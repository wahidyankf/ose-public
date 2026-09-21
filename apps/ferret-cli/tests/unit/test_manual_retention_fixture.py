"""The retention fixture seeds expiry relative to one instant, holds a write lock on request, and records safe facts."""

import importlib.util
import re
import sqlite3
import sys
import threading
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest

from ferret.adapters.sqlite_schema import MIGRATIONS

HELPER = Path(__file__).resolve().parents[1] / "support" / "manual_retention_fixture.py"
RUN_ID = "unit-run"
RAW_ROOT = f"local-tmp/ferret-plan01/{RUN_ID}"
SUMMARY = "retention-summary.txt"
INSTALLATION = "00000000-0000-4000-8000-0000000000aa"
REFERENCE = datetime(2026, 9, 21, 10, 0, 0, tzinfo=UTC)
CUTOFF = timedelta(days=30)
SUMMARY_LINE = re.compile(r"^(case|command|exit|bytes|sha256|assertion)=")
SHA256_LINE = re.compile(r"^sha256=[0-9a-f]{64} [\w][\w./-]*$")
BYTES_LINE = re.compile(r"^bytes=stdout:\d+ stderr:\d+$")
COMMANDS = [
    "init",
    "status-seeded",
    "events-list-locked",
    "status-locked",
    "hold-lock",
    "events-list-unlocked",
    "status-partial",
    "maintenance",
    "maintenance-repeat",
    "status-final",
    "events-list-final",
]
HELD_ASSERTIONS = [
    "reads expose no expired row while the lock is held",
    "the locked attempt changed no row, counter, or marker",
    "the first unlocked operation removed at most 100 expired rows and left the rest",
    "a partial prune leaves the maintenance marker unchanged",
    "explicit maintenance removed the remainder",
    "repeating maintenance removed nothing more",
    "expiredLocalTotal counts every expired row once and expiredBeforeAckTotal is zero",
    "the retained rows survived every prune",
]


def load_helper() -> ModuleType:
    """The helper module, or an assertion failure that names it when it does not exist yet."""
    assert HELPER.is_file(), (
        "missing manual_retention_fixture: apps/ferret-cli/tests/support/manual_retention_fixture.py"
    )
    spec = importlib.util.spec_from_file_location("manual_retention_fixture", HELPER)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["manual_retention_fixture"] = module
    spec.loader.exec_module(module)
    return module


def stamp(moment: datetime) -> str:
    return f"{moment:%Y-%m-%dT%H:%M:%S}.{moment.microsecond // 1000:03d}Z"


def parse_stamp(text: str) -> datetime:
    return datetime.strptime(text, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=UTC)


def current_reference() -> str:
    """The instant the plan's shell computes: now, truncated to whole seconds, with zero milliseconds."""
    return stamp(datetime.now(UTC).replace(microsecond=0))


@pytest.fixture
def database(tmp_path: Path) -> Path:
    """An empty store with the packaged schema, written by the test rather than by the artifact."""
    path = tmp_path / "ferret.sqlite3"
    connection = sqlite3.connect(path, autocommit=True)
    connection.execute("PRAGMA journal_mode = WAL")
    for migration in MIGRATIONS:
        for statement in migration.statements:
            connection.execute(statement)
    connection.close()
    return path


def rows(path: Path, sql: str, *parameters: Any) -> list[tuple[Any, ...]]:
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    try:
        return connection.execute(sql, parameters).fetchall()
    finally:
        connection.close()


def seed(helper: ModuleType, database: Path, *, events: int = 3, snapshots: int = 2, retained: int = 1) -> None:
    helper.seed_relative(
        database,
        installation_id=INSTALLATION,
        reference_now=REFERENCE,
        expired_events=events,
        expired_snapshots=snapshots,
        retained_events=retained,
    )


