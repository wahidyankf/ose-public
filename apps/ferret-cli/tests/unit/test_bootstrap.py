"""The interpreter guard: which interpreter FERRET runs on, and what a host without a suitable one is told.

Every case here is pure. The one thing that cannot be faked — that this module and its neighbours parse under an
interpreter older than the package requires — is held by the grammar cases at the end.
"""

import ast
import os
from collections.abc import Mapping
from pathlib import Path

import pytest

from ferret import _bootstrap
from ferret._bootstrap import (
    EXIT_CALLER_ERROR,
    EXIT_NOT_EXECUTABLE,
    OVERRIDE_VARIABLE,
    REQUIRED,
    SENTINEL_VARIABLE,
    candidates,
    choose,
    diagnosis,
    relaunch,
    running_version,
    search_directories,
    supports,
    unstartable,
)
from ferret.domain.errors import EXIT_CALLER_ERROR as CLOSED_CONTRACT_EXIT


@pytest.fixture
def only_path(monkeypatch: pytest.MonkeyPatch) -> None:
    """Search nothing but the PATH the test gives, so the host's own interpreters cannot answer for it."""
    monkeypatch.setattr(_bootstrap, "FALLBACK_DIRECTORIES", ())


def executable(directory: Path, name: str) -> Path:
    path = directory / name
    path.write_text("#!/bin/sh\nexit 0\n")
    path.chmod(0o755)
    return path


def test_the_repeated_exit_status_equals_the_closed_failure_contract() -> None:
    # _bootstrap may not import the rest of the package, so this is the only thing keeping the two in step.
    assert EXIT_CALLER_ERROR == CLOSED_CONTRACT_EXIT


@pytest.mark.parametrize(
    ("version", "expected"),
    [
        ((3, 14, 0), True),
        ((3, 14, 7), True),
        ((3, 15, 0), True),
        ((4, 0, 0), True),
        ((3, 13, 12), False),
        ((3, 9, 0), False),
        ((2, 7, 18), False),
    ],
)
def test_only_the_major_and_minor_numbers_decide_support(version: tuple[int, ...], expected: bool) -> None:
    assert supports(version) is expected


def test_the_required_version_matches_the_packaged_requirement() -> None:
    pyproject = (Path(__file__).resolve().parents[2] / "pyproject.toml").read_text()
    assert f'requires-python = ">={REQUIRED[0]}.{REQUIRED[1]},' in pyproject


def test_the_search_path_takes_absolute_path_entries_first_then_the_usual_locations() -> None:
    directories = search_directories({"PATH": "/first:relative:/second"})
    assert directories[:2] == ["/first", "/second"]
    assert os.path.expanduser("~/.local/bin") in directories
    assert "relative" not in directories


def test_the_search_path_drops_a_repeated_directory_and_keeps_first_seen_order() -> None:
    directories = search_directories({"PATH": "/usr/bin:/first:/usr/bin//:/first"})
    assert directories.count("/usr/bin") == 1
    assert directories.index("/usr/bin") < directories.index("/first")


def test_a_missing_path_variable_still_searches_the_usual_locations() -> None:
    assert os.path.expanduser("~/.local/bin") in search_directories({})


def test_candidates_reads_the_version_from_the_name_and_ignores_one_too_old(tmp_path: Path, only_path: None) -> None:
    executable(tmp_path, "python3.13")
    wanted = executable(tmp_path, "python3.14")
    executable(tmp_path, "python3")
    executable(tmp_path, "pythonesque")
    assert candidates({"PATH": str(tmp_path)}) == [str(wanted)]


def test_candidates_prefers_the_highest_version_wherever_it_is_found(tmp_path: Path, only_path: None) -> None:
    early, late = tmp_path / "early", tmp_path / "late"
    early.mkdir()
    late.mkdir()
    lower = executable(early, "python3.14")
    higher = executable(late, "python3.15")
    assert candidates({"PATH": f"{early}{os.pathsep}{late}"}) == [str(higher), str(lower)]


