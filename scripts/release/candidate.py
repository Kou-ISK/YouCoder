"""Bind an unchanged extension ZIP to its tested source and reviewed SHA256.

Only stdlib Python and the repository's existing Node bundle audit are used.
Downloaded files are data: no script from the candidate is executed.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
import urllib.error
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
REPOSITORY = "Kou-ISK/YouCoder"
ARCHIVE = "chrome-mv3-prod.zip"
FILES = {ARCHIVE, ARCHIVE + ".sha256", "candidate.json", "bundle-audit.json"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def input_values():
    commit = os.environ["EXPECTED_COMMIT"]
    sha = os.environ["EXPECTED_SHA256"]
    require(re.fullmatch(r"[0-9a-f]{40}", commit), "Expected a full commit SHA")
    require(re.fullmatch(r"[0-9a-f]{64}", sha), "Expected the inner ZIP SHA256")
    ids = [os.environ[k] for k in ("CANDIDATE_RUN_ID", "CANDIDATE_ARTIFACT_ID")]
    require(all(re.fullmatch(r"[1-9][0-9]*", x) for x in ids), "Invalid run/artifact ID")
    return commit, sha, *map(int, ids)


def validate_provenance(run, artifact, commit, run_id, artifact_id):
    require(run["id"] == run_id, "Wrong workflow run")
    require(run["repository"]["full_name"] == REPOSITORY, "Wrong repository")
    require(run["head_repository"]["full_name"] == REPOSITORY, "Fork candidates are refused")
    require(run["event"] == "pull_request", "Candidate must come from PR validation")
    require(run["path"] == ".github/workflows/test.yml", "Wrong producer workflow")
    require(run["head_sha"] == commit, "Run does not test the reviewed commit")
    require(run["status"] == "completed" and run["conclusion"] == "success", "Producer CI must succeed")
    require(artifact["id"] == artifact_id and artifact["name"] == "youcoder-candidate", "Wrong artifact")
    require(artifact["expired"] is False, "Artifact expired; do not rebuild a reviewed ZIP")
    origin = artifact["workflow_run"]
    require(origin["id"] == run_id and origin["head_sha"] == commit, "Artifact provenance mismatch")
    require(origin["repository_id"] == run["repository"]["id"], "Artifact repository mismatch")
    require(origin["head_repository_id"] == run["repository"]["id"], "Artifact fork mismatch")


def api(resource):
    request = urllib.request.Request(
        f"https://api.github.com/repos/{REPOSITORY}/{resource}",
        headers={"Authorization": "Bearer " + os.environ["GITHUB_TOKEN"],
                 "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise ValueError(f"GitHub metadata unavailable (HTTP {error.code}); existing token access is required") from None


def safe_extract(archive, destination):
    names = set()
    total = 0
    with zipfile.ZipFile(archive) as zipped:
        require(len(zipped.infolist()) <= 1000, "Too many ZIP entries")
        for entry in zipped.infolist():
            name = entry.filename
            path = PurePosixPath(name)
            require(name and not path.is_absolute() and ".." not in path.parts
                    and "\\" not in name and ":" not in name
                    and str(path) == name.rstrip("/"), "Unsafe ZIP path")
            require(name.casefold() not in names, "Duplicate ZIP entry")
            names.add(name.casefold())
            require(not stat.S_ISLNK(entry.external_attr >> 16), "ZIP symlink refused")
            require(not (entry.flag_bits & 1), "Encrypted ZIP refused")
            total += entry.file_size
            require(total <= 100 * 1024 * 1024, "ZIP exceeds extraction limit")
            require(not any(p.startswith(".") for p in path.parts)
                    and path.suffix in {".json", ".js", ".css", ".html", ".png", ".txt", ""}
                    and path.suffix != ".map", "Unexpected packaged file")
            target = destination.joinpath(*path.parts)
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(zipped.read(entry))


def validate_payload(directory, expected_commit, expected_sha, expected_version,
                     expected_tree, expected_notices, destination):
    require({p.name for p in directory.iterdir()} == FILES, "Candidate file set mismatch")
    require(all(p.is_file() and not p.is_symlink() for p in directory.iterdir()), "Candidate must contain regular files")
    meta = read_json(directory / "candidate.json")
    require(meta["schema"] == 1 and meta["repository"] == REPOSITORY, "Unknown candidate format")
    require(meta["source_commit"] == expected_commit and meta["source_tree"] == expected_tree, "Candidate source mismatch")
    require(meta["version"] == expected_version, "Candidate version mismatch")
    require(meta["archive"] == ARCHIVE and meta["sha256"] == expected_sha, "Candidate hash receipt mismatch")
    zipped = directory / ARCHIVE
    require(digest(zipped.read_bytes()) == expected_sha, "ZIP differs from reviewed SHA256")
    require((directory / (ARCHIVE + ".sha256")).read_text() == f"{expected_sha}  {ARCHIVE}\n", "SHA256 sidecar mismatch")
    audit_bytes = (directory / "bundle-audit.json").read_bytes()
    require(digest(audit_bytes) == meta["audit_sha256"], "Bundle audit receipt mismatch")
    require(digest(expected_notices) == meta["notices_sha256"], "License receipt mismatch")
    safe_extract(zipped, destination)
    manifest = read_json(destination / "manifest.json")
    require(manifest["version"] == expected_version, "ZIP manifest version mismatch")
    require((destination / "THIRD_PARTY_NOTICES.txt").read_bytes() == expected_notices, "Runtime license notices missing or changed")
    audit = json.loads(audit_bytes)
    inventory = {p.relative_to(destination).as_posix(): p for p in destination.rglob("*") if p.is_file()}
    require(len(audit["files"]) == len(inventory), "ZIP file count differs from audit")
    require({f["file"] for f in audit["files"]} == set(inventory), "ZIP files differ from audit")
    for item in audit["files"]:
        data = inventory[item["file"]].read_bytes()
        require(len(data) == item["bytes"] and digest(data) == item["sha256"], "ZIP file differs from audited bytes")
    require(audit["manifest"] == manifest, "Audited manifest differs from ZIP")
    return meta


def create(directory):
    require(not git("diff", "HEAD", "--"), "Tracked source changed after checkout")
    directory.mkdir(parents=True, exist_ok=False)
    shutil.copyfile(ROOT / "build" / ARCHIVE, directory / ARCHIVE)
    shutil.copyfile(os.environ["BUNDLE_AUDIT"], directory / "bundle-audit.json")
    notices = (ROOT / "build/chrome-mv3-prod/THIRD_PARTY_NOTICES.txt").read_bytes()
    meta = {"schema": 1, "repository": REPOSITORY, "source_commit": git("rev-parse", "HEAD"),
            "source_tree": git("rev-parse", "HEAD^{tree}"), "version": read_json(ROOT / "package.json")["version"],
            "run_id": int(os.environ["GITHUB_RUN_ID"]), "run_attempt": int(os.environ["GITHUB_RUN_ATTEMPT"]),
            "archive": ARCHIVE, "sha256": digest((directory / ARCHIVE).read_bytes()),
            "audit_sha256": digest((directory / "bundle-audit.json").read_bytes()),
            "notices_sha256": digest(notices)}
    require(meta["source_commit"] == os.environ["CANDIDATE_COMMIT"], "Checkout differs from tested PR head")
    (directory / "candidate.json").write_text(json.dumps(meta, indent=2) + "\n")
    (directory / (ARCHIVE + ".sha256")).write_text(f'{meta["sha256"]}  {ARCHIVE}\n')
    with tempfile.TemporaryDirectory() as temp:
        validate_payload(directory, meta["source_commit"], meta["sha256"], meta["version"],
                         meta["source_tree"], notices, Path(temp))
    print(json.dumps(meta))


def verify(directory, provenance, notices_path, output):
    commit, sha, run_id, artifact_id = input_values()
    require(os.environ["GITHUB_REF"] == "refs/heads/main", "Submission validation must run from main")
    require(not git("diff", "HEAD", "--"), "Tracked source changed after checkout")
    facts = read_json(provenance)
    validate_provenance(facts["run"], facts["artifact"], commit, run_id, artifact_id)
    require(subprocess.run(["git", "merge-base", "--is-ancestor", commit, "HEAD"], cwd=ROOT).returncode == 0,
            "Reviewed commit is not integrated into this main revision")
    tree = git("rev-parse", "HEAD^{tree}")
    require(tree == git("rev-parse", commit + "^{tree}"), "Main differs from reviewed source; obtain a new reviewed candidate")
    output.mkdir(parents=True, exist_ok=False)
    with tempfile.TemporaryDirectory() as temp:
        meta = validate_payload(directory, commit, sha, read_json(ROOT / "package.json")["version"],
                                tree, notices_path.read_bytes(), Path(temp))
        require(meta["run_id"] == run_id and meta["run_attempt"] == facts["run"]["run_attempt"], "Candidate belongs to another run attempt")
        audited = subprocess.check_output(["node", str(ROOT / "scripts/release/audit-bundle.cjs"), temp],
                                          cwd=ROOT, stderr=subprocess.PIPE)
        require(json.loads(audited) == read_json(directory / "bundle-audit.json"), "Fresh bundle audit differs from candidate")
    shutil.copyfile(directory / ARCHIVE, output / ARCHIVE)
    require(digest((output / ARCHIVE).read_bytes()) == sha, "ZIP changed during handoff")
    (output / "receipt.json").write_text(json.dumps({**meta, "artifact_id": artifact_id,
        "submission_revision": git("rev-parse", "HEAD"), "verified": True}, indent=2) + "\n")
    print(f"Verified {meta['version']} / {commit} / {sha}; no rebuild or repack")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["create", "metadata", "verify", "recheck"])
    parser.add_argument("--directory", type=Path)
    parser.add_argument("--provenance", type=Path)
    parser.add_argument("--notices", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.command == "create":
        create(args.directory)
    elif args.command == "metadata":
        commit, _, run_id, artifact_id = input_values()
        run, artifact = api(f"actions/runs/{run_id}"), api(f"actions/artifacts/{artifact_id}")
        validate_provenance(run, artifact, commit, run_id, artifact_id)
        args.provenance.write_text(json.dumps({"run": run, "artifact": artifact}))
    elif args.command == "verify":
        verify(args.directory, args.provenance, args.notices, args.output)
    else:
        commit, sha, _, artifact_id = input_values()
        receipt = read_json(args.directory / "receipt.json")
        require(receipt["verified"] is True and receipt["source_commit"] == commit
                and receipt["sha256"] == sha and receipt["artifact_id"] == artifact_id, "Verification receipt mismatch")
        require(digest((args.directory / ARCHIVE).read_bytes()) == sha, "Verified ZIP changed before publisher")
        with open(os.environ["GITHUB_OUTPUT"], "a") as result:
            result.write("verified=true\n")


if __name__ == "__main__":
    main()
