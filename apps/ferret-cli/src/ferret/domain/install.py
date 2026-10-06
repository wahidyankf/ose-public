"""The per-user install layout and the manifest rules: where each object lives and what makes a manifest trusted."""

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Final, Literal, cast

from typekit import Err, Ok, Result, attempt

from ferret.domain.storage import DOCUMENT_SCHEMA_VERSION
from ferret.domain.timestamps import parse_timestamp

ARTIFACT_FILE: Final = "ferret.pyz"
LAUNCHER_FILE: Final = "ferret"
MANIFEST_FILE: Final = "install.json"

DIRECTORY_MODE: Final = 0o700
ARTIFACT_MODE: Final = 0o700
LAUNCHER_MODE: Final = 0o700
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
_NOT_STRICT_JSON: Final = "manifest is not strict JSON"

# The launcher is a script rather than a link so it can name the interpreter the install resolved. A link would
# leave the archive's ``#!/usr/bin/env python3`` in charge, and on a host whose ``python3`` is older than FERRET
# requires that costs a second interpreter start on every hook call, which is the one path that must stay cheap.
LAUNCHER_NOTICE: Final = "# Written by 'ferret self install'. Reinstall to change the interpreter or the version."
_LAUNCHER = re.compile(r"#!/bin/sh\n" + re.escape(LAUNCHER_NOTICE) + r'\nexec "([^"\n]+)" "([^"\n]+)" "\$@"\n\Z')


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


def _json_object(parsed: object) -> Result[dict[str, object], ValueError]:
    """``parsed`` when it is a JSON object, which is all a manifest may be."""
    if not isinstance(parsed, dict):
        return Err(ValueError("manifest is not an object"))
    return Ok(cast(dict[str, object], parsed))


def _strict_fault(fault: ValueError | RecursionError) -> ValueError | RecursionError:
    """A document that is not JSON is a manifest fault; the interpreter's own depth limit is returned as it is."""
    return fault if isinstance(fault, RecursionError) else ValueError(_NOT_STRICT_JSON)


def _strict_object(content: bytes) -> Result[dict[str, object], ValueError | RecursionError]:
    """The one JSON object ``content`` is, read strictly: UTF-8, no member repeated, nothing else in the document.

    ``json.loads`` calls the hook for every object it closes, and a hook can only signal by raising, which this layer
    never does. So the hook records a repeated member in ``repeated``, which this function owns, and the ``Err`` is
    made here once the parse is done. A document nested past the interpreter's limit raises ``RecursionError``, which
    stays an ``Err`` of its own unless a repeat was recorded first.
    """
    repeated: list[str] = []

    def keep_unique(pairs: list[tuple[str, object]]) -> dict[str, object]:
        document = dict(pairs)
        if len(document) != len(pairs):
            repeated.append("manifest repeats a member")
        return document

    def read() -> object:
        return json.loads(content.decode("utf-8"), object_pairs_hook=keep_unique)

    parsed = attempt(read, ValueError, RecursionError)
    if repeated:
        # The repeat's object closed before any nesting too deep was reached, so it is the first fault met, whatever
        # the parse made of the rest of the document.
        return Err(ValueError(_NOT_STRICT_JSON))
    return parsed.map_err(_strict_fault).flat_map(_json_object)


def _closed_members(document: dict[str, object]) -> Result[dict[str, object], ValueError]:
    """``document`` when its members are exactly the closed set, in the normative order."""
    if tuple(document) != MANIFEST_MEMBERS:
        return Err(ValueError("manifest members are not the closed set in the normative order"))
    return Ok(document)


def _member_texts(document: dict[str, object]) -> Result[tuple[str, ...], ValueError]:
    """The value of every member, in the normative order, provided each is text."""
    texts: list[str] = []
    for name in MANIFEST_MEMBERS:
        value = document[name]
        if not isinstance(value, str):
            return Err(ValueError(f"manifest member {name} is not text"))
        texts.append(value)
    return Ok(tuple(texts))


