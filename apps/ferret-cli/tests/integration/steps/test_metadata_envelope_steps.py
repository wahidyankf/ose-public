"""Integration bindings for the metadata envelope feature: a real store, a real process, and real standard input."""

import json
import re
import sqlite3
import subprocess
import sys
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.adapters.system import system_runtime
from ferret.application.initialization import initialize_store
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, encode
from support.hook_payloads import CANARIES, IMAGE_CANARY, claude_tool, codex_view_image
from support.hook_payloads import encode as encode_payload
from support.wrapper import in_tree

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature"
SOURCE = Path(__file__).resolve().parents[3] / "src"
RUNNER = (
    "import sys; sys.path.insert(0, sys.argv[1]); from ferret.cli import main; "
    "raise SystemExit(main(['capture', '--json']))"
)
CANARY = "canary-value-that-must-never-be-echoed"
RAW_WORKSPACE = "/users/example/work/repo-a"
RAW_SESSION = "raw-harness-session-123"
FORBIDDEN_KEYS = {
    "prompt": ("prompt", "prompt"),
    "response": ("response", "response"),
    "tool_arguments": ("tool_arguments", "tool_arguments"),
    "transcript_path": ("transcript_path", "transcript_path"),
    "environment": ("environment", "environment"),
    "an unknown arbitrary field": ("unexpected_arbitrary_field", None),
}


@dataclass(slots=True)
class Session:
    """A real initialized home, the field under test, and what the capture process returned."""

    home: Path
    completed: subprocess.CompletedProcess[bytes] | None = None
    category: str | None = None
    raw: bytes = b""
    harness: str = "claude_code"

    @property
    def data_home(self) -> Path:
        return self.home / ".local" / "share" / "ferret"

    @property
    def database(self) -> Path:
        return self.data_home / "ferret.sqlite3"


@pytest.fixture
def session(tmp_path: Path) -> Session:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    initialize_store(system_runtime({"HOME": str(home)}))
    return Session(home=home)


def submit(session: Session, document: dict[str, Any]) -> None:
    session.completed = subprocess.run(
        [sys.executable, "-c", RUNNER, str(SOURCE)],
        input=encode(document),
        env={"HOME": str(session.home), "PATH": "/usr/bin:/bin"},
        capture_output=True,
        check=False,
    )


def count(session: Session, table: str) -> int:
    with closing(sqlite3.connect(session.database)) as connection:
        return int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


def data_home_bytes(session: Session) -> bytes:
    return b"".join(path.read_bytes() for path in sorted(session.data_home.iterdir()))


@scenario(FEATURE, "Capture a valid lifecycle event")
def test_capture_a_valid_lifecycle_event() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@scenario(FEATURE, "Reject a forbidden capture field")
def test_reject_a_forbidden_capture_field() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("FERRET is initialized with an empty local database")
def given_initialized_and_empty(session: Session) -> None:
    assert session.database.is_file()
    assert count(session, "event") == 0
    assert count(session, "workspace") == 0


@when("an adapter submits one schema-version-1.0 tool-completed event")
def when_submit_valid_event(session: Session) -> None:
    submit(session, VECTOR_DOCUMENT)


@when(parsers.parse("an adapter submits an otherwise valid event containing {field}"))
def when_submit_event_with_forbidden_field(session: Session, field: str) -> None:
    key, session.category = FORBIDDEN_KEYS[field]
    submit(session, {**VECTOR_DOCUMENT, key: CANARY})


@then("the CLI stores one event with its canonical hash and opaque identifiers")
def then_stores_one_event(session: Session) -> None:
    with closing(sqlite3.connect(session.database)) as connection:
        rows = connection.execute("SELECT event_hash, workspace_id, session_id, installation_id FROM event").fetchall()
    assert rows == [
        (
            VECTOR_HASH,
            VECTOR_DOCUMENT["workspaceId"],
            VECTOR_DOCUMENT["sessionId"],
            VECTOR_DOCUMENT["installationId"],
        )
    ]
    assert re.fullmatch(r"ws_[0-9a-f]{32}", rows[0][1])
    assert re.fullmatch(r"ss_[0-9a-f]{32}", rows[0][2])


@then("the stored record contains no raw workspace or harness session value")
def then_no_raw_values(session: Session) -> None:
    stored = data_home_bytes(session)
    assert RAW_WORKSPACE.encode() not in stored
    assert RAW_SESSION.encode() not in stored
    assert count(session, "workspace") == 1


@then("the direct capture command reports success")
def then_reports_success(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stderr) == (0, b"")
    assert json.loads(session.completed.stdout) == {
        "schemaVersion": 1,
        "command": "capture",
        "exitCode": 0,
        "result": "stored",
        "eventId": VECTOR_DOCUMENT["eventId"],
        "eventHash": VECTOR_HASH,
    }


