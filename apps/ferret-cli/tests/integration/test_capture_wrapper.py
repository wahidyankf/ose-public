"""The shared POSIX capture wrapper as a real process: which ferret it runs, what it forwards, and how quiet it is."""

import os
from pathlib import Path

import pytest

from ferret.application.privacy import RAW_LIMIT_BYTES
from support.wrapper import WRAPPER, Behaviour, run_wrapper, stand_in

PAYLOAD = b'{"session_id":"s1","cwd":"/work","hook_event_name":"PreToolUse","tool_name":"Read"}'


def recorded(directory: Path, name: str) -> bytes | None:
    """What a stand-in recorded, or None when it never ran."""
    marker = directory / name
    return marker.read_bytes() if marker.exists() else None


def candidate(root: Path, name: str, behaviour: Behaviour = "record") -> Path:
    """A stand-in in its own directory, so what each candidate recorded can be told apart."""
    directory = root / name
    directory.mkdir()
    return stand_in(directory, behaviour)


def on_path(root: Path, stand: Path) -> str:
    """A PATH directory whose ``ferret`` is the stand-in."""
    directory = root / f"bin-{stand.parent.name}"
    directory.mkdir()
    (directory / "ferret").symlink_to(stand)
    return f"{directory}:/usr/bin:/bin"


def user_launcher(home: Path, stand: Path) -> None:
    directory = home / ".local" / "bin"
    directory.mkdir(parents=True)
    (directory / "ferret").symlink_to(stand)


def test_the_environment_override_wins_over_the_path_and_the_user_launcher(tmp_path: Path) -> None:
    override = candidate(tmp_path, "override")
    searched = candidate(tmp_path, "searched")
    launcher = candidate(tmp_path, "launcher")
    home = tmp_path / "home"
    home.mkdir()
    user_launcher(home, launcher)

    ran = run_wrapper(
        "claude_code", "tool.started", PAYLOAD, home=home, binary=override, path=on_path(tmp_path, searched)
    )

    assert ran.code == 0
    assert recorded(override.parent, "stdin") == PAYLOAD
    assert recorded(searched.parent, "stdin") is None
    assert recorded(launcher.parent, "stdin") is None


def test_the_path_is_searched_before_the_user_launcher(tmp_path: Path) -> None:
    searched = candidate(tmp_path, "searched")
    launcher = candidate(tmp_path, "launcher")
    home = tmp_path / "home"
    home.mkdir()
    user_launcher(home, launcher)

    ran = run_wrapper("codex", "tool.started", PAYLOAD, home=home, binary=None, path=on_path(tmp_path, searched))

    assert ran.code == 0
    assert recorded(searched.parent, "stdin") == PAYLOAD
    assert recorded(launcher.parent, "stdin") is None


def test_the_user_launcher_is_used_when_the_path_has_no_ferret(tmp_path: Path) -> None:
    launcher = candidate(tmp_path, "launcher")
    home = tmp_path / "home"
    home.mkdir()
    user_launcher(home, launcher)

    ran = run_wrapper("claude_code", "session.started", PAYLOAD, home=home, binary=None)

    assert ran.code == 0
    assert recorded(launcher.parent, "stdin") == PAYLOAD


def test_no_ferret_anywhere_is_a_silent_success(tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir()

    ran = run_wrapper("claude_code", "tool.started", PAYLOAD, home=home, binary=None)

    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")


def test_a_user_launcher_that_is_not_executable_is_ignored(tmp_path: Path) -> None:
    launcher = candidate(tmp_path, "launcher")
    launcher.chmod(0o644)
    home = tmp_path / "home"
    home.mkdir()
    user_launcher(home, launcher)

    ran = run_wrapper("claude_code", "tool.started", PAYLOAD, home=home, binary=None)

    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    assert recorded(launcher.parent, "stdin") is None


def test_the_command_receives_exactly_the_two_static_arguments_the_hook_registered(tmp_path: Path) -> None:
    override = candidate(tmp_path, "override")

    run_wrapper("codex", "agent.ended", PAYLOAD, home=tmp_path, binary=override)

    assert recorded(override.parent, "argv") == b"capture-hook\n--harness\ncodex\n--event\nagent.ended\n"


@pytest.mark.parametrize("size", [0, 1, RAW_LIMIT_BYTES])
def test_standard_input_is_forwarded_byte_for_byte_up_to_the_raw_limit(tmp_path: Path, size: int) -> None:
    override = candidate(tmp_path, "override")
    payload = (b'{"a":"\r\n\xc3\xa9\t"}\n' * (size // 16 + 1))[:size]

    ran = run_wrapper("claude_code", "tool.completed", payload, home=tmp_path, binary=override)

    assert ran.code == 0
    assert recorded(override.parent, "stdin") == payload


def test_whatever_the_command_prints_and_however_it_exits_the_wrapper_is_silent_and_successful(tmp_path: Path) -> None:
    override = candidate(tmp_path, "override", "noisy")

    ran = run_wrapper("codex", "tool.started", PAYLOAD, home=tmp_path, binary=override)

    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")


def test_the_wrapper_is_executable_for_its_owner() -> None:
    assert os.access(WRAPPER, os.X_OK)
