"""Unit bindings for the harness capabilities feature, in process with every OS dependency faked."""

import json
import time
from dataclasses import dataclass, field, replace
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.application.capabilities import DimensionReport, report_dimension
from ferret.application.ports import Budget, CaptureResult, Runtime
from ferret.domain.capability import CapabilitySnapshot, snapshot_from_document
from ferret.domain.errors import FerretError
from ferret.domain.event import Event
from ferret.domain.install import ARTIFACT_MODE, DIRECTORY_MODE, LAUNCHER_MODE, MANIFEST_MODE, launcher_artifact
from support.fakes import FAKE_HOME, FIXED_NOW, FakeEvents, World
from support.hook_payloads import claude_tool, codex_tool
from support.hook_payloads import encode as encode_payload
from support.invoke import Ran, run_cli, run_runtime
from support.populate import make_event, world_with
from support.snapshots import capability, snapshot_document
from support.wrapper import (
    HUNG_SECONDS,
    KILL_MILLISECONDS,
    Behaviour,
    WrapperRun,
    alive,
    recorded_pid,
    run_wrapper,
    stand_in,
)

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"


@dataclass(slots=True)
class Session:
    """The harness's latest capability snapshot and the usage answer computed from it."""

    snapshot: CapabilitySnapshot | None = None
    report: DimensionReport | None = None
    world: World = field(default_factory=lambda: world_with(make_event(1)))
    ran: Ran | None = None
    bystanders: dict[str, tuple[str, int, bytes | str | None]] = field(
        default_factory=lambda: dict[str, tuple[str, int, bytes | str | None]]()
    )
    data_before: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())


@pytest.fixture
def session() -> Session:
    return Session()


@scenario(FEATURE, "Mark an unobservable capability unknown")
def test_mark_an_unobservable_capability_unknown() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the selected harness exposes tool events but no stable skill lifecycle event")
def given_tool_events_without_a_skill_lifecycle(session: Session) -> None:
    session.snapshot = snapshot_from_document(
        snapshot_document(
            capabilities=[
                capability("skill_invocation", "unknown", "unavailable"),
                capability("tool_lifecycle", "observed", "official_hook"),
            ]
        ),
        now=FIXED_NOW,
    )


@when("the user requests usage grouped by skill for that harness")
def when_usage_is_grouped_by_skill(session: Session) -> None:
    session.report = report_dimension(session.snapshot, "skill", recorded=0)


@then("the result marks skill subject visibility as unknown")
def then_skill_visibility_is_unknown(session: Session) -> None:
    assert session.report is not None
    assert (session.report.dimension, session.report.visibility) == ("skill", "unknown")


@then("the result does not report zero skill invocations as an observed fact")
def then_zero_is_not_reported_as_a_fact(session: Session) -> None:
    assert session.report is not None
    assert session.report.observed_count is None


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
REPOSITORY = Path("/work/repository")


def install(session: Session) -> Ran:
    return run_cli(session.world, ["self", "install", "--target", "user", "--json"])


def objects_by_name(session: Session, names: dict[str, bytes]) -> dict[str, tuple[str, int, bytes | str | None]]:
    snapshot = session.world.installer.snapshot()
    return {name: snapshot[str(FAKE_HOME / name)] for name in names}


@scenario(FEATURE, "Install privately for the current user")
def test_install_privately_for_the_current_user() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("a supported environment with no FERRET artifact installed where {situation}"))
def given_no_artifact_installed(session: Session, situation: str) -> None:
    installer = session.world.installer
    installer.path_variable = "/usr/bin:" + (str(installer.paths.bin) if "already on PATH" in situation else "/bin")
    for name, content in STARTUP_FILES.items():
        installer.put_file(FAKE_HOME / name, content, 0o644)
    session.bystanders = objects_by_name(session, STARTUP_FILES)
    assert not any(str(path).startswith(str(installer.paths.share)) for path in installer.nodes)
    assert installer.facts(installer.paths.launcher).kind == "missing"


@when("the user runs self install --target user")
def when_install_runs(session: Session) -> None:
    session.ran = install(session)