@then("capture rejects the complete event without storing a partial row")
def then_rejects_without_a_row(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout) == (2, b"")
    assert count(session, "event") == 0
    assert count(session, "workspace") == 0


@then("the diagnostic names the field category without echoing its value")
def then_names_the_category_only(session: Session) -> None:
    assert session.completed is not None
    error = json.loads(session.completed.stderr)["error"]
    assert error == {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": session.category,
        "retryable": False,
    }
    assert CANARY.encode() not in session.completed.stderr
    assert CANARY.encode() not in data_home_bytes(session)


@scenario(FEATURE, "Project raw hook JSON without retaining content")
def test_project_raw_hook_json_without_retaining_content() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


def sqlite_rows(session: Session, statement: str) -> list[tuple[Any, ...]]:
    with closing(sqlite3.connect(session.database)) as connection:
        return connection.execute(statement).fetchall()


def files_under(root: Path) -> dict[str, bytes]:
    """Every regular file below ``root`` by relative name, so nothing the run wrote anywhere can go unread."""
    return {str(path.relative_to(root)): path.read_bytes() for path in sorted(root.rglob("*")) if path.is_file()}


@given("a raw harness payload carrying prompt text, tool arguments, and environment values")
def given_a_raw_payload_with_content(session: Session) -> None:
    session.raw = encode_payload(claude_tool("PostToolUse", duration_ms=27, tool_response={"content": CANARIES[2]}))


@when("capture-hook maps it through that harness's allowlist mapper")
def when_capture_hook_maps_the_payload(session: Session) -> None:
    launcher = in_tree(session.home.parent)
    session.completed = subprocess.run(
        [str(launcher), "capture-hook", "--harness", session.harness, "--event", "tool.completed"],
        input=session.raw,
        env={"HOME": str(session.home), "PATH": "/usr/bin:/bin"},
        cwd=session.home.parent,
        capture_output=True,
        check=False,
    )


@then("only allowlisted metadata reaches the canonical envelope")
def then_only_allowlisted_metadata_is_kept(session: Session) -> None:
    rows = sqlite_rows(
        session,
        "SELECT harness, event_type, tool_name, duration_ms, workspace_id, session_id, outcome FROM event",
    )
    assert len(rows) == 1
    harness, event_type, tool, duration, workspace, native, outcome = rows[0]
    assert (harness, event_type, tool, duration, outcome) == ("claude_code", "tool.completed", "Read", 27, "success")
    assert re.fullmatch(r"ws_[0-9a-f]{32}", workspace)
    assert re.fullmatch(r"ss_[0-9a-f]{32}", native)
    assert session.raw not in b"".join(files_under(session.data_home).values())


@then("the raw bytes stay in memory and are never spooled, logged, or written to SQLite")
def then_the_raw_bytes_are_never_written(session: Session) -> None:
    everything = files_under(session.home.parent)
    written = b"".join(everything.values())
    assert not any(canary.encode() in written for canary in CANARIES)
    # Nothing but the store's own files exists: no spool, log, or scratch file beside them.
    assert {name.split("/")[1] for name in everything if name.startswith("home/")} == {".local"}
    assert {name.split("/")[-1] for name in everything if "/.ferret/" in name} <= {
        "config.json",
        "ferret.lock",
        "ferret.sqlite3",
        "ferret.sqlite3-shm",
        "ferret.sqlite3-wal",
        "identity.json",
        "identity.key",
    }


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout, session.completed.stderr) == (0, b"", b"")


@scenario(FEATURE, "Record a tool completion whose result is a large image")
def test_record_a_tool_completion_whose_result_is_a_large_image() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a raw Codex view_image completion whose result is a 1 MiB base64 image")
def given_a_codex_view_image_completion(session: Session) -> None:
    session.harness = "codex"
    session.raw = encode_payload(codex_view_image())
    assert len(session.raw) > 1024 * 1024


@then("one tool-completed event naming view_image is stored")
def then_one_view_image_completion_is_stored(session: Session) -> None:
    rows = sqlite_rows(
        session,
        "SELECT harness, event_type, tool_name, outcome, outcome_visibility, duration_ms, duration_visibility "
        "FROM event",
    )
    assert rows == [("codex", "tool.completed", "view_image", "success", "derived", None, "unknown")]


@then("no part of the image or of the other content reaches the store")
def then_no_image_or_content_is_stored(session: Session) -> None:
    everything = files_under(session.home.parent)
    written = b"".join(everything.values())
    for canary in (IMAGE_CANARY, *CANARIES):
        assert canary.encode() not in written
    # A refused payload would leave its failure record beside the store; an accepted one leaves none.
    assert "hook-failures.log" not in {name.split("/")[-1] for name in everything}
