"""Run the shared POSIX capture wrapper, or the OpenCode plugin under Node, against a stand-in or in-tree ``ferret``
and measure what it did."""

import contextlib
import functools
import json
import os
import shutil
import signal
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


#: The only programs a Unit binding's search path offers: the wrapper sleeps, and the stand-ins read their input.
SYSTEM_UTILITIES = ("cat", "sleep")
SYSTEM_DIRECTORIES = "/usr/bin:/bin"


@dataclass(frozen=True, slots=True)
class Isolation:
    """Where a Unit binding runs a script subject: a private home, a directory of fakes, and a private search path.

    Everything lives in one owner-only directory the test created, and the search path holds links to the named
    system utilities and nothing else, so no installed ``ferret`` can be found and nothing outside is written.
    """

    home: Path
    fakes: Path
    path: str

    def reaches_no_ferret(self) -> bool:
        """Whether the subject, left to itself, could resolve no ``ferret`` through its search path or its home."""
        launcher = self.home / ".local" / "bin" / "ferret"
        return shutil.which("ferret", path=self.path) is None and not launcher.exists()


def isolate(directory: Path) -> Isolation:
    """An :class:`Isolation` inside ``directory``, whose home is empty and whose search path offers no ``ferret``."""
    directory.mkdir(mode=0o700, exist_ok=True)
    directory.chmod(0o700)
    home, fakes, programs = (directory / name for name in ("home", "fakes", "programs"))
    for created in (home, fakes, programs):
        created.mkdir(mode=0o700)
    for name in SYSTEM_UTILITIES:
        found = shutil.which(name, path=SYSTEM_DIRECTORIES)
        assert found is not None, f"{name} is required in {SYSTEM_DIRECTORIES}"
        (programs / name).symlink_to(found)
    isolation = Isolation(home=home, fakes=fakes, path=str(programs))
    assert isolation.reaches_no_ferret()
    return isolation


def within_deadline(ran: WrapperRun) -> bool:
    """Whether a wrapper call returned by its 1,000 ms deadline, allowing for the reap after a KILL."""
    return ran.elapsed_seconds < DEADLINE_SECONDS + TAIL_SECONDS


def _script(directory: Path, name: str, body: str) -> Path:
    path = directory / name
    path.write_text("#!/bin/sh\n" + body)
    path.chmod(path.stat().st_mode | stat.S_IXUSR)
    return path


WARM_UP = "--warm-up"
#: The first line of every stand-in's body: started with :data:`WARM_UP`, it exits at once and does nothing else.
WARM_UP_GUARD = f'[ "${{1:-}}" = "{WARM_UP}" ] && exit 0\n'


def warm(path: Path) -> None:
    """Start a newly written stand-in once, with nothing to do, before any test times it.

    macOS checks a newly written executable the first time it is started, which can add a few hundred milliseconds to
    that one start, and far more on a loaded host. A measured call must time the adapter, not that check -- a stand-in
    still being checked when the adapter's 900 ms TERM arrives would be stopped before it recorded anything -- so the
    script is started once first, with an argument no caller passes, and exits at once. It runs beside the script
    with only the system search path, and a deadline.
    """
    environment = {"PATH": SYSTEM_DIRECTORIES}
    subprocess.run(
        [str(path), WARM_UP], check=True, capture_output=True, env=environment, cwd=path.parent, timeout=HUNG_SECONDS
    )


def _warmed(directory: Path, name: str, body: str) -> Path:
    """A script whose body starts with :data:`WARM_UP_GUARD`, already started once by :func:`warm`."""
    path = _script(directory, name, WARM_UP_GUARD + body)
    warm(path)
    return path


def stand_in(directory: Path, behaviour: Behaviour) -> Path:
    """A ``ferret`` that records its arguments, standard input, and process ID, then behaves as told.

    ``record`` succeeds quietly, ``noisy`` writes to both streams and fails, ``hang`` sleeps until it is terminated, and
    ``stubborn`` ignores TERM so only KILL can stop it. The sleeps are ``exec``ed, so the recorded ID is the sleeper's.
    It is warmed before it is returned, so the adapter's timers never race the host's first-start check of it.
    """
    record = f'echo $$ > "{directory}/pid"\nprintf "%s\\n" "$@" > "{directory}/argv"\ncat > "{directory}/stdin"\n'
    tails = {
        "record": "exit 0\n",
        "noisy": 'echo "captured elsewhere"; echo "failed loudly" >&2; exit 9\n',
        "hang": "exec sleep 30\n",
        "stubborn": "trap '' TERM\nexec sleep 30\n",
    }
    return _warmed(directory, f"ferret-{behaviour}", record + tails[behaviour])


def call_logger(log: Path) -> bytes:
    """The text of a ``ferret`` that appends each call's arguments as one line to ``log``, then drains its input.

    Whoever writes it out must :func:`warm` it before an adapter is timed against it.
    """
    return f'#!/bin/sh\n{WARM_UP_GUARD}printf "%s\\n" "$*" >> "{log}"\ncat > /dev/null\nexit 0\n'.encode()


def logged_calls(log: Path) -> list[str]:
    """The calls a :func:`call_logger` wrote down, one argument line each; none when it never ran."""
    return log.read_text().splitlines() if log.exists() else []


