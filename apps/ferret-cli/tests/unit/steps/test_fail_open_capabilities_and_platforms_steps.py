"""Unit bindings for the harness capabilities feature, in process with every OS dependency faked.

The harness adapters themselves are script subjects: a POSIX shell script and a TypeScript plugin this Python runner
cannot load in process. Where a scenario's subject is one of them -- the two adapter outlines, FERRET not installed,
and the adapters after an uninstall -- the binding runs the real wrapper, or the real plugin under Node, as the
repository's Script-Subject Unit Proof allows: every ``ferret`` it can reach is a stand-in, its home and search path
are private (see ``support.wrapper.isolate``), nothing opens a network or a store, and each run has a deadline.
"""

import hashlib
import json
from collections import Counter
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.application.initialization import initialize_store
from ferret.application.ports import Budget, CaptureResult, InstalledFacts, Runtime, StagedInstall, StagePlan
from ferret.domain.errors import FerretError
from ferret.domain.event import Event
from ferret.domain.install import (
    ARTIFACT_MODE,
    DIRECTORY_MODE,
    LAUNCHER_MODE,
    MANIFEST_MODE,
    launcher_artifact,
    parse_manifest,
)
from support.fakes import FAKE_HOME, FakeEvents, FakeInstall, FakeMonotonic, World, make_world
from support.hook_payloads import OPENCODE_EMPTY_CALL, WORKSPACE, claude_tool, codex_tool, opencode_call
from support.hook_payloads import encode as encode_payload
from support.invoke import Ran, run_cli, run_runtime
from support.populate import NO_OUTCOME, make_event, world_with
from support.wrapper import (
    DEADLINE_SECONDS,
    Behaviour,
    Isolation,
    WrapperRun,
    alive,
    assert_term_then_kill,
    call_logger,
    isolate,
    logged_calls,
    recorded_pid,
    run_plugin,
    run_wrapper,
    spawn_instants,
    stand_in,
    term_recorder,
    warm,
)

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"


class RecordingInstall(FakeInstall):
    """The fake install area, also noting every path production asks about or changes and every plan it stages."""

    def __init__(self) -> None:
        super().__init__()
        self.targets: list[Path] = []
        self.plans: list[StagePlan] = []

    def facts(self, path: Path) -> InstalledFacts:
        self.targets.append(path)
        return super().facts(path)

    def stage(self, plan: StagePlan) -> StagedInstall:
        self.plans.append(plan)
        return super().stage(plan)

    def remove(self, path: Path) -> None:
        self.targets.append(path)
        super().remove(path)

    def remove_empty_directory(self, path: Path) -> None:
        self.targets.append(path)
        super().remove_empty_directory(path)


def recording_world(*events: Event) -> tuple[World, RecordingInstall]:
    installer = RecordingInstall()
    world = make_world(installer=installer)
    initialize_store(world.runtime)
    world.events.stored.extend(events)
    return world, installer


@dataclass(slots=True)
class Session:
    """A fake machine whose install area records what production asks of it, and what each command printed."""

    world: World
    installer: RecordingInstall
    directory: Path
    ran: Ran | None = None
    bystanders: dict[str, tuple[str, int, bytes | str | None]] = field(
        default_factory=lambda: dict[str, tuple[str, int, bytes | str | None]]()
    )
    data_before: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())
    creates_before: int = 0
    captures_before: int = 0


@pytest.fixture
def session(tmp_path: Path) -> Session:
    world, installer = recording_world(make_event(1))
    return Session(world=world, installer=installer, directory=tmp_path)


# Count skill invocations the harness could not name: the real ``usage`` command over events a harness adapter can
# produce. A Claude Code ``Skill`` call whose input names no valid skill maps to a skill event whose subject is unknown.
HARNESS = "claude_code"
SKILL_CALLS: tuple[tuple[str, str | None], ...] = (
    (HARNESS, "tdd"),
    (HARNESS, None),
    (HARNESS, "tdd"),
    (HARNESS, "review"),
    (HARNESS, None),
    ("opencode", "deploy"),
)


