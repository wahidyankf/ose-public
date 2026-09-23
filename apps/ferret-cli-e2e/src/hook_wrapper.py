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
# A call that needed KILL returns just after the deadline, because the wrapper reaps the child and exits after
# sending it. This tail belongs to that row alone: it is a measurement budget for the latency tool's `kill`
# condition, never an allowance on the deadline an acceptance criterion states.
REAP_TAIL_SECONDS = 0.25
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
    #: The monotonic reading taken just before the process started. The clock is system-wide, so a stand-in's own
    #: readings of it can be compared with this one.
    started: float = 0.0

    @property
    def ended(self) -> float:
        return self.started + self.elapsed_seconds


def within_deadline(ran: HookRun) -> bool:
    """Whether an adapter call returned by the 1,000 ms deadline the acceptance criterion states, with no allowance.

    Every call site is a condition whose child dies at TERM, so the deadline is the literal one. A call that needs
    KILL returns just after it, and the two rows that provoke one assert their own bounds rather than this predicate.
    """
    return ran.elapsed_seconds < DEADLINE_SECONDS


def _script(directory: Path, name: str, body: str) -> Path:
    path = directory / name
    path.write_text("#!/bin/sh\n" + body)
    path.chmod(path.stat().st_mode | stat.S_IXUSR)
    return path


WARM_UP = "--warm-up"


def _warmed(directory: Path, name: str, body: str) -> Path:
    """A script run once, with nothing to do, before any test times it.

    macOS checks a newly written executable the first time it is started, which can add a few hundred milliseconds to
    that one start. A measured call must time the adapter, not that check, so the script is started once first, with
    an argument no caller passes, and exits at once.
    """
    path = _script(directory, name, f'[ "${{1:-}}" = "{WARM_UP}" ] && exit 0\n' + body)
    subprocess.run([str(path), WARM_UP], check=True, capture_output=True)
    return path


def launcher(directory: Path, artifact: Path) -> Path:
    """A ``ferret`` that runs the built artifact with the interpreter running the tests, not whatever ``python3`` is."""
    return _script(directory, "ferret", f'exec "{sys.executable}" "{artifact}" "$@"\n')


def stand_in(directory: Path, behaviour: Behaviour) -> Path:
    """A ``ferret`` that records its process ID and then sleeps until terminated (``hang``) or until killed."""
    record = f'echo $$ > "{directory}/pid"\ncat > /dev/null\n'
    tails = {"record": "exit 0\n", "hang": "exec sleep 30\n", "stubborn": "trap '' TERM\nexec sleep 30\n"}
    return _script(directory, f"ferret-{behaviour}", record + tails[behaviour])


def recorder(directory: Path) -> Path:
    """A ``ferret`` that keeps the arguments and the exact standard input it was started with, and exits zero."""
    body = f'printf "%s\\n" "$@" > "{directory}/argv"\ncat > "{directory}/stdin"\nexit 0\n'
    return _warmed(directory, "ferret-recorder", body)


def received(directory: Path) -> tuple[list[str], bytes]:
    """The arguments and standard input a ``recorder`` or ``term_recorder`` in ``directory`` was started with."""
    return (directory / "argv").read_text().split("\n")[:-1], (directory / "stdin").read_bytes()


def term_recorder(directory: Path) -> Path:
    """A ``ferret`` that ignores TERM but notes, on the shared monotonic clock, when it started and when TERM came.

    It also records its process ID, arguments, and standard input, then sleeps until KILL. It is a Python program,
    because a shell cannot read a clock finer than a second; the handler is installed before anything else, so a TERM
    can never arrive before it is ready to be noted.
    """
    program = directory / "term_recorder.py"
    program.write_text(
        "import os, signal, sys, time\n"
        "from pathlib import Path\n"
        "STARTED = time.monotonic()\n"
        f"HERE = Path({str(directory)!r})\n"
        "signal.signal(signal.SIGTERM, lambda number, frame: (HERE / 'term').write_text(repr(time.monotonic())))\n"
        "(HERE / 'pid').write_text(str(os.getpid()))\n"
        "(HERE / 'started').write_text(repr(STARTED))\n"
        "(HERE / 'argv').write_text(''.join(argument + '\\n' for argument in sys.argv[1:]))\n"
        "(HERE / 'stdin').write_bytes(sys.stdin.buffer.read())\n"
        "while True:\n"
        "    time.sleep(30)\n"
    )
    return _warmed(directory, "ferret-term-recorder", f'exec "{sys.executable}" -IS "{program}" "$@"\n')


