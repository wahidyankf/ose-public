"""Integration bindings for the harness capabilities feature: a real HOME, real SQLite, and the real adapters.

The adapters are the shared POSIX wrapper that Claude Code and Codex run, and the OpenCode plugin run under Node, each
in front of this working tree's CLI or of a stand-in that records what it was given.
"""

import hashlib
import hmac
import json
import os
import sqlite3
import stat
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.domain.event import Event
from ferret.domain.install import LAUNCHER_MODE, InstallPaths, launcher_artifact
from support.artifacts import write_test_artifact
from support.hook_payloads import CANARIES, OPENCODE_EMPTY_CALL, WORKSPACE, claude_tool, codex_tool, opencode_call
from support.hook_payloads import encode as encode_payload
from support.invoke import Ran
from support.machine import Machine, make_machine
from support.populate import NO_OUTCOME, make_event
from support.wrapper import (
    DEADLINE_SECONDS,
    WrapperRun,
    alive,
    assert_term_then_kill,
    in_tree,
    in_tree_artifact,
    recorded_pid,
    run_plugin,
    run_wrapper,
    stand_in,
    term_recorder,
)

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"
HOOK_FAILURES = "hook-failures.log"


def recorded_failures(data_home: Path) -> list[str]:
    """The closed codes in the data home's hook-failure record, oldest first; none when there is no record."""
    record = data_home / HOOK_FAILURES
    if not record.exists():
        return []
    return [line.split("\t")[1] for line in record.read_text(encoding="utf-8").splitlines() if line]


def tree(directory: Path) -> dict[str, bytes]:
    """Every file under ``directory`` and its bytes, so two moments can be compared whole."""
    return {str(path.relative_to(directory)): path.read_bytes() for path in directory.rglob("*") if path.is_file()}


def store_files(data_home: Path) -> dict[str, bytes]:
    """The store's own files in a data home it shares with an install: everything but the manifest and the versions."""
    return {name: content for name, content in tree(data_home).items() if "/" not in name and name != "install.json"}


# Count skill invocations the harness could not name: the real ``usage`` command over a real store. A Claude Code
# ``Skill`` call whose input names no valid skill is stored as a skill event whose subject is unknown.
HARNESS = "claude_code"
SKILL_CALLS: tuple[tuple[str, str | None], ...] = (
    (HARNESS, "tdd"),
    (HARNESS, None),
    (HARNESS, "tdd"),
    (HARNESS, "review"),
    (HARNESS, None),
    ("opencode", "deploy"),
)


@dataclass(slots=True)
class Usage:
    """A real store holding the harness's events, and the ``usage`` answer read from it."""

    machine: Machine
    ran: Ran | None = None

    def rows(self) -> dict[str | None, dict[str, Any]]:
        assert self.ran is not None
        assert (self.ran.code, self.ran.stderr) == (0, "")
        rows = json.loads(self.ran.stdout)["rows"]
        by_skill = {row["dimensions"][0]["value"]: row for row in rows}
        assert len(by_skill) == len(rows)
        return by_skill


@pytest.fixture
def usage(tmp_path: Path) -> Usage:
    return Usage(machine=make_machine(tmp_path))