def skill_event(number: int, harness: str, skill: str | None) -> Event:
    visibility = "observed" if skill is not None else "unknown"
    return make_event(
        number,
        harness=harness,
        eventType="skill.invoked",
        skillName=skill,
        toolName=None,
        subjectVisibility=visibility,
        **NO_OUTCOME,
    )


def usage_rows(session: Session) -> dict[str | None, dict[str, Any]]:
    assert session.ran is not None
    assert (session.ran.code, session.ran.stderr) == (0, "")
    rows = json.loads(session.ran.stdout)["rows"]
    by_skill = {row["dimensions"][0]["value"]: row for row in rows}
    assert len(by_skill) == len(rows)
    return by_skill


@scenario(FEATURE, "Count skill invocations the harness could not name as unknown, not as zero usage")
def test_count_unnamed_skill_invocations_as_unknown() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a harness recorded skill invocations, some of which it could not name")
def given_skill_invocations_some_unnamed(session: Session) -> None:
    events = [skill_event(number, harness, skill) for number, (harness, skill) in enumerate(SKILL_CALLS, start=1)]
    session.world, session.installer = recording_world(*events)


@when("the user requests usage grouped by skill for that harness")
def when_usage_is_grouped_by_skill(session: Session) -> None:
    session.ran = run_cli(session.world, ["usage", "--group-by", "skill", "--harness", HARNESS, "--all-time", "--json"])


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
    invoked = {skill for harness, skill in SKILL_CALLS if harness == HARNESS}
    assert set(rows) == invoked
    assert "deploy" not in rows
    assert all(row["eventCount"] > 0 for row in rows.values())


@then("the result states that unknown subject visibility is not zero usage")
def then_the_result_states_unknown_is_not_zero(session: Session) -> None:
    assert session.ran is not None
    interpretation = json.loads(session.ran.stdout)["interpretation"]
    assert interpretation == "Operational usage only; unknown subject visibility is not zero usage."


STARTUP_FILES = {
    ".zshrc": b"export EDITOR=vi\n",
    ".bashrc": b"# bash startup\n",
    ".profile": b"# login shell\n",
}
HARNESS_FILES = {
    ".claude/settings.json": b'{"hooks":{"PostToolUse":[{"command":".claude/hooks/ferret-capture.sh"}]}}\n',
    ".codex/hooks.json": b'{"hooks":{"PostToolUse":[{"command":".claude/hooks/ferret-capture.sh"}]}}\n',
    ".config/opencode/plugins/ferret.ts": b"export const Ferret = async () => ({})\n",
}


def install(session: Session) -> Ran:
    return run_cli(session.world, ["self", "install", "--target", "user", "--json"])


def objects_by_name(session: Session, names: dict[str, bytes]) -> dict[str, tuple[str, int, bytes | str | None]]:
    snapshot = session.installer.snapshot()
    return {name: snapshot[str(FAKE_HOME / name)] for name in names}


def only_ferret_paths(installer: RecordingInstall) -> bool:
    """Whether every path production asked about or changed lies in the two directories the install owns."""
    paths = installer.paths
    return all(path.is_relative_to(paths.share) or path.is_relative_to(paths.bin) for path in installer.targets)


@scenario(FEATURE, "Install privately for the current user")
def test_install_privately_for_the_current_user() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("a supported environment with no FERRET artifact installed where {situation}"))
def given_no_artifact_installed(session: Session, situation: str) -> None:
    installer = session.installer
    installer.path_variable = "/usr/bin:" + (str(installer.paths.bin) if "already on PATH" in situation else "/bin")
    for name, content in STARTUP_FILES.items():
        installer.put_file(FAKE_HOME / name, content, 0o644)
    session.bystanders = objects_by_name(session, STARTUP_FILES)
    assert not any(path.is_relative_to(installer.paths.share) for path in installer.nodes)
    assert installer.facts(installer.paths.launcher).kind == "missing"


@when("the user runs self install --target user")
def when_install_runs(session: Session) -> None:
    session.installer.targets.clear()
    session.ran = install(session)


