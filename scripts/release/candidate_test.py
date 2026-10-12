import copy
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

import candidate as gate

COMMIT, TREE = "a" * 40, "b" * 40
VERSION = json.loads((gate.ROOT / "package.json").read_text())["version"]
NOTICES = b"Synthetic runtime license fixture\n"
MANIFEST = {
    "manifest_version": 3, "name": "Synthetic YouCoder", "version": VERSION,
    "permissions": ["storage"], "host_permissions": ["https://www.youtube.com/*"],
    "content_scripts": [{"matches": ["https://www.youtube.com/*"], "js": ["content.js"]}],
    "content_security_policy": {"extension_pages": "script-src 'self'; object-src 'self';"}}


class CandidateGate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.directory = self.root / "candidate"
        self.directory.mkdir()
        self.contents = {"manifest.json": json.dumps(MANIFEST).encode(),
                         "THIRD_PARTY_NOTICES.txt": NOTICES, "content.js": b'console.log("fixture")\n'}
        self.audit = {"scope": "Static production file inventory and targeted marker checks; not a runtime network audit",
                      "manifest": copy.deepcopy(MANIFEST), "files": []}
        self.seal()
        self.run = {"id": 123, "run_attempt": 1, "repository": {"id": 99, "full_name": gate.REPOSITORY},
                    "head_repository": {"full_name": gate.REPOSITORY}, "event": "pull_request",
                    "path": ".github/workflows/test.yml", "head_sha": COMMIT,
                    "status": "completed", "conclusion": "success"}
        self.artifact = {"id": 456, "name": "youcoder-candidate", "expired": False,
                         "workflow_run": {"id": 123, "head_sha": COMMIT, "repository_id": 99, "head_repository_id": 99}}

    def seal(self):
        self.audit["files"] = []
        for name, data in sorted(self.contents.items(), key=lambda item: item[0].lower()):
            entry = {"file": name, "bytes": len(data), "sha256": gate.digest(data)}
            if name.endswith(".js"):
                entry.update(sheetsPrototypeMarkers=False, urlLiterals=[], networkApiIdentifiers=[])
            self.audit["files"].append(entry)
        with zipfile.ZipFile(self.directory / gate.ARCHIVE, "w") as zipped:
            for name, data in self.contents.items():
                zipped.writestr(name, data)
        self.sha = gate.digest((self.directory / gate.ARCHIVE).read_bytes())
        audit_bytes = json.dumps(self.audit).encode()
        (self.directory / "bundle-audit.json").write_bytes(audit_bytes)
        self.meta = {"schema": 1, "repository": gate.REPOSITORY, "source_commit": COMMIT,
                     "source_tree": TREE, "version": VERSION, "run_id": 123, "run_attempt": 1,
                     "archive": gate.ARCHIVE, "sha256": self.sha,
                     "audit_sha256": gate.digest(audit_bytes), "notices_sha256": gate.digest(NOTICES)}
        self.write_meta()
        (self.directory / (gate.ARCHIVE + ".sha256")).write_text(f"{self.sha}  {gate.ARCHIVE}\n")

    def write_meta(self):
        (self.directory / "candidate.json").write_text(json.dumps(self.meta))

    def payload(self, **overrides):
        values = dict(directory=self.directory, expected_commit=COMMIT, expected_sha=self.sha,
                      expected_version=VERSION, expected_tree=TREE, expected_notices=NOTICES,
                      destination=self.root / "unpacked")
        values.update(overrides)
        return gate.validate_payload(**values)

    def provenance(self):
        gate.validate_provenance(self.run, self.artifact, COMMIT, 123, 456)

    def verify(self, tree=TREE):
        facts = self.root / "provenance.json"
        facts.write_text(json.dumps({"run": self.run, "artifact": self.artifact}))
        notices = self.root / "notices.txt"
        notices.write_bytes(NOTICES)
        values = {"EXPECTED_COMMIT": COMMIT, "EXPECTED_SHA256": self.sha,
                  "CANDIDATE_RUN_ID": "123", "CANDIDATE_ARTIFACT_ID": "456", "GITHUB_REF": "refs/heads/main"}
        def fake_git(*args):
            if args[0] == "diff":
                return ""
            return tree if args[-1] == "HEAD^{tree}" else TREE if args[-1].endswith("^{tree}") else COMMIT
        original_run = subprocess.run
        def run(command, *args, **kwargs):
            if command[:2] == ["git", "merge-base"]:
                return subprocess.CompletedProcess(command, 0)
            return original_run(command, *args, **kwargs)
        with patch.dict(os.environ, values), patch.object(gate, "git", side_effect=fake_git), \
                patch.object(gate.subprocess, "run", side_effect=run):
            gate.verify(self.directory, facts, notices, self.root / "verified")

    def test_valid_reviewed_bytes_survive_full_gate_and_recheck(self):
        self.provenance()
        self.verify()
        verified = self.root / "verified"
        self.assertEqual((verified / gate.ARCHIVE).read_bytes(), (self.directory / gate.ARCHIVE).read_bytes())
        result = self.root / "output"
        env = dict(os.environ, EXPECTED_COMMIT=COMMIT, EXPECTED_SHA256=self.sha,
                   CANDIDATE_RUN_ID="123", CANDIDATE_ARTIFACT_ID="456", GITHUB_OUTPUT=str(result))
        command = ["python3", str(gate.ROOT / "scripts/release/candidate.py"), "recheck", "--directory", str(verified)]
        subprocess.run(command, env=env, check=True, capture_output=True)
        self.assertEqual(result.read_text(), "verified=true\n")
        result.unlink()
        (verified / gate.ARCHIVE).write_bytes(b"changed after verification")
        self.assertNotEqual(subprocess.run(command, env=env, capture_output=True).returncode, 0)
        self.assertFalse(result.exists(), "A changed ZIP must not enable the publisher")

    def test_zip_tampering_is_refused(self):
        with open(self.directory / gate.ARCHIVE, "ab") as zipped:
            zipped.write(b"tamper")
        with self.assertRaisesRegex(ValueError, "reviewed SHA256"):
            self.payload()

    def test_wrong_expected_hash_commit_version_tree_or_licenses_are_refused(self):
        for name, value in {"expected_sha": "f" * 64, "expected_commit": "c" * 40,
                            "expected_version": "99.0.0", "expected_tree": "d" * 40,
                            "expected_notices": b"different license"}.items():
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.payload(**{name: value})

    def test_zip_manifest_version_mismatch_is_refused(self):
        self.contents["manifest.json"] = json.dumps({**MANIFEST, "version": "99.0.0"}).encode()
        self.seal()
        with self.assertRaisesRegex(ValueError, "manifest version"):
            self.payload()

    def test_missing_or_changed_license_is_refused_even_with_new_zip_hash(self):
        self.contents["THIRD_PARTY_NOTICES.txt"] = b"missing license text"
        self.seal()
        with self.assertRaisesRegex(ValueError, "notices missing or changed"):
            self.payload()

    def test_audit_cannot_hide_modified_bundled_bytes(self):
        self.audit["files"][0]["sha256"] = "0" * 64
        data = json.dumps(self.audit).encode()
        (self.directory / "bundle-audit.json").write_bytes(data)
        self.meta["audit_sha256"] = gate.digest(data)
        self.write_meta()
        with self.assertRaisesRegex(ValueError, "audited bytes"):
            self.payload()

    def test_fresh_audit_rejects_permission_expansion_despite_matching_receipts(self):
        self.audit["manifest"]["permissions"].append("tabs")
        self.contents["manifest.json"] = json.dumps(self.audit["manifest"]).encode()
        self.seal()
        with self.assertRaises(subprocess.CalledProcessError):
            self.verify()
        self.assertFalse((self.root / "verified" / gate.ARCHIVE).exists())

    def test_other_run_attempt_and_different_main_tree_are_refused(self):
        self.meta["run_attempt"] = 2
        self.write_meta()
        with self.assertRaisesRegex(ValueError, "run attempt"):
            self.verify()
        with self.assertRaisesRegex(ValueError, "Main differs"):
            self.verify(tree="e" * 40)

    def test_unsuccessful_running_wrong_workflow_or_fork_run_are_refused(self):
        for key, value in [("conclusion", "failure"), ("status", "in_progress"),
                           ("path", ".github/workflows/other.yml"), ("event", "push"),
                           ("head_sha", "f" * 40), ("head_repository", {"full_name": "someone/fork"})]:
            with self.subTest(key=key):
                original = copy.deepcopy(self.run)
                self.run[key] = value
                with self.assertRaises(ValueError):
                    self.provenance()
                self.run = original

    def test_expired_wrong_named_or_wrong_run_artifacts_are_refused(self):
        for key, value in [("expired", True), ("name", "other"), ("id", 999),
                           ("workflow_run", {**self.artifact["workflow_run"], "id": 999}),
                           ("workflow_run", {**self.artifact["workflow_run"], "head_repository_id": 1})]:
            with self.subTest(key=key):
                original = copy.deepcopy(self.artifact)
                self.artifact[key] = value
                with self.assertRaises(ValueError):
                    self.provenance()
                self.artifact = original

    def test_extra_candidate_file_is_refused(self):
        (self.directory / "script.sh").write_text("must not execute")
        with self.assertRaisesRegex(ValueError, "file set"):
            self.payload()

    def test_traversal_absolute_and_backslash_paths_are_refused(self):
        for name in ["../escape.js", "/escape.js", "folder\\escape.js", "a//b.js", ".env"]:
            with self.subTest(name=name):
                archive = self.root / "unsafe.zip"
                with zipfile.ZipFile(archive, "w") as zipped:
                    zipped.writestr(name, b"never extract")
                with self.assertRaises(ValueError):
                    gate.safe_extract(archive, self.root / "unsafe")

    def test_symlink_and_duplicate_zip_entries_are_refused(self):
        archive = self.root / "unsafe.zip"
        link = zipfile.ZipInfo("link.js")
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        with zipfile.ZipFile(archive, "w") as zipped:
            zipped.writestr(link, "../outside")
        with self.assertRaisesRegex(ValueError, "symlink"):
            gate.safe_extract(archive, self.root / "unsafe")
        with zipfile.ZipFile(archive, "w") as zipped:
            zipped.writestr("content.js", "a")
            zipped.writestr("CONTENT.js", "b")
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            gate.safe_extract(archive, self.root / "unsafe")

    def test_workflow_keeps_publication_opt_in_and_never_rebuilds(self):
        workflow = (gate.ROOT / ".github/workflows/submit.yml").read_text()
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn("default: false", workflow)
        self.assertIn("if: ${{ inputs.publish && steps.verify.outputs.verified == 'true' }}", workflow)
        self.assertIn("artifact: ${{ runner.temp }}/verified-candidate/chrome-mv3-prod.zip", workflow)
        self.assertIn("merge-multiple: true", workflow)
        self.assertEqual(workflow.count("secrets.SUBMIT_KEYS"), 1)
        for forbidden in ["pnpm build", "pnpm package", "continue-on-error", "always()", "permissions:", "pull_request_target:"]:
            self.assertNotIn(forbidden, workflow)
        producer = (gate.ROOT / ".github/workflows/test.yml").read_text()
        self.assertIn("ref: ${{ github.event.pull_request.head.sha || github.sha }}", producer)
        self.assertLess(producer.index("node scripts/release/notices.cjs"), producer.index("pnpm package"))
        self.assertLess(producer.index("node scripts/release/audit-bundle.cjs"), producer.index("pnpm package"))
        self.assertIn("candidate.py create", producer)


if __name__ == "__main__":
    unittest.main()
