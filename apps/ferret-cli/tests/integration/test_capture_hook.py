"""Raw-hook capture against a real store, real files, and a real repository layout: one row, and nothing beyond it."""

import io
import sqlite3
import stat
from contextlib import closing
from pathlib import Path
from typing import Any

import pytest

from ferret import cli
from ferret.adapters.system import system_runtime
from ferret.application.capture_hook import capture_hook
from ferret.application.initialization import initialize_store
from ferret.commands import build_handlers
from ferret.domain.errors import FerretError
from ferret.domain.identity import derive_identifier
from support.busy import record_busy_timeouts
from support.hook_payloads import (
    CANARIES,
    CLAUDE_CODE,
    CODEX,
    REGISTRATIONS,
    SESSION,
    claude_tool,
    codex_tool,
    encode,
)

REGISTRATION_IDS = [f"{harness}-{event}" for harness, event, _ in REGISTRATIONS]
HOOK_ARGV = ["capture-hook", "--harness", CLAUDE_CODE, "--event", "tool.started"]


def make_home(tmp_path: Path) -> Path:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    initialize_store(system_runtime({"HOME": str(home)}))
    return home


def repository(tmp_path: Path, name: str = "repo-a") -> Path:
    root = tmp_path / "work" / name
    (root / ".git").mkdir(parents=True)
    (root / "src").mkdir()
    return root


def capture(home: Path, harness: str, event: str, document: dict[str, Any]) -> str | None:
    runtime = system_runtime({"HOME": str(home)}, stdin=io.BytesIO(encode(document)))
    return capture_hook(runtime, harness=harness, event=event)


def rows(home: Path, sql: str) -> list[tuple[Any, ...]]:
    with closing(sqlite3.connect(home / ".ferret" / "ferret.sqlite3")) as connection:
        return connection.execute(sql).fetchall()


def everything_on_disk(home: Path) -> bytes:
    return b"".join(path.read_bytes() for path in sorted((home / ".ferret").iterdir()))


@pytest.mark.parametrize(("harness", "event", "document"), REGISTRATIONS, ids=REGISTRATION_IDS)
def test_every_registration_stores_one_row_and_no_content(
    tmp_path: Path, harness: str, event: str, document: dict[str, Any]
) -> None:
    home = make_home(tmp_path)

    result = capture(home, harness, event, document)

    assert result == "stored"
    assert rows(home, "SELECT harness, event_type FROM event") == [(harness, event)]
    stored = everything_on_disk(home)
    assert [canary for canary in CANARIES if canary.encode() in stored] == []
    assert SESSION.encode() not in stored


def test_the_stored_identifiers_are_derived_from_the_repository_root_and_the_installation_key(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    root = repository(tmp_path)
    key = (home / ".ferret" / "identity.key").read_bytes()

    capture(home, CLAUDE_CODE, "tool.started", claude_tool("PreToolUse", cwd=str(root / "src")))

    assert rows(home, "SELECT workspace_id, session_id FROM event") == [
        (
            derive_identifier(key, "ws", str(root.resolve())),
            derive_identifier(key, "ss", CLAUDE_CODE, SESSION),
        )
    ]
    assert rows(home, "SELECT workspace_id FROM workspace") == [(derive_identifier(key, "ws", str(root.resolve())),)]
    assert str(root).encode() not in everything_on_disk(home)


def test_events_from_two_directories_of_one_repository_share_one_workspace(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    root = repository(tmp_path)

    capture(home, CLAUDE_CODE, "tool.started", claude_tool("PreToolUse", cwd=str(root)))
    capture(home, CODEX, "tool.started", codex_tool("PreToolUse", cwd=str(root / "src")))

    assert rows(home, "SELECT COUNT(*) FROM workspace") == [(1,)]
    assert rows(home, "SELECT COUNT(DISTINCT workspace_id), COUNT(DISTINCT session_id) FROM event") == [(1, 2)]


def test_a_different_repository_is_a_different_workspace(tmp_path: Path) -> None:
    home = make_home(tmp_path)

    capture(home, CLAUDE_CODE, "tool.started", claude_tool("PreToolUse", cwd=str(repository(tmp_path, "one"))))
    capture(home, CLAUDE_CODE, "tool.started", claude_tool("PreToolUse", cwd=str(repository(tmp_path, "two"))))

    assert rows(home, "SELECT COUNT(*) FROM workspace") == [(2,)]


def test_a_writer_blocked_beyond_the_busy_timeout_stores_nothing_and_fails_retryably(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    home = make_home(tmp_path)
    record_busy_timeouts(monkeypatch)
    blocker = sqlite3.connect(home / ".ferret" / "ferret.sqlite3", autocommit=True)
    blocker.execute("BEGIN IMMEDIATE")
    try:
        with pytest.raises(FerretError) as caught:
            capture(home, CLAUDE_CODE, "tool.started", claude_tool("PreToolUse"))
    finally:
        blocker.execute("ROLLBACK")
        blocker.close()

    assert (caught.value.code, caught.value.retryable) == ("storage_unavailable", True)
    assert rows(home, "SELECT COUNT(*) FROM event") == [(0,)]


def run_command(home: Path, payload: bytes) -> tuple[int, str, str]:
    stdout, stderr = io.StringIO(), io.StringIO()
    runtime = system_runtime({"HOME": str(home)}, stdin=io.BytesIO(payload))
    code = cli.main(HOOK_ARGV, stdout=stdout, stderr=stderr, handlers=build_handlers(lambda: runtime))
    return code, stdout.getvalue(), stderr.getvalue()


def test_the_command_stores_the_event_and_says_nothing(tmp_path: Path) -> None:
    home = make_home(tmp_path)

    outcome = run_command(home, encode(claude_tool("PreToolUse")))

    assert outcome == (0, "", "")
    assert rows(home, "SELECT COUNT(*) FROM event") == [(1,)]


@pytest.mark.parametrize("payload", [b"{not json", b"", b"[]", b'{"hook_event_name":"Stop"}'], ids=str)
def test_the_command_refuses_a_payload_it_cannot_map_silently_and_stores_nothing(
    tmp_path: Path, payload: bytes
) -> None:
    home = make_home(tmp_path)

    outcome = run_command(home, payload)

    assert outcome == (0, "", "")
    assert rows(home, "SELECT COUNT(*) FROM event") == [(0,)]


def test_the_command_on_an_uninitialized_home_is_silent_and_creates_nothing(tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)

    outcome = run_command(home, encode(claude_tool("PreToolUse")))

    assert outcome == (0, "", "")
    assert not (home / ".ferret").exists()


def test_the_command_on_an_unsafe_data_home_is_silent_and_changes_nothing(tmp_path: Path) -> None:
    home = make_home(tmp_path)
    key = home / ".ferret" / "identity.key"
    key.chmod(0o644)
    before = everything_on_disk(home)

    outcome = run_command(home, encode(claude_tool("PreToolUse")))

    assert outcome == (0, "", "")
    assert stat.S_IMODE(key.stat().st_mode) == 0o644
    assert everything_on_disk(home) == before
    assert rows(home, "SELECT COUNT(*) FROM event") == [(0,)]
