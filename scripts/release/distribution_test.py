"""Regressions for the file users download, independently of a new build."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import zipfile

from candidate import ROOT, digest, read_json
import distribution


class DistributionGate(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.directory = Path(temp.name) / "downloads"
        shutil.copytree(ROOT / "downloads", self.directory)
        self.metadata_path = next(self.directory.glob("*.provenance.json"))
        self.meta = read_json(self.metadata_path)
        self.archive = self.directory / self.meta["archive"]

    def save_metadata(self):
        self.metadata_path.write_text(json.dumps(self.meta))

    def reseal_zip(self, updates):
        with zipfile.ZipFile(self.archive) as zipped:
            contents = {name: zipped.read(name) for name in zipped.namelist()}
        contents.update(updates)
        with zipfile.ZipFile(self.archive, "w") as zipped:
            for name, data in contents.items():
                zipped.writestr(name, data)
        self.meta["sha256"] = digest(self.archive.read_bytes())
        (self.directory / (self.archive.name + ".sha256")).write_text(
            f'{self.meta["sha256"]}  {self.archive.name}\n')
        self.save_metadata()

    def save_audit(self, audit):
        data = json.dumps(audit).encode()
        (self.directory / self.meta["audit_file"]).write_bytes(data)
        self.meta["audit_sha256"] = digest(data)
        self.save_metadata()

    def test_fixed_snapshot_passes_without_rebuilding_or_changing_bytes(self):
        before = {p.name: p.read_bytes() for p in self.directory.iterdir()}
        result = distribution.verify_directory(self.directory)
        self.assertEqual(result[0]["sha256"], self.meta["sha256"])
        self.assertEqual(result[0]["source_commit"], self.meta["source_commit"])
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.directory.iterdir()})

    def test_corrupt_zip_is_refused_even_when_a_fresh_build_would_be_valid(self):
        self.archive.write_bytes(self.archive.read_bytes() + b"corrupt download")
        with self.assertRaisesRegex(ValueError, "ZIP SHA256"):
            distribution.verify_directory(self.directory)

    def test_wrong_source_tree_version_and_license_are_refused(self):
        original = dict(self.meta)
        for key, value, error in [("source_tree", "0" * 40, "source tree"),
                                  ("version", "99.0.0", "source version"),
                                  ("notices_sha256", "0" * 64, "license SHA256")]:
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, error):
                self.meta = {**original, key: value}
                self.save_metadata()
                distribution.verify_directory(self.directory)

    def test_sidecar_and_unaccounted_archive_are_refused(self):
        sidecar = self.directory / (self.archive.name + ".sha256")
        original = sidecar.read_bytes()
        sidecar.write_text("wrong hash and filename\n")
        with self.assertRaisesRegex(ValueError, "sidecar"):
            distribution.verify_directory(self.directory)
        sidecar.write_bytes(original)
        (self.directory / "forgotten-old-build.zip").write_bytes(self.archive.read_bytes())
        with self.assertRaisesRegex(ValueError, "Untracked distribution ZIP"):
            distribution.verify_directory(self.directory)

    def test_unsafe_metadata_and_archive_paths_are_refused(self):
        original = dict(self.meta)
        for name in ["../outside.zip", "/outside.zip", "folder\\outside.zip"]:
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, "plain filenames"):
                self.meta = {**original, "archive": name}
                self.save_metadata()
                distribution.verify_directory(self.directory)
        self.meta = original
        self.reseal_zip({"../outside.js": b"must not be extracted"})
        with self.assertRaisesRegex(ValueError, "Unsafe ZIP path"):
            distribution.verify_directory(self.directory)
        self.assertFalse((self.directory.parent / "outside.js").exists())

    def test_extra_internal_file_is_refused_despite_matching_zip_hash(self):
        self.reseal_zip({"unreviewed.js": b"// unexpected extra file"})
        with self.assertRaisesRegex(ValueError, "file count"):
            distribution.verify_directory(self.directory)

    def test_modified_inventory_is_refused_despite_matching_audit_hash(self):
        audit = read_json(self.directory / self.meta["audit_file"])
        audit["files"][0]["sha256"] = "0" * 64
        self.save_audit(audit)
        with self.assertRaisesRegex(ValueError, "audited bytes"):
            distribution.verify_directory(self.directory)

    def test_permission_expansion_is_refused_even_with_consistent_receipts(self):
        audit = read_json(self.directory / self.meta["audit_file"])
        audit["manifest"]["permissions"].append("tabs")
        manifest = json.dumps(audit["manifest"]).encode()
        self.reseal_zip({"manifest.json": manifest})
        for entry in audit["files"]:
            if entry["file"] == "manifest.json":
                entry.update(bytes=len(manifest), sha256=digest(manifest))
        self.save_audit(audit)
        with self.assertRaises(subprocess.CalledProcessError):
            distribution.verify_directory(self.directory)


if __name__ == "__main__":
    unittest.main()