@dataclass(frozen=True, slots=True)
class TermTimes:
    """When a ``term_recorder`` child started and when TERM reached it, on the shared monotonic clock."""

    started: float
    term: float | None


def term_times(directory: Path) -> TermTimes:
    """What a ``term_recorder`` in ``directory`` wrote down; ``term`` is ``None`` when TERM never reached it."""
    marker = directory / "term"
    term = float(marker.read_text()) if marker.exists() else None
    return TermTimes(float((directory / "started").read_text()), term)


def assert_term_then_kill(ran: HookRun, directory: Path, *, from_call: bool) -> None:
    """A child that ignores TERM, written by ``term_recorder``, got TERM about 900 ms in and the call ended at KILL.

    Every reading is on the one system-wide monotonic clock. TERM is timed from the child's own start and, when
    ``from_call`` says the adapter starts the child at once (the wrapper, not Node), from the harness call too. The call
    cannot end before KILL, 100 ms after TERM, and must end within the reap tail after it.
    """
    times = term_times(directory)
    assert times.term is not None, "TERM never reached the child"
    assert TERM_SECONDS - 0.1 <= times.term - times.started <= KILL_SECONDS, times
    if from_call:
        assert TERM_SECONDS - 0.05 <= times.term - ran.started <= KILL_SECONDS, (times, ran)
        assert ran.elapsed_seconds < KILL_SECONDS + REAP_TAIL_SECONDS, ran
    spacing = KILL_SECONDS - TERM_SECONDS
    assert spacing - 0.05 <= ran.ended - times.term <= spacing + REAP_TAIL_SECONDS, (times, ran)
    assert ran.ended - times.started < KILL_SECONDS + REAP_TAIL_SECONDS, (times, ran)


def node_executable() -> str | None:
    """The real Node binary, found through the caller's own environment so a version manager's shim can resolve it."""
    found = shutil.which("node")
    if found is None:
        return None
    completed = subprocess.run([found, "-p", "process.execPath"], capture_output=True, text=True, check=False)
    return completed.stdout.strip() or None


def run_timed(
    command: Sequence[str], *, payload: bytes, environment: Mapping[str, str], cwd: Path | None = None
) -> HookRun:
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
        cwd=cwd,
    ) as process:
        guard = threading.Timer(HUNG_SECONDS + 6, process.kill)
        guard.start()
        try:
            stdout, stderr = process.communicate(payload)
        finally:
            guard.cancel()
        elapsed = time.monotonic() - started
    return HookRun(process.returncode, stdout, stderr, elapsed, started)


def run_wrapper(
    harness: str,
    event: str,
    payload: bytes,
    *,
    home: Path,
    binary: Path | None,
    path: str = CLEAN_PATH,
    extra: Mapping[str, str] | None = None,
    cwd: Path | None = None,
) -> HookRun:
    """Invoke the wrapper the way a harness does: two static arguments, the payload on standard input."""
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {}), **(extra or {})}
    return run_timed([str(WRAPPER), harness, event], payload=payload, environment=environment, cwd=cwd)


def run_plugin(
    calls: Sequence[Mapping[str, Any]],
    *,
    home: Path,
    binary: Path | None,
    directory: Path,
    path: str = CLEAN_PATH,
    extra: Mapping[str, str] | None = None,
    cwd: Path | None = None,
) -> HookRun:
    """Replay hook calls against the OpenCode plugin under Node, which ends when every child it started has ended."""
    node = node_executable()
    assert node is not None, "Node is required to replay the OpenCode plugin"
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {}), **(extra or {})}
    request = json.dumps({"directory": str(directory), "calls": list(calls)}).encode("utf-8")
    command = [node, "--no-warnings", str(DRIVER), str(PLUGIN)]
    return run_timed(command, payload=request, environment=environment, cwd=cwd)


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
