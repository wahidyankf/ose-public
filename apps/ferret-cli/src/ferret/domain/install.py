"""The per-user install layout and the manifest rules: where each object lives and what makes a manifest trusted."""

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Final, Literal, cast

from ferret.domain.storage import DOCUMENT_SCHEMA_VERSION
from ferret.domain.timestamps import parse_timestamp

ARTIFACT_FILE: Final = "ferret.pyz"
LAUNCHER_FILE: Final = "ferret"
MANIFEST_FILE: Final = "install.json"

DIRECTORY_MODE: Final = 0o700
ARTIFACT_MODE: Final = 0o700
MANIFEST_MODE: Final = 0o600

# The normative property order of the manifest: the closed set, and no other member.
MANIFEST_MEMBERS: Final = (
    "schemaVersion",
    "version",
    "artifactPath",
    "artifactSha256",
    "launcherPath",
    "installedAt",
)

type PathAction = Literal["none", "add_home_local_bin"]

_NUMBER = r"(?:0|[1-9][0-9]*)"
_IDENTIFIERS = r"[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*"
_VERSION = re.compile(rf"{_NUMBER}\.{_NUMBER}\.{_NUMBER}(?:-{_IDENTIFIERS})?(?:\+{_IDENTIFIERS})?")
_SHA256 = re.compile(r"[0-9a-f]{64}")
_NONCE = r"[0-9a-f]{32}"


@dataclass(frozen=True, slots=True)
class InstallPaths:
    """Where an install for one home directory puts its artifact, launcher, and manifest."""

    home: Path

    @property
    def share(self) -> Path:
        return self.home / ".local" / "share" / "ferret"

    @property
    def bin(self) -> Path:
        return self.home / ".local" / "bin"

    @property
    def launcher(self) -> Path:
        return self.bin / LAUNCHER_FILE

    @property
    def manifest(self) -> Path:
        return self.share / MANIFEST_FILE

    def version_directory(self, version: str) -> Path:
        return self.share / version

    def artifact(self, version: str) -> Path:
        return self.version_directory(version) / ARTIFACT_FILE


@dataclass(frozen=True, slots=True)
class Manifest:
    """What an install records about itself: the one version it owns, that artifact's digest, and when it landed."""

    version: str
    artifact_path: Path
    artifact_sha256: str
    launcher_path: Path
    installed_at: str

    def to_bytes(self) -> bytes:
        """The manifest as stored: compact JSON in the normative member order, ending in a line feed."""
        document = {
            "schemaVersion": DOCUMENT_SCHEMA_VERSION,
            "version": self.version,
            "artifactPath": str(self.artifact_path),
            "artifactSha256": self.artifact_sha256,
            "launcherPath": str(self.launcher_path),
            "installedAt": self.installed_at,
        }
        return (json.dumps(document, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def is_version(text: str) -> bool:
    """True for a semantic version, the only kind of name a version directory may have."""
    return _VERSION.fullmatch(text) is not None


def _no_duplicates(pairs: list[tuple[str, object]]) -> dict[str, object]:
    document = dict(pairs)
    if len(document) != len(pairs):
        raise ValueError("manifest repeats a member")
    return document


def _text(document: dict[str, object], name: str) -> str:
    value = document[name]
    if not isinstance(value, str):
        raise ValueError(f"manifest member {name} is not text")
    return value


def parse_manifest(content: bytes, paths: InstallPaths) -> Manifest:
    """Read a manifest for exactly these install paths, or raise ValueError naming the first rule it breaks.

    The document must be strict JSON: one object with every member of the closed set, in the normative order, each
    a string, no member repeated, and nothing else. The artifact and launcher paths must be the ones ``paths``
    derives from the recorded version, so a manifest can never point outside the install area.
    """
    try:
        parsed: object = json.loads(content.decode("utf-8"), object_pairs_hook=_no_duplicates)
    except ValueError:
        raise ValueError("manifest is not strict JSON") from None
    if not isinstance(parsed, dict):
        raise ValueError("manifest is not an object")
    document = cast(dict[str, object], parsed)
    if tuple(document) != MANIFEST_MEMBERS:
        raise ValueError("manifest members are not the closed set in the normative order")
    schema, version, artifact_path, sha256, launcher_path, installed_at = (
        _text(document, name) for name in MANIFEST_MEMBERS
    )
    if schema != DOCUMENT_SCHEMA_VERSION:
        raise ValueError("manifest schema version is not supported")
    if not is_version(version):
        raise ValueError("manifest version is not a semantic version")
    if _SHA256.fullmatch(sha256) is None:
        raise ValueError("manifest digest is not a lowercase SHA-256")
    try:
        parse_timestamp(installed_at)
    except ValueError:
        raise ValueError("manifest installedAt is not a canonical UTC timestamp") from None
    if artifact_path != str(paths.artifact(version)) or launcher_path != str(paths.launcher):
        raise ValueError("manifest paths are not this user's install paths")
    return Manifest(
        version=version,
        artifact_path=paths.artifact(version),
        artifact_sha256=sha256,
        launcher_path=paths.launcher,
        installed_at=installed_at,
    )


def on_path(variable: str, directory: Path) -> bool:
    """Whether ``directory`` is one of the absolute entries of a ``PATH`` value; a relative or empty entry never is."""
    wanted = os.path.normpath(directory)
    return any(entry.startswith("/") and os.path.normpath(entry) == wanted for entry in variable.split(":"))


def path_action(variable: str, directory: Path) -> PathAction:
    """What the user must do so a launcher in ``directory`` resolves: nothing, or add the directory themselves."""
    return "none" if on_path(variable, directory) else "add_home_local_bin"


def stage_name(final: str, nonce: str) -> str:
    """The hidden name a file is written under beside ``final`` before it replaces it."""
    return f".{final}.stage-{nonce}"


def is_stage_name(name: str, final: str) -> bool:
    """True only for a name ``stage_name`` can produce for ``final``, so recovery never touches anything else."""
    return re.fullmatch(rf"\.{re.escape(final)}\.stage-{_NONCE}", name) is not None


def is_ferret_artifact_path(target: str, paths: InstallPaths) -> bool:
    """True when ``target`` is exactly where some version's artifact lives: normalized, absolute, one level down."""
    if not target.startswith("/") or os.path.normpath(target) != target:
        return False
    path = Path(target)
    return path.name == ARTIFACT_FILE and path.parent.parent == paths.share and is_version(path.parent.name)