def term_recorder(directory: Path) -> Path:
    """A ``ferret`` that ignores TERM but notes, on the shared monotonic clock, when it started and when TERM came.

    It also records its process ID, arguments, and standard input like ``stand_in``, then sleeps until KILL. It is a
    Python program, because a shell cannot read a clock finer than a second; the handler is installed before anything
    else, so a TERM can never arrive before it is ready to be noted. Should KILL never come, it exits by itself once
    ``HUNG_SECONDS`` have passed, so it cannot outlive the test that started it.
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
        f"DEADLINE = STARTED + {HUNG_SECONDS!r}\n"
        "while (left := DEADLINE - time.monotonic()) > 0:\n"
        "    time.sleep(left)\n"
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


@functools.cache
def node_executable() -> str:
    """The real Node binary.

    Run through the project's targets, npm names the Node running it in ``npm_node_execpath``, so nothing is started to
    find it. A direct run asks the ``node`` on the caller's search path once, with a deadline, so a version manager's
    shim can resolve its pinned binary.
    """
    named = os.environ.get("npm_node_execpath", "")  # noqa: SIM112 - npm names this variable in lower case
    if os.path.isabs(named) and os.access(named, os.X_OK):
        return named
    found = shutil.which("node")
    assert found is not None, "Node is required to run the OpenCode plugin"
    completed = subprocess.run(
        [found, "-p", "process.execPath"], capture_output=True, text=True, check=True, timeout=HUNG_SECONDS
    )
    return completed.stdout.strip()


def run_plugin(
    calls: Sequence[Mapping[str, Any]],
    *,
    home: Path,
    binary: Path | None,
    directory: Path,
    path: str = "/usr/bin:/bin",
    cwd: Path | None = None,
    spawn_log: Path | None = None,
) -> WrapperRun:
    """Replay OpenCode hook calls against the real plugin under Node; the process ends when every child it started has.

    Each call is ``{"hook": <hook name>, "args": [...]}``, exactly the arguments OpenCode hands that hook. With
    ``spawn_log``, the driver notes there when it spawned each child; :func:`spawn_instants` reads it back.
    """
    environment = {"HOME": str(home), "PATH": path, **({"FERRET_BIN": str(binary)} if binary else {})}
    document: dict[str, Any] = {"directory": str(directory), "calls": list(calls)}
    if spawn_log is not None:
        document["spawnLog"] = str(spawn_log)
    request = json.dumps(document).encode("utf-8")
    command = [node_executable(), "--no-warnings", str(DRIVER), str(PLUGIN)]
    return _run_timed(command, request, environment, timeout=HUNG_SECONDS + 6, cwd=cwd)


def _run_timed(
    command: Sequence[str], payload: bytes, environment: Mapping[str, str], *, timeout: float, cwd: Path | None
) -> WrapperRun:
    # ``subprocess.run(timeout=...)`` waits for the exit by polling with sleeps that grow to 50 ms, which would be added
    # to every measured call; a timer that kills a hung process leaves the wait blocking and exact. The process leads a
    # session of its own, so the timer kills everything it started too, not only the process itself.
    started = time.monotonic()
    with subprocess.Popen(
        list(command),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=dict(environment),
        cwd=cwd,
        start_new_session=True,
    ) as process:
        guard = threading.Timer(timeout, _kill_group, (process.pid,))
        guard.start()
        try:
            stdout, stderr = process.communicate(payload)
        finally:
            guard.cancel()
        elapsed = time.monotonic() - started
    return WrapperRun(process.returncode, stdout, stderr, elapsed, started)


def _kill_group(leader: int) -> None:
    """KILL every process in the group ``leader`` leads; one already gone is not an error."""
    with contextlib.suppress(ProcessLookupError):
        os.killpg(leader, signal.SIGKILL)


def spawn_instants(spawn_log: Path) -> list[float]:
    """When the plugin driver spawned each child, in seconds on the monotonic clock ``time.monotonic`` reads."""
    return [int(line) / 1_000_000_000 for line in spawn_log.read_text().splitlines()]


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


def assert_term_then_kill(ran: WrapperRun, directory: Path, *, spawned: float | None = None) -> None:
    """A child that ignores TERM, written by ``term_recorder``, got TERM about 900 ms in and the call ended at KILL.

    Every reading is on the one system-wide monotonic clock, and they happen in one order: the call starts, the child
    is spawned and starts, TERM reaches it, the call ends. Each bound is taken from an instant the adapter's own timers
    cannot precede, so a loaded host's delay in starting a process is never charged to the adapter:

    - The plugin arms its timers right after spawning the child, so with ``spawned`` -- that instant, as the driver
      noted it -- TERM must fall in the documented 800-1,000 ms window from it.
    - The wrapper arms its watchdog as it starts the child, at once, so TERM cannot come before that window measured
      from the harness call, nor more than 1,000 ms after the child began to run.

    The call cannot end before KILL, 100 ms after TERM, and must end within the reap tail after it.
    """
    times = term_times(directory)
    assert times.term is not None, "TERM never reached the child"
    assert ran.started <= times.started < times.term < ran.ended, (times, ran)
    term, kill = TERM_MILLISECONDS / 1000, KILL_MILLISECONDS / 1000
    if spawned is not None:
        assert ran.started <= spawned <= times.started, (spawned, times, ran)
        assert term - 0.1 <= times.term - spawned <= kill, (spawned, times)
    else:
        assert term - 0.05 <= times.term - ran.started, (times, ran)
        assert times.term - times.started <= kill, times
        assert ran.elapsed_seconds < kill + TAIL_SECONDS, ran
    assert kill - term - 0.05 <= ran.ended - times.term <= kill - term + TAIL_SECONDS, (times, ran)
    assert ran.ended - times.started < kill + TAIL_SECONDS, (times, ran)
