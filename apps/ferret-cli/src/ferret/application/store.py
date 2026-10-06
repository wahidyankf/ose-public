"""Checks every persistent command makes about the data home before it reads or writes anything in it."""

import json
from typing import Any, Literal, cast

from typekit import Err, Ok, attempt

from ferret.application.ports import DataHomeFiles, FileFacts
from ferret.domain.errors import FerretError, FerretResult
from ferret.domain.fields import UUID_V4
from ferret.domain.storage import (
    CONFIG_FILE,
    DATABASE_FILE,
    DOCUMENT_SCHEMA_VERSION,
    IDENTITY_FILE,
    KEY_BYTES,
    KEY_FILE,
    is_private_mode,
)
from ferret.domain.timestamps import parse_timestamp

ARTIFACTS = (KEY_FILE, IDENTITY_FILE, CONFIG_FILE, DATABASE_FILE)
_IDENTITY_FIELDS = frozenset({"schemaVersion", "installationId", "createdAt"})


def _unavailable() -> FerretError:
    """The one refusal of a store whose contents cannot be used."""
    return FerretError("ferret.storage.unavailable")


def require_safe(facts: FileFacts, expected: Literal["file", "directory"]) -> FerretResult[None]:
    """Refuse an existing object that is not a private regular file or directory owned by this user."""
    if facts.kind == "missing":
        return Ok(None)
    if facts.kind != expected or not facts.owned_by_current_user or not is_private_mode(facts.mode):
        return Err(FerretError("ferret.storage.unsafe"))
    if expected == "file" and facts.link_count != 1:
        return Err(FerretError("ferret.storage.unsafe"))
    return Ok(None)


def _require_artifacts(files: DataHomeFiles, directory: FileFacts) -> FerretResult[None]:
    """Refuse an artifact that is unsafe, and then a directory or an artifact that is missing, in that order."""
    present = [files.facts(name) for name in ARTIFACTS]
    for facts in present:
        safe = require_safe(facts, "file")
        if isinstance(safe, Err):
            return safe
    if directory.kind == "missing" or any(facts.kind == "missing" for facts in present):
        return Err(FerretError("ferret.storage.uninitialized"))
    return Ok(None)


def require_initialized(files: DataHomeFiles) -> FerretResult[None]:
    """Refuse a data home that is unsafe, or that is missing the directory or any artifact ``init`` creates.

    Safety is judged before absence, so a widened or linked object is reported as unsafe rather than as missing.
    Nothing is created or repaired.
    """
    directory = files.facts(None)
    return require_safe(directory, "directory").flat_map(lambda _: _require_artifacts(files, directory))


def _json_object(document: object) -> FerretResult[dict[str, Any]]:
    """``document`` when it is a JSON object, which is all a stored document may be."""
    if not isinstance(document, dict):
        return Err(_unavailable())
    return Ok(cast(dict[str, Any], document))


def read_document(content: bytes) -> FerretResult[dict[str, Any]]:
    """One stored JSON document as a dictionary; anything else is a store that cannot be used.

    Only a ``ValueError`` is a refusal, as the ``except`` this replaced named only that: a document nested past the
    interpreter's limit still raises ``RecursionError`` to the caller's last resort.
    """
    return attempt(lambda: json.loads(content), ValueError).map_err(lambda _: _unavailable()).flat_map(_json_object)


def _identity(document: dict[str, Any]) -> FerretResult[str]:
    """The installation ID of ``document`` when it is exactly the identity members and its ID and moment are valid."""
    installation_id = document.get("installationId")
    if (
        frozenset(document) != _IDENTITY_FIELDS
        or document["schemaVersion"] != DOCUMENT_SCHEMA_VERSION
        or not isinstance(installation_id, str)
        or UUID_V4.fullmatch(installation_id) is None
    ):
        return Err(_unavailable())
    return parse_timestamp(str(document["createdAt"])).map(lambda _: installation_id).map_err(lambda _: _unavailable())


def installation_id_from(content: bytes) -> FerretResult[str]:
    """The installation ID in the bytes of ``identity.json``, after checking that the whole document is well formed."""
    return read_document(content).flat_map(_identity)


def read_key(files: DataHomeFiles) -> FerretResult[bytes]:
    """The installation's HMAC key, which is exactly ``KEY_BYTES`` long or the store cannot be used."""
    key = files.read_file(KEY_FILE)
    if len(key) != KEY_BYTES:
        return Err(_unavailable())
    return Ok(key)