@then("the artifact, launcher, and manifest are created with owner-only access")
def then_objects_are_owner_only(session: Session) -> None:
    assert session.ran is not None
    document = json.loads(session.ran.stdout)
    assert (session.ran.code, session.ran.stderr, document["result"]) == (0, "", "installed")
    installer = session.world.installer
    paths = installer.paths
    version_directory = paths.version_directory(document["version"])
    facts = {
        name: installer.facts(path)
        for name, path in {
            "share": paths.share,
            "version": version_directory,
            "artifact": paths.artifact(document["version"]),
            "launcher": paths.launcher,
            "manifest": paths.manifest,
        }.items()
    }
    assert (facts["share"].mode, facts["version"].mode) == (DIRECTORY_MODE, DIRECTORY_MODE)
    assert (facts["artifact"].kind, facts["artifact"].mode) == ("file", ARTIFACT_MODE)
    assert (facts["manifest"].kind, facts["manifest"].mode) == ("file", MANIFEST_MODE)
    assert (facts["launcher"].kind, facts["launcher"].mode) == ("file", LAUNCHER_MODE)
    assert launcher_artifact(installer.read_launcher() or b"", paths) == paths.artifact(document["version"])
    assert all(fact.owned_by_current_user for fact in facts.values())


@then(parsers.parse("the command reports path action {path_action}"))
def then_the_path_action_is_reported(session: Session, path_action: str) -> None:
    assert session.ran is not None
    assert json.loads(session.ran.stdout)["pathAction"] == path_action


@then("no shell startup file and no machine-wide PATH are modified")
def then_no_startup_file_or_path_is_modified(session: Session) -> None:
    installer = session.world.installer
    assert objects_by_name(session, STARTUP_FILES) == session.bystanders
    assert installer.path_variable in ("/usr/bin:/bin", f"/usr/bin:{installer.paths.bin}")
    # Everything the install created lies under the two directories the contract names.
    created = {path for path in installer.nodes if path.name not in STARTUP_FILES}
    assert all(
        path.is_relative_to(installer.paths.share) or path.is_relative_to(installer.paths.bin) for path in created
    )


@scenario(FEATURE, "Remove FERRET without changing harness behaviour")
def test_remove_ferret_without_changing_harness_behaviour() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("supported harness adapters are configured to call FERRET")
def given_harness_adapters_call_ferret(session: Session) -> None:
    installer = session.world.installer
    assert install(session).code == 0
    for name, content in HARNESS_FILES.items():
        installer.put_file(FAKE_HOME / name, content, 0o644)
    installer.put_file(REPOSITORY / "src" / "main.py", b"print('hello')\n", 0o644)
    session.bystanders = objects_by_name(session, HARNESS_FILES)
    session.data_before = {name: entry.content for name, entry in session.world.files.files.items()}
    assert installer.facts(installer.paths.launcher).kind == "file"


@when("the ferret executable and local integration are removed")
def when_ferret_is_removed(session: Session) -> None:
    session.ran = run_cli(session.world, ["self", "uninstall", "--json"])


@then("every harness continues to run normally")
def then_every_harness_continues_to_run(session: Session) -> None:
    assert session.ran is not None
    document = json.loads(session.ran.stdout)
    installer = session.world.installer
    assert (session.ran.code, session.ran.stderr, document["result"]) == (0, "", "uninstalled")
    # The harness's own configuration and hooks are byte-identical, and the name they call no longer resolves.
    assert objects_by_name(session, HARNESS_FILES) == session.bystanders
    assert installer.facts(installer.paths.launcher).kind == "missing"