def _manifest_for(texts: tuple[str, ...], paths: InstallPaths) -> Result[Manifest, ValueError]:
    """The manifest these member texts record, provided each is what the rules allow for these install paths."""
    schema, version, artifact_path, sha256, launcher_path, installed_at = texts
    if schema != DOCUMENT_SCHEMA_VERSION:
        return Err(ValueError("manifest schema version is not supported"))
    if not is_version(version):
        return Err(ValueError("manifest version is not a semantic version"))
    if _SHA256.fullmatch(sha256) is None:
        return Err(ValueError("manifest digest is not a lowercase SHA-256"))
    if isinstance(parse_timestamp(installed_at), Err):
        return Err(ValueError("manifest installedAt is not a canonical UTC timestamp"))
    if artifact_path != str(paths.artifact(version)) or launcher_path != str(paths.launcher):
        return Err(ValueError("manifest paths are not this user's install paths"))
    return Ok(
        Manifest(
            version=version,
            artifact_path=paths.artifact(version),
            artifact_sha256=sha256,
            launcher_path=paths.launcher,
            installed_at=installed_at,
        )
    )


def parse_manifest(content: bytes, paths: InstallPaths) -> Result[Manifest, ValueError | RecursionError]:
    """Read a manifest for exactly these install paths, or an ``Err`` of ``ValueError`` naming the first rule it breaks.

    The document must be strict JSON: one object with every member of the closed set, in the normative order, each
    a string, no member repeated, and nothing else. The artifact and launcher paths must be the ones ``paths``
    derives from the recorded version, so a manifest can never point outside the install area. A document nested past
    the interpreter's limit is an ``Err`` of ``RecursionError``: no rule of the manifest was broken, the reader gave up.
    """
    return (
        _strict_object(content)
        .flat_map(_closed_members)
        .flat_map(_member_texts)
        .flat_map(lambda texts: _manifest_for(texts, paths))
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


def is_quotable(path: str) -> bool:
    """Whether a path can appear inside the launcher's double quotes without changing what the shell runs."""
    return '"' not in path and "\\" not in path and "\n" not in path and "$" not in path and "`" not in path


def launcher_script(interpreter: Path, artifact: Path) -> Result[bytes, ValueError]:
    """The launcher that starts ``artifact`` on ``interpreter``, passing every argument through unchanged.

    ``exec`` replaces the shell, so the launcher costs no process of its own and the caller waits on FERRET
    itself. A path the shell would not read back literally is an ``Err`` rather than escaped, because an install
    that cannot write an exact launcher must fail visibly instead of writing an approximate one.
    """
    if not (is_quotable(str(interpreter)) and is_quotable(str(artifact))):
        return Err(ValueError("a path the launcher cannot quote"))
    return Ok(f'#!/bin/sh\n{LAUNCHER_NOTICE}\nexec "{interpreter}" "{artifact}" "$@"\n'.encode())


def launcher_artifact(content: bytes, paths: InstallPaths) -> Path | None:
    """The artifact a launcher this user wrote starts, or ``None`` when the bytes are not one FERRET made.

    Recognition is by exact shape, so nothing hand-edited or merely similar is ever mistaken for ours and
    replaced. The interpreter it names is deliberately not checked: an install may legitimately have pinned one
    that has since moved, and that is a reason to rewrite the launcher, not to refuse the install.
    """
    decoded = attempt(lambda: content.decode("utf-8"), UnicodeDecodeError)
    if isinstance(decoded, Err):
        return None
    matched = _LAUNCHER.fullmatch(decoded.value)
    if matched is None or not is_ferret_artifact_path(matched.group(2), paths):
        return None
    return Path(matched.group(2))


def is_ferret_artifact_path(target: str, paths: InstallPaths) -> bool:
    """True when ``target`` is exactly where some version's artifact lives: normalized, absolute, one level down."""
    if not target.startswith("/") or os.path.normpath(target) != target:
        return False
    path = Path(target)
    return path.name == ARTIFACT_FILE and path.parent.parent == paths.share and is_version(path.parent.name)