@then("the artifact, launcher, and manifest are created with owner-only access")
def then_objects_are_owner_only(session: Session) -> None:
    assert session.ran is not None
    document = json.loads(session.ran.stdout)
    assert (session.ran.code, session.ran.stderr, document["result"]) == (0, "", "installed")
    installer = session.installer
    paths = installer.paths
    artifact = paths.artifact(document["version"])
    # The application decides what is written and in which order: everything staged first, the manifest last.
    assert installer.steps == ["recover", "stage", "replace_artifact", "replace_launcher", "replace_manifest"]
    [plan] = installer.plans
    assert launcher_artifact(plan.launcher, paths) == artifact
    manifest = parse_manifest(plan.manifest, paths)
    assert (manifest.artifact_path, manifest.artifact_sha256) == (
        artifact,
        hashlib.sha256(installer.artifact).hexdigest(),
    )
    # The staging port carries no mode: the POSIX adapter writes each object with the domain's install modes, and
    # the fake stands in for it with the same ones. So Unit pins those modes to the literal owner-only contract, and
    # Integration and E2E read the modes a real install leaves on disk.
    assert (DIRECTORY_MODE, ARTIFACT_MODE, LAUNCHER_MODE, MANIFEST_MODE) == (0o700, 0o700, 0o700, 0o600)
    modes = {
        name: installer.facts(path).mode
        for name, path in {
            "share": paths.share,
            "version": paths.version_directory(document["version"]),
            "artifact": artifact,
            "launcher": paths.launcher,
            "manifest": paths.manifest,
        }.items()
    }
    assert modes == {"share": 0o700, "version": 0o700, "artifact": 0o700, "launcher": 0o700, "manifest": 0o600}


@then(parsers.parse("the command reports path action {path_action}"))
def then_the_path_action_is_reported(session: Session, path_action: str) -> None:
    assert session.ran is not None
    assert json.loads(session.ran.stdout)["pathAction"] == path_action


@then("no shell startup file and no machine-wide PATH are modified")
def then_no_startup_file_or_path_is_modified(session: Session) -> None:
    installer = session.installer
    assert objects_by_name(session, STARTUP_FILES) == session.bystanders
    # No call production made through the install port named a startup file, or anything else outside the two
    # directories the contract names; the port has no way to change PATH at all.
    assert installer.targets
    assert only_ferret_paths(installer)
    created = {path for path in installer.nodes if path.name not in STARTUP_FILES}
    assert all(
        path.is_relative_to(installer.paths.share) or path.is_relative_to(installer.paths.bin) for path in created
    )


# Remove FERRET: uninstall runs in process over the fake install area, and the adapters are script subjects, so each
# moment's layout is written onto a private home with a stand-in ``ferret`` wherever a launcher stands. Before the
# uninstall every real adapter finds that launcher and calls it once; after it, none can find one.
ADAPTER_EVENTS = {"claude_code": "tool.completed", "codex": "tool.completed", "opencode": "tool.started"}
EXPECTED_CALLS = [f"capture-hook --harness {harness} --event {event}" for harness, event in ADAPTER_EVENTS.items()]


def run_every_adapter(isolation: Isolation) -> dict[str, WrapperRun]:
    """Each real harness adapter, run as its harness runs it with no FERRET_BIN, in the isolation's home and path."""
    home, path = isolation.home, isolation.path
    payloads = {
        "claude_code": encode_payload(claude_tool("PostToolUse", duration_ms=5)),
        "codex": encode_payload(codex_tool("PostToolUse")),
    }
    ran = {
        harness: run_wrapper(harness, ADAPTER_EVENTS[harness], payload, home=home, binary=None, path=path, cwd=home)
        for harness, payload in payloads.items()
    }
    ran["opencode"] = run_plugin(
        [opencode_call("tool.execute.before")], home=home, binary=None, directory=Path(WORKSPACE), path=path, cwd=home
    )
    return ran


def assert_silent_in_time(ran: dict[str, WrapperRun]) -> None:
    """Every adapter exited zero, wrote to neither stream, and returned by the 1,000 ms deadline."""
    assert set(ran) == set(ADAPTER_EVENTS)
    for harness, run in ran.items():
        assert (run.code, run.stdout, run.stderr) == (0, b"", b""), harness
        assert run.elapsed_seconds < DEADLINE_SECONDS, (harness, run)


