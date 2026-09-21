"""The per-user install area as a test sees it: where FERRET's files live, what a crash leaves, and a tree to compare.

Everything here is written from the contract (paths, modes, manifest bytes), never from the product code, so a
drift in the product cannot make the expectation drift with it.
"""

import hashlib
import json
import os
import stat
import zipfile
from dataclasses import dataclass
from pathlib import Path

DIRECTORY_MODE = 0o700
ARTIFACT_MODE = 0o700
MANIFEST_MODE = 0o600
INSTALLED_LONG_AGO = "2026-09-01T00:00:00.000Z"
STAGE_NONCE = "0123456789abcdef0123456789abcdef"
OLDER_VERSION = "0.0.9"

type Tree = dict[str, tuple[str, int, bytes | str | None]]


@dataclass(frozen=True, slots=True)
class Layout:
    """Where an install for ``home`` puts its three files and the directories around them."""

    home: Path

    @property
    def share(self) -> Path:
        return self.home / ".local" / "share" / "ferret"

    @property
    def bin(self) -> Path:
        return self.home / ".local" / "bin"

    @property
    def launcher(self) -> Path:
        return self.bin / "ferret"

    @property
    def manifest(self) -> Path:
        return self.share / "install.json"

    def version_directory(self, version: str) -> Path:
        return self.share / version

    def artifact(self, version: str) -> Path:
        return self.version_directory(version) / "ferret.pyz"


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def manifest_bytes(layout: Layout, version: str, artifact: bytes, installed_at: str = INSTALLED_LONG_AGO) -> bytes:
    """The manifest a finished install of ``artifact`` at ``version`` writes: compact members in the normative order."""
    document = {
        "schemaVersion": "1.0",
        "version": version,
        "artifactPath": str(layout.artifact(version)),
        "artifactSha256": digest(artifact),
        "launcherPath": str(layout.launcher),
        "installedAt": installed_at,
    }
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode() + b"\n"


def older_artifact(artifact: Path, version: str, target: Path) -> Path:
    """A working copy of ``artifact`` that reports ``version``; nothing but ``ferret.__version__`` differs.

    The archive's bytecode is unchecked-hash, so it would win over a rewritten source; the copy drops the rewritten
    module's bytecode and lets Python compile the source it now holds.
    """
    marker = b'__version__ = "'
    with zipfile.ZipFile(artifact) as source:
        members = [(info, source.read(info)) for info in source.infolist()]
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("wb") as copy:
        copy.write(artifact.read_bytes().split(b"\n", 1)[0] + b"\n")
        with zipfile.ZipFile(copy, "w") as archive:
            for info, data in members:
                if info.filename == "ferret/__init__.pyc":
                    continue
                if info.filename == "ferret/__init__.py":
                    head, found, rest = data.partition(marker)
                    assert found, "the package no longer declares __version__ the way this helper rewrites it"
                    data = head + marker + version.encode() + b'"' + rest.split(b'"', 1)[1]
                archive.writestr(info, data)
    target.chmod(0o755)
    return target


def empty_tree() -> Tree:
    return {}


def tree(root: Path) -> Tree:
    """Every object under ``root`` as plain values, so two moments or a whole area can be compared at once.

    A symlink's own mode is not portable (macOS and Linux disagree), so it is recorded as zero.
    """
    found: Tree = {}
    if not os.path.lexists(root):
        return found
    for directory, names, files in os.walk(root):
        for name in sorted([*names, *files]):
            path = Path(directory) / name
            info = os.lstat(path)
            key = str(path.relative_to(root))
            if stat.S_ISLNK(info.st_mode):
                found[key] = ("symlink", 0, os.readlink(path))
            elif stat.S_ISDIR(info.st_mode):
                found[key] = ("directory", stat.S_IMODE(info.st_mode), None)
            else:
                found[key] = ("file", stat.S_IMODE(info.st_mode), path.read_bytes())
    return dict(sorted(found.items()))


def area(layout: Layout) -> Tree:
    """The install area: everything under HOME's ``.local``, keyed relative to HOME."""
    return {key: value for key, value in tree(layout.home).items() if key == ".local" or key.startswith(".local/")}


def completed(layout: Layout, version: str, artifact: bytes, installed_at: str = INSTALLED_LONG_AGO) -> Tree:
    """Exactly what a finished install leaves under HOME: five private directories and the three owned files."""
    directories = (
        layout.home / ".local",
        layout.home / ".local" / "share",
        layout.share,
        layout.version_directory(version),
        layout.bin,
    )
    found: Tree = {str(path.relative_to(layout.home)): ("directory", DIRECTORY_MODE, None) for path in directories}
    found[str(layout.artifact(version).relative_to(layout.home))] = ("file", ARTIFACT_MODE, artifact)
    found[str(layout.launcher.relative_to(layout.home))] = ("symlink", 0, str(layout.artifact(version)))
    found[str(layout.manifest.relative_to(layout.home))] = (
        "file",
        MANIFEST_MODE,
        manifest_bytes(layout, version, artifact, installed_at),
    )
    return dict(sorted(found.items()))
