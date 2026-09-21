"""Measure what a FERRET store weighs: its schema, rows, indexes, write-ahead log, and what retention gives back.

Run it against the built artifact, in an isolated home, with deterministic synthetic events (``synthetic_store``)::

    python storage_benchmark.py --events 100000 --seed 20260918 --output storage.json

Two identical stores are built from one seed. The first is measured: empty, loaded but not yet checkpointed,
checkpointed, exercised by real ``capture`` invocations, and then with its expired half deleted. The second is handed
to the artifact's own ``maintenance`` command, which prunes, checkpoints, and compacts by policy while the file sizes
are sampled from outside. The exit status is zero only when the bytes per event fall inside the planning envelope, or
an explanation is given for a result outside it, and no footprint seen during maintenance exceeds the high-water mark
the artifact reported by more than the documented allowance. Only synthetic aggregate results are kept; the databases
are discarded.
"""

import argparse
import json
import math
import os
import sqlite3
import sys
import tempfile
import threading
import time
from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime
from functools import partial
from pathlib import Path
from types import TracebackType
from typing import Any, Self

from event_documents import encode_document, numbered_event, stamp
from ferret_process import run_artifact
from synthetic_store import Row, insert_events, synthetic_rows

KIB = 1024
MIB = KIB * KIB
ENVELOPE_MIN_BYTES_PER_EVENT = 0.7 * KIB
ENVELOPE_MAX_BYTES_PER_EVENT = 1.5 * KIB
# The log can grow by one automatic checkpoint interval (1000 pages) between the moments the artifact measures a store.
PEAK_ALLOWANCE_BYTES = 8 * MIB
PROJECTED_EVENTS_PER_DAY = (5_000, 20_000, 100_000)
RETENTION_DAYS = 30
CONCURRENT_WRITERS = 4
DEFAULT_CAPTURE_SAMPLES = 40
POLL_INTERVAL_SECONDS = 0.002
BUILT_ARTIFACT = Path(__file__).resolve().parents[2] / "ferret-cli" / "dist" / "ferret.pyz"


class BenchmarkError(Exception):
    """A measurement could not be taken, or the artifact contradicted itself while it was."""


@dataclass(frozen=True, slots=True)
class Footprint:
    """The two files a store keeps its rows in, in bytes."""

    database_bytes: int
    wal_bytes: int

    @property
    def total_bytes(self) -> int:
        return self.database_bytes + self.wal_bytes

    def as_json(self) -> dict[str, int]:
        return {"databaseBytes": self.database_bytes, "walBytes": self.wal_bytes}


@dataclass(frozen=True, slots=True)
class SpaceUsage:
    """How the pages of a database are spent: tables, indexes, and the free list."""

    table_bytes: int
    index_bytes: int
    freelist_bytes: int
    page_size: int


@dataclass(frozen=True, slots=True)
class Acceptance:
    """Whether the size is inside the planning envelope, or outside it and explained, or outside it and not."""

    state: str
    problems: tuple[str, ...]
    explanation: str | None

    @property
    def passes(self) -> bool:
        return self.state != "unexplained"

    def as_json(self) -> dict[str, Any]:
        return {"state": self.state, "problems": list(self.problems), "explanation": self.explanation}


@dataclass(frozen=True, slots=True)
class Store:
    """One isolated FERRET data home driven only through the built artifact, plus direct file access for measuring."""

    artifact: Path
    home: Path

    @property
    def database(self) -> Path:
        return self.home / ".ferret" / "ferret.sqlite3"

    def run(self, *arguments: str) -> dict[str, Any]:
        """A command's ``--json`` result, or a ``BenchmarkError`` naming the closed error it failed with."""
        ran = run_artifact(self.artifact, [*arguments, "--json"], home=self.home)
        if (ran.returncode, ran.stderr) != (0, b""):
            raise BenchmarkError(f"ferret {' '.join(arguments)} exited {ran.returncode}: {ran.stderr.decode().strip()}")
        result: dict[str, Any] = json.loads(ran.stdout)
        return result


