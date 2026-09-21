"""Drive the shared capture wrapper and the OpenCode plugin against the built FERRET artifact, and time them."""

import json
import os
import shutil
import stat
import subprocess
import sys
import threading
import time
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

REPOSITORY = Path(__file__).resolve().parents[3]
WRAPPER = REPOSITORY / ".claude" / "hooks" / "ferret-capture.sh"
PLUGIN = REPOSITORY / ".opencode" / "plugins" / "ferret.ts"
DRIVER = Path(__file__).with_name("opencode_driver.mjs")

TERM_SECONDS = 0.9
KILL_SECONDS = 1.0
DEADLINE_SECONDS = 1.0
# A call that needed KILL returns just after the deadline, because the wrapper reaps the child and exits after sending
# it, and a lock wait can use the whole budget when the host's timers run late. This tail is how much later than the
# deadline still counts as meeting it; a call that is hung, rather than late, is bounded by HUNG_SECONDS below.
TAIL_SECONDS = 0.25
# A harness call that has not returned by now is hung, whatever the machine's load; the lower bounds prove the timers.
HUNG_SECONDS = 4.0
CLEAN_PATH = "/usr/bin:/bin"

type Behaviour = Literal["record", "hang", "stubborn"]


@dataclass(frozen=True, slots=True)
class HookRun:
    """What one adapter invocation returned and how long it took."""

    code: int
    stdout: bytes
    stderr: bytes
    elapsed_seconds: float


def within_deadline(ran: HookRun) -> bool:
    """Whether an adapter call returned by its 1,000 ms deadline, allowing for the reap after a KILL."""
    return ran.elapsed_seconds < DEADLINE_SECONDS + TAIL_SECONDS


def _script(directory: Path, name: str, body: str) -> Path:
    path = directory / name
    path.write_text("#!/bin/sh\n" + body)
    path.chmod(path.stat().st_mode | stat.S_IXUSR)
    return path


def launcher(directory: Path, artifact: Path) -> Path:
    """A ``ferret`` that runs the built artifact with the interpreter running the tests, not whatever ``python3`` is."""
    return _script(directory, "ferret", f'exec "{sys.executable}" "{artifact}" "$@"\n')


def stand_in(directory: Path, behaviour: Behaviour) -> Path:
    """A ``ferret`` that records its process ID and then sleeps until terminated (``hang``) or until killed."""
    record = f'echo $$ > "{directory}/pid"\ncat > /dev/null\n'
    tails = {"record": "exit 0\n", "hang": "exec sleep 30\n", "stubborn": "trap '' TERM\nexec sleep 30\n"}
    return _script(directory, f"ferret-{behaviour}", record + tails[behaviour])


def node_executable() -> str | None:
    """The real Node binary, found through the caller's own environment so a version manager's shim can resolve it."""
    found = shutil.which("node")
    if found is None:
        return None
    completed = subprocess.run([found, "-p", "process.execPath"], capture_output=True, text=True, check=False)
    return completed.stdout.strip() or None


def run_timed(command: Sequence[str], *, payload: bytes, environment: Mapping[str, str]) -> HookRun:
    """Run ``command`` with ``payload`` on standard input and time it exactly; one hung past HUNG_SECONDS is killed.

    ``subprocess.run(timeout=...)`` waits for the exit by polling with sleeps that grow to 50 ms, so it would add up to
    that much to every call measured here. A timer that kills the process leaves the wait blocking and exact.
    """
    started = time.monotonic()
    with subprocess.Popen(
        list(command),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=dict(environment),
    ) as process:
        guard = threading.Timer(HUNG_SECONDS + 6, process.kill)
        guard.start()
        try:
            stdout, stderr = process.communicate(payload)
        finally:
            guard.cancel()
        elapsed = time.monotonic() - started
    return HookRun(process.returncode, stdout, stderr, elapsed)


def run_wrapper(
    harness: str,
    event: str,
    payload: bytes,
    *,
    home: Path,
    binary: Path | None,
    path: str = CLEAN_PATH,
    extra: Mapping[str, str] | None = None,
) -> HookRun:
    """Invoke the wrapper the way a harness does: two static arguments, the payload on standard input."""
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {}), **(extra or {})}
    return run_timed([str(WRAPPER), harness, event], payload=payload, environment=environment)


def run_plugin(
    calls: Sequence[Mapping[str, Any]],
    *,
    home: Path,
    binary: Path | None,
    directory: Path,
    path: str = CLEAN_PATH,
    extra: Mapping[str, str] | None = None,
) -> HookRun:
    """Replay hook calls against the OpenCode plugin under Node, which ends when every child it started has ended."""
    node = node_executable()
    assert node is not None, "Node is required to replay the OpenCode plugin"
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {}), **(extra or {})}
    request = json.dumps({"directory": str(directory), "calls": list(calls)})
    command = [node, "--no-warnings", str(DRIVER), str(PLUGIN), request]
    return run_timed(command, payload=b"", environment=environment)


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
