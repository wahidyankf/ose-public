"""Observe actual adapter timer requests with bounded, test-owned host collaborators."""

import contextlib
import json
import os
import selectors
import shutil
import signal
import subprocess
import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path

from support.wrapper import PLUGIN, SYSTEM_DIRECTORIES, WRAPPER, WrapperRun, alive, node_executable


@dataclass(frozen=True, slots=True)
class TimerProof:
    """An actual subject's requests and effects, with its unchanged forwarding and silent return."""

    ran: WrapperRun
    requests_ms: tuple[int, ...]
    signals: tuple[str, ...]
    argv: tuple[str, ...]
    stdin: bytes
    cancelled: bool = False


def _program(path: Path, source: str) -> Path:
    program = path.with_suffix(".py")
    program.write_text(source)
    path.write_text(f'#!/bin/sh\nexec "{sys.executable}" -IS "{program}" "$@"\n')
    path.chmod(0o700)
    return path


def _kill_owned_group(pid: int) -> None:
    with contextlib.suppress(ProcessLookupError):
        os.killpg(pid, signal.SIGKILL)


def controlled_wrapper(
    directory: Path,
    harness: str,
    event: str,
    payload: bytes,
    *,
    early_exit: bool = False,
    timer_ignores_term: bool = False,
    subject: Path = WRAPPER,
) -> TimerProof:
    """Release the real shell subject's two sleep requests, observing TERM before the second expiry and actual KILL.

    Anonymous pipes are readiness barriers, not clocks. A test-owned deadline kills only this session. Every fake,
    input and output lies in the private directory; the subject receives no inherited search path or user home.
    """
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    home = directory / "home"
    home.mkdir(mode=0o700)
    programs = directory / "programs"
    programs.mkdir(mode=0o700)
    for utility in ("mktemp", "rm"):
        found = shutil.which(utility, path=SYSTEM_DIRECTORIES)
        assert found is not None, f"{utility} is required in {SYSTEM_DIRECTORIES}"
        (programs / utility).symlink_to(found)
    read_events, write_events = os.pipe()
    read_release, write_release = os.pipe()
    prefix = (
        "import os, signal, sys\n"
        f"EVENTS = {write_events}\nRELEASE = {read_release}\n"
        "def note(text): os.write(EVENTS, (text + '\\n').encode())\n"
    )
    _program(
        programs / "sleep",
        prefix
        + ("signal.signal(signal.SIGTERM, signal.SIG_IGN)\n" if timer_ignores_term else "")
        + "note('sleep ' + sys.argv[1] + ' ' + str(os.getpid()))\nassert os.read(RELEASE, 1) == b'x'\n",
    )
    child = _program(
        directory / "ferret",
        prefix + "from pathlib import Path\n"
        f"HERE = Path({str(directory)!r})\n"
        "signal.signal(signal.SIGTERM, lambda number, frame: note('TERM'))\n"
        "(HERE / 'argv').write_text('\\n'.join(sys.argv[1:]))\n"
        "(HERE / 'stdin').write_bytes(sys.stdin.buffer.read())\n"
        "note('ready ' + str(os.getpid()))\n"
        + ("assert os.read(RELEASE, 1) == b'x'\n" if early_exit else "while True: signal.pause()\n"),
    )
    environment = {"HOME": str(home), "TMPDIR": str(home), "PATH": str(programs), "FERRET_BIN": str(child)}
    requested: list[int] = []
    sleepers: list[int] = []
    seen: list[str] = []
    child_pid = 0
    started = time.monotonic()
    guard_fired = threading.Event()
    process: subprocess.Popen[bytes] | None = None
    selector = selectors.DefaultSelector()
    buffer = b""

    def next_event() -> str:
        nonlocal buffer
        while b"\n" not in buffer:
            assert selector.select(timeout=4), "controlled timer readiness deadline expired"
            part = os.read(read_events, 4096)
            assert part, "controlled timer event pipe closed before readiness"
            buffer += part
        line, buffer = buffer.split(b"\n", 1)
        return line.decode()

    def expire_guard() -> None:
        guard_fired.set()
        assert process is not None
        _kill_owned_group(process.pid)

    guard = threading.Timer(8, expire_guard)
    try:
        selector.register(read_events, selectors.EVENT_READ)
        process = subprocess.Popen(
            [str(subject), harness, event],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=environment,
            cwd=home,
            start_new_session=True,
            pass_fds=(write_events, read_release),
        )
        guard.start()
        assert process.stdin is not None
        process.stdin.write(payload)
        process.stdin.close()
        process.stdin = None
        while not child_pid or not requested:
            message = next_event()
            if message.startswith("ready "):
                child_pid = int(message.split()[1])
            else:
                name, interval, pid = message.split()
                assert name == "sleep", message
                requested.append(round(float(interval) * 1000))
                sleepers.append(int(pid))
        assert requested == [900], requested
        assert alive(child_pid)
        assert process.poll() is None
        if early_exit:
            # The child and timer share a pipe, so early exit uses the owned child's signal instead of a race to read.
            os.kill(child_pid, signal.SIGKILL)
        else:
            # Holding this first barrier proves late expiry does not skip TERM or shorten the requested grace.
            os.write(write_release, b"x")
            while "TERM" not in seen or len(requested) < 2:
                message = next_event()
                if message == "TERM":
                    seen.append(message)
                else:
                    name, interval, pid = message.split()
                    assert name == "sleep", message
                    requested.append(round(float(interval) * 1000))
                    sleepers.append(int(pid))
            assert requested == [900, 100], requested
            assert alive(child_pid), "KILL occurred before second expiry"
            assert process.poll() is None, "KILL occurred before second expiry"
            os.write(write_release, b"x")
        stdout, stderr = process.communicate()
        assert not guard_fired.is_set(), "test-owned process deadline killed the subject"
        ran = WrapperRun(process.returncode, stdout, stderr, time.monotonic() - started, started)
        assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
        assert not alive(child_pid), "owned capture child survived actual wrapper return"
        assert all(not alive(pid) for pid in sleepers), "owned timer sleeper survived actual wrapper return"
        assert not list(home.glob("ferret-watchdog.*")), "owned job certificate survived actual wrapper return"
        if not early_exit:
            seen.append("KILL")  # A TERM-ignoring child died only after the second controlled expiry.
        return TimerProof(
            ran,
            tuple(requested),
            tuple(seen),
            tuple((directory / "argv").read_text().splitlines()),
            (directory / "stdin").read_bytes(),
            early_exit,
        )
    finally:
        guard.cancel()
        if guard.ident is not None:
            guard.join()
        if process is not None:
            _kill_owned_group(process.pid)
            if process.poll() is None:
                process.wait(timeout=4)
        selector.close()
        for descriptor in (read_events, write_events, read_release, write_release):
            os.close(descriptor)


