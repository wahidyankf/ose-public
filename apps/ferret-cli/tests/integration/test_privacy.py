"""The privacy boundary against a real store and a real process: a rejected payload leaves no trace at all."""

import json
import sqlite3
import subprocess
import sys
from contextlib import closing
from pathlib import Path

import pytest

from ferret.adapters.system import system_runtime
from ferret.application.initialization import initialize_store
from ferret.application.privacy import CANONICAL_LIMIT_BYTES
from support.events import VECTOR_DOCUMENT, encode

SOURCE = Path(__file__).resolve().parents[2] / "src"
RUNNER = (
    "import sys; sys.path.insert(0, sys.argv[1]); from ferret.cli import main; "
    "raise SystemExit(main(['capture', '--json']))"
)
CANARY = "canary-value-that-must-never-be-echoed"


def capture(home: Path, payload: bytes) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        [sys.executable, "-c", RUNNER, str(SOURCE)],
        input=payload,
        env={"HOME": str(home), "PATH": "/usr/bin:/bin"},
        capture_output=True,
        check=False,
    )


def count(home: Path, table: str) -> int:
    with closing(sqlite3.connect(home / ".local" / "share" / "ferret" / "ferret.sqlite3")) as connection:
        return int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


def everything_on_disk(home: Path) -> bytes:
    return b"".join(path.read_bytes() for path in sorted((home / ".local" / "share" / "ferret").iterdir()))


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        (encode({**VECTOR_DOCUMENT, "prompt": CANARY}), "prompt"),
        (encode({**VECTOR_DOCUMENT, "response": CANARY}), "response"),
        (encode({**VECTOR_DOCUMENT, "tool_arguments": {"command": CANARY}}), "tool_arguments"),
        (encode({**VECTOR_DOCUMENT, "transcript_path": f"/users/example/{CANARY}.jsonl"}), "transcript_path"),
        (encode({**VECTOR_DOCUMENT, "environment": {"SECRET": CANARY}}), "environment"),
        (encode({**VECTOR_DOCUMENT, "an_unexpected_field": CANARY}), None),
        (encode({**VECTOR_DOCUMENT, "toolName": f"/etc/{CANARY}"}), "toolName"),
        (encode({**VECTOR_DOCUMENT, "eventHash": "0" * 64}), "eventHash"),
        (b'{"schemaVersion":"1.0","schemaVersion":"1.0","note":"' + CANARY.encode() + b'"}', None),
        (b'{"note":"' + CANARY.encode() + b'\xff"}', None),
        (encode({**VECTOR_DOCUMENT, "toolName": CANARY * 1000}), None),
        (b" " * (CANONICAL_LIMIT_BYTES + 1) + CANARY.encode(), None),
    ],
    ids=[
        "prompt",
        "response",
        "tool-arguments",
        "transcript-path",
        "environment",
        "unknown-field",
        "path-shaped-tool-name",
        "hash-mismatch",
        "duplicate-keys",
        "invalid-utf8",
        "oversized-canonical",
        "oversized-padding",
    ],
)
def test_rejected_payload_writes_no_row(tmp_path: Path, payload: bytes, field: str | None) -> None:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    initialize_store(system_runtime({"HOME": str(home)}))
    before = everything_on_disk(home)

    completed = capture(home, payload)

    assert completed.returncode == 2
    assert completed.stdout == b""
    assert json.loads(completed.stderr)["error"] == {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": field,
        "retryable": False,
    }
    assert CANARY.encode() not in completed.stderr
    assert (count(home, "event"), count(home, "workspace")) == (0, 0)
    assert CANARY.encode() not in everything_on_disk(home)
    assert everything_on_disk(home) == before


def test_a_valid_payload_on_an_uninitialized_home_is_refused_without_creating_a_store(tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)

    completed = capture(home, encode(VECTOR_DOCUMENT))

    assert completed.returncode == 2
    assert json.loads(completed.stderr)["error"]["code"] == "ferret.storage.uninitialized"
    assert not (home / ".local" / "share" / "ferret").exists()