def test_candidates_break_a_version_tie_by_search_path_order(tmp_path: Path, only_path: None) -> None:
    early, late = tmp_path / "early", tmp_path / "late"
    early.mkdir()
    late.mkdir()
    first = executable(early, "python3.14")
    second = executable(late, "python3.14")
    assert candidates({"PATH": f"{early}{os.pathsep}{late}"}) == [str(first), str(second)]


def test_candidates_skip_a_name_that_is_not_executable_and_a_directory(tmp_path: Path, only_path: None) -> None:
    (tmp_path / "python3.14").write_text("not executable\n")
    (tmp_path / "python3.16").mkdir()
    assert candidates({"PATH": str(tmp_path)}) == []


def test_candidates_skip_a_directory_that_cannot_be_listed(tmp_path: Path, only_path: None) -> None:
    assert candidates({"PATH": str(tmp_path / "absent")}) == []


def test_a_bare_environment_still_finds_an_interpreter_through_the_fallback_directories(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # The hook path is exactly this: a harness may hand the wrapper a PATH with no interpreter on it at all.
    wanted = executable(tmp_path, "python3.14")
    monkeypatch.setattr(_bootstrap, "FALLBACK_DIRECTORIES", (str(tmp_path),))
    assert choose({"PATH": "/nowhere"}) == str(wanted)


def test_the_override_wins_over_every_discovered_candidate(tmp_path: Path, only_path: None) -> None:
    executable(tmp_path, "python3.14")
    pinned = executable(tmp_path, "pinned")
    assert choose({"PATH": str(tmp_path), OVERRIDE_VARIABLE: str(pinned)}) == str(pinned)


def test_an_override_that_names_nothing_executable_is_ignored(tmp_path: Path, only_path: None) -> None:
    wanted = executable(tmp_path, "python3.14")
    assert choose({"PATH": str(tmp_path), OVERRIDE_VARIABLE: str(tmp_path / "absent")}) == str(wanted)


def test_choose_returns_nothing_when_the_host_has_no_suitable_interpreter(tmp_path: Path, only_path: None) -> None:
    executable(tmp_path, "python3.13")
    assert choose({"PATH": str(tmp_path)}) is None


def test_the_diagnosis_names_both_versions_and_the_override_but_no_path() -> None:
    line = diagnosis((3, 13, 12))
    assert line == (
        f"ferret: requires Python {REQUIRED[0]}.{REQUIRED[1]} or newer, running 3.13; "
        f"set {OVERRIDE_VARIABLE} to a suitable interpreter"
    )
    assert "/" not in line


def never_executes(path: str, argv: list[str], environ: Mapping[str, str]) -> None:
    raise AssertionError(f"must not restart on {path} with {argv} and {sorted(environ)}")


def never_reports(line: str) -> None:
    raise AssertionError(f"unexpected diagnosis: {line}")


def test_a_supported_interpreter_is_left_alone(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 14, 7))
    assert relaunch("/archive.pyz", ["status"], {}, execute=never_executes, report=never_reports) is None


def test_the_running_version_reads_the_interpreter_executing_the_module(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 13, 12))
    assert running_version() == (3, 13)


def test_an_old_interpreter_restarts_the_archive_on_the_one_it_found(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, only_path: None
) -> None:
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 13, 12))
    wanted = executable(tmp_path, "python3.14")
    seen: list[tuple[str, list[str], dict[str, str]]] = []

    def record(path: str, argv: list[str], environ: Mapping[str, str]) -> None:
        seen.append((path, argv, dict(environ)))

    outcome = relaunch(
        "/archive.pyz", ["events", "list"], {"PATH": str(tmp_path)}, execute=record, report=never_reports
    )
    assert outcome is None
    assert seen == [
        (
            str(wanted),
            [str(wanted), "/archive.pyz", "events", "list"],
            {"PATH": str(tmp_path), SENTINEL_VARIABLE: "1"},
        )
    ]


def test_an_old_interpreter_with_nothing_to_restart_on_reports_and_gives_the_exit_status(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, only_path: None
) -> None:
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 13, 12))
    reported: list[str] = []
    outcome = relaunch(
        "/archive.pyz",
        [],
        {"PATH": str(tmp_path)},
        execute=never_executes,
        report=reported.append,
    )
    assert outcome == EXIT_CALLER_ERROR
    assert reported == [diagnosis((3, 13, 12))]


