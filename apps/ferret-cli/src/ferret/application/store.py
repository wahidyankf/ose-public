"""Checks every persistent command makes about the data home before it reads or writes anything in it."""

import json
from typing import Any, Literal, cast

from ferret.application.ports import DataHomeFiles, FileFacts
from ferret.domain.errors import FerretError
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


def require_safe(facts: FileFacts, expected: Literal["file", "directory"]) -> None:
    """Refuse an existing object that is not a private regular file or directory owned by this user."""
    if facts.kind == "missing":
        return
    if facts.kind != expected or not facts.owned_by_current_user or not is_private_mode(facts.mode):
        raise FerretError("ferret.storage.unsafe")
    if expected == "file" and facts.link_count != 1:
        raise FerretError("ferret.storage.unsafe")


def require_initialized(files: DataHomeFiles) -> None:
    """Refuse a data home that is unsafe, or that is missing the directory or any artifact ``init`` creates.

    Safety is judged before absence, so a widened or linked object is reported as unsafe rather than as missing.
    Nothing is created or repaired.
    """
    directory = files.facts(None)
    require_safe(directory, "directory")
    present = {name: files.facts(name) for name in ARTIFACTS}
    for facts in present.values():
        require_safe(facts, "file")
    if directory.kind == "missing" or any(facts.kind == "missing" for facts in present.values()):
        raise FerretError("ferret.storage.uninitialized")


def read_document(content: bytes) -> dict[str, Any]:
    """One stored JSON document as a dictionary; anything else is a store that cannot be used."""
    try:
        document: object = json.loads(content)
    except ValueError:
        raise FerretError("ferret.storage.unavailable") from None
    if not isinstance(document, dict):
        raise FerretError("ferret.storage.unavailable")
    return cast(dict[str, Any], document)


def installation_id_from(content: bytes) -> str:
    """The installation ID in the bytes of ``identity.json``, after checking that the whole document is well formed."""
    document = read_document(content)
    installation_id = document.get("installationId")
    if (
        frozenset(document) != _IDENTITY_FIELDS
        or document["schemaVersion"] != DOCUMENT_SCHEMA_VERSION
        or not isinstance(installation_id, str)
        or UUID_V4.fullmatch(installation_id) is None
    ):
        raise FerretError("ferret.storage.unavailable")
    try:
        parse_timestamp(str(document["createdAt"]))
    except ValueError:
        raise FerretError("ferret.storage.unavailable") from None
    return installation_id


def read_key(files: DataHomeFiles) -> bytes:
    """The installation's HMAC key, which is exactly ``KEY_BYTES`` long or the store cannot be used."""
    key = files.read_file(KEY_FILE)
    if len(key) != KEY_BYTES:
        raise FerretError("ferret.storage.unavailable")
    return key