def home_tree(home: Path) -> dict[str, bytes | None]:
    """Every path below ``home``, with a file's bytes; directories map to ``None``."""
    return {
        str(path.relative_to(home)): None if path.is_dir() else path.read_bytes() for path in sorted(home.rglob("*"))
    }


def materialize(installer: RecordingInstall, home: Path, launcher: bytes) -> None:
    """Write the fake install area's current objects onto ``home``, with ``launcher`` in place of the launcher's text.

    The launcher the application wrote would start the real artifact; a Unit binding may start only a stand-in.
    """
    for path, node in sorted(installer.nodes.items()):
        assert path.is_relative_to(FAKE_HOME), path
        target = home / path.relative_to(FAKE_HOME)
        target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if node.kind == "directory":
            target.mkdir(exist_ok=True)
        elif node.kind == "symlink":
            assert node.target is not None
            target.symlink_to(node.target)
            continue
        else:
            target.write_bytes(launcher if path == installer.paths.launcher else node.content)
        target.chmod(node.mode)
    if installer.facts(installer.paths.launcher).kind == "file":
        warm(home / installer.paths.launcher.relative_to(FAKE_HOME))


@scenario(FEATURE, "Remove FERRET without changing harness behaviour")
def test_remove_ferret_without_changing_harness_behaviour() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("supported harness adapters are configured to call FERRET")
def given_harness_adapters_call_ferret(session: Session) -> None:
    installer = session.installer
    assert install(session).code == 0
    for name, content in HARNESS_FILES.items():
        installer.put_file(FAKE_HOME / name, content, 0o644)
    session.bystanders = objects_by_name(session, HARNESS_FILES)
    world = session.world
    session.data_before = {name: entry.content for name, entry in world.files.files.items()}
    session.creates_before = len(world.files.creates)
    session.captures_before = world.events.captures
    assert installer.facts(installer.paths.launcher).kind == "file"
    installed = isolate(session.directory / "installed")
    materialize(installer, installed.home, call_logger(session.directory / "calls"))
    assert_silent_in_time(run_every_adapter(installed))
    assert logged_calls(session.directory / "calls") == EXPECTED_CALLS


@when("the user runs self uninstall")
def when_ferret_is_removed(session: Session) -> None:
    session.installer.targets.clear()
    session.ran = run_cli(session.world, ["self", "uninstall", "--json"])


@then("every harness adapter still exits zero without writing to either stream or capturing an event")
def then_every_adapter_still_exits_zero(session: Session) -> None:
    assert session.ran is not None
    document = json.loads(session.ran.stdout)
    installer = session.installer
    assert (session.ran.code, session.ran.stderr, document["result"]) == (0, "", "uninstalled")
    assert objects_by_name(session, HARNESS_FILES) == session.bystanders
    # The layout uninstall left, run by the same real adapters: each still exits zero in time and silently, and none
    # calls a ferret, because no launcher is left to stand one in for.
    uninstalled = isolate(session.directory / "uninstalled")
    materialize(installer, uninstalled.home, call_logger(session.directory / "calls"))
    layout = home_tree(uninstalled.home)
    assert_silent_in_time(run_every_adapter(uninstalled))
    assert logged_calls(session.directory / "calls") == EXPECTED_CALLS
    assert home_tree(uninstalled.home) == layout
    assert uninstalled.reaches_no_ferret()
    assert session.world.events.captures == session.captures_before


@then("the repository contains no newly generated telemetry data")
def then_the_repository_holds_no_new_telemetry(session: Session) -> None:
    world = session.world
    # Uninstall created nothing in the data home and touched no path outside the install area it owns.
    assert len(world.files.creates) == session.creates_before
    assert {name: entry.content for name, entry in world.files.files.items()} == session.data_before
    assert session.installer.targets
    assert only_ferret_paths(session.installer)