class PeakWatcher:
    """Samples a store's file sizes from a thread while a command runs, keeping the largest total it saw."""

    def __init__(self, database: Path) -> None:
        self._database = database
        self._stopped = threading.Event()
        self._thread = threading.Thread(target=self._sample_until_stopped, daemon=True)
        self.peak_bytes = 0

    def __enter__(self) -> Self:
        self._thread.start()
        return self

    def __exit__(
        self, error_type: type[BaseException] | None, error: BaseException | None, trace: TracebackType | None
    ) -> None:
        self._stopped.set()
        self._thread.join()

    def _sample_until_stopped(self) -> None:
        while True:
            self.peak_bytes = max(self.peak_bytes, footprint_of(self._database).total_bytes)
            if self._stopped.wait(POLL_INTERVAL_SECONDS):
                break


def size_of(path: Path) -> int:
    try:
        return path.stat().st_size
    except FileNotFoundError:
        return 0


def footprint_of(database: Path) -> Footprint:
    return Footprint(size_of(database), size_of(Path(f"{database}-wal")))


def open_store(artifact: Path, scratch: Path, name: str) -> Store:
    """A fresh isolated home with FERRET initialized in it."""
    home = scratch / name
    home.mkdir(mode=0o700)
    store = Store(artifact, home)
    store.run("init")
    return store


def space_usage(connection: sqlite3.Connection) -> SpaceUsage:
    """Table, index, and free-list bytes of the database ``connection`` is open on, from the page-level statistics."""
    kinds = dict(connection.execute("SELECT name, type FROM sqlite_schema").fetchall())
    page_size = int(connection.execute("PRAGMA page_size").fetchone()[0])
    free_pages = int(connection.execute("PRAGMA freelist_count").fetchone()[0])
    tables = indexes = 0
    try:
        for name, size in connection.execute("SELECT name, sum(pgsize) FROM dbstat GROUP BY name").fetchall():
            if kinds.get(name) == "index":
                indexes += int(size)
            else:
                tables += int(size)
    except sqlite3.OperationalError as error:
        raise BenchmarkError(f"this SQLite build cannot report page usage: {error}") from error
    return SpaceUsage(tables, indexes, free_pages * page_size, page_size)


def fold_log_into_database(connection: sqlite3.Connection) -> None:
    busy = int(connection.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()[0])
    if busy:
        raise BenchmarkError("the write-ahead log could not be truncated: another connection held the store")


def percentile(ordered: Sequence[float], fraction: float) -> float:
    """The nearest-rank percentile of an ascending sequence."""
    return ordered[max(0, math.ceil(fraction * len(ordered)) - 1)]


def distribution(samples_ms: Sequence[float]) -> dict[str, float | int]:
    ordered = sorted(samples_ms)
    return {
        "count": len(ordered),
        "minMs": round(ordered[0], 1),
        "p50Ms": round(percentile(ordered, 0.50), 1),
        "p95Ms": round(percentile(ordered, 0.95), 1),
        "maxMs": round(ordered[-1], 1),
        "meanMs": round(sum(ordered) / len(ordered), 1),
    }


def capture_once(store: Store, number: int) -> float:
    """One real ``capture`` invocation, end to end, in milliseconds; a refusal is a benchmark failure."""
    stdin = encode_document(numbered_event(number, now=datetime.now(UTC)))
    started = time.perf_counter()
    ran = run_artifact(store.artifact, ["capture", "--json"], home=store.home, stdin=stdin)
    elapsed = (time.perf_counter() - started) * 1000
    if (ran.returncode, ran.stderr) != (0, b""):
        raise BenchmarkError(f"ferret capture exited {ran.returncode}: {ran.stderr.decode().strip()}")
    return elapsed


def measure_capture(store: Store, samples: int) -> dict[str, Any]:
    """Capture latency for one writer at a time, then for a bounded pool of concurrent writers."""
    single = [capture_once(store, number) for number in range(1, samples + 1)]
    with ThreadPoolExecutor(max_workers=CONCURRENT_WRITERS) as pool:
        concurrent = list(pool.map(partial(capture_once, store), range(samples + 1, 2 * samples + 1)))
    return {"single": distribution(single), "concurrent": {"writers": CONCURRENT_WRITERS, **distribution(concurrent)}}


