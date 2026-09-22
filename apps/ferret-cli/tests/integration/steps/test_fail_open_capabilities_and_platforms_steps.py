"""Integration bindings for the harness capabilities feature: snapshots persisted in a real SQLite database."""

import hashlib
import hmac
import json
import os
import sqlite3
import stat
import subprocess
from collections.abc import Iterator
from contextlib import closing
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.adapters.sqlite_repository import SQLiteCapabilityRepository
from ferret.adapters.sqlite_schema import SQLiteSchema
from ferret.adapters.system import SystemClock
from ferret.application.capabilities import DimensionReport, report_dimension
from ferret.domain.capability import snapshot_from_document
from ferret.domain.install import LAUNCHER_MODE, InstallPaths, launcher_artifact
from support.artifacts import write_test_artifact
from support.hook_payloads import CANARIES, claude_tool, codex_tool
from support.hook_payloads import encode as encode_payload
from support.invoke import Ran
from support.machine import Machine, make_machine
from support.populate import make_event
from support.snapshots import capability, snapshot_document
from support.wrapper import (
    HUNG_SECONDS,
    KILL_MILLISECONDS,
    WrapperRun,
    alive,
    in_tree,
    recorded_pid,
    run_wrapper,
    stand_in,
    within_deadline,
)

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"
NOW = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)


@dataclass(slots=True)
class Session:
    """A real database holding the harness's persisted snapshot, and the usage answer computed from what it reads."""

    database: Path
    report: DimensionReport | None = None


@pytest.fixture
def session(tmp_path: Path) -> Session:
    database = tmp_path / "ferret.sqlite3"
    SQLiteSchema(database, SystemClock()).migrate()
    return Session(database=database)


@scenario(FEATURE, "Mark an unobservable capability unknown")
def test_mark_an_unobservable_capability_unknown() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the selected harness exposes tool events but no stable skill lifecycle event")
def given_tool_events_without_a_skill_lifecycle(session: Session) -> None:
    snapshot = snapshot_from_document(
        snapshot_document(
            capabilities=[
                capability("skill_invocation", "unknown", "unavailable"),
                capability("tool_lifecycle", "observed", "official_hook"),
            ]
        ),
        now=NOW,
    )
    SQLiteCapabilityRepository(session.database).store_snapshot(snapshot)
    with closing(sqlite3.connect(session.database)) as connection:
        states = dict(connection.execute("SELECT capability_name, state FROM capability_item"))
    assert states == {"skill_invocation": "unknown", "tool_lifecycle": "observed"}


@when("the user requests usage grouped by skill for that harness")
def when_usage_is_grouped_by_skill(session: Session) -> None:
    persisted = SQLiteCapabilityRepository(session.database).latest_snapshot("codex", now=NOW)
    session.report = report_dimension(persisted, "skill", recorded=0)


@then("the result marks skill subject visibility as unknown")
def then_skill_visibility_is_unknown(session: Session) -> None:
    assert session.report is not None
    assert (session.report.dimension, session.report.visibility) == ("skill", "unknown")


@then("the result does not report zero skill invocations as an observed fact")
def then_zero_is_not_reported_as_a_fact(session: Session) -> None:
    assert session.report is not None
    assert session.report.observed_count is None


STARTUP_FILES = {".zshrc": b"export EDITOR=vi\n", ".bashrc": b"# bash startup\n", ".profile": b"# login shell\n"}
HARNESS_FILES = {
    ".claude/settings.json": b'{"hooks":{"PostToolUse":[{"command":"hook.sh"}]}}\n',
    ".codex/hooks.json": b'{"hooks":{"PostToolUse":[{"command":"hook.sh"}]}}\n',
    ".config/opencode/plugins/ferret.ts": b"export const Ferret = async () => ({})\n",
}
HOOK = """#!/bin/sh
# Stands in for a harness hook: it looks for ferret, notes what it found, and never lets a failure reach the harness.
if command -v ferret >/dev/null 2>&1; then
  printf 'resolved\\n' >> "$FERRET_HOOK_LOG"
else
  printf 'missing\\n' >> "$FERRET_HOOK_LOG"
fi
exit 0
"""


@dataclass(slots=True)
class Installation:
    """A real HOME with a real artifact file to install, the files around it, and what each command printed."""

    machine: Machine
    source: Path
    source_sha256: str
    repository: Path
    hook: Path
    log: Path
    ran: Ran | None = None
    startup: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())
    database_before: bytes = b""


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
        hook=tmp_path / "hook.sh",
        log=tmp_path / "hook.log",
    )


def home_names(installation: Installation) -> set[str]:
    return {path.name for path in installation.machine.home.iterdir()}


def user_files(installation: Installation, names: dict[str, bytes]) -> dict[str, bytes]:
    return {name: (installation.machine.home / name).read_bytes() for name in names}


