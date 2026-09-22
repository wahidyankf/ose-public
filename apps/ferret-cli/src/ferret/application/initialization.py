"""Initialization: create, verify, or complete the one private store for the current operating-system user."""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from ferret.application.ports import Runtime
from ferret.application.store import ARTIFACTS, installation_id_from, read_document, read_key, require_safe
from ferret.domain.errors import FerretError
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


def _verify_config(content: bytes) -> None:
    if _compact(read_document(content)) != _compact(_CONFIG):
        raise FerretError("ferret.storage.unavailable")


def initialize_store(runtime: Runtime) -> InitResult:
    """Create the private data home, identity, key, configuration, and schema, or complete a partial one.

    Every write happens under the exclusive data-home lock, after every existing object has been verified, so
    concurrent initializations converge on one identity and an interrupted one is finished rather than replaced.
    """
    files = runtime.files
    files.ensure_directory(PRIVATE_DIRECTORY_MODE)
    require_safe(files.facts(None), "directory")
    with files.lock():
        present = {name: files.facts(name) for name in ARTIFACTS}
        for facts in present.values():
            require_safe(facts, "file")
        # The database is created last, so a database without its companions cannot come from an interrupted
        # initialization: refuse it rather than mint a second identity for stored telemetry.
        if present[DATABASE_FILE].kind != "missing" and any(present[name].kind == "missing" for name in _COMPANIONS):
            raise FerretError("ferret.storage.unavailable")

        if present[KEY_FILE].kind == "missing":
            files.create_file(KEY_FILE, runtime.randomness.token_bytes(KEY_BYTES), PRIVATE_FILE_MODE)
        else:
            read_key(files)

        if present[IDENTITY_FILE].kind == "missing":
            installation_id = runtime.randomness.uuid4()
            identity = {
                "schemaVersion": DOCUMENT_SCHEMA_VERSION,
                "installationId": installation_id,
                "createdAt": format_timestamp(runtime.clock.now()),
            }
            files.create_file(IDENTITY_FILE, _compact(identity), PRIVATE_FILE_MODE)
        else:
            installation_id = installation_id_from(files.read_file(IDENTITY_FILE))

        if present[CONFIG_FILE].kind == "missing":
            files.create_file(CONFIG_FILE, _compact(_CONFIG), PRIVATE_FILE_MODE)
        else:
            _verify_config(files.read_file(CONFIG_FILE))

        if present[DATABASE_FILE].kind == "missing":
            files.create_file(DATABASE_FILE, b"", PRIVATE_FILE_MODE)
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
