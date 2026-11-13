"""Verify the fixed GitHub download, without rebuilding it or executing its code.

This checks local integrity and source metadata. It does not certify the producer
CI, supply a review approval, or replace live YouTube and manual-install QA.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import tempfile

from candidate import (ROOT, REPOSITORY, digest, git, read_json, require,
                       safe_extract, validate_audited_files)


def local_file(directory, name):
    require(isinstance(name, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", name),
            "Distribution references must be plain filenames")
    path = directory / name
    require(path.is_file() and not path.is_symlink(), "Missing or non-regular distribution file: " + name)
    return path


def verify_distribution(metadata_path):
    meta = read_json(metadata_path)
    require(meta["schema"] == 1 and meta["repository"] == REPOSITORY, "Unknown distribution format")
    for key, length in [("source_commit", 40), ("source_tree", 40), ("sha256", 64),
                        ("audit_sha256", 64), ("notices_sha256", 64)]:
        require(isinstance(meta[key], str) and re.fullmatch(f"[0-9a-f]{{{length}}}", meta[key]),
                "Invalid " + key)
    for key in ("ci_run_id", "ci_run_attempt", "artifact_id"):
        require(type(meta[key]) is int and meta[key] > 0, "Invalid " + key)
    require(meta["repackaged"] is False, "Distribution must retain the original CI ZIP")
    commit = meta["source_commit"]
    require(git("rev-parse", commit + "^{tree}") == meta["source_tree"], "Distribution source tree mismatch")
    package = json.loads(git("show", commit + ":package.json"))
    require(meta["version"] == package["version"], "Distribution source version mismatch")

    directory = metadata_path.parent
    archive = local_file(directory, meta["archive"])
    require(archive.suffix == ".zip", "Distribution archive must be a ZIP")
    require(digest(archive.read_bytes()) == meta["sha256"], "Distribution ZIP SHA256 mismatch")
    sidecar = local_file(directory, meta["archive"] + ".sha256")
    require(sidecar.read_text() == f'{meta["sha256"]}  {meta["archive"]}\n', "Distribution SHA256 sidecar mismatch")
    audit = local_file(directory, meta["audit_file"]).read_bytes()
    require(digest(audit) == meta["audit_sha256"], "Distribution audit SHA256 mismatch")

    with tempfile.TemporaryDirectory(prefix="youcoder-distribution-") as temp:
        destination = Path(temp)
        safe_extract(archive, destination)
        manifest = read_json(destination / "manifest.json")
        require(manifest["version"] == meta["version"], "Distribution manifest version mismatch")
        notices = (destination / "THIRD_PARTY_NOTICES.txt").read_bytes()
        require(digest(notices) == meta["notices_sha256"], "Distribution license SHA256 mismatch")
        validate_audited_files(destination, json.loads(audit))
        fresh = subprocess.check_output(["node", str(ROOT / "scripts/release/audit-bundle.cjs"), temp],
                                        cwd=ROOT, stderr=subprocess.PIPE)
        require(json.loads(fresh) == json.loads(audit), "Fresh distribution audit mismatch")
    return {"archive": archive.name, "version": meta["version"], "sha256": meta["sha256"],
            "source_commit": commit, "status": "PASS"}


def verify_directory(directory):
    metadata = sorted(directory.glob("*.provenance.json"))
    require(metadata, "No distribution metadata found")
    results = [verify_distribution(local_file(directory, path.name)) for path in metadata]
    archives = [result["archive"] for result in results]
    require(len(set(archives)) == len(archives), "Duplicate distribution metadata")
    require(set(archives) == {path.name for path in directory.glob("*.zip")},
            "Untracked distribution ZIP")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=ROOT / "downloads")
    print(json.dumps(verify_directory(parser.parse_args().directory)))