@then("the repository contains no newly generated telemetry data")
def then_the_repository_holds_no_new_telemetry(session: Session) -> None:
    repository = {
        str(path.relative_to(REPOSITORY)) for path in session.world.installer.nodes if path.is_relative_to(REPOSITORY)
    }
    assert repository == {"src/main.py"}


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
    """An event repository whose every capture fails the way a real storage fault does."""

    failure: FerretError = field(default_factory=lambda: FerretError("storage_unavailable"))
    attempts: int = 0

    def capture(self, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        self.attempts += 1
        raise self.failure


@dataclass(slots=True)
class Adapter:
    """The fake machine an adapter call runs on, the runtime it is given, and what the call produced."""

    world: World = field(default_factory=lambda: world_with())
    broken: BrokenEvents | None = None
    ran: Ran | None = None
    elapsed_seconds: float = 0.0

    @property
    def runtime(self) -> Runtime:
        return self.world.runtime if self.broken is None else replace(self.world.runtime, events=self.broken)


@pytest.fixture
def adapter() -> Adapter:
    return Adapter()


@scenario(FEATURE, "Keep a harness fail-open after a local failure")
def test_keep_a_harness_fail_open_after_a_local_failure() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("a harness invokes the FERRET adapter")
def given_a_harness_invokes_the_adapter(adapter: Adapter) -> None:
    adapter.world.input.data = encode_payload(claude_tool("PostToolUse", duration_ms=5))


@given(parsers.parse("FERRET is {condition}"))
def given_ferret_is_in_a_condition(adapter: Adapter, condition: str) -> None:
    payload = adapter.world.input.data
    if condition == "not installed":
        adapter.world = world_with(initialized=False)
        adapter.world.input.data = payload
    elif condition == "given invalid metadata":
        adapter.world.input.data = TRUNCATED_METADATA
    elif condition == "unable to open SQLite":
        adapter.broken = BrokenEvents(failure=FerretError("storage_unavailable"))
    else:
        assert condition == "blocked by a concurrent writer beyond the timeout", condition
        adapter.broken = BrokenEvents(failure=FerretError("storage_unavailable", retryable=True))


@when("the adapter handles a lifecycle event")
def when_the_adapter_handles_an_event(adapter: Adapter) -> None:
    started = time.perf_counter()
    adapter.ran = run_runtime(adapter.runtime, ADAPTER_ARGUMENTS)
    adapter.elapsed_seconds = time.perf_counter() - started


@then("the adapter returns exit code zero within 1000 milliseconds")
def then_the_adapter_returns_zero_in_time(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert adapter.ran.code == 0
    assert adapter.elapsed_seconds < 1.0


@then("it writes no output into the harness conversation")
def then_the_adapter_writes_no_output(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert (adapter.ran.stdout, adapter.ran.stderr) == ("", "")
    assert adapter.world.events.stored == []
    if adapter.broken is not None:
        assert adapter.broken.attempts == 1


# Keep one POSIX adapter fail-open at the wrapper boundary: the shared wrapper in front of a stand-in ferret.
CONTENT_PAYLOAD = encode_payload(
    codex_tool("PostToolUse", tool_response={"output": "raw output the wrapper never reads"})
)
RAW_BYTES = b'{"hook_event_name":"PostToolUse","note":"caf\xc3\xa9\r\n\t"}\x00\xff'


@dataclass(slots=True)
class Wrapping:
    """One wrapper invocation: the harness binding, the stand-in behind it, and what the wrapper did."""

    directory: Path
    harness: str = ""
    event: str = "tool.completed"
    payload: bytes = b""
    behaviour: Behaviour | None = "record"
    ran: WrapperRun | None = None

    def invoke(self) -> None:
        binary = None if self.behaviour is None else stand_in(self.directory, self.behaviour)
        self.ran = run_wrapper(self.harness, self.event, self.payload, home=self.directory, binary=binary)


@pytest.fixture
def wrapping(tmp_path: Path) -> Wrapping:
    return Wrapping(directory=tmp_path)


@scenario(FEATURE, "Keep one POSIX adapter fail-open at the wrapper boundary")
def test_keep_one_posix_adapter_fail_open_at_the_wrapper_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("a {harness} binding invokes the shared wrapper"))
def given_a_binding_invokes_the_wrapper(wrapping: Wrapping, harness: str) -> None:
    wrapping.harness = harness
    wrapping.payload = CONTENT_PAYLOAD


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
    wrapping.payload = b"{not json"
    wrapping.invoke()


@when("the child process hangs past the deadline")
def when_the_child_hangs(wrapping: Wrapping) -> None:
    wrapping.behaviour = "stubborn"
    wrapping.invoke()


@then("the wrapper exits zero and writes nothing to either stream")
def then_the_wrapper_is_silent(wrapping: Wrapping) -> None:
    assert wrapping.ran is not None
    assert (wrapping.ran.code, wrapping.ran.stdout, wrapping.ran.stderr) == (0, b"", b"")
    if wrapping.behaviour is not None:
        # Whatever the wrapper was given reached the child untouched, under the two static registration arguments.
        assert (wrapping.directory / "stdin").read_bytes() == wrapping.payload
        arguments = (wrapping.directory / "argv").read_text().split("\n")[:-1]
        assert arguments == ["capture-hook", "--harness", wrapping.harness, "--event", wrapping.event]


@then("any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds")
def then_a_surviving_child_is_terminated(wrapping: Wrapping) -> None:
    assert wrapping.ran is not None
    pid = recorded_pid(wrapping.directory)
    if pid is not None:
        assert not alive(pid)
    minimum = KILL_MILLISECONDS / 1000 - 0.05 if wrapping.behaviour == "stubborn" else 0.0
    assert minimum <= wrapping.ran.elapsed_seconds < HUNG_SECONDS