def load(store: Store, rows: Sequence[Row], *, now: datetime) -> tuple[Footprint, Footprint, SpaceUsage]:
    """Insert ``rows`` with no automatic checkpoint, measuring the files before and after the log is folded in."""
    with closing(sqlite3.connect(store.database, autocommit=True)) as connection:
        connection.execute("PRAGMA wal_autocheckpoint = 0")
        connection.execute("PRAGMA synchronous = OFF")
        insert_events(connection, rows, now=now)
        before = footprint_of(store.database)
        fold_log_into_database(connection)
        return before, footprint_of(store.database), space_usage(connection)


def mark_maintained(store: Store, now: datetime) -> None:
    """Record a maintenance run that just completed, so the captures measured next are not also asked to prune.

    Every operation prunes a bounded batch of expired rows while maintenance is due, and the store holds seeded expired
    rows. Without the marker the first captures would pay for that prune and would also consume the rows the expiry
    measurement is about.
    """
    with closing(sqlite3.connect(store.database, autocommit=True)) as connection:
        connection.execute("UPDATE maintenance_state SET last_completed_at = ? WHERE singleton_id = 1", (stamp(now),))


def expire(store: Store) -> tuple[int, Footprint, SpaceUsage]:
    """Delete every row whose retention has ended, as maintenance would, and fold the log in; nothing is reclaimed."""
    with closing(sqlite3.connect(store.database, autocommit=True)) as connection:
        connection.execute("BEGIN")
        removed = connection.execute("DELETE FROM event WHERE expires_at <= ?", (stamp(datetime.now(UTC)),)).rowcount
        connection.execute(
            "DELETE FROM workspace"
            " WHERE NOT EXISTS (SELECT 1 FROM event WHERE event.workspace_id = workspace.workspace_id)"
        )
        connection.execute("COMMIT")
        fold_log_into_database(connection)
        return removed, footprint_of(store.database), space_usage(connection)


def reclaim(store: Store, expired: int, retained: int) -> dict[str, Any]:
    """Run the artifact's own maintenance on a store holding ``expired`` dead rows, and check what it reports."""
    with PeakWatcher(store.database) as watcher:
        started = time.perf_counter()
        report = store.run("maintenance")
        elapsed = time.perf_counter() - started
    status = store.run("status")
    actual = footprint_of(store.database)
    if report["expiredEventCount"] != expired or status["eventCount"] != retained:
        raise BenchmarkError(
            f"maintenance pruned {report['expiredEventCount']} of {expired} expired events"
            f" and left {status['eventCount']} of {retained}"
        )
    if (status["databaseBytes"], status["walBytes"]) != (actual.database_bytes, actual.wal_bytes):
        raise BenchmarkError("status does not report the sizes of the files on disk")
    return {
        "elapsedSeconds": round(elapsed, 2),
        "expiredEventCount": report["expiredEventCount"],
        "databaseBytesBefore": report["databaseBytesBefore"],
        "databaseBytesAfter": report["databaseBytesAfter"],
        "walBytesAfter": report["walBytesAfter"],
        "freelistBytesAfter": report["freelistBytesAfter"],
        "reportedHighWaterBytes": report["highWaterBytes"],
        "observedPeakBytes": watcher.peak_bytes,
    }


def judge(
    *, bytes_per_event: float, observed_peak: int, reported_high_water: int, explanation: str | None
) -> Acceptance:
    """The storage acceptance gate: inside the envelope, or outside it and explained, or outside it and not."""
    problems: list[str] = []
    if not ENVELOPE_MIN_BYTES_PER_EVENT <= bytes_per_event <= ENVELOPE_MAX_BYTES_PER_EVENT:
        problems.append(
            f"{bytes_per_event:.1f} bytes per event is outside the planning envelope of"
            f" {ENVELOPE_MIN_BYTES_PER_EVENT:.1f} to {ENVELOPE_MAX_BYTES_PER_EVENT:.1f}"
        )
    if observed_peak > reported_high_water + PEAK_ALLOWANCE_BYTES:
        problems.append(
            f"the footprint reached {observed_peak} bytes, beyond the reported high-water mark of {reported_high_water}"
            f" plus the {PEAK_ALLOWANCE_BYTES} byte allowance"
        )
    if not problems:
        return Acceptance("within_envelope", (), None)
    return Acceptance("explained" if explanation else "unexplained", tuple(problems), explanation)


