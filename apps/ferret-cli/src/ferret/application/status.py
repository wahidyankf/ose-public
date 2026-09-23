"""``status``: one read-only report of the store, its physical space, retention, the runtime, and each adapter.

Nothing is written and nothing is pruned, so a report shows the store as it stands. A store that cannot be reported on
is a closed failure rather than a partial report: an uninitialized or unsafe data home, a failed integrity probe, and
an unreadable database each end the command with the error that names them.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import ClassVar, Literal

from ferret import __version__
from ferret.application.ports import ExpiryCounters, InterpreterFacts, Runtime, StoreCounts
from ferret.application.store import require_initialized
from ferret.domain.capability import CapabilitySnapshot
from ferret.domain.errors import FerretError
from ferret.domain.retention import NEAR_EXPIRY_WINDOW, is_due
from ferret.domain.space import StorageFacts
from ferret.domain.status import (
    ADAPTERS,
    ConfigurationState,
    InterpreterState,
    PlatformSupport,
    interpreter_state,
)
from ferret.domain.storage import DATABASE_FILE


@dataclass(frozen=True, slots=True)
class AdapterStatus:
    """One harness adapter: how far its platform is supported, and what its latest live snapshot says it can observe.

    An adapter is configured exactly when the store holds a snapshot of it that has not expired, because a snapshot is
    the only evidence of a working adapter that the store keeps.
    """

    harness: str
    platform_support: PlatformSupport
    snapshot: CapabilitySnapshot | None

    @property
    def configuration_state(self) -> ConfigurationState:
        return "not_configured" if self.snapshot is None else "configured"


@dataclass(frozen=True, slots=True)
class StatusReport:
    """Everything ``status`` reports.

    A report exists only for a store that passed every check, so its database, integrity, and permissions states are
    fixed: a store that failed one of them is a closed failure and never reaches a report.
    """

    DATABASE_STATE: ClassVar[Literal["healthy"]] = "healthy"
    INTEGRITY_STATE: ClassVar[Literal["ok"]] = "ok"
    PERMISSIONS_STATE: ClassVar[Literal["private"]] = "private"
    BACKEND_STATE: ClassVar[Literal["not_available_in_this_version"]] = "not_available_in_this_version"

    ferret_version: str
    interpreter: InterpreterFacts
    interpreter_state: InterpreterState
    data_home: Path
    database_path: Path
    schema_number: int
    counts: StoreCounts
    facts: StorageFacts
    counters: ExpiryCounters
    last_maintenance_at: str | None
    maintenance_due: bool
    #: What the fail-open callback lost, since it can say nothing itself.
    hook_failure_count: int
    last_hook_failure_at: str | None
    adapters: tuple[AdapterStatus, ...]


def report_status(runtime: Runtime) -> StatusReport:
    """Read the store as it stands and describe it, failing closed on anything that makes a report untrustworthy.

    The file sizes come first, before any connection is opened, so a log left unfolded by another process is reported
    as it stands rather than as this command's own connections leave it.
    """
    require_initialized(runtime.files)
    telemetry = runtime.telemetry
    facts = telemetry.storage_facts()
    if not telemetry.check_integrity(thorough=False):
        raise FerretError("ferret.storage.integrity-failure")
    now = runtime.clock.now()
    last_maintenance_at = telemetry.last_completed_at()
    hook_failure_count, last_hook_failure_at = runtime.hook_failures.read()
    return StatusReport(
        ferret_version=__version__,
        interpreter=runtime.interpreter,
        interpreter_state=interpreter_state(runtime.interpreter.path, runtime.interpreter.version),
        data_home=runtime.data_home,
        database_path=runtime.data_home / DATABASE_FILE,
        schema_number=telemetry.schema_number(),
        counts=telemetry.counts(now=now, near_expiry_within=NEAR_EXPIRY_WINDOW),
        facts=facts,
        counters=telemetry.expiry_counters(),
        last_maintenance_at=last_maintenance_at,
        maintenance_due=is_due(last_maintenance_at, now),
        hook_failure_count=hook_failure_count,
        last_hook_failure_at=last_hook_failure_at,
        adapters=tuple(
            AdapterStatus(harness, support, runtime.capabilities.latest_snapshot(harness, now=now))
            for harness, support in ADAPTERS
        ),
    )