def skill_event(number: int, harness: str, skill: str | None, now: datetime) -> Event:
    return make_event(
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


@scenario(FEATURE, "Count skill invocations the harness could not name as unknown, not as zero usage")
def test_count_unnamed_skill_invocations_as_unknown() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a harness recorded skill invocations, some of which it could not name")
def given_skill_invocations_some_unnamed(usage: Usage) -> None:
    now = datetime.now(UTC)
    usage.machine.fill(
        skill_event(number, harness, skill, now) for number, (harness, skill) in enumerate(SKILL_CALLS, start=1)
    )
    assert usage.machine.sql("SELECT COUNT(*) FROM event") == [(len(SKILL_CALLS),)]


@when("the user requests usage grouped by skill for that harness")
def when_usage_is_grouped_by_skill(usage: Usage) -> None:
    usage.ran = usage.machine.run(["usage", "--group-by", "skill", "--harness", HARNESS, "--all-time", "--json"])


@then("each named skill is counted as observed usage")
def then_named_skills_are_observed(usage: Usage) -> None:
    named = Counter(skill for harness, skill in SKILL_CALLS if harness == HARNESS and skill is not None)
    rows = usage.rows()
    for skill, count in named.items():
        row = rows[skill]
        assert (row["eventCount"], row["observedSubjectCount"], row["unknownSubjectCount"]) == (count, count, 0)


@then("the unnamed invocations are counted as unknown subjects in a group of their own")
def then_unnamed_invocations_are_unknown(usage: Usage) -> None:
    unnamed = sum(1 for harness, skill in SKILL_CALLS if harness == HARNESS and skill is None)
    row = usage.rows()[None]
    assert (row["eventCount"], row["unknownSubjectCount"]) == (unnamed, unnamed)
    assert (row["observedSubjectCount"], row["derivedSubjectCount"]) == (0, 0)


@then("no skill the harness never invoked is reported with a zero count")
def then_no_zero_is_fabricated(usage: Usage) -> None:
    rows = usage.rows()
    assert set(rows) == {skill for harness, skill in SKILL_CALLS if harness == HARNESS}
    assert "deploy" not in rows
    assert all(row["eventCount"] > 0 for row in rows.values())


@then("the result states that unknown subject visibility is not zero usage")
def then_the_result_states_unknown_is_not_zero(usage: Usage) -> None:
    assert usage.ran is not None
    interpretation = json.loads(usage.ran.stdout)["interpretation"]
    assert interpretation == "Operational usage only; unknown subject visibility is not zero usage."


STARTUP_FILES = {".zshrc": b"export EDITOR=vi\n", ".bashrc": b"# bash startup\n", ".profile": b"# login shell\n"}
HARNESS_FILES = {
    ".claude/settings.json": b'{"hooks":{"PostToolUse":[{"command":".claude/hooks/ferret-capture.sh"}]}}\n',
    ".codex/hooks.json": b'{"hooks":{"PostToolUse":[{"command":".claude/hooks/ferret-capture.sh"}]}}\n',
    ".config/opencode/plugins/ferret.ts": b"export const Ferret = async () => ({})\n",
}


@dataclass(slots=True)
class Installation:
    """A real HOME with a real artifact file to install, the files around it, and what each command printed."""

    machine: Machine
    source: Path
    source_sha256: str
    repository: Path
    ran: Ran | None = None
    startup: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())
    database_before: bytes = b""
    data_before: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())
    rows_before: int = 0
    adapters: dict[str, WrapperRun] = field(default_factory=lambda: dict[str, WrapperRun]())


@pytest.fixture
def installation(tmp_path: Path) -> Installation:
    source = tmp_path / "dist" / "ferret.pyz"
    digest = write_test_artifact(source)
    repository = tmp_path / "repository"
    repository.mkdir()
    return Installation(
        machine=make_machine(tmp_path, artifact=source),
        source=source,
        source_sha256=digest,
        repository=repository,
    )


def home_names(installation: Installation) -> set[str]:
    return {path.name for path in installation.machine.home.iterdir()}


def user_files(installation: Installation, names: dict[str, bytes]) -> dict[str, bytes]:
    return {name: (installation.machine.home / name).read_bytes() for name in names}


@scenario(FEATURE, "Install privately for the current user")
def test_install_privately_for_the_current_user() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("a supported environment with no FERRET artifact installed where {situation}"))
def given_no_artifact_installed(installation: Installation, situation: str) -> None:
    home = installation.machine.home
    path = f"/usr/bin:{home / '.local' / 'bin'}" if "already on PATH" in situation else "/usr/bin:/bin"
    installation.machine = replace(installation.machine, path=path)
    for name, content in STARTUP_FILES.items():
        (home / name).write_bytes(content)
    installation.startup = user_files(installation, STARTUP_FILES)
    # The data home and the install area share `.local/share/ferret`, and the store is already there, so what makes
    # this "not installed" is that no launcher, no manifest, and no version directory exist.
    paths = InstallPaths(home)
    assert not os.path.lexists(paths.bin)
    assert not os.path.lexists(paths.manifest)
    assert [path for path in paths.share.iterdir() if path.is_dir()] == []


@when("the user runs self install --target user")
def when_install_runs(installation: Installation) -> None:
    installation.ran = installation.machine.run(["self", "install", "--target", "user", "--json"])