def projections(*, empty_bytes: int, marginal_bytes_per_event: float) -> list[dict[str, int]]:
    """The steady-state size of a thirty-day store at each planned daily rate, and the peak of a full rewrite of it."""
    projected: list[dict[str, int]] = []
    for rate in PROJECTED_EVENTS_PER_DAY:
        events = rate * RETENTION_DAYS
        steady = empty_bytes + round(events * marginal_bytes_per_event)
        projected.append(
            {
                "eventsPerDay": rate,
                "retentionDays": RETENTION_DAYS,
                "events": events,
                "steadyStateBytes": steady,
                "compactionPeakBytes": 2 * steady,
            }
        )
    return projected


def measure(artifact: Path, *, events: int, seed: int, capture_samples: int, explanation: str | None) -> dict[str, Any]:
    now = datetime.now(UTC)
    expired = events // 2
    rows = synthetic_rows(seed, events, now=now, expired=expired)
    with tempfile.TemporaryDirectory(prefix="ferret-benchmark-") as directory:
        scratch = Path(directory)
        measured = open_store(artifact, scratch, "measured")
        empty = footprint_of(measured.database)
        before, after, usage = load(measured, rows, now=now)
        mark_maintained(measured, now)
        capture = measure_capture(measured, capture_samples)
        removed, after_expiry, expiry_usage = expire(measured)
        reclaimed_store = open_store(artifact, scratch, "reclaimed")
        load(reclaimed_store, rows, now=now)
        reclamation = reclaim(reclaimed_store, expired, events - expired)
    if removed != expired:
        raise BenchmarkError(f"{removed} rows expired where {expired} were seeded to")
    bytes_per_event = after.database_bytes / events
    marginal = (after.database_bytes - empty.database_bytes) / events
    acceptance = judge(
        bytes_per_event=bytes_per_event,
        observed_peak=reclamation["observedPeakBytes"],
        reported_high_water=reclamation["reportedHighWaterBytes"],
        explanation=explanation,
    )
    return {
        "schemaVersion": 1,
        "events": events,
        "seed": seed,
        "expiredEvents": expired,
        "pageSizeBytes": usage.page_size,
        "envelope": {
            "minBytesPerEvent": ENVELOPE_MIN_BYTES_PER_EVENT,
            "maxBytesPerEvent": ENVELOPE_MAX_BYTES_PER_EVENT,
            "peakAllowanceBytes": PEAK_ALLOWANCE_BYTES,
        },
        "emptySchema": empty.as_json(),
        "insertion": {"beforeCheckpoint": before.as_json(), "afterCheckpoint": after.as_json()},
        "space": {
            "tableBytes": usage.table_bytes,
            "indexBytes": usage.index_bytes,
            "freelistBytes": usage.freelist_bytes,
        },
        "perEvent": {
            "bytesPerEvent": round(bytes_per_event, 1),
            "marginalBytesPerEvent": round(marginal, 1),
            "indexShare": round(usage.index_bytes / after.database_bytes, 3),
        },
        "capture": capture,
        "expiry": {
            "expiredEvents": removed,
            "afterExpiry": {**after_expiry.as_json(), "freelistBytes": expiry_usage.freelist_bytes},
        },
        "reclamation": reclamation,
        "projection": projections(empty_bytes=empty.database_bytes, marginal_bytes_per_event=marginal),
        "acceptance": acceptance.as_json(),
    }


