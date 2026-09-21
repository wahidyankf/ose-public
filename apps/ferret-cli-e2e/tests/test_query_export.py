"""Reading events back through the built artifact: cursors, streaming export, broken pipes, and byte-stable output."""

import json
import signal
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from event_documents import encode_document, numbered_event
from ferret_process import Completed, capture_documents, run_artifact, run_into_closed_pipe

EVENT_COUNT = 7


@pytest.fixture
def seeded(artifact: Path, home: Path) -> list[dict[str, Any]]:
    """An initialized home holding seven events, event 1 the newest and event 7 the oldest."""
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    now = datetime.now(UTC)
    documents = [numbered_event(number, now=now, ago=timedelta(minutes=number)) for number in range(1, EVENT_COUNT + 1)]
    capture_documents(artifact, home, documents)
    return documents


def ids(completed: Completed) -> list[int]:
    return [int(item["eventId"][-12:]) for item in json.loads(completed.stdout)["items"]]


def test_a_cursor_journey_walks_every_event_exactly_once(
    artifact: Path, home: Path, seeded: list[dict[str, Any]]
) -> None:
    arguments = ["events", "list", "--json", "--limit", "3", "--all-time"]
    pages: list[Completed] = [run_artifact(artifact, arguments, home=home)]

    while (cursor := json.loads(pages[-1].stdout)["nextCursor"]) is not None:
        pages.append(run_artifact(artifact, [*arguments, "--cursor", cursor], home=home))

    assert all((page.returncode, page.stderr) == (0, b"") for page in pages)
    assert [ids(page) for page in pages] == [[1, 2, 3], [4, 5, 6], [7]]
    assert len(seeded) == EVENT_COUNT


@pytest.mark.usefixtures("seeded")
def test_a_cursor_is_refused_for_another_query_and_for_garbage(artifact: Path, home: Path) -> None:
    first = run_artifact(artifact, ["events", "list", "--json", "--limit", "3", "--all-time"], home=home)
    cursor = json.loads(first.stdout)["nextCursor"]

    for arguments in (
        ["events", "list", "--json", "--limit", "4", "--all-time", "--cursor", cursor],
        ["events", "list", "--json", "--limit", "3", "--all-time", "--harness", "codex", "--cursor", cursor],
        ["events", "list", "--json", "--limit", "3", "--all-time", "--cursor", "not-a-cursor"],
    ):
        refused = run_artifact(artifact, arguments, home=home)
        assert (refused.returncode, refused.stdout) == (2, b"")
        assert json.loads(refused.stderr) == {
            "schemaVersion": 1,
            "command": "events.list",
            "exitCode": 2,
            "error": {"code": "invalid_cursor", "field": None, "retryable": False},
        }


def test_export_is_jsonl_oldest_first_and_repeatable_byte_for_byte(
    artifact: Path, home: Path, seeded: list[dict[str, Any]]
) -> None:
    arguments = ["events", "export", "--format", "jsonl", "--all-time"]

    first = run_artifact(artifact, arguments, home=home)
    again = run_artifact(artifact, arguments, home=home)

    assert (first.returncode, first.stderr) == (0, b"")
    assert first == again
    assert first.stdout.splitlines(keepends=True) == [
        encode_document(document) + b"\n" for document in reversed(seeded)
    ]


def test_an_export_with_no_events_is_zero_bytes(artifact: Path, home: Path) -> None:
    run_artifact(artifact, ["init", "--json"], home=home)

    assert run_artifact(artifact, ["events", "export", "--format", "jsonl"], home=home) == Completed(0, b"", b"")


@pytest.mark.usefixtures("seeded")
def test_an_export_into_a_closed_pipe_ends_the_way_a_posix_filter_does(artifact: Path, home: Path) -> None:
    ended = run_into_closed_pipe(artifact, ["events", "export", "--format", "jsonl", "--all-time"], home=home)

    assert ended.returncode == -signal.SIGPIPE
    assert ended.stderr == b""


@pytest.mark.usefixtures("seeded")
def test_output_bytes_do_not_depend_on_locale_time_zone_or_terminal(artifact: Path, home: Path) -> None:
    varied = {
        "LC_ALL": "tr_TR.UTF-8",
        "LANG": "tr_TR.UTF-8",
        "TZ": "Asia/Jakarta",
        "TERM": "xterm-256color",
        "COLUMNS": "20",
    }

    tables = (["events", "list", "--all-time"], ["usage", "--group-by", "harness,tool", "--all-time"])
    streams = (
        ["events", "export", "--format", "jsonl", "--all-time"],
        ["outcomes", "--group-by", "outcome", "--all-time", "--json"],
    )

    for arguments in (*tables, *streams):
        plain = run_artifact(artifact, arguments, home=home)
        assert (plain.returncode, plain.stderr) == (0, b"")
        assert run_artifact(artifact, arguments, home=home, extra_environment=varied) == plain
        assert b"\x1b" not in plain.stdout
    for arguments in tables:
        cells = [
            cell
            for line in run_artifact(artifact, arguments, home=home).stdout.decode().splitlines()
            for cell in line.split("\t")
        ]
        assert cells
        assert all(cell == cell.strip() and cell for cell in cells)


def test_every_read_of_an_uninitialized_home_is_a_closed_failure_that_creates_nothing(
    artifact: Path, home: Path
) -> None:
    for arguments in (
        ["events", "list", "--json"],
        ["usage", "--group-by", "harness", "--json"],
        ["outcomes", "--group-by", "harness", "--json"],
    ):
        failed = run_artifact(artifact, arguments, home=home)
        assert (failed.returncode, failed.stdout) == (3, b"")
        assert json.loads(failed.stderr)["error"]["code"] == "uninitialized"
    # An export has no machine-readable mode, so its failure is the text form and stdout stays empty.
    exported = run_artifact(artifact, ["events", "export", "--format", "jsonl"], home=home)
    assert (exported.returncode, exported.stdout) == (3, b"")
    assert exported.stderr.startswith(b"FERRET error [uninitialized]: ")
    assert not (home / ".ferret").exists()