@then("the artifact, launcher, and manifest are created with owner-only access")
def then_objects_are_owner_only(installation: Installation) -> None:
    assert installation.ran is not None
    document = json.loads(installation.ran.stdout)
    assert (installation.ran.code, installation.ran.stderr, document["result"]) == (0, "", "installed")
    home = installation.machine.home
    share = home / ".local" / "share" / "ferret"
    artifact = Path(document["artifactPath"])
    launcher = Path(document["launcherPath"])
    manifest = Path(document["manifestPath"])
    assert (artifact, launcher, manifest) == (
        share / document["version"] / "ferret.pyz",
        home / ".local" / "bin" / "ferret",
        share / "install.json",
    )
    modes = {path.name: stat.S_IMODE(os.lstat(path).st_mode) for path in (share, artifact.parent, artifact, manifest)}
    assert modes == {"ferret": 0o700, document["version"]: 0o700, "ferret.pyz": 0o700, "install.json": 0o600}
    assert stat.S_IMODE(os.lstat(launcher.parent).st_mode) == 0o700
    assert (launcher.is_symlink(), stat.S_IMODE(os.lstat(launcher).st_mode)) == (False, LAUNCHER_MODE)
    assert launcher_artifact(launcher.read_bytes(), InstallPaths(home)) == artifact
    assert artifact.read_bytes() == installation.source.read_bytes()
    assert {os.lstat(path).st_uid for path in (share, artifact, launcher, manifest)} == {os.geteuid()}
    recorded = json.loads(manifest.read_text(encoding="utf-8"))
    assert recorded["artifactSha256"] == installation.source_sha256 == hashlib.sha256(artifact.read_bytes()).hexdigest()


@then(parsers.parse("the command reports path action {path_action}"))
def then_the_path_action_is_reported(installation: Installation, path_action: str) -> None:
    assert installation.ran is not None
    assert json.loads(installation.ran.stdout)["pathAction"] == path_action


@then("no shell startup file and no machine-wide PATH are modified")
def then_no_startup_file_or_path_is_modified(installation: Installation) -> None:
    home = installation.machine.home
    assert user_files(installation, STARTUP_FILES) == installation.startup
    assert home_names(installation) == {".local", *STARTUP_FILES}
    assert {path.name for path in (home / ".local").iterdir()} == {"bin", "share"}
    assert {path.name for path in (home / ".local" / "bin").iterdir()} == {"ferret"}


# Remove FERRET: the installed artifact is a working FERRET over this working tree, so before the uninstall each real
# adapter, finding it through PATH as a harness does, captures one event.
ADAPTER_EVENTS = {"claude_code": "tool.completed", "codex": "tool.completed", "opencode": "tool.started"}


def run_every_adapter(installation: Installation) -> dict[str, WrapperRun]:
    """Each harness's real adapter, run the way its harness runs it: no FERRET_BIN, the user's bin on PATH."""
    home = installation.machine.home
    path = f"{home / '.local' / 'bin'}:/usr/bin:/bin"
    cwd = installation.repository
    payloads = {
        "claude_code": encode_payload(claude_tool("PostToolUse", duration_ms=5, cwd=str(cwd))),
        "codex": encode_payload(codex_tool("PostToolUse", cwd=str(cwd))),
    }
    ran = {
        harness: run_wrapper(harness, ADAPTER_EVENTS[harness], payload, home=home, binary=None, path=path, cwd=cwd)
        for harness, payload in payloads.items()
    }
    ran["opencode"] = run_plugin(
        [opencode_call("tool.execute.before")], home=home, binary=None, directory=cwd, path=path, cwd=cwd
    )
    return ran


def stored_harnesses(machine: Machine) -> list[str]:
    return [harness for (harness,) in machine.sql("SELECT harness FROM event ORDER BY harness")]


@scenario(FEATURE, "Remove FERRET without changing harness behaviour")
def test_remove_ferret_without_changing_harness_behaviour() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("supported harness adapters are configured to call FERRET")
def given_harness_adapters_call_ferret(installation: Installation, tmp_path: Path) -> None:
    home = installation.machine.home
    installation.machine = replace(
        installation.machine,
        path=f"/usr/bin:{home / '.local' / 'bin'}",
        artifact=in_tree_artifact(tmp_path / "in-tree" / "ferret.pyz"),
    )
    installation.machine.fill([make_event(1, now=datetime.now(UTC))])
    installed = installation.machine.run(["self", "install", "--target", "user", "--json"])
    assert (installed.code, installed.stderr) == (0, "")
    for name, content in HARNESS_FILES.items():
        (home / name).parent.mkdir(parents=True, exist_ok=True)
        (home / name).write_bytes(content)
    installation.startup = user_files(installation, HARNESS_FILES)
    captured = run_every_adapter(installation)
    assert {harness: (ran.code, ran.stdout, ran.stderr) for harness, ran in captured.items()} == dict.fromkeys(
        ADAPTER_EVENTS, (0, b"", b"")
    )
    assert stored_harnesses(installation.machine) == ["claude_code", "claude_code", "codex", "opencode"]
    installation.rows_before = 4
    installation.database_before = installation.machine.database.read_bytes()
    installation.data_before = store_files(installation.machine.data_home)
    assert list(installation.repository.iterdir()) == []


