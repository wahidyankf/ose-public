"""Initialization: create, verify, or complete the one private store for the current operating-system user."""

import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from typekit import Err, Ok

from ferret.application.ports import FileFacts, Runtime
from ferret.application.store import artifact_facts, installation_id_from, read_document, read_key, require_safe
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
        return files.create_file(KEY_FILE, runtime.randomness.token_bytes(KEY_BYTES), PRIVATE_FILE_MODE)
    return read_key(files).map(lambda _: None)


def _ensure_identity(runtime: Runtime, present: Mapping[str, FileFacts]) -> FerretResult[str]:
    """The installation ID: the one stored, or a new one written down with the moment it was made."""
    files = runtime.files
    if present[IDENTITY_FILE].kind != "missing":
        return files.read_file(IDENTITY_FILE).flat_map(installation_id_from)
    installation_id = runtime.randomness.uuid4()
    return (
        format_timestamp(runtime.clock.now())
        .map_err(as_internal_failure)
        .flat_map(
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
        return files.create_file(CONFIG_FILE, _compact(_CONFIG), PRIVATE_FILE_MODE)
    return files.read_file(CONFIG_FILE).flat_map(_verify_config)


def _ensure_database(runtime: Runtime, present: Mapping[str, FileFacts]) -> FerretResult[None]:
    """Create the empty database file when it is missing."""
    if present[DATABASE_FILE].kind == "missing":
        return runtime.files.create_file(DATABASE_FILE, b"", PRIVATE_FILE_MODE)
    return Ok(None)


def _migrated(runtime: Runtime, installation_id: str) -> InitResult:
    """Migrate the database, which makes the schema, and report what this call found."""
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


def _complete_from(runtime: Runtime, present: Mapping[str, FileFacts]) -> FerretResult[InitResult]:
    """Judge what exists, and then create or check each artifact in the order an interruption can leave."""
    return (
        _require_private_artifacts(present)
        .flat_map(lambda _: _require_companions(present))
        .flat_map(lambda _: _ensure_key(runtime, present))
        .flat_map(lambda _: _ensure_identity(runtime, present))
        .flat_map(
            lambda installation_id: (
                _ensure_config(runtime, present)
                .flat_map(lambda _: _ensure_database(runtime, present))
                .map(lambda _: _migrated(runtime, installation_id))
            )
        )
    )


def _complete(runtime: Runtime) -> FerretResult[InitResult]:
    """Verify every existing object, and then create or check each artifact in the order an interruption can leave."""
    return artifact_facts(runtime.files).flat_map(lambda present: _complete_from(runtime, present))


def _initialize_under_lock(runtime: Runtime) -> FerretResult[InitResult]:
    """Complete the store while holding the lock, which every way out of the work releases, a refusal included."""
    return runtime.files.with_lock(lambda: _complete(runtime))


def initialize_store(runtime: Runtime) -> FerretResult[InitResult]:
    """Create the private data home, identity, key, configuration, and schema, or complete a partial one.

    Every write happens under the exclusive data-home lock, after every existing object has been verified, so
    concurrent initializations converge on one identity and an interrupted one is finished rather than replaced.
    """
    files = runtime.files
    return (
        files.ensure_directory(PRIVATE_DIRECTORY_MODE)
        .flat_map(lambda _: files.facts(None))
        .flat_map(lambda directory: require_safe(directory, "directory"))
        .flat_map(lambda _: _initialize_under_lock(runtime))
    )
