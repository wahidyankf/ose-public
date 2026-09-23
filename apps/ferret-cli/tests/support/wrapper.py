"""Run the shared POSIX capture wrapper, or the OpenCode plugin under Node, against a stand-in or in-tree ``ferret``
and measure what it did."""

import json
import os
import shutil
import stat
import subprocess
import sys
import threading
import time
import zipfile
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

REPOSITORY = Path(__file__).resolve().parents[4]
WRAPPER = REPOSITORY / ".claude" / "hooks" / "ferret-capture.sh"
PLUGIN = REPOSITORY / ".opencode" / "plugins" / "ferret.ts"
DRIVER = Path(__file__).with_name("opencode_driver.mjs")
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
    #: The monotonic reading taken just before the process started. The clock is system-wide, so a stand-in's own
    #: readings of it can be compared with this one.
    started: float = 0.0

    @property
    def ended(self) -> float:
        return self.started + self.elapsed_seconds


def within_deadline(ran: WrapperRun) -> bool:
    """Whether a wrapper call returned by its 1,000 ms deadline, allowing for the reap after a KILL."""
    return ran.elapsed_seconds < DEADLINE_SECONDS + TAIL_SECONDS


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


def term_recorder(directory: Path) -> Path:
    """A ``ferret`` that ignores TERM but notes, on the shared monotonic clock, when it started and when TERM came.

    It also records its process ID, arguments, and standard input like ``stand_in``, then sleeps until KILL. It is a
    Python program, because a shell cannot read a clock finer than a second; the handler is installed before anything
    else, so a TERM can never arrive before it is ready to be noted.
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


def in_tree_artifact(path: Path) -> Path:
    """A zipapp whose entry point runs this working tree's ``ferret``, so an install of it is a working FERRET."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as artifact:
        artifact.write(b"#!/usr/bin/env python3\n")
        with zipfile.ZipFile(artifact, "w") as archive:
            archive.writestr(
                "__main__.py",
                f"import sys\nsys.path.insert(0, {str(SOURCE)!r})\nfrom ferret.cli import main\nsys.exit(main())\n",
            )
    path.chmod(0o755)
    return path


def in_tree(directory: Path) -> Path:
    """A ``ferret`` that runs this working tree's source with the interpreter running the tests."""
    program = "import sys; from ferret.cli import main; sys.exit(main())"
    body = f'PYTHONPATH="{SOURCE}" exec "{sys.executable}" -c "{program}" "$@"\n'
    return _warmed(directory, "ferret-in-tree", body)


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
    cwd: Path | None = None,
) -> WrapperRun:
    """Invoke the wrapper the way a harness does: two static arguments, the payload on standard input."""
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {}), **(extra or {})}
    return _run_timed([str(WRAPPER), harness, event], payload, environment, timeout=timeout, cwd=cwd)


def node_executable() -> str:
    """The real Node binary, found through the caller's own environment so a version manager's shim can resolve it."""
    found = shutil.which("node")
    assert found is not None, "Node is required to run the OpenCode plugin"
    completed = subprocess.run([found, "-p", "process.execPath"], capture_output=True, text=True, check=True)
    return completed.stdout.strip()


def run_plugin(
    calls: Sequence[Mapping[str, Any]],
    *,
    home: Path,
    binary: Path | None,
    directory: Path,
    path: str = "/usr/bin:/bin",
    cwd: Path | None = None,
) -> WrapperRun:
    """Replay OpenCode hook calls against the real plugin under Node; the process ends when every child it started has.

    Each call is ``{"hook": <hook name>, "args": [...]}``, exactly the arguments OpenCode hands that hook.
    """
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {})}
    request = json.dumps({"directory": str(directory), "calls": list(calls)}).encode("utf-8")
    command = [node_executable(), "--no-warnings", str(DRIVER), str(PLUGIN)]
    return _run_timed(command, request, environment, timeout=HUNG_SECONDS + 6, cwd=cwd)


def _run_timed(
    command: Sequence[str], payload: bytes, environment: Mapping[str, str], *, timeout: float, cwd: Path | None
) -> WrapperRun:
    # ``subprocess.run(timeout=...)`` waits for the exit by polling with sleeps that grow to 50 ms, which would be added
    # to every measured call; a timer that kills a hung process leaves the wait blocking and exact.
    started = time.monotonic()
    with subprocess.Popen(
        list(command),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=dict(environment),
        cwd=cwd,
    ) as process:
        guard = threading.Timer(timeout, process.kill)
        guard.start()
        try:
            stdout, stderr = process.communicate(payload)
        finally:
            guard.cancel()
        elapsed = time.monotonic() - started
    return WrapperRun(process.returncode, stdout, stderr, elapsed, started)


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


def assert_term_then_kill(ran: WrapperRun, directory: Path, *, from_call: bool) -> None:
    """A child that ignores TERM, written by ``term_recorder``, got TERM about 900 ms in and the call ended at KILL.

    Every reading is on the one system-wide monotonic clock. TERM is timed from the child's own start and, when
    ``from_call`` says the adapter starts the child at once (the wrapper, not Node), from the harness call too. The call
    cannot end before KILL, 100 ms after TERM, and must end within the reap tail after it.
    """
    times = term_times(directory)
    assert times.term is not None, "TERM never reached the child"
    term, kill = TERM_MILLISECONDS / 1000, KILL_MILLISECONDS / 1000
    assert term - 0.1 <= times.term - times.started <= kill, times
    if from_call:
        assert term - 0.05 <= times.term - ran.started <= kill, (times, ran)
        assert ran.elapsed_seconds < kill + TAIL_SECONDS, ran
    assert kill - term - 0.05 <= ran.ended - times.term <= kill - term + TAIL_SECONDS, (times, ran)
    assert ran.ended - times.started < kill + TAIL_SECONDS, (times, ran)