@when("the user runs self uninstall")
def when_ferret_is_removed(installation: Installation) -> None:
    installation.ran = installation.machine.run(["self", "uninstall", "--json"])


@then("every harness adapter still exits zero without writing to either stream or capturing an event")
def then_every_adapter_still_exits_zero(installation: Installation) -> None:
    assert installation.ran is not None
    assert (installation.ran.code, installation.ran.stderr) == (0, "")
    assert json.loads(installation.ran.stdout)["result"] == "uninstalled"
    installation.adapters = run_every_adapter(installation)
    for harness, ran in installation.adapters.items():
        assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b""), harness
        assert ran.elapsed_seconds < DEADLINE_SECONDS, harness
    machine = installation.machine
    assert machine.sql("SELECT COUNT(*) FROM event") == [(installation.rows_before,)]
    assert store_files(machine.data_home) == installation.data_before
    assert user_files(installation, HARNESS_FILES) == installation.startup


@then("the repository contains no newly generated telemetry data")
def then_the_repository_holds_no_new_telemetry(installation: Installation) -> None:
    assert set(installation.adapters) == set(ADAPTER_EVENTS)
    assert list(installation.repository.iterdir()) == []


@then("the existing user database remains recoverable or removable by an explicit user action")
def then_the_database_is_recoverable_or_removable(installation: Installation) -> None:
    machine = installation.machine
    assert machine.database.read_bytes() == installation.database_before
    listing = machine.run(["events", "list", "--json"])
    assert (listing.code, len(json.loads(listing.stdout)["items"])) == (0, installation.rows_before)
    purged = machine.run(["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (purged.code, purged.stderr, json.loads(purged.stdout)["dataAction"]) == (0, "", "deleted")
    assert not machine.data_home.exists()


# Keep a harness fail-open after a local failure, and at each adapter's boundary: the real adapter in front of this
# working tree's real CLI, over a real home directory and a real SQLite store.
TRUNCATED_METADATA = b'{"session_id":"native-session-0001","hook_event_name":'
HOOK_CAPTURE_BUDGET_SECONDS = 0.25


@dataclass(slots=True)
class Adapter:
    """A real initialized home, the adapter's binding to it, and what one adapter invocation did."""

    machine: Machine
    launcher: Path
    directory: Path
    plugin: bool = False
    harness: str = "claude_code"
    event: str = "tool.completed"
    payload: bytes = b""
    call: dict[str, Any] = field(default_factory=lambda: dict[str, Any]())
    binary: Path | None = None
    expected_rows: int = 1
    expected_failures: list[str] = field(default_factory=lambda: list[str]())
    data_before: dict[str, bytes] | None = None
    ran: WrapperRun | None = None
    received: tuple[list[str], bytes] | None = None
    writer: sqlite3.Connection | None = None
    hangs: bool = False


@pytest.fixture
def adapter(tmp_path: Path) -> Iterator[Adapter]:
    machine = make_machine(tmp_path)
    launcher = in_tree(tmp_path)
    binding = Adapter(
        machine=machine,
        launcher=launcher,
        directory=tmp_path,
        payload=encode_payload(claude_tool("PostToolUse", duration_ms=5)),
    )
    binding.binary = launcher
    yield binding
    if binding.writer is not None:
        binding.writer.close()


def invoke(adapter: Adapter, binary: Path | None = None) -> WrapperRun:
    chosen = adapter.binary if binary is None else binary
    home = adapter.machine.home
    if adapter.plugin:
        return run_plugin([adapter.call], home=home, binary=chosen, directory=Path(WORKSPACE))
    return run_wrapper(adapter.harness, adapter.event, adapter.payload, home=home, binary=chosen)


def record_forwarding(adapter: Adapter) -> None:
    """Run the adapter once more against a stand-in that keeps exactly the arguments and bytes it was handed."""
    recording = adapter.directory / "recording"
    recording.mkdir()
    ran = invoke(adapter, stand_in(recording, "record"))
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    adapter.received = ((recording / "argv").read_text().split("\n")[:-1], (recording / "stdin").read_bytes())


def stored_events(adapter: Adapter) -> int:
    return int(adapter.machine.sql("SELECT COUNT(*) FROM event")[0][0])


@scenario(FEATURE, "Keep a harness fail-open after a local failure")
def test_keep_a_harness_fail_open_after_a_local_failure() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("a harness invokes the FERRET adapter")
def given_a_harness_invokes_the_adapter(adapter: Adapter) -> None:
    assert adapter.machine.database.is_file()


@given(parsers.parse("FERRET is {condition}"))
def given_ferret_is_in_a_condition(adapter: Adapter, condition: str) -> None:
    adapter.expected_rows = 0
    if condition == "not installed":
        adapter.binary = None
        adapter.data_before = tree(adapter.machine.data_home)
    elif condition == "given invalid metadata":
        adapter.payload = TRUNCATED_METADATA
        adapter.expected_failures = ["ferret.event.invalid"]
    elif condition == "unable to open SQLite":
        adapter.machine.database.write_bytes(b"this is not a SQLite database" * 64)
        adapter.expected_failures = ["ferret.storage.integrity-failure"]
    else:
        assert condition == "blocked by a concurrent writer beyond the timeout", condition
        adapter.writer = sqlite3.connect(adapter.machine.database, autocommit=True)
        adapter.writer.execute("BEGIN IMMEDIATE")
        adapter.expected_failures = ["ferret.storage.unavailable"]


@when("the adapter handles a lifecycle event")
def when_the_adapter_handles_an_event(adapter: Adapter) -> None:
    adapter.ran = invoke(adapter)


@then("the adapter returns exit code zero within 1000 milliseconds")
def then_the_adapter_returns_zero_in_time(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert adapter.ran.code == 0
    assert adapter.ran.elapsed_seconds < DEADLINE_SECONDS
    if adapter.writer is not None:
        # The capture waited out its whole lock budget before giving up, rather than failing at once.
        assert adapter.ran.elapsed_seconds >= HOOK_CAPTURE_BUDGET_SECONDS


@then("it writes no output into the harness conversation")
def then_the_adapter_writes_no_output(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert (adapter.ran.stdout, adapter.ran.stderr) == (b"", b"")
    if adapter.writer is not None:
        adapter.writer.execute("ROLLBACK")
    if adapter.machine.database.read_bytes().startswith(b"SQLite format 3"):
        assert stored_events(adapter) == 0
    # The cause the condition names is the one the callback wrote down, as a closed code and nothing else.
    assert recorded_failures(adapter.machine.data_home) == adapter.expected_failures
    if adapter.data_before is not None:
        assert tree(adapter.machine.data_home) == adapter.data_before


@scenario(FEATURE, "Keep one POSIX adapter fail-open at the wrapper boundary")
def test_keep_one_posix_adapter_fail_open_at_the_wrapper_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@scenario(FEATURE, "Keep the OpenCode plugin fail-open at its process boundary")
def test_keep_the_opencode_plugin_fail_open_at_its_process_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the {harness} hook runs the shared POSIX wrapper"))
def given_a_hook_runs_the_wrapper(adapter: Adapter, harness: str) -> None:
    adapter.harness = harness
    adapter.payload = b""


@given("OpenCode runs the FERRET plugin for a lifecycle hook")
def given_opencode_runs_the_plugin(adapter: Adapter) -> None:
    adapter.plugin = True
    adapter.harness = "opencode"
    adapter.event = "tool.started"
    adapter.call = opencode_call("tool.execute.before")


@when("stdin is forwarded byte-for-byte for a supported event")
def when_stdin_is_forwarded(adapter: Adapter) -> None:
    # Valid JSON with CRLF line ends, tabs, and non-ASCII text: any re-encoding of these bytes changes the derived IDs.
    adapter.payload = (
        b'{\r\n\t"session_id": "s\xc3\xa9ance-1",\r\n\t"cwd": "/users/example/caf\xc3\xa9",\r\n'
        b'\t"hook_event_name": "PostToolUse",\r\n\t"tool_name": "Read",\r\n\t"duration_ms": 27\r\n}\r\n'
    )
    adapter.ran = invoke(adapter)
    record_forwarding(adapter)


@when("the event is not one FERRET registers")
def when_the_event_is_not_registered(adapter: Adapter) -> None:
    adapter.event = "notification.sent"
    adapter.payload = encode_payload(claude_tool("PostToolUse", duration_ms=5))
    adapter.expected_rows = 0
    adapter.ran = invoke(adapter)


@when("the payload carries raw content fields")
def when_the_payload_carries_content(adapter: Adapter) -> None:
    adapter.payload = encode_payload(
        codex_tool("PostToolUse", tool_response={"output": CANARIES[2]}, prompt=CANARIES[0], env={"K": CANARIES[3]})
    )
    adapter.ran = invoke(adapter)


@when("the ferret executable is missing")
def when_the_executable_is_missing(adapter: Adapter) -> None:
    adapter.binary = None
    adapter.payload = encode_payload(codex_tool("PostToolUse"))
    adapter.expected_rows = 0
    adapter.ran = invoke(adapter)


@when("the plugin forwards an invalid payload")
def when_the_plugin_forwards_an_invalid_payload(adapter: Adapter) -> None:
    adapter.call = OPENCODE_EMPTY_CALL
    adapter.expected_rows = 0
    adapter.ran = invoke(adapter)
    record_forwarding(adapter)


@when("the child process hangs past the deadline")
def when_the_child_hangs(adapter: Adapter) -> None:
    if not adapter.plugin:
        adapter.payload = encode_payload(claude_tool("PostToolUse", duration_ms=5))
    hung = adapter.directory / "hung"
    hung.mkdir()
    adapter.binary = term_recorder(hung)
    adapter.hangs = True
    adapter.expected_rows = 0
    adapter.ran = invoke(adapter)
    adapter.received = ((hung / "argv").read_text().split("\n")[:-1], (hung / "stdin").read_bytes())


@then("the wrapper exits zero and writes nothing to either stream")
def then_the_wrapper_is_silent(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert (adapter.ran.code, adapter.ran.stdout, adapter.ran.stderr) == (0, b"", b"")
    assert stored_events(adapter) == adapter.expected_rows
    if adapter.received is not None:
        # The child got the payload's exact bytes under the two static registration arguments.
        assert adapter.received == (
            ["capture-hook", "--harness", adapter.harness, "--event", adapter.event],
            adapter.payload,
        )
    if adapter.expected_rows:
        [(harness, workspace, native, content)] = adapter.machine.sql(
            "SELECT harness, workspace_id, session_id, tool_name FROM event"
        )
        key = (adapter.machine.data_home / "identity.key").read_bytes()
        assert adapter.harness == harness
        assert content in {"Read", "Bash"}
        if content == "Read":
            expected_workspace = derived(key, "ws", "/users/example/café")
            expected_session = derived(key, "ss", adapter.harness, "séance-1")
            assert (workspace, native) == (expected_workspace, expected_session)
        stored = b"".join(path.read_bytes() for path in adapter.machine.data_home.iterdir())
        assert not any(canary.encode() in stored for canary in CANARIES)


@then("the plugin completes the hook without an error and writes nothing to either stream")
def then_the_plugin_is_silent(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert (adapter.ran.code, adapter.ran.stdout, adapter.ran.stderr) == (0, b"", b"")
    assert stored_events(adapter) == adapter.expected_rows
    # The plugin forwarded the hook as one JSON document, whatever it held, under its static registration arguments.
    assert adapter.received is not None
    arguments, stdin = adapter.received
    assert arguments == ["capture-hook", "--harness", "opencode", "--event", "tool.started"]
    given_input, given_output = adapter.call["args"]
    assert json.loads(stdin) == {
        "hook": "tool.execute.before",
        "directory": WORKSPACE,
        "input": given_input,
        "output": given_output,
    }


@then("any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds")
def then_a_surviving_child_is_terminated(adapter: Adapter) -> None:
    assert adapter.ran is not None
    if not adapter.hangs:
        # No child outlived its own work, so nothing needed either signal.
        assert adapter.ran.elapsed_seconds < DEADLINE_SECONDS
        return
    hung = adapter.directory / "hung"
    pid = recorded_pid(hung)
    assert pid is not None
    assert not alive(pid)
    assert_term_then_kill(adapter.ran, hung, from_call=not adapter.plugin)


def derived(key: bytes, kind: str, *parts: str) -> str:
    """The identifier the contract derives: HMAC-SHA256 over the NUL-joined purpose and parts, first 16 bytes in hex."""
    message = b"\0".join(part.encode("utf-8") for part in ("ferret/id/1", kind, *parts))
    return f"{kind}_{hmac.new(key, message, hashlib.sha256).hexdigest()[:32]}"