@then("the existing user database remains recoverable or removable by an explicit user action")
def then_the_database_is_recoverable_or_removable(session: Session) -> None:
    world = session.world
    assert {name: entry.content for name, entry in world.files.files.items()} == session.data_before
    assert len(world.events.stored) == 1
    purged = run_cli(world, ["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (purged.code, purged.stderr, json.loads(purged.stdout)["dataAction"]) == (0, "", "deleted")
    assert (world.files.purges, world.files.files) == (1, {})


# Keep a harness fail-open after a local failure: the adapter is the capture-hook command, run over fakes.
ADAPTER_ARGUMENTS = ["capture-hook", "--harness", "claude_code", "--event", "tool.completed"]
TRUNCATED_METADATA = b'{"session_id":"native-session-0001","hook_event_name":'


@dataclass(slots=True)
class BrokenEvents(FakeEvents):
    """An event repository whose every capture fails the way a real storage fault does.

    With ``monotonic`` set it first waits out the budget it was handed, on that fake clock, the way the real repository
    waits for a write lock a concurrent writer never releases.
    """

    failure: FerretError = field(default_factory=lambda: FerretError("ferret.storage.unavailable"))
    monotonic: FakeMonotonic | None = None
    budgets: list[Budget | None] = field(default_factory=lambda: list[Budget | None]())

    def capture(self, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        self.budgets.append(budget)
        if self.monotonic is not None and budget is not None:
            self.monotonic.advance(budget.remaining_ms() + 1)
        raise self.failure


@dataclass(slots=True)
class Adapter:
    """The fake machine an adapter call runs on, the runtime it is given, and what the call produced.

    With no FERRET installed there is no command to run in process: the subject is then each real harness adapter,
    run in ``isolation``, and ``processes`` holds what each did.
    """

    directory: Path
    world: World = field(default_factory=lambda: world_with())
    broken: BrokenEvents | None = None
    expected_codes: list[str] = field(default_factory=lambda: list[str]())
    ran: Ran | None = None
    elapsed_ms: float = 0.0
    isolation: Isolation | None = None
    processes: dict[str, WrapperRun] = field(default_factory=lambda: dict[str, WrapperRun]())

    @property
    def runtime(self) -> Runtime:
        return self.world.runtime if self.broken is None else replace(self.world.runtime, events=self.broken)


@pytest.fixture
def adapter(tmp_path: Path) -> Adapter:
    return Adapter(directory=tmp_path)


@scenario(FEATURE, "Keep a harness fail-open after a local failure")
def test_keep_a_harness_fail_open_after_a_local_failure() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("a harness invokes the FERRET adapter")
def given_a_harness_invokes_the_adapter(adapter: Adapter) -> None:
    adapter.world.input.data = encode_payload(claude_tool("PostToolUse", duration_ms=5))


@given(parsers.parse("FERRET is {condition}"))
def given_ferret_is_in_a_condition(adapter: Adapter, condition: str) -> None:
    if condition == "not installed":
        # No FERRET_BIN, an empty private home, and a search path holding no ferret: the executable is truly missing.
        adapter.isolation = isolate(adapter.directory)
    elif condition == "given invalid metadata":
        adapter.world.input.data = TRUNCATED_METADATA
        adapter.expected_codes = ["ferret.event.invalid"]
    elif condition == "unable to open SQLite":
        # What the real repository raises for a database file SQLite cannot read as one.
        adapter.broken = BrokenEvents(failure=FerretError("ferret.storage.integrity-failure"))
        adapter.expected_codes = ["ferret.storage.integrity-failure"]
    else:
        assert condition == "blocked by a concurrent writer beyond the timeout", condition
        adapter.broken = BrokenEvents(
            failure=FerretError("ferret.storage.unavailable", retryable=True), monotonic=adapter.world.monotonic
        )
        adapter.expected_codes = ["ferret.storage.unavailable"]


@when("the adapter handles a lifecycle event")
def when_the_adapter_handles_an_event(adapter: Adapter) -> None:
    if adapter.isolation is not None:
        adapter.processes = run_every_adapter(adapter.isolation)
        return
    monotonic = adapter.world.monotonic
    started = monotonic.now_ns()
    adapter.ran = run_runtime(adapter.runtime, ADAPTER_ARGUMENTS)
    adapter.elapsed_ms = (monotonic.now_ns() - started) / 1_000_000


@then("the adapter returns exit code zero within 1000 milliseconds")
def then_the_adapter_returns_zero_in_time(adapter: Adapter) -> None:
    if adapter.isolation is not None:
        # Real processes, so real time: each adapter gave up on the missing executable well inside its deadline.
        assert set(adapter.processes) == set(ADAPTER_EVENTS)
        assert all(run.code == 0 and run.elapsed_seconds < DEADLINE_SECONDS for run in adapter.processes.values())
        return
    assert adapter.ran is not None
    assert adapter.ran.code == 0
    # Time here is the fake monotonic clock: only a wait production itself makes can move it.
    assert adapter.elapsed_ms < 1000
    if adapter.broken is not None and adapter.broken.monotonic is not None:
        [budget] = adapter.broken.budgets
        assert budget is not None
        assert budget.limit_ns <= 250 * 1_000_000
        assert budget.spent()
        assert adapter.elapsed_ms > budget.limit_ns / 1_000_000


@then("it writes no output into the harness conversation")
def then_the_adapter_writes_no_output(adapter: Adapter) -> None:
    if adapter.isolation is not None:
        assert all((run.stdout, run.stderr) == (b"", b"") for run in adapter.processes.values())
        # Nothing was created in the home either: no data home, no failure record, no launcher.
        assert home_tree(adapter.isolation.home) == {}
        assert adapter.isolation.reaches_no_ferret()
        return
    assert adapter.ran is not None
    assert (adapter.ran.stdout, adapter.ran.stderr) == ("", "")
    assert adapter.world.events.stored == []
    # The failure is written down through the hook-failure port, as its closed code and nothing else.
    assert adapter.world.hook_failures.codes() == adapter.expected_codes
    if adapter.broken is not None:
        assert len(adapter.broken.budgets) == 1
    if adapter.world.files.directory is None:
        # A machine with no data home is left without one.
        assert adapter.world.files.creates == []


# Keep one POSIX adapter fail-open at the wrapper boundary, and the OpenCode plugin at its own: each real adapter in
# front of a stand-in ferret that records what it was given, inside an isolation whose home stays empty.
CONTENT_PAYLOAD = encode_payload(
    codex_tool("PostToolUse", tool_response={"output": "raw output the wrapper never reads"})
)
RAW_BYTES = b'{"hook_event_name":"PostToolUse","note":"caf\xc3\xa9\r\n\t"}\x00\xff'


@dataclass(slots=True)
class Wrapping:
    """One adapter invocation: the harness, the stand-in behind it, and what the adapter did."""

    isolation: Isolation
    plugin: bool = False
    harness: str = ""
    event: str = "tool.completed"
    payload: bytes = b""
    call: dict[str, Any] = field(default_factory=lambda: dict[str, Any]())
    behaviour: Behaviour | None = "record"
    hangs: bool = False
    ran: WrapperRun | None = None

    @property
    def fakes(self) -> Path:
        return self.isolation.fakes

    @property
    def spawn_log(self) -> Path:
        """Where the plugin driver notes each instant the plugin spawned a child."""
        return self.fakes / "spawned"

    def invoke(self) -> None:
        if self.hangs:
            binary: Path | None = term_recorder(self.fakes)
        else:
            binary = None if self.behaviour is None else stand_in(self.fakes, self.behaviour)
        home, path = self.isolation.home, self.isolation.path
        if self.plugin:
            self.ran = run_plugin(
                [self.call],
                home=home,
                binary=binary,
                directory=Path(WORKSPACE),
                path=path,
                cwd=home,
                spawn_log=self.spawn_log,
            )
        else:
            self.ran = run_wrapper(
                self.harness, self.event, self.payload, home=home, binary=binary, path=path, cwd=home
            )

    def received(self) -> tuple[list[str], bytes]:
        """The arguments and standard input the stand-in was started with."""
        return (self.fakes / "argv").read_text().split("\n")[:-1], (self.fakes / "stdin").read_bytes()


@pytest.fixture
def wrapping(tmp_path: Path) -> Wrapping:
    return Wrapping(isolation=isolate(tmp_path))


@scenario(FEATURE, "Keep one POSIX adapter fail-open at the wrapper boundary")
def test_keep_one_posix_adapter_fail_open_at_the_wrapper_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@scenario(FEATURE, "Keep the OpenCode plugin fail-open at its process boundary")
def test_keep_the_opencode_plugin_fail_open_at_its_process_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the {harness} hook runs the shared POSIX wrapper"))
def given_a_hook_runs_the_wrapper(wrapping: Wrapping, harness: str) -> None:
    wrapping.harness = harness
    wrapping.payload = CONTENT_PAYLOAD


@given("OpenCode runs the FERRET plugin for a lifecycle hook")
def given_opencode_runs_the_plugin(wrapping: Wrapping) -> None:
    wrapping.plugin = True
    wrapping.harness = "opencode"
    wrapping.event = "tool.started"
    wrapping.call = opencode_call("tool.execute.before")


@when("stdin is forwarded byte-for-byte for a supported event")
def when_stdin_is_forwarded(wrapping: Wrapping) -> None:
    wrapping.payload = RAW_BYTES
    wrapping.invoke()


@when("the event is not one FERRET registers")
def when_the_event_is_not_registered(wrapping: Wrapping) -> None:
    wrapping.event = "notification.sent"
    wrapping.invoke()


@when("the payload carries raw content fields")
def when_the_payload_carries_content(wrapping: Wrapping) -> None:
    wrapping.invoke()


@when("the ferret executable is missing")
def when_the_executable_is_missing(wrapping: Wrapping) -> None:
    wrapping.behaviour = None
    wrapping.invoke()


@when("the plugin forwards an invalid payload")
def when_the_plugin_forwards_an_invalid_payload(wrapping: Wrapping) -> None:
    wrapping.call = OPENCODE_EMPTY_CALL
    wrapping.invoke()


@when("the child process hangs past the deadline")
def when_the_child_hangs(wrapping: Wrapping) -> None:
    wrapping.hangs = True
    wrapping.invoke()


@then("the wrapper exits zero and writes nothing to either stream")
def then_the_wrapper_is_silent(wrapping: Wrapping) -> None:
    assert wrapping.ran is not None
    assert (wrapping.ran.code, wrapping.ran.stdout, wrapping.ran.stderr) == (0, b"", b"")
    assert home_tree(wrapping.isolation.home) == {}
    if wrapping.behaviour is None:
        # With no executable anywhere it could look, the wrapper started nothing.
        assert wrapping.isolation.reaches_no_ferret()
        assert recorded_pid(wrapping.fakes) is None
    else:
        # Whatever the wrapper was given reached the child untouched, under the two static registration arguments.
        arguments, stdin = wrapping.received()
        assert stdin == wrapping.payload
        assert arguments == ["capture-hook", "--harness", wrapping.harness, "--event", wrapping.event]


@then("the plugin completes the hook without an error and writes nothing to either stream")
def then_the_plugin_is_silent(wrapping: Wrapping) -> None:
    assert wrapping.ran is not None
    assert (wrapping.ran.code, wrapping.ran.stdout, wrapping.ran.stderr) == (0, b"", b"")
    assert home_tree(wrapping.isolation.home) == {}
    # The plugin forwarded the hook as one JSON document, whatever it held, under its static registration arguments.
    arguments, stdin = wrapping.received()
    assert arguments == ["capture-hook", "--harness", "opencode", "--event", "tool.started"]
    [given_input, given_output] = wrapping.call["args"]
    assert json.loads(stdin) == {
        "hook": "tool.execute.before",
        "directory": WORKSPACE,
        "input": given_input,
        "output": given_output,
    }


@then("any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds")
def then_a_surviving_child_is_terminated(wrapping: Wrapping) -> None:
    assert wrapping.ran is not None
    pid = recorded_pid(wrapping.fakes)
    if pid is not None:
        assert not alive(pid)
    if not wrapping.hangs:
        # No child outlived its own work, so nothing needed either signal.
        assert wrapping.ran.elapsed_seconds < DEADLINE_SECONDS
        return
    spawned = spawn_instants(wrapping.spawn_log) if wrapping.plugin else [None]
    assert len(spawned) == 1, spawned
    assert_term_then_kill(wrapping.ran, wrapping.fakes, spawned=spawned[0])