def test_seed_relative_boundary(database: Path) -> None:
    helper = load_helper()

    seed(helper, database)

    reference = stamp(REFERENCE)
    expired = rows(database, "SELECT expires_at FROM event WHERE expires_at <= ? ORDER BY expires_at", reference)
    assert [row[0] for row in expired] == [
        stamp(REFERENCE - timedelta(seconds=2)),
        stamp(REFERENCE - timedelta(seconds=1)),
        reference,
    ]
    retained = rows(database, "SELECT expires_at FROM event WHERE expires_at > ?", reference)
    assert retained == [(stamp(REFERENCE + CUTOFF - timedelta(hours=1)),)]
    for table in ("event", "capability_snapshot"):
        for captured, expires in rows(database, f"SELECT captured_at, expires_at FROM {table}"):
            assert parse_stamp(expires) - parse_stamp(captured) == CUTOFF
    assert rows(database, "SELECT count(*) FROM capability_snapshot WHERE expires_at <= ?", reference) == [(2,)]
    assert rows(database, "SELECT count(*) FROM capability_item") == [(4,)]
    assert rows(database, "PRAGMA foreign_key_check") == []
    assert rows(database, "SELECT value FROM operational_counter ORDER BY name") == [(0,), (0,)]
    assert rows(database, "SELECT last_completed_at FROM maintenance_state") == [(None,)]

    exactly = helper.inspect(database, reference_now=REFERENCE)
    assert (exactly.expired_events, exactly.expired_snapshots) == (3, 2)
    assert (exactly.live_events, exactly.live_snapshots) == (1, 0)
    assert (exactly.expired_local_total, exactly.expired_before_ack_total, exactly.marker) == (0, 0, None)
    a_millisecond_earlier = helper.inspect(database, reference_now=REFERENCE - timedelta(milliseconds=1))
    assert (a_millisecond_earlier.expired_events, a_millisecond_earlier.expired_snapshots) == (2, 1)
    assert (a_millisecond_earlier.live_events, a_millisecond_earlier.live_snapshots) == (2, 1)


def test_seed_refuses_a_store_that_already_holds_rows(database: Path) -> None:
    helper = load_helper()
    seed(helper, database)

    with pytest.raises(helper.RefusedError, match="already holds"):
        seed(helper, database)

    assert rows(database, "SELECT count(*) FROM event") == [(4,)]


def test_lock_handshake_timeout(database: Path, tmp_path: Path) -> None:
    helper = load_helper()
    ready = tmp_path / "ready"
    release = tmp_path / "release"

    assert helper.await_ready(ready, timeout_seconds=0.2) is False
    code = helper.hold_lock(database, ready, release, hard_stop_seconds=0.2)

    assert code == helper.HARD_STOP
    assert ready.is_file()
    assert not release.exists()
    assert helper.await_ready(ready, timeout_seconds=0.2) is True
    writer = sqlite3.connect(database, timeout=0, autocommit=True)
    try:
        writer.execute("BEGIN IMMEDIATE")
        writer.execute("ROLLBACK")
    finally:
        writer.close()


def test_lock_is_held_until_the_release_file_appears(database: Path, tmp_path: Path) -> None:
    helper = load_helper()
    ready = tmp_path / "ready"
    release = tmp_path / "release"
    outcome: list[int] = []
    holder = threading.Thread(target=lambda: outcome.append(helper.hold_lock(database, ready, release)))
    holder.start()
    try:
        assert helper.await_ready(ready)
        competitor = sqlite3.connect(database, timeout=0, autocommit=True)
        try:
            with pytest.raises(sqlite3.OperationalError, match="locked"):
                competitor.execute("BEGIN IMMEDIATE")
        finally:
            competitor.close()
    finally:
        release.write_text("release\n")
        holder.join(timeout=10)

    assert not holder.is_alive()
    assert outcome == [helper.RELEASED]


def run_matrix(
    binary: Path,
    *,
    run_id: str = RUN_ID,
    raw_root: str = RAW_ROOT,
    reference_now: str | None = None,
    expired_events: int = 101,
    expired_snapshots: int = 1,
    retained_events: int = 1,
) -> int:
    return load_helper().main(
        [
            "run-matrix",
            "--run-id",
            run_id,
            "--raw-root",
            raw_root,
            "--bin",
            str(binary),
            "--reference-now",
            reference_now or current_reference(),
            "--expired-events",
            str(expired_events),
            "--expired-snapshots",
            str(expired_snapshots),
            "--retained-events",
            str(retained_events),
            "--summary",
            SUMMARY,
        ]
    )


