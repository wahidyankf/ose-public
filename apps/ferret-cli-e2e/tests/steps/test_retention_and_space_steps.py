"""E2E bindings for the retention feature: the built artifact, a store seeded into its tables, and the benchmark."""

import json
import sqlite3
import subprocess
import sys
from collections.abc import Iterator
from contextlib import closing
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from event_documents import stamp
from ferret_process import Completed, run_artifact
from storage_benchmark import ENVELOPE_MAX_BYTES_PER_EVENT, ENVELOPE_MIN_BYTES_PER_EVENT, Footprint, footprint_of
from synthetic_store import RETENTION, insert_events, synthetic_rows

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature"
BENCHMARK = Path(__file__).resolve().parents[2] / "src" / "storage_benchmark.py"
SEED = 20260918
BEYOND_CUTOFF = 130
NEWER = 5
PRUNE_ROW_LIMIT = 100
LIST_ALL = ["events", "list", "--all-time", "--limit", "200", "--json"]
CAPTURE_SAMPLES = "3"
REPRESENTATIVE_EVENTS = 1000
TOO_FEW_FOR_THE_ENVELOPE = 2


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, its clock reading, and what each invocation and the benchmark returned."""

    artifact: Path
    home: Path
    now: datetime
    newer: set[str] = field(default_factory=lambda: set[str]())
    holder: sqlite3.Connection | None = None
    populated: Footprint | None = None
    read: Completed | None = None
    next_operation: Completed | None = None
    removed: int = 0
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None
    benchmark_output: Path | None = None

    def run(self, arguments: list[str]) -> Completed:
        return run_artifact(self.artifact, arguments, home=self.home)

    @property
    def database(self) -> Path:
        return self.home / ".local" / "share" / "ferret" / "ferret.sqlite3"

    def sql(self, statement: str, parameters: tuple[object, ...] = ()) -> list[tuple[Any, ...]]:
        with closing(sqlite3.connect(self.database, autocommit=True)) as connection:
            return connection.execute(statement, parameters).fetchall()

    def seed(self) -> None:
        """Rows well beyond the thirty-day cutoff and rows well inside it, written straight into the tables."""
        rows = synthetic_rows(SEED, BEYOND_CUTOFF + NEWER, now=self.now, expired=BEYOND_CUTOFF)
        self.newer = {str(row[0]) for row in rows[BEYOND_CUTOFF:]}
        with closing(sqlite3.connect(self.database, autocommit=True)) as connection:
            insert_events(connection, rows, now=self.now)

    def json_result(self, arguments: list[str]) -> dict[str, Any]:
        ran = self.run([*arguments, "--json"])
        assert (ran.returncode, ran.stderr) == (0, b"")
        result: dict[str, Any] = json.loads(ran.stdout)
        return result


@pytest.fixture
def session(artifact: Path, home: Path) -> Iterator[Session]:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    opened = Session(artifact=artifact, home=home, now=datetime.now(UTC))
    yield opened
    if opened.holder is not None:
        opened.holder.close()


def listed_ids(ran: Completed | None) -> list[str]:
    assert ran is not None
    assert (ran.returncode, ran.stderr) == (0, b"")
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


@scenario(FEATURE, "Hide then prune every expired usage-derived record")
def test_hide_then_prune_every_expired_usage_derived_record() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains rows captured before and after the thirty-day cutoff")
def given_rows_around_the_cutoff(session: Session) -> None:
    session.seed()
    # Maintenance ran a moment ago, so the read below is not the operation that prunes.
    session.sql("UPDATE maintenance_state SET last_completed_at = ? WHERE singleton_id = 1", (stamp(session.now),))
    assert session.sql("SELECT count(*) FROM event") == [(BEYOND_CUTOFF + NEWER,)]


@when("a read runs before physical pruning and then the next FERRET operation runs with a fixed clock")
def when_a_read_then_the_next_operation_runs(session: Session) -> None:
    session.read = session.run(LIST_ALL)
    assert session.sql("SELECT count(*) FROM event") == [(BEYOND_CUTOFF + NEWER,)]
    session.sql("UPDATE maintenance_state SET last_completed_at = NULL WHERE singleton_id = 1")
    session.next_operation = session.run(LIST_ALL)


@then("no row at or beyond the cutoff is returned by the read")
def then_no_expired_row_is_returned(session: Session) -> None:
    assert session.read is not None
    items = json.loads(session.read.stdout)["items"]
    assert items
    assert all(item["capturedAt"] > stamp(datetime.now(UTC) - RETENTION) for item in items)


@then("the next operation stops physical pruning at the first of 100 rows or 100 monotonic milliseconds")
def then_the_prune_stops_at_its_first_limit(session: Session) -> None:
    [(still_expired,)] = session.sql("SELECT count(*) FROM event WHERE expires_at <= ?", (stamp(datetime.now(UTC)),))
    session.removed = BEYOND_CUTOFF - still_expired
    assert 1 <= session.removed <= PRUNE_ROW_LIMIT


@then("every newer row remains queryable")
def then_every_newer_row_remains_queryable(session: Session) -> None:
    assert set(listed_ids(session.next_operation)) == session.newer
    assert set(listed_ids(session.read)) == session.newer


@then("status increments expiredLocalTotal for locally expired rows")
def then_the_local_counter_grows_by_what_was_pruned(session: Session) -> None:
    session.status = session.json_result(["status"])
    assert session.status["expiredLocalTotal"] == session.removed


@then("expiredBeforeAckTotal remains zero")
def then_the_before_ack_counter_stays_zero(session: Session) -> None:
    assert session.status is not None
    assert session.status["expiredBeforeAckTotal"] == 0


@scenario(FEATURE, "Measure storage before and after retention")
def test_measure_storage_before_and_after_retention() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


def run_benchmark(
    session: Session, events: int, *extra: str
) -> tuple[subprocess.CompletedProcess[str], dict[str, Any]]:
    """The benchmark as a separate process, and the aggregate result it wrote."""
    output = session.home.parent / f"storage-{events}.json"
    ran = subprocess.run(
        [
            sys.executable,
            str(BENCHMARK),
            "--events",
            str(events),
            "--seed",
            str(SEED),
            "--output",
            str(output),
            "--artifact",
            str(session.artifact),
            "--capture-samples",
            CAPTURE_SAMPLES,
            *extra,
        ],
        capture_output=True,
        text=True,
        env={"PATH": "/usr/bin:/bin"},
        timeout=300,
        check=False,
    )
    report: dict[str, Any] = json.loads(output.read_text())
    return ran, report


@given("a representative event fixture has populated the database and WAL")
def given_a_populated_database_and_log(session: Session) -> None:
    # Another connection stays open, as a concurrent harness process would, so the log outlives the writers.
    session.holder = sqlite3.connect(session.database, autocommit=True)
    session.holder.execute("SELECT count(*) FROM event").fetchone()
    session.seed()
    session.populated = footprint_of(session.database)
    assert session.populated.wal_bytes > 0


@when("maintenance checkpoints, prunes expired rows, and performs the planned compaction policy")
def when_maintenance_reclaims_space(session: Session) -> None:
    session.maintenance = session.json_result(["maintenance"])
    session.status = session.json_result(["status"])


@then("status reports database, WAL, and total high-water bytes separately")
def then_status_reports_the_three_figures_separately(session: Session) -> None:
    assert session.maintenance is not None
    assert session.status is not None
    assert session.populated is not None
    report, status = session.maintenance, session.status
    on_disk = footprint_of(session.database)
    assert (status["databaseBytes"], status["walBytes"]) == (on_disk.database_bytes, 0)
    assert status["freelistBytes"] > 0
    assert status["highWaterBytes"] == status["databaseBytes"] + status["walBytes"]
    assert report["databaseBytesBefore"] == session.populated.database_bytes
    assert report["highWaterBytes"] >= session.populated.total_bytes


@then("the benchmark reports bytes per event and index share")
def then_the_benchmark_reports_bytes_per_event_and_index_share(session: Session) -> None:
    ran, report = run_benchmark(session, REPRESENTATIVE_EVENTS)

    assert (ran.returncode, ran.stderr) == (0, "")
    database_bytes = report["insertion"]["afterCheckpoint"]["databaseBytes"]
    assert report["perEvent"]["bytesPerEvent"] == round(database_bytes / REPRESENTATIVE_EVENTS, 1)
    assert report["perEvent"]["indexShare"] == round(report["space"]["indexBytes"] / database_bytes, 3)
    assert 0 < report["perEvent"]["indexShare"] < 1
    assert ENVELOPE_MIN_BYTES_PER_EVENT <= report["perEvent"]["bytesPerEvent"] <= ENVELOPE_MAX_BYTES_PER_EVENT
    assert report["acceptance"] == {"state": "within_envelope", "problems": [], "explanation": None}
    labels = [line.split(":")[0] for line in ran.stdout.splitlines()]
    assert labels[:5] == [
        "FERRET storage benchmark",
        "Empty schema",
        "Loaded before checkpoint",
        "Loaded after checkpoint",
        "Per event",
    ]
    assert "Maintenance" in labels


@then("a size outside the planning envelope fails the storage acceptance gate pending explanation")
def then_an_outside_size_fails_the_gate_until_explained(session: Session) -> None:
    refused, unexplained = run_benchmark(session, TOO_FEW_FOR_THE_ENVELOPE)
    accepted, explained = run_benchmark(
        session, TOO_FEW_FOR_THE_ENVELOPE, "--explanation", "the fixed schema pages dominate a two-event fixture"
    )

    assert refused.returncode == 1
    assert unexplained["acceptance"]["state"] == "unexplained"
    assert unexplained["perEvent"]["bytesPerEvent"] > ENVELOPE_MAX_BYTES_PER_EVENT
    assert (accepted.returncode, accepted.stderr) == (0, "")
    assert explained["acceptance"]["state"] == "explained"
    assert explained["acceptance"]["explanation"] == "the fixed schema pages dominate a two-event fixture"
    assert explained["perEvent"] == unexplained["perEvent"]