def summary_lines(report: dict[str, Any]) -> list[str]:
    """The labelled human summary of ``report``: one line per measurement, in the order the contract lists them."""
    insertion, space, per_event = report["insertion"], report["space"], report["perEvent"]
    capture, reclamation = report["capture"], report["reclamation"]
    single, concurrent = capture["single"], capture["concurrent"]
    lines = [
        f"FERRET storage benchmark: events={report['events']} seed={report['seed']} expired={report['expiredEvents']}",
        f"Empty schema: database={report['emptySchema']['databaseBytes']} wal={report['emptySchema']['walBytes']}",
        f"Loaded before checkpoint: database={insertion['beforeCheckpoint']['databaseBytes']}"
        f" wal={insertion['beforeCheckpoint']['walBytes']}",
        f"Loaded after checkpoint: database={insertion['afterCheckpoint']['databaseBytes']}"
        f" wal={insertion['afterCheckpoint']['walBytes']} table={space['tableBytes']} index={space['indexBytes']}",
        f"Per event: bytes={per_event['bytesPerEvent']} marginal={per_event['marginalBytesPerEvent']}"
        f" index-share={per_event['indexShare']}",
        f"Capture single: n={single['count']} p50={single['p50Ms']}ms p95={single['p95Ms']}ms max={single['maxMs']}ms",
        f"Capture concurrent: writers={concurrent['writers']} n={concurrent['count']} p50={concurrent['p50Ms']}ms"
        f" p95={concurrent['p95Ms']}ms max={concurrent['maxMs']}ms",
        f"Expired half deleted: events={report['expiry']['expiredEvents']}"
        f" database={report['expiry']['afterExpiry']['databaseBytes']}"
        f" wal={report['expiry']['afterExpiry']['walBytes']}"
        f" freelist={report['expiry']['afterExpiry']['freelistBytes']}",
        f"Maintenance: pruned={reclamation['expiredEventCount']} seconds={reclamation['elapsedSeconds']}"
        f" database-before={reclamation['databaseBytesBefore']} database-after={reclamation['databaseBytesAfter']}"
        f" wal={reclamation['walBytesAfter']} freelist={reclamation['freelistBytesAfter']}"
        f" high-water={reclamation['reportedHighWaterBytes']} observed-peak={reclamation['observedPeakBytes']}",
        *(
            f"Projection {item['eventsPerDay']}/day x {item['retentionDays']} days: steady={item['steadyStateBytes']}"
            f" compaction-peak={item['compactionPeakBytes']}"
            for item in report["projection"]
        ),
        f"Acceptance: {report['acceptance']['state']}",
        *(f"  {problem}" for problem in report["acceptance"]["problems"]),
    ]
    return lines


def default_artifact() -> Path:
    return Path(os.environ.get("FERRET_ARTIFACT", str(BUILT_ARTIFACT))).resolve()


def parse(arguments: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="storage_benchmark.py", description="Measure the space a FERRET store takes.")
    parser.add_argument("--events", type=int, required=True, help="rows to load; half of them are already expired")
    parser.add_argument("--seed", type=int, required=True, help="seed of the deterministic synthetic events")
    parser.add_argument("--output", type=Path, required=True, help="where to write the aggregate JSON result")
    parser.add_argument("--artifact", type=Path, default=default_artifact(), help="the built ferret.pyz to measure")
    parser.add_argument("--capture-samples", type=int, default=DEFAULT_CAPTURE_SAMPLES, help="captures per writer mode")
    parser.add_argument("--explanation", default=None, help="why a result outside the planning envelope is acceptable")
    options = parser.parse_args(arguments)
    if options.events < 2 or options.capture_samples < 1:
        parser.error("--events must be at least 2 and --capture-samples at least 1")
    if not options.artifact.is_file():
        parser.error(f"no built artifact at {options.artifact}; run the ferret-cli build target first")
    return options


def main(arguments: Sequence[str] | None = None) -> int:
    options = parse(arguments)
    explanation = (options.explanation or "").strip() or None
    report = measure(
        options.artifact.resolve(),
        events=options.events,
        seed=options.seed,
        capture_samples=options.capture_samples,
        explanation=explanation,
    )
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    sys.stdout.write("\n".join(summary_lines(report)) + "\n")
    return 0 if report["acceptance"]["state"] != "unexplained" else 1


if __name__ == "__main__":
    sys.exit(main())
