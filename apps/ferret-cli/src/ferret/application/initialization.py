"""Initialization: create, verify, or complete the one private store for the current operating-system user."""

import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from typekit import Err, Ok

from ferret.application.ports import FileFacts, Runtime
from ferret.application.store import ARTIFACTS, installation_id_from, read_document, read_key, require_safe
from ferret.domain.errors import FerretError, FerretResult, as_internal_failure
from ferret.domain.storage import (
    CONFIG_FILE,
    DATABASE_FILE,
    DOCUMENT_SCHEMA_VERSION,
    IDENTITY_FILE,
    KEY_BYTES,
    KEY_FILE,
    MAINTENANCE_INTERVAL_SECONDS,
    PRIVATE_DIRECTORY_MODE,
    PRIVATE_FILE_MODE,
    RETENTION_DAYS,
)
from ferret.domain.timestamps import format_timestamp

_COMPANIONS = (KEY_FILE, IDENTITY_FILE, CONFIG_FILE)
_CONFIG = {
    "schemaVersion": DOCUMENT_SCHEMA_VERSION,
    "retentionDays": RETENTION_DAYS,
    "maintenanceIntervalSeconds": MAINTENANCE_INTERVAL_SECONDS,
}


@dataclass(frozen=True, slots=True)
class InitResult:
    """The outcome of ``ferret init``: which store, which identity, and whether this call created it."""

    result: Literal["created", "already_initialized"]
    data_home: Path
    database_path: Path
    schema_number: int
    installation_id: str
    retention_days: int
    permissions_state: Literal["private"]


def _compact(document: dict[str, Any]) -> bytes:
    return (json.dumps(document, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def _verify_config(content: bytes) -> FerretResult[None]:
    return read_document(content).flat_map(
        lambda document: (
            Ok(None) if _compact(document) == _compact(_CONFIG) else Err(FerretError("ferret.storage.unavailable"))
        )
    )


def _require_private_artifacts(present: Mapping[str, FileFacts]) -> FerretResult[None]:
    """The first artifact that is not a private regular file of this user refuses the initialization."""
    for facts in present.values():
        safe = require_safe(facts, "file")
        if isinstance(safe, Err):
            return safe
    return Ok(None)


def _require_companions(present: Mapping[str, FileFacts]) -> FerretResult[None]:
    """The database is created last, so a database without its companions cannot come from an interrupted one.

    Refuse it rather than mint a second identity for stored telemetry.
    """
    if present[DATABASE_FILE].kind != "missing" and any(present[name].kind == "missing" for name in _COMPANIONS):
        return Err(FerretError("ferret.storage.unavailable"))
    return Ok(None)


def _ensure_key(runtime: Runtime, present: Mapping[str, FileFacts]) -> FerretResult[None]:
    """Create the key when it is missing, and otherwise check that the one stored is usable."""
    files = runtime.files
    if present[KEY_FILE].kind == "missing":
        files.create_file(KEY_FILE, runtime.randomness.token_bytes(KEY_BYTES), PRIVATE_FILE_MODE)
        return Ok(None)
    return read_key(files).map(lambda _: None)


def _ensure_identity(runtime: Runtime, present: Mapping[str, FileFacts]) -> FerretResult[str]:
    """The installation ID: the one stored, or a new one written down with the moment it was made."""
    files = runtime.files
    if present[IDENTITY_FILE].kind != "missing":
        return installation_id_from(files.read_file(IDENTITY_FILE))
    installation_id = runtime.randomness.uuid4()
    return (
        format_timestamp(runtime.clock.now())
        .map_err(as_internal_failure)
        .tap(
            lambda created_at: files.create_file(
                IDENTITY_FILE,
                _compact(
                    {
                        "schemaVersion": DOCUMENT_SCHEMA_VERSION,
                        "installationId": installation_id,
                        "createdAt": created_at,
                    }
                ),
                PRIVATE_FILE_MODE,
            )
        )
        .map(lambda _: installation_id)
    )


def _ensure_config(runtime: Runtime, present: Mapping[str, FileFacts]) -> FerretResult[None]:
    """Create the configuration when it is missing, and otherwise check that it is exactly the supported one."""
    files = runtime.files
    if present[CONFIG_FILE].kind == "missing":
        files.create_file(CONFIG_FILE, _compact(_CONFIG), PRIVATE_FILE_MODE)
        return Ok(None)
    return _verify_config(files.read_file(CONFIG_FILE))


def _finish(runtime: Runtime, present: Mapping[str, FileFacts], installation_id: str) -> InitResult:
    """Create the empty database file when it is missing, and migrate it, which makes the schema."""
    if present[DATABASE_FILE].kind == "missing":
        runtime.files.create_file(DATABASE_FILE, b"", PRIVATE_FILE_MODE)
    state = runtime.schema.migrate()
    return InitResult(
        result="created" if state.applied_now else "already_initialized",
        data_home=runtime.data_home,
        database_path=runtime.data_home / DATABASE_FILE,
        schema_number=state.number,
        installation_id=installation_id,
        retention_days=RETENTION_DAYS,
        permissions_state="private",
    )


def _complete(runtime: Runtime) -> FerretResult[InitResult]:
    """Verify every existing object, and then create or check each artifact in the order an interruption can leave."""
    present = {name: runtime.files.facts(name) for name in ARTIFACTS}
    return (
        _require_private_artifacts(present)
        .flat_map(lambda _: _require_companions(present))
        .flat_map(lambda _: _ensure_key(runtime, present))
        .flat_map(lambda _: _ensure_identity(runtime, present))
        .flat_map(
            lambda installation_id: _ensure_config(runtime, present).map(
                lambda _: _finish(runtime, present, installation_id)
            )
        )
    )


def _initialize_under_lock(runtime: Runtime) -> FerretResult[InitResult]:
    """Complete the store while holding the lock, which every way out of the block releases, a refusal included."""
    with runtime.files.lock():
        return _complete(runtime)


def initialize_store(runtime: Runtime) -> FerretResult[InitResult]:
    """Create the private data home, identity, key, configuration, and schema, or complete a partial one.

    Every write happens under the exclusive data-home lock, after every existing object has been verified, so
    concurrent initializations converge on one identity and an interrupted one is finished rather than replaced.
    """
    files = runtime.files
    files.ensure_directory(PRIVATE_DIRECTORY_MODE)
    return require_safe(files.facts(None), "directory").flat_map(lambda _: _initialize_under_lock(runtime))