def run_hook(installation: Installation) -> subprocess.CompletedProcess[bytes]:
    bin_directory = installation.machine.home / ".local" / "bin"
    return subprocess.run(
        ["/bin/sh", str(installation.hook)],
        env={
            "HOME": str(installation.machine.home),
            "PATH": f"{bin_directory}:/usr/bin:/bin",
            "FERRET_HOOK_LOG": str(installation.log),
        },
        cwd=installation.repository,
        capture_output=True,
        check=False,
    )


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
    # `.local` itself now also holds the data home, so the precondition is about the install tree inside it.
    assert not (home / ".local" / "bin").exists()
    assert not (home / ".local" / "share" / "ferret-cli").exists()


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


@scenario(FEATURE, "Remove FERRET without changing harness behaviour")
def test_remove_ferret_without_changing_harness_behaviour() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("supported harness adapters are configured to call FERRET")
def given_harness_adapters_call_ferret(installation: Installation) -> None:
    home = installation.machine.home
    installation.machine = replace(installation.machine, path=f"/usr/bin:{home / '.local' / 'bin'}")
    installation.machine.fill([make_event(1, now=datetime.now(UTC))])
    installed = installation.machine.run(["self", "install", "--target", "user", "--json"])
    assert (installed.code, installed.stderr) == (0, "")
    for name, content in HARNESS_FILES.items():
        (home / name).parent.mkdir(parents=True, exist_ok=True)
        (home / name).write_bytes(content)
    installation.hook.write_text(HOOK, encoding="utf-8")
    installation.startup = user_files(installation, HARNESS_FILES)
    installation.database_before = installation.machine.database.read_bytes()
    hooked = run_hook(installation)
    assert (hooked.returncode, hooked.stdout, hooked.stderr) == (0, b"", b"")
    assert installation.log.read_text(encoding="utf-8").splitlines() == ["resolved"]


@when("the ferret executable and local integration are removed")
def when_ferret_is_removed(installation: Installation) -> None:
    installation.ran = installation.machine.run(["self", "uninstall", "--json"])


@then("every harness continues to run normally")
def then_every_harness_continues_to_run(installation: Installation) -> None:
    assert installation.ran is not None
    assert (installation.ran.code, installation.ran.stderr) == (0, "")
    assert json.loads(installation.ran.stdout)["result"] == "uninstalled"
    hooked = run_hook(installation)
    assert (hooked.returncode, hooked.stdout, hooked.stderr) == (0, b"", b"")
    assert installation.log.read_text(encoding="utf-8").splitlines() == ["resolved", "missing"]
    assert user_files(installation, HARNESS_FILES) == installation.startup


@then("the repository contains no newly generated telemetry data")
def then_the_repository_holds_no_new_telemetry(installation: Installation) -> None:
    assert list(installation.repository.iterdir()) == []


