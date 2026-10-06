"""Retention and space: the bounded foreground prune every operation attempts, and the explicit maintenance command.

Foreground pruning is best effort and rides on whatever operation happens to come next. Explicit maintenance is the
thorough version: it prunes until nothing expired remains, folds the log into the database, and rewrites the file
when enough of it is free, measuring the store around each step so that the reported peak is one that was seen.
"""

from dataclasses import dataclass
from typing import Literal

from typekit import Err, Ok

from ferret.application.ports import Budget, ExpiryCounters, PruneResult, Runtime
from ferret.application.store import require_initialized
from ferret.domain.errors import FerretError, FerretResult, as_internal_failure
from ferret.domain.retention import PRUNE_BUDGET_MS, PRUNE_ROW_LIMIT, is_due
from ferret.domain.space import StorageFacts, high_water_bytes, should_compact


@dataclass(frozen=True, slots=True)
class Reclamation:
    """What one reclamation did and every measurement it took, in order.

    ``checkpoint`` is the outcome of the last checkpoint attempted, and ``compaction`` says whether the free pages were
    worth a rewrite and, if they were, whether it succeeded.
    """

    checkpoint: Literal["truncated", "skipped"]
    compaction: Literal["not_needed", "compacted", "failed"]
    measurements: tuple[StorageFacts, ...]


@dataclass(frozen=True, slots=True)
class Pruned:
    """The rows one maintenance run removed."""

    events: int = 0
    workspaces: int = 0
    snapshots: int = 0


@dataclass(frozen=True, slots=True)
class MaintenanceReport:
    """The outcome of one ``maintenance`` run: what expired, the lifetime counters, and the bytes before and after."""

    result: Literal["completed", "not_due"]
    pruned: Pruned
    counters: ExpiryCounters
    before: StorageFacts
    after: StorageFacts
    high_water_bytes: int


def prune_due(runtime: Runtime) -> PruneResult | None:
    """Attempt one bounded prune when maintenance is due, and report it; ``None`` means nothing was due.

    Retention is best effort. A failure of any kind, including a write lock that could not be taken inside the budget,
    is absorbed and reported as skipped, so it can neither fail nor delay the operation that happened to trigger it.
    That operation's own storage access surfaces a store that is really unusable. The budget starts once the marker
    says a prune is due, so the wait for the write lock is charged to it.
    """
    now = runtime.clock.now()
    try:
        if not is_due(runtime.telemetry.last_completed_at(), now):
            return None
        budget = Budget.start(runtime.monotonic, PRUNE_BUDGET_MS)
        return runtime.telemetry.prune_batch(now=now, limit=PRUNE_ROW_LIMIT, budget=budget)
    except FerretError:
        return PruneResult("skipped")


def open_store(runtime: Runtime) -> FerretResult[None]:
    """Refuse an unusable data home, then give retention its turn before the caller touches storage itself.

    Every argument the caller was given is validated before this runs, so a refused request never reaches the prune.
    """
    return require_initialized(runtime.files).tap(lambda _: prune_due(runtime))


def measure_storage(runtime: Runtime) -> StorageFacts:
    """The store's database bytes, log bytes, and free-page bytes as they stand."""
    return runtime.telemetry.storage_facts()


def reclaim_space(runtime: Runtime) -> FerretResult[Reclamation]:
    """Fold the log into the database and, when the free pages are worth it, rewrite the file without them.

    The checkpoint never waits for a reader: one that holds the log makes it skip, and the log is folded away by a
    later run. A rewrite is refused for a database that fails a full integrity check, so a damaged file is never
    rewritten, and it goes through the log, so it is followed by a second checkpoint. A rewrite that fails changes no
    byte and needs no second checkpoint.
    """
    telemetry = runtime.telemetry
    measurements = [telemetry.storage_facts()]
    checkpoint = telemetry.checkpoint()
    settled = telemetry.storage_facts()
    measurements.append(settled)
    if not should_compact(settled):
        return Ok(Reclamation(checkpoint, "not_needed", tuple(measurements)))
    if not telemetry.check_integrity(thorough=True):
        return Err(FerretError("ferret.storage.integrity-failure"))
    compaction = telemetry.compact()
    measurements.append(compaction.measured)
    if compaction.outcome == "failed":
        return Ok(Reclamation(checkpoint, "failed", tuple(measurements)))
    checkpoint = telemetry.checkpoint()
    measurements.append(telemetry.storage_facts())
    return Ok(Reclamation(checkpoint, "compacted", tuple(measurements)))


def prune_to_exhaustion(runtime: Runtime) -> FerretResult[Pruned]:
    """Run bounded prune transactions until one finds nothing expired, counting what they removed.

    Each transaction has its own budget, and the moment ``now`` is fixed for the whole run, so a row that expires while
    the run is under way is left for the next one. A transaction that cannot take the write lock ends the run.
    """
    now = runtime.clock.now()
    events = workspaces = snapshots = 0
    while True:
        budget = Budget.start(runtime.monotonic, PRUNE_BUDGET_MS)
        result = runtime.telemetry.prune_batch(now=now, limit=PRUNE_ROW_LIMIT, budget=budget)
        if result.state == "skipped":
            return Err(FerretError("ferret.storage.unavailable", retryable=True))
        events += result.events
        workspaces += result.workspaces
        snapshots += result.snapshots
        if result.completed:
            return Ok(Pruned(events, workspaces, snapshots))


def _report_completed(
    runtime: Runtime, before: StorageFacts, pruned: Pruned, reclamation: Reclamation
) -> FerretResult[MaintenanceReport]:
    """The report of a whole run, whose peak is the largest of the measurements taken around its steps."""
    return (
        high_water_bytes([before, *reclamation.measurements])
        .map_err(as_internal_failure)
        .map(
            lambda peak: MaintenanceReport(
                "completed",
                pruned,
                runtime.telemetry.expiry_counters(),
                before,
                reclamation.measurements[-1],
                peak,
            )
        )
    )


def _maintain(runtime: Runtime, *, if_due: bool) -> FerretResult[MaintenanceReport]:
    """The run of an initialized store: only a measurement when it is not yet due, and otherwise the whole of it."""
    telemetry = runtime.telemetry
    if if_due and not is_due(telemetry.last_completed_at(), runtime.clock.now()):
        facts = measure_storage(runtime)
        # One measurement, so the high-water mark is that measurement's own footprint.
        return Ok(
            MaintenanceReport("not_due", Pruned(), telemetry.expiry_counters(), facts, facts, facts.footprint_bytes)
        )
    before = measure_storage(runtime)
    return prune_to_exhaustion(runtime).flat_map(
        lambda pruned: reclaim_space(runtime).flat_map(
            lambda reclamation: _report_completed(runtime, before, pruned, reclamation)
        )
    )


def run_maintenance(runtime: Runtime, *, if_due: bool) -> FerretResult[MaintenanceReport]:
    """Prune every expired row, then reclaim space; with ``if_due``, do nothing but measure until a run is due."""
    return require_initialized(runtime.files).flat_map(lambda _: _maintain(runtime, if_due=if_due))