def test_an_interpreter_that_cannot_be_started_is_its_own_status_and_never_a_traceback(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, only_path: None
) -> None:
    # The guard exists because this interpreter cannot parse the package, so an OSError escaping here would become
    # a traceback on the one interpreter that cannot produce a useful one -- and under a hook, no output at all.
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 13, 12))
    wanted = executable(tmp_path, "python3.14")

    def refuses(path: str, argv: list[str], environ: Mapping[str, str]) -> None:
        raise OSError(8, "Exec format error")

    reported: list[str] = []
    outcome = relaunch("/archive.pyz", [], {"PATH": str(tmp_path)}, execute=refuses, report=reported.append)

    assert outcome == EXIT_NOT_EXECUTABLE == 126
    assert reported == [unstartable(str(wanted))]


def test_the_unstartable_line_names_the_interpreter_and_the_override_and_nothing_else(tmp_path: Path) -> None:
    line = unstartable("/opt/python3.14")

    assert "/opt/python3.14" in line
    assert OVERRIDE_VARIABLE in line
    assert "\n" not in line


def test_a_second_old_interpreter_diagnoses_rather_than_restarting_again(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, only_path: None
) -> None:
    # The name claimed 3.14 and the interpreter behind it is not; without the sentinel this would restart forever.
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 13, 12))
    executable(tmp_path, "python3.14")
    reported: list[str] = []
    outcome = relaunch(
        "/archive.pyz",
        [],
        {"PATH": str(tmp_path), SENTINEL_VARIABLE: "1"},
        execute=never_executes,
        report=reported.append,
    )
    assert outcome == EXIT_CALLER_ERROR
    assert reported == [diagnosis((3, 13, 12))]


def test_the_default_reporter_writes_one_line_to_standard_error(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # Reached through relaunch rather than by name, so the default really is the one a caller gets.
    monkeypatch.setattr(_bootstrap.sys, "version_info", (3, 13, 12))
    monkeypatch.setattr(_bootstrap, "FALLBACK_DIRECTORIES", ())
    assert relaunch("/archive.pyz", [], {"PATH": "/nowhere", SENTINEL_VARIABLE: "1"}) == EXIT_CALLER_ERROR
    captured = capsys.readouterr()
    assert (captured.out, captured.err) == ("", diagnosis((3, 13, 12)) + "\n")


def test_the_default_executor_is_the_one_that_replaces_the_process() -> None:
    # relaunch must not fall back to something that returns, or a too-old interpreter would carry on and crash.
    assert _bootstrap.os.execve is os.execve


OLD_GRAMMAR = (3, 9)
GUARDED = ("_bootstrap.py", "__init__.py")


@pytest.mark.parametrize("name", GUARDED)
def test_every_file_a_too_old_interpreter_reads_parses_under_the_old_grammar(name: str) -> None:
    """The regression test for the defect this module exists to fix: 3.14-only syntax on the pre-import path."""
    source = (Path(_bootstrap.__file__).parent / name).read_text()
    ast.parse(source, filename=name, feature_version=OLD_GRAMMAR)


def test_the_generated_entry_point_parses_under_the_old_grammar_and_guards_before_importing_the_cli() -> None:
    from build_zipapp import ENTRY_POINT

    ast.parse(ENTRY_POINT, filename="__main__.py", feature_version=OLD_GRAMMAR)
    assert ENTRY_POINT.index("from ferret._bootstrap import relaunch") < ENTRY_POINT.index("from ferret.cli import")


def test_the_guarded_files_import_nothing_else_from_the_package() -> None:
    """Any import of a 3.14-syntax module from these files would defeat the guard at its first line."""
    for name in GUARDED:
        tree = ast.parse((Path(_bootstrap.__file__).parent / name).read_text(), filename=name)
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                assert node.module is None or not node.module.startswith("ferret"), name
            if isinstance(node, ast.Import):
                assert all(not alias.name.startswith("ferret") for alias in node.names), name