@then("the existing user database remains recoverable or removable by an explicit user action")
def then_the_database_is_recoverable_or_removable(installation: Installation) -> None:
    machine = installation.machine
    assert machine.database.read_bytes() == installation.database_before
    listing = machine.run(["events", "list", "--json"])
    assert (listing.code, [item["eventId"] for item in json.loads(listing.stdout)["items"]]) == (
        0,
        [make_event(1).event_id],
    )
    purged = machine.run(["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (purged.code, purged.stderr, json.loads(purged.stdout)["dataAction"]) == (0, "", "deleted")
    assert not machine.data_home.exists()


# Keep a harness fail-open after a local failure, and at the wrapper boundary: the shared wrapper in front of this
# working tree's real CLI, over a real home directory and a real SQLite store.
TRUNCATED_METADATA = b'{"session_id":"native-session-0001","hook_event_name":'


@dataclass(slots=True)
class Adapter:
    """A real initialized home, the wrapper's binding to it, and what one wrapper invocation did."""

    machine: Machine
    launcher: Path
    harness: str = "claude_code"
    event: str = "tool.completed"
    payload: bytes = b""
    binary: Path | None = None
    expected_rows: int = 1
    ran: WrapperRun | None = None
    writer: sqlite3.Connection | None = None
    stuck: Path | None = None


@pytest.fixture
def adapter(tmp_path: Path) -> Iterator[Adapter]:
    machine = make_machine(tmp_path)
    launcher = in_tree(tmp_path)
    binding = Adapter(
        machine=machine, launcher=launcher, payload=encode_payload(claude_tool("PostToolUse", duration_ms=5))
    )
    binding.binary = launcher
    yield binding
    if binding.writer is not None:
        binding.writer.close()


def invoke(adapter: Adapter) -> None:
    adapter.ran = run_wrapper(
        adapter.harness, adapter.event, adapter.payload, home=adapter.machine.home, binary=adapter.binary
    )


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
    elif condition == "given invalid metadata":
        adapter.payload = TRUNCATED_METADATA
    elif condition == "unable to open SQLite":
        adapter.machine.database.write_bytes(b"this is not a SQLite database" * 64)
    else:
        assert condition == "blocked by a concurrent writer beyond the timeout", condition
        adapter.writer = sqlite3.connect(adapter.machine.database, autocommit=True)
        adapter.writer.execute("BEGIN IMMEDIATE")


@when("the adapter handles a lifecycle event")
def when_the_adapter_handles_an_event(adapter: Adapter) -> None:
    invoke(adapter)


@then("the adapter returns exit code zero within 1000 milliseconds")
def then_the_adapter_returns_zero_in_time(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert adapter.ran.code == 0
    assert within_deadline(adapter.ran)


@then("it writes no output into the harness conversation")
def then_the_adapter_writes_no_output(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert (adapter.ran.stdout, adapter.ran.stderr) == (b"", b"")
    if adapter.writer is not None:
        adapter.writer.execute("ROLLBACK")
    if adapter.machine.database.read_bytes().startswith(b"SQLite format 3"):
        assert stored_events(adapter) == 0


@scenario(FEATURE, "Keep one POSIX adapter fail-open at the wrapper boundary")
def test_keep_one_posix_adapter_fail_open_at_the_wrapper_boundary() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("a {harness} binding invokes the shared wrapper"))
def given_a_binding_invokes_the_wrapper(adapter: Adapter, harness: str) -> None:
    adapter.harness = harness
    adapter.payload = b""


@when("stdin is forwarded byte-for-byte for a supported event")
def when_stdin_is_forwarded(adapter: Adapter) -> None:
    # Valid JSON with CRLF line ends, tabs, and non-ASCII text: any re-encoding of these bytes changes the derived IDs.
    adapter.payload = (
        b'{\r\n\t"session_id": "s\xc3\xa9ance-1",\r\n\t"cwd": "/users/example/caf\xc3\xa9",\r\n'
        b'\t"hook_event_name": "PostToolUse",\r\n\t"tool_name": "Read",\r\n\t"duration_ms": 27\r\n}\r\n'
    )
    invoke(adapter)


@when("the event is not one FERRET registers")
def when_the_event_is_not_registered(adapter: Adapter) -> None:
    adapter.event = "notification.sent"
    adapter.payload = encode_payload(claude_tool("PostToolUse", duration_ms=5))
    adapter.expected_rows = 0
    invoke(adapter)


@when("the payload carries raw content fields")
def when_the_payload_carries_content(adapter: Adapter) -> None:
    adapter.payload = encode_payload(
        codex_tool("PostToolUse", tool_response={"output": CANARIES[2]}, prompt=CANARIES[0], env={"K": CANARIES[3]})
    )
    invoke(adapter)


@when("the ferret executable is missing")
def when_the_executable_is_missing(adapter: Adapter) -> None:
    adapter.binary = None
    adapter.payload = encode_payload(codex_tool("PostToolUse"))
    adapter.expected_rows = 0
    invoke(adapter)


@when("the plugin forwards an invalid payload")
def when_the_plugin_forwards_an_invalid_payload(adapter: Adapter) -> None:
    adapter.payload = b"{not json"
    adapter.expected_rows = 0
    invoke(adapter)


@when("the child process hangs past the deadline")
def when_the_child_hangs(adapter: Adapter) -> None:
    adapter.binary = stand_in(adapter.machine.home.parent, "stubborn")
    adapter.stuck = adapter.machine.home.parent
    adapter.expected_rows = 0
    invoke(adapter)


@then("the wrapper exits zero and writes nothing to either stream")
def then_the_wrapper_is_silent(adapter: Adapter) -> None:
    assert adapter.ran is not None
    assert (adapter.ran.code, adapter.ran.stdout, adapter.ran.stderr) == (0, b"", b"")
    assert stored_events(adapter) == adapter.expected_rows
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


@then("any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds")
def then_a_surviving_child_is_terminated(adapter: Adapter) -> None:
    assert adapter.ran is not None
    minimum = 0.0
    if adapter.stuck is not None:
        pid = recorded_pid(adapter.stuck)
        assert pid is not None
        assert not alive(pid)
        minimum = KILL_MILLISECONDS / 1000 - 0.05
    assert minimum <= adapter.ran.elapsed_seconds < HUNG_SECONDS


def derived(key: bytes, kind: str, *parts: str) -> str:
    """The identifier the contract derives: HMAC-SHA256 over the NUL-joined purpose and parts, first 16 bytes in hex."""
    message = b"\0".join(part.encode("utf-8") for part in ("ferret/id/1", kind, *parts))
    return f"{kind}_{hmac.new(key, message, hashlib.sha256).hexdigest()[:32]}"
