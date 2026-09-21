"""Run the shared POSIX capture wrapper against a stand-in or in-tree ``ferret`` and measure what it did."""

import os
import stat
import subprocess
import sys
import threading
import time
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

REPOSITORY = Path(__file__).resolve().parents[4]
WRAPPER = REPOSITORY / ".claude" / "hooks" / "ferret-capture.sh"
SOURCE = REPOSITORY / "apps" / "ferret-cli" / "src"

TERM_MILLISECONDS = 900
KILL_MILLISECONDS = 1000
DEADLINE_SECONDS = 1.0
# A call that needed KILL returns just after the deadline, because the wrapper reaps the child and exits after sending
# it, and a lock wait can use the whole budget when the host's timers run late. This tail is how much later than the
# deadline still counts as meeting it; a call that is hung, rather than late, is bounded by HUNG_SECONDS below.
TAIL_SECONDS = 0.25
# A wrapper that has not returned by now is hung, whatever the machine's load; the lower bounds prove the timers.
HUNG_SECONDS = 4.0

type Behaviour = Literal["record", "noisy", "hang", "stubborn"]


@dataclass(frozen=True, slots=True)
class WrapperRun:
    """What one wrapper invocation returned and how long it took."""

    code: int
    stdout: bytes
    stderr: bytes
    elapsed_seconds: float


def within_deadline(ran: WrapperRun) -> bool:
    """Whether a wrapper call returned by its 1,000 ms deadline, allowing for the reap after a KILL."""
    return ran.elapsed_seconds < DEADLINE_SECONDS + TAIL_SECONDS


def _script(directory: Path, name: str, body: str) -> Path:
    path = directory / name
    path.write_text("#!/bin/sh\n" + body)
    path.chmod(path.stat().st_mode | stat.S_IXUSR)
    return path


def stand_in(directory: Path, behaviour: Behaviour) -> Path:
    """A ``ferret`` that records its arguments, standard input, and process ID, then behaves as told.

    ``record`` succeeds quietly, ``noisy`` writes to both streams and fails, ``hang`` sleeps until it is terminated, and
    ``stubborn`` ignores TERM so only KILL can stop it. The sleeps are ``exec``ed, so the recorded ID is the sleeper's.
    """
    record = f'echo $$ > "{directory}/pid"\nprintf "%s\\n" "$@" > "{directory}/argv"\ncat > "{directory}/stdin"\n'
    tails = {
        "record": "exit 0\n",
        "noisy": 'echo "captured elsewhere"; echo "failed loudly" >&2; exit 9\n',
        "hang": "exec sleep 30\n",
        "stubborn": "trap '' TERM\nexec sleep 30\n",
    }
    return _script(directory, f"ferret-{behaviour}", record + tails[behaviour])


def in_tree(directory: Path) -> Path:
    """A ``ferret`` that runs this working tree's source with the interpreter running the tests."""
    program = "import sys; from ferret.cli import main; sys.exit(main())"
    body = f'PYTHONPATH="{SOURCE}" exec "{sys.executable}" -c "{program}" "$@"\n'
    return _script(directory, "ferret-in-tree", body)


def run_wrapper(
    harness: str,
    event: str,
    payload: bytes,
    *,
    home: Path,
    binary: Path | None,
    path: str = "/usr/bin:/bin",
    extra: Mapping[str, str] | None = None,
    timeout: float = HUNG_SECONDS + 6,
) -> WrapperRun:
    """Invoke the wrapper the way a harness does: two static arguments, the payload on standard input."""
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {}), **(extra or {})}
    # ``subprocess.run(timeout=...)`` waits for the exit by polling with sleeps that grow to 50 ms, which would be added
    # to every measured call; a timer that kills a hung wrapper leaves the wait blocking and exact.
    started = time.monotonic()
    with subprocess.Popen(
        [str(WRAPPER), harness, event],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=environment,
    ) as process:
        guard = threading.Timer(timeout, process.kill)
        guard.start()
        try:
            stdout, stderr = process.communicate(payload)
        finally:
            guard.cancel()
        elapsed = time.monotonic() - started
    return WrapperRun(process.returncode, stdout, stderr, elapsed)


def alive(pid: int) -> bool:
    """Whether a process with this ID still exists; a reaped child does not."""
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def recorded_pid(directory: Path) -> int | None:
    """The process ID a stand-in wrote, or None when it never ran."""
    marker = directory / "pid"
    return int(marker.read_text()) if marker.exists() else None
