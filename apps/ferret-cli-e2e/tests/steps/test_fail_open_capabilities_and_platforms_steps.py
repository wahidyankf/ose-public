"""E2E bindings for the harness feature: a skill gap read through ``usage``, per-user install and removal, and the real
adapters failing open in front of the built artifact."""

import json
import os
import sqlite3
import stat
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from adapter_cases import HARNESSES, INVALID, VALID, stored_rows
from event_documents import numbered_event
from ferret_process import Completed, capture_documents, run_artifact
from hook_bench import Bench, derived
from hook_wrapper import (
    DEADLINE_SECONDS,
    HookRun,
    alive,
    assert_term_then_kill,
    received,
    recorded_pid,
    recorder,
    run_plugin,
    run_wrapper,
    term_recorder,
    within_deadline,
)
from install_area import LAUNCHER_MODE, Layout, Tree, digest, empty_tree, launcher_starts, store
from vendor_payloads import CLAUDE_CODE, CODEX, OPENCODE, WORKSPACE, claude_tool, codex_tool, encode, opencode_call

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"
NO_OUTCOME: dict[str, Any] = {
    "outcome": "not_applicable",
    "durationMs": None,
    "outcomeVisibility": "not_applicable",
    "durationVisibility": "not_applicable",
}
USAGE_INTERPRETATION = "Operational usage only; unknown subject visibility is not zero usage."
PATH_WITHOUT_USER_BIN = "/usr/bin:/bin"
STARTUP_FILES = {".zshrc": b"export EDITOR=vi\n", ".bashrc": b"# bash startup\n", ".profile": b"# login shell\n"}
HARNESS_FILES = {
    ".claude/settings.json": b'{"hooks":{"PostToolUse":[{"command":".claude/hooks/ferret-capture.sh"}]}}\n',
    ".codex/hooks.json": b'{"hooks":{"PostToolUse":[{"command":".claude/hooks/ferret-capture.sh"}]}}\n',
    ".config/opencode/plugins/ferret.ts": b"export const Ferret = async () => ({})\n",
}


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, and the usage answer for the harness under test."""

    artifact: Path
    home: Path
    repository: Path
    usage: Completed | None = None
    ran: Completed | None = None
    path: str = PATH_WITHOUT_USER_BIN
    bystanders: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())
    data_before: Tree = field(default_factory=empty_tree)
    rows_before: int = 0
    adapters: dict[str, HookRun] = field(default_factory=lambda: dict[str, HookRun]())

    def document(self) -> dict[str, Any]:
        assert self.usage is not None
        assert (self.usage.returncode, self.usage.stderr) == (0, b"")
        return json.loads(self.usage.stdout)


@pytest.fixture
def session(artifact: Path, home: Path, workdir: Path) -> Session:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    return Session(artifact=artifact, home=home, repository=workdir)


def dimension(row: dict[str, Any], name: str) -> Any:
    return {item["name"]: item["value"] for item in row["dimensions"]}[name]


# Count skill invocations the harness could not name: skill events as the Claude Code adapter stores them, a ``Skill``
# call whose input named no valid skill keeping an unknown subject, captured through the artifact's own ``capture``.
HARNESS = CLAUDE_CODE
SKILL_CALLS: tuple[tuple[str, str | None], ...] = (
    (HARNESS, "tdd"),
    (HARNESS, None),
    (HARNESS, "tdd"),
    (HARNESS, "review"),
    (HARNESS, None),
    ("opencode", "deploy"),
)


def usage_rows(session: Session) -> dict[str | None, dict[str, Any]]:
    rows = session.document()["rows"]
    by_skill = {dimension(row, "skill"): row for row in rows}
    assert len(by_skill) == len(rows)
    return by_skill


@scenario(FEATURE, "Count skill invocations the harness could not name as unknown, not as zero usage")
def test_count_unnamed_skill_invocations_as_unknown() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a harness recorded skill invocations, some of which it could not name")
def given_skill_invocations_some_unnamed(session: Session) -> None:
    now = datetime.now(UTC)
    events = [
        numbered_event(
            number,
            now=now,
            ago=timedelta(minutes=number),
            harness=harness,
            eventType="skill.invoked",
            skillName=skill,
            toolName=None,
            subjectVisibility="observed" if skill is not None else "unknown",
            **NO_OUTCOME,
        )
        for number, (harness, skill) in enumerate(SKILL_CALLS, start=1)
    ]
    capture_documents(session.artifact, session.home, events)


@when("the user requests usage grouped by skill for that harness")
def when_usage_is_grouped_by_skill(session: Session) -> None:
    session.usage = run_artifact(
        session.artifact,
        ["usage", "--group-by", "skill", "--harness", HARNESS, "--all-time", "--json"],
        home=session.home,
    )


@then("each named skill is counted as observed usage")
def then_named_skills_are_observed(session: Session) -> None:
    named = Counter(skill for harness, skill in SKILL_CALLS if harness == HARNESS and skill is not None)
    rows = usage_rows(session)
    for skill, count in named.items():
        row = rows[skill]
        assert (row["eventCount"], row["observedSubjectCount"], row["unknownSubjectCount"]) == (count, count, 0)


@then("the unnamed invocations are counted as unknown subjects in a group of their own")
def then_unnamed_invocations_are_unknown(session: Session) -> None:
    unnamed = sum(1 for harness, skill in SKILL_CALLS if harness == HARNESS and skill is None)
    row = usage_rows(session)[None]
    assert (row["eventCount"], row["unknownSubjectCount"]) == (unnamed, unnamed)
    assert (row["observedSubjectCount"], row["derivedSubjectCount"]) == (0, 0)


@then("no skill the harness never invoked is reported with a zero count")
def then_no_zero_is_fabricated(session: Session) -> None:
    rows = usage_rows(session)
    assert set(rows) == {skill for harness, skill in SKILL_CALLS if harness == HARNESS}
    assert "deploy" not in rows
    assert all(row["eventCount"] > 0 for row in rows.values())


@then("the result states that unknown subject visibility is not zero usage")
def then_the_result_states_unknown_is_not_zero(session: Session) -> None:
    assert session.document()["interpretation"] == USAGE_INTERPRETATION


def run_self(session: Session, arguments: list[str]) -> Completed:
    return run_artifact(
        session.artifact,
        arguments,
        home=session.home,
        cwd=session.repository,
        extra_environment={"PATH": session.path},
    )


def user_files(session: Session, names: dict[str, bytes]) -> dict[str, bytes]:
    return {name: (session.home / name).read_bytes() for name in names}


def run_every_adapter(session: Session) -> dict[str, HookRun]:
    """Each harness's real adapter, run the way its harness runs it: no FERRET_BIN, the user's bin on PATH."""
    cwd = session.repository
    ran = {
        harness: run_wrapper(
            harness,
            "tool.completed",
            encode(payload),
            home=session.home,
            binary=None,
            path=session.path,
            cwd=cwd,
        )
        for harness, payload in {
            CLAUDE_CODE: claude_tool("PostToolUse", duration_ms=5, cwd=str(cwd)),
            CODEX: codex_tool("PostToolUse", cwd=str(cwd)),
        }.items()
    }
    ran[OPENCODE] = run_plugin(
        [opencode_call("tool.execute.before")],
        home=session.home,
        binary=None,
        directory=cwd,
        path=session.path,
        cwd=cwd,
    )
    return ran


def stored_harnesses(session: Session) -> list[str]:
    listing = run_self(session, ["events", "list", "--json"])
    assert (listing.returncode, listing.stderr) == (0, b"")
    return sorted(item["harness"] for item in json.loads(listing.stdout)["items"])


@scenario(FEATURE, "Install privately for the current user")
def test_install_privately_for_the_current_user() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("a supported environment with no FERRET artifact installed where {situation}"))
def given_no_artifact_installed(session: Session, situation: str) -> None:
    layout = Layout(session.home)
    session.path = f"/usr/bin:{layout.bin}" if "already on PATH" in situation else PATH_WITHOUT_USER_BIN
    for name, content in STARTUP_FILES.items():
        (session.home / name).write_bytes(content)
    session.bystanders = user_files(session, STARTUP_FILES)
    # The data home shares `.local/share/ferret` with the install area and the store is already there, so what
    # makes this "not installed" is that no launcher and no manifest exist.
    assert not os.path.lexists(layout.launcher)
    assert not os.path.lexists(layout.manifest)


@when("the user runs self install --target user")
def when_install_runs(session: Session) -> None:
    session.ran = run_self(session, ["self", "install", "--target", "user", "--json"])


@then("the artifact, launcher, and manifest are created with owner-only access")
def then_objects_are_owner_only(session: Session) -> None:
    assert session.ran is not None
    assert (session.ran.returncode, session.ran.stderr) == (0, b"")
    document = json.loads(session.ran.stdout)
    assert document["result"] == "installed"
    layout = Layout(session.home)
    version = document["version"]
    artifact = layout.artifact(version)
    assert [document["artifactPath"], document["launcherPath"], document["manifestPath"]] == [
        str(artifact),
        str(layout.launcher),
        str(layout.manifest),
    ]
    modes = {
        path: stat.S_IMODE(os.lstat(path).st_mode)
        for path in (layout.share, layout.version_directory(version), layout.bin, artifact, layout.manifest)
    }
    assert modes == {
        layout.share: 0o700,
        layout.version_directory(version): 0o700,
        layout.bin: 0o700,
        artifact: 0o700,
        layout.manifest: 0o600,
    }
    assert (layout.launcher.is_symlink(), stat.S_IMODE(os.lstat(layout.launcher).st_mode)) == (False, LAUNCHER_MODE)
    assert launcher_starts(layout) == artifact
    assert artifact.read_bytes() == session.artifact.read_bytes()
    owners = {os.lstat(path).st_uid for path in (layout.share, artifact, layout.launcher, layout.manifest)}
    assert owners == {os.geteuid()}
    recorded = json.loads(layout.manifest.read_bytes())
    assert recorded["artifactSha256"] == digest(session.artifact.read_bytes())


@then(parsers.parse("the command reports path action {path_action}"))
def then_the_path_action_is_reported(session: Session, path_action: str) -> None:
    assert session.ran is not None
    assert json.loads(session.ran.stdout)["pathAction"] == path_action


@then("no shell startup file and no machine-wide PATH are modified")
def then_no_startup_file_or_path_is_modified(session: Session) -> None:
    layout = Layout(session.home)
    assert user_files(session, STARTUP_FILES) == session.bystanders
    assert {path.name for path in session.home.iterdir()} == {".local", *STARTUP_FILES}
    assert {path.name for path in (session.home / ".local").iterdir()} == {"bin", "share"}
    assert {path.name for path in layout.bin.iterdir()} == {"ferret"}
    assert list(session.repository.iterdir()) == []


@scenario(FEATURE, "Remove FERRET without changing harness behaviour")
def test_remove_ferret_without_changing_harness_behaviour() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("supported harness adapters are configured to call FERRET")
def given_harness_adapters_call_ferret(session: Session) -> None:
    layout = Layout(session.home)
    session.path = f"{layout.bin}:{PATH_WITHOUT_USER_BIN}"
    capture_documents(
        session.artifact, session.home, [numbered_event(1, now=datetime.now(UTC), ago=timedelta(minutes=1))]
    )
    installed = run_self(session, ["self", "install", "--target", "user", "--json"])
    assert (installed.returncode, installed.stderr) == (0, b"")
    for name, content in HARNESS_FILES.items():
        (session.home / name).parent.mkdir(parents=True, exist_ok=True)
        (session.home / name).write_bytes(content)
    session.bystanders = user_files(session, HARNESS_FILES)
    # Each real adapter finds the installed launcher through PATH, as its harness would, and captures one event.
    captured = run_every_adapter(session)
    assert {harness: (ran.code, ran.stdout, ran.stderr) for harness, ran in captured.items()} == {
        CLAUDE_CODE: (0, b"", b""),
        CODEX: (0, b"", b""),
        OPENCODE: (0, b"", b""),
    }
    assert stored_harnesses(session) == [CLAUDE_CODE, CLAUDE_CODE, CODEX, OPENCODE]
    session.rows_before = 4
    session.data_before = store(Layout(session.home))
    assert list(session.repository.iterdir()) == []


@when("the user runs self uninstall")
def when_ferret_is_removed(session: Session) -> None:
    session.ran = run_self(session, ["self", "uninstall", "--json"])


@then("every harness adapter still exits zero without writing to either stream or capturing an event")
def then_every_adapter_still_exits_zero(session: Session) -> None:
    assert session.ran is not None
    assert (session.ran.returncode, session.ran.stderr) == (0, b"")
    assert json.loads(session.ran.stdout)["result"] == "uninstalled"
    session.adapters = run_every_adapter(session)
    for harness, ran in session.adapters.items():
        assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b""), harness
        assert ran.elapsed_seconds < DEADLINE_SECONDS, harness
    # Nothing reached the store: its files, the hook-failure record included, are exactly as the uninstall left them.
    assert store(Layout(session.home)) == session.data_before
    assert user_files(session, HARNESS_FILES) == session.bystanders


@then("the repository contains no newly generated telemetry data")
def then_the_repository_holds_no_new_telemetry(session: Session) -> None:
    assert set(session.adapters) == {CLAUDE_CODE, CODEX, OPENCODE}
    assert list(session.repository.iterdir()) == []


@then("the existing user database remains recoverable or removable by an explicit user action")
def then_the_database_is_recoverable_or_removable(session: Session) -> None:
    assert store(Layout(session.home)) == session.data_before
    assert len(stored_harnesses(session)) == session.rows_before
    purged = run_self(session, ["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (purged.returncode, purged.stderr, json.loads(purged.stdout)["dataAction"]) == (0, b"", "deleted")
    assert not os.path.lexists(session.home / ".local" / "share" / "ferret")


# Keep a harness fail-open after a local failure, and at the wrapper boundary: the real adapters (the shared wrapper
# for Claude Code and Codex, the plugin under Node) in front of the built artifact, over a real home and SQLite store.
WRAPPER_BYTES = (
    b'{\r\n\t"session_id": "s\xc3\xa9ance-1",\r\n\t"cwd": "/users/example/caf\xc3\xa9",\r\n'
    b'\t"hook_event_name": "PostToolUse",\r\n\t"tool_name": "Read",\r\n\t"duration_ms": 27\r\n}\r\n'
)


@dataclass(slots=True)
class Adapters:
    """An initialized machine, the condition FERRET is in, and what each adapter returned for the one event sent."""

    bench: Bench
    harness: str = CLAUDE_CODE
    binary: Path | str | None = "default"
    invalid: bool = False
    expected_rows: int = 1
    stuck: bool = False
    writer: sqlite3.Connection | None = None
    ran: dict[str, HookRun] = field(default_factory=lambda: dict[str, HookRun]())
    call: dict[str, Any] | bytes | None = None
    forwarded: bytes | None = None
    received: tuple[list[str], bytes] | None = None


@pytest.fixture
def adapters(artifact: Path, home: Path) -> Iterator[Adapters]:
    binding = Adapters(bench=Bench.create(artifact, home, home.parent))
    yield binding
    if binding.writer is not None:
        binding.writer.close()


def unusable_database(adapters: Adapters) -> bool:
    return not adapters.bench.database.read_bytes().startswith(b"SQLite format 3")


@scenario(FEATURE, "Keep a harness fail-open after a local failure")
def test_keep_a_harness_fail_open_after_a_local_failure() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("a harness invokes the FERRET adapter")
def given_a_harness_invokes_the_adapter(adapters: Adapters) -> None:
    assert adapters.bench.database.is_file()


@given(parsers.parse("FERRET is {condition}"))
def given_ferret_is_in_a_condition(adapters: Adapters, condition: str) -> None:
    adapters.expected_rows = 0
    if condition == "not installed":
        adapters.binary = None
    elif condition == "given invalid metadata":
        adapters.invalid = True
    elif condition == "unable to open SQLite":
        adapters.bench.database.write_bytes(b"this is not a SQLite database" * 64)
    else:
        assert condition == "blocked by a concurrent writer beyond the timeout", condition
        adapters.writer = sqlite3.connect(adapters.bench.database, autocommit=True)
        adapters.writer.execute("BEGIN IMMEDIATE")


@when("the adapter handles a lifecycle event")
def when_the_adapter_handles_an_event(adapters: Adapters) -> None:
    for harness in HARNESSES:
        fixture = VALID[harness]
        document = INVALID[harness] if adapters.invalid else fixture.document
        adapters.ran[harness] = adapters.bench.forward(harness, fixture.event, document, binary=adapters.binary)


@then("the adapter returns exit code zero within 1000 milliseconds")
def then_the_adapter_returns_zero_in_time(adapters: Adapters) -> None:
    assert set(adapters.ran) == set(HARNESSES)
    for harness, ran in adapters.ran.items():
        assert ran.code == 0, harness
        assert within_deadline(ran), harness


@then("it writes no output into the harness conversation")
def then_the_adapter_writes_no_output(adapters: Adapters) -> None:
    streams = {harness: (ran.stdout, ran.stderr) for harness, ran in adapters.ran.items()}
    assert streams == dict.fromkeys(HARNESSES, (b"", b""))
    if adapters.writer is not None:
        adapters.writer.execute("ROLLBACK")
    if not unusable_database(adapters):
        assert adapters.bench.stored() == 0


@scenario(FEATURE, "Keep one POSIX adapter fail-open at the wrapper boundary")
def test_keep_one_posix_adapter_fail_open_at_the_wrapper_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@scenario(FEATURE, "Keep the OpenCode plugin fail-open at its process boundary")
def test_keep_the_opencode_plugin_fail_open_at_its_process_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the {harness} hook runs the shared POSIX wrapper"))
def given_a_hook_runs_the_wrapper(adapters: Adapters, harness: str) -> None:
    adapters.harness = harness


@given("OpenCode runs the FERRET plugin for a lifecycle hook")
def given_opencode_runs_the_plugin(adapters: Adapters) -> None:
    adapters.harness = OPENCODE


def send(adapters: Adapters, document: dict[str, Any] | bytes, *, event: str | None = None) -> None:
    adapters.ran[adapters.harness] = adapters.bench.forward(
        adapters.harness, event or VALID[adapters.harness].event, document, binary=adapters.binary
    )


def record_forwarding(adapters: Adapters, document: dict[str, Any] | bytes) -> None:
    """Send ``document`` once more, to a stand-in that keeps exactly the arguments and bytes the adapter handed it."""
    recording = adapters.bench.directory / "recording"
    recording.mkdir()
    ran = adapters.bench.forward(adapters.harness, VALID[adapters.harness].event, document, binary=recorder(recording))
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    adapters.received = received(recording)


@when("stdin is forwarded byte-for-byte for a supported event")
def when_stdin_is_forwarded(adapters: Adapters) -> None:
    # Valid JSON with CRLF line ends, tabs, and non-ASCII text: any re-encoding of these bytes changes the derived IDs.
    send(adapters, WRAPPER_BYTES)
    record_forwarding(adapters, WRAPPER_BYTES)
    adapters.forwarded = WRAPPER_BYTES


@when("the event is not one FERRET registers")
def when_the_event_is_not_registered(adapters: Adapters) -> None:
    adapters.expected_rows = 0
    send(adapters, VALID[adapters.harness].document, event="notification.sent")


@when("the payload carries raw content fields")
def when_the_payload_carries_content(adapters: Adapters) -> None:
    send(adapters, VALID[adapters.harness].document)


@when("the ferret executable is missing")
def when_the_executable_is_missing(adapters: Adapters) -> None:
    adapters.binary = None
    adapters.expected_rows = 0
    send(adapters, VALID[adapters.harness].document)


@when("the plugin forwards an invalid payload")
def when_the_plugin_forwards_an_invalid_payload(adapters: Adapters) -> None:
    adapters.expected_rows = 0
    adapters.call = INVALID[OPENCODE]
    send(adapters, adapters.call)
    record_forwarding(adapters, adapters.call)


@when("the child process hangs past the deadline")
def when_the_child_hangs(adapters: Adapters) -> None:
    hung = adapters.bench.directory / "hung"
    hung.mkdir()
    adapters.binary = term_recorder(hung)
    adapters.stuck = True
    adapters.expected_rows = 0
    adapters.call = VALID[adapters.harness].document
    send(adapters, adapters.call)
    adapters.received = received(hung)


@then("the wrapper exits zero and writes nothing to either stream")
def then_the_wrapper_is_silent(adapters: Adapters) -> None:
    ran = adapters.ran[adapters.harness]
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    assert adapters.bench.stored() == adapters.expected_rows
    if adapters.forwarded is not None:
        # The child got the payload's exact bytes under the two static registration arguments.
        assert adapters.received == (
            ["capture-hook", "--harness", adapters.harness, "--event", VALID[adapters.harness].event],
            adapters.forwarded,
        )
    if adapters.expected_rows:
        [row] = stored_rows(adapters.bench)
        key = adapters.bench.key()
        assert row["harness"] == adapters.harness
        if row["tool_name"] == "Read" and adapters.harness == CLAUDE_CODE:
            assert row["workspace_id"] == derived(key, "ws", "/users/example/café")
            assert row["session_id"] == derived(key, "ss", CLAUDE_CODE, "séance-1")
        assert adapters.bench.leaks() == []


@then("the plugin completes the hook without an error and writes nothing to either stream")
def then_the_plugin_is_silent(adapters: Adapters) -> None:
    ran = adapters.ran[OPENCODE]
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    assert adapters.bench.stored() == adapters.expected_rows
    # The plugin forwarded the hook as one JSON document, whatever it held, under its static registration arguments.
    assert adapters.received is not None
    arguments, stdin = adapters.received
    assert arguments == ["capture-hook", "--harness", OPENCODE, "--event", "tool.started"]
    assert isinstance(adapters.call, dict)
    given_input, given_output = adapters.call["args"]
    assert json.loads(stdin) == {
        "hook": "tool.execute.before",
        "directory": WORKSPACE,
        "input": given_input,
        "output": given_output,
    }


@then("any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds")
def then_a_surviving_child_is_terminated(adapters: Adapters) -> None:
    ran = adapters.ran[adapters.harness]
    if not adapters.stuck:
        # No child outlived its own work, so nothing needed either signal.
        assert ran.elapsed_seconds < DEADLINE_SECONDS
        return
    hung = adapters.bench.directory / "hung"
    pid = recorded_pid(hung)
    assert pid is not None
    assert not alive(pid)
    assert_term_then_kill(ran, hung, from_call=adapters.harness != OPENCODE)
