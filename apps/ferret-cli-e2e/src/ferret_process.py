"""Run the built FERRET artifact as a separate process with a controlled, isolated environment."""

import os
import subprocess
import sys
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from event_documents import encode_document

DEFAULT_TIMEOUT_SECONDS = 30.0


@dataclass(frozen=True, slots=True)
class Completed:
    """What a finished invocation produced, kept as bytes so a test can assert exact output."""

    returncode: int
    stdout: bytes
    stderr: bytes


def run_artifact(
    artifact: Path,
    arguments: Sequence[str],
    *,
    home: Path,
    stdin: bytes = b"",
    cwd: Path | None = None,
    extra_environment: Mapping[str, str] | None = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> Completed:
    """Invoke ``artifact`` with an empty inherited environment, ``home`` as HOME, ``stdin`` as its input, and ``cwd``.

    The interpreter is the one running the tests, so the artifact never depends on which ``python3`` a shell
    happens to resolve.
    """
    environment = {"HOME": str(home), "PATH": "/usr/bin:/bin", **(extra_environment or {})}
    completed = subprocess.run(
        [sys.executable, str(artifact), *arguments],
        input=stdin,
        capture_output=True,
        env=environment,
        cwd=cwd,
        timeout=timeout,
        check=False,
    )
    return Completed(completed.returncode, completed.stdout, completed.stderr)


def capture_documents(artifact: Path, home: Path, documents: Iterable[dict[str, Any]]) -> None:
    """Store each canonical event through the artifact's own ``capture`` command, failing loudly on any refusal."""
    for document in documents:
        stored = run_artifact(artifact, ["capture", "--json"], home=home, stdin=encode_document(document))
        assert (stored.returncode, stored.stderr) == (0, b""), stored


def run_into_closed_pipe(artifact: Path, arguments: Sequence[str], *, home: Path) -> Completed:
    """Invoke ``artifact`` with standard output connected to a pipe whose reader is already gone.

    The reader is closed before the process starts, so its first write hits a broken pipe deterministically,
    whatever the machine's speed. Standard output is therefore always empty in the result.
    """
    read_end, write_end = os.pipe()
    os.close(read_end)
    try:
        completed = subprocess.run(
            [sys.executable, str(artifact), *arguments],
            stdin=subprocess.DEVNULL,
            stdout=write_end,
            stderr=subprocess.PIPE,
            env={"HOME": str(home), "PATH": "/usr/bin:/bin"},
            timeout=DEFAULT_TIMEOUT_SECONDS,
            check=False,
        )
    finally:
        os.close(write_end)
    return Completed(completed.returncode, b"", completed.stderr)