def controlled_plugin(
    directory: Path,
    call: dict[str, object],
    *,
    completion: str = "",
    late_delivery: bool = False,
    subject: Path = PLUGIN,
    workspace: Path | None = None,
) -> TimerProof:
    """Advance the actual plugin's fake host timers through 899/900/999/1000 and late or early completion paths."""
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    report = directory / "timer-report.json"
    request = {
        "directory": str(workspace or directory),
        "call": call,
        "report": str(report),
        "completion": completion,
        "lateDelivery": late_delivery,
    }
    environment = {"HOME": str(directory), "PATH": str(directory), "FERRET_BIN": str(directory / "fake-ferret")}
    started = time.monotonic()
    with subprocess.Popen(
        [node_executable(), "--no-warnings", str(Path(__file__).with_name("opencode_timer_driver.mjs")), str(subject)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=environment,
        cwd=directory,
        start_new_session=True,
    ) as process:
        guard = threading.Timer(8, _kill_owned_group, (process.pid,))
        guard.start()
        try:
            stdout, stderr = process.communicate(json.dumps(request).encode())
        finally:
            guard.cancel()
            guard.join()
    ran = WrapperRun(process.returncode, stdout, stderr, time.monotonic() - started, started)
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    observed = json.loads(report.read_bytes())
    assert observed["requests"] == [900, 1000], observed
    assert observed["pending"] == 0, observed
    assert len(observed["cleared"]) == 2, observed
    assert observed["queueRetired"], observed
    assert observed["finalPending"] == 0, observed
    signals = tuple(item["signal"] for item in observed["signals"])
    assert signals == (() if completion else ("SIGTERM", "SIGKILL")), observed
    if not completion and not late_delivery:
        assert [item["signals"] for item in observed["snapshots"]] == [
            [],
            ["SIGTERM"],
            ["SIGTERM"],
            ["SIGTERM", "SIGKILL"],
        ], observed
    arguments = observed["argumentsReceived"]
    assert arguments["binary"] == environment["FERRET_BIN"]
    assert arguments["options"]["stdio"] == ["pipe", "ignore", "ignore"]
    return TimerProof(
        ran,
        tuple(observed["requests"]),
        signals,
        tuple(arguments["args"]),
        observed["forwarded"].encode(),
        bool(completion),
    )