def test_run_matrix_sanitizes_summary(repository: Path, artifact: Path) -> None:
    assert run_matrix(artifact) == 0

    text = (repository / SUMMARY).read_text()
    lines = text.splitlines()
    assert lines[0] == "case=retention"
    assert all(SUMMARY_LINE.match(line) for line in lines)
    assert all(SHA256_LINE.match(line) for line in lines if line.startswith("sha256="))
    assert all(BYTES_LINE.match(line) for line in lines if line.startswith("bytes="))
    assert [line for line in lines if line.startswith("assertion=") and not line.endswith(": pass")] == []
    assert [line.removeprefix("command=") for line in lines if line.startswith("command=")] == COMMANDS
    assert [line for line in lines if line.startswith("exit=")] == ["exit=0"] * len(COMMANDS)
    for label in HELD_ASSERTIONS:
        assert f"assertion={label}: pass" in lines, label
    for forbidden in (str(repository), str(Path.home()), "/Users/", "/home/", "raw_payload", "FERRET_DATA_HOME"):
        assert forbidden not in text, forbidden
    raw = repository / RAW_ROOT / "retention" / "raw"
    assert len(list(raw.glob("*.stdout"))) == len(COMMANDS)
    assert (repository / RAW_ROOT / ".ferret-plan01-run").read_text() == f"{RUN_ID}\n"


def test_run_matrix_rejects_unowned_root(repository: Path, artifact: Path) -> None:
    root = repository / RAW_ROOT
    root.mkdir(parents=True)
    (root / "keep.txt").write_text("not the helper's\n")

    assert run_matrix(artifact) == 2

    assert (root / "keep.txt").read_text() == "not the helper's\n"
    assert sorted(path.name for path in root.iterdir()) == ["keep.txt"]
    assert not (repository / SUMMARY).exists()


def test_run_matrix_rejects_a_root_that_another_run_owns(repository: Path, artifact: Path) -> None:
    root = repository / "local-tmp" / "ferret-plan01" / "first-run"
    root.mkdir(parents=True)
    (root / ".ferret-plan01-run").write_text("first-run\n")

    assert run_matrix(artifact, run_id="second-run", raw_root="local-tmp/ferret-plan01/first-run") == 2

    assert sorted(path.name for path in root.iterdir()) == [".ferret-plan01-run"]
    assert not (repository / SUMMARY).exists()


@pytest.mark.parametrize(
    "raw_root",
    [
        "/tmp/ferret-plan01/unit-run",
        "../ferret-plan01/unit-run",
        "local-tmp/elsewhere/unit-run",
        "local-tmp/ferret-plan01",
    ],
)
def test_run_matrix_rejects_a_raw_root_that_is_not_the_run_directory(
    repository: Path, artifact: Path, raw_root: str
) -> None:
    assert run_matrix(artifact, raw_root=raw_root) == 2
    assert not (repository / SUMMARY).exists()


@pytest.mark.parametrize(
    "arguments",
    [
        {"reference_now": "2026-09-21T10:00:00Z"},
        {"reference_now": "not-a-time"},
        {"reference_now": stamp(datetime.now(UTC).replace(microsecond=0) + timedelta(hours=1))},
        {"reference_now": stamp(datetime.now(UTC).replace(microsecond=0) - timedelta(hours=2))},
        {"expired_events": 100, "expired_snapshots": 0},
        {"expired_events": 0},
        {"retained_events": 0},
        {"retained_events": 101},
    ],
)
def test_run_matrix_rejects_arguments_it_cannot_honor(
    repository: Path, artifact: Path, arguments: dict[str, Any]
) -> None:
    assert run_matrix(artifact, **arguments) == 2
    assert not (repository / SUMMARY).exists()
    assert not (repository / RAW_ROOT / "retention").exists()
