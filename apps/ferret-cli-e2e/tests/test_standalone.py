"""FERRET runs standalone: every command works from the built artifact with every network socket denied."""

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from denied_sockets import attempted, denied_socket_environment
from event_documents import numbered_event
from ferret_process import run_artifact
from local_commands import run_local_commands

LOCAL_FILES = {"config.json", "ferret.lock", "ferret.sqlite3", "identity.json", "identity.key"}


def test_all_commands_with_denied_sockets(artifact: Path, home: Path, workdir: Path, socket_log: Path) -> None:
    environment = denied_socket_environment(socket_log)
    event = numbered_event(1, now=datetime.now(UTC), ago=timedelta(seconds=1))

    initialized = run_artifact(artifact, ["init", "--json"], home=home, cwd=workdir, extra_environment=environment)
    ran = run_local_commands(artifact, home, event=event, cwd=workdir, environment=environment)
    status = run_artifact(artifact, ["status", "--json"], home=home, cwd=workdir, extra_environment=environment)

    assert [(done.returncode, done.stderr) for done in (initialized, *ran.values(), status)] == [(0, b"")] * 8
    assert json.loads(status.stdout)["backend"] == {"state": "not_available_in_this_version"}
    assert attempted(socket_log) == []
    assert {path.name for path in home.iterdir()} == {".ferret"}
    assert {path.name for path in (home / ".ferret").iterdir()} <= LOCAL_FILES | {
        "ferret.sqlite3-wal",
        "ferret.sqlite3-shm",
    }
    assert list(workdir.iterdir()) == []


def test_denied_sockets_stop_and_record_a_connection_attempt(home: Path, tmp_path: Path, socket_log: Path) -> None:
    probe = tmp_path / "probe.py"
    probe.write_text("import socket\nsocket.create_connection(('127.0.0.1', 9))\n", encoding="utf-8")

    ran = run_artifact(probe, [], home=home, extra_environment=denied_socket_environment(socket_log))

    assert ran.returncode == 1
    assert b"PermissionError" in ran.stderr
    assert attempted(socket_log) != []
    assert all(event.startswith("socket.") for event in attempted(socket_log))
