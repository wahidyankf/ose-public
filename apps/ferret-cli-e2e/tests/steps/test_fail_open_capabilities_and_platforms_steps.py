"""E2E bindings for the harness feature: a skill gap read through ``usage``, per-user install and removal, and the real
adapters failing open in front of the built artifact."""

import json
import os
import sqlite3
import stat
import subprocess
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
from hook_wrapper import HUNG_SECONDS, KILL_SECONDS, HookRun, alive, recorded_pid, stand_in, within_deadline
from install_area import Layout, Tree, digest, empty_tree, tree
from vendor_payloads import CLAUDE_CODE

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
class Session:
    """The built artifact, an isolated home, and the usage answer for the harness under test."""

    artifact: Path
    home: Path
    repository: Path
    hook: Path
    log: Path
    usage: Completed | None = None
    ran: Completed | None = None
    path: str = PATH_WITHOUT_USER_BIN
    bystanders: dict[str, bytes] = field(default_factory=lambda: dict[str, bytes]())
    data_before: Tree = field(default_factory=empty_tree)

    def document(self) -> dict[str, Any]:
        assert self.usage is not None
        assert (self.usage.returncode, self.usage.stderr) == (0, b"")
        return json.loads(self.usage.stdout)


@pytest.fixture
def session(artifact: Path, home: Path, workdir: Path, tmp_path: Path) -> Session:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    return Session(
        artifact=artifact, home=home, repository=workdir, hook=tmp_path / "hook.sh", log=tmp_path / "hook.log"
    )


def dimension(row: dict[str, Any], name: str) -> Any:
    return {item["name"]: item["value"] for item in row["dimensions"]}[name]


@scenario(FEATURE, "Mark an unobservable capability unknown")
def test_mark_an_unobservable_capability_unknown() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the selected harness exposes tool events but no stable skill lifecycle event")
def given_tool_events_without_a_skill_lifecycle(session: Session) -> None:
    now = datetime.now(UTC)
    tools = [
        numbered_event(number, now=now, ago=timedelta(minutes=10 - number), harness="codex") for number in (1, 2, 3)
    ]
    # The adapter cannot name a skill, so the gap is stored as skill events whose subject is unknown.
    gaps = [
        numbered_event(
            number,
            now=now,
            ago=timedelta(minutes=10 - number),
            harness="codex",
            eventType="skill.invoked",
            skillName=None,
            toolName=None,
            subjectVisibility="unknown",
            **NO_OUTCOME,
        )
        for number in (4, 5)
    ]
    capture_documents(session.artifact, session.home, [*tools, *gaps])


@when("the user requests usage grouped by skill for that harness")
def when_usage_is_grouped_by_skill(session: Session) -> None:
    session.usage = run_artifact(
        session.artifact,
        ["usage", "--group-by", "skill,subject_visibility", "--harness", "codex", "--all-time", "--json"],
        home=session.home,
    )


@then("the result marks skill subject visibility as unknown")
def then_skill_visibility_is_unknown(session: Session) -> None:
    rows = session.document()["rows"]

    [unknown] = [row for row in rows if dimension(row, "subject_visibility") == "unknown"]

    assert dimension(unknown, "skill") is None
    assert (unknown["eventCount"], unknown["unknownSubjectCount"]) == (2, 2)
    assert (unknown["observedSubjectCount"], unknown["derivedSubjectCount"]) == (0, 0)


@then("the result does not report zero skill invocations as an observed fact")
def then_zero_is_not_reported_as_a_fact(session: Session) -> None:
    document = session.document()

    assert [row for row in document["rows"] if dimension(row, "skill") is not None] == []
    assert document["interpretation"] == USAGE_INTERPRETATION


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


def run_hook(session: Session) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["/bin/sh", str(session.hook)],
        env={"HOME": str(session.home), "PATH": session.path, "FERRET_HOOK_LOG": str(session.log)},
        cwd=session.repository,
        capture_output=True,
        check=False,
    )


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
    assert not os.path.lexists(session.home / ".local")


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
    assert (layout.launcher.is_symlink(), os.readlink(layout.launcher)) == (True, str(artifact))
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
    assert {path.name for path in session.home.iterdir()} == {".ferret", ".local", *STARTUP_FILES}
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
    session.hook.write_text(HOOK, encoding="utf-8")
    session.bystanders = user_files(session, HARNESS_FILES)
    session.data_before = tree(session.home / ".ferret")
    hooked = run_hook(session)
    assert (hooked.returncode, hooked.stdout, hooked.stderr) == (0, b"", b"")
    assert session.log.read_text(encoding="utf-8").splitlines() == ["resolved"]


@when("the ferret executable and local integration are removed")
def when_ferret_is_removed(session: Session) -> None:
    session.ran = run_self(session, ["self", "uninstall", "--json"])


@then("every harness continues to run normally")
def then_every_harness_continues_to_run(session: Session) -> None:
    assert session.ran is not None
    assert (session.ran.returncode, session.ran.stderr) == (0, b"")
    assert json.loads(session.ran.stdout)["result"] == "uninstalled"
    hooked = run_hook(session)
    assert (hooked.returncode, hooked.stdout, hooked.stderr) == (0, b"", b"")
    assert session.log.read_text(encoding="utf-8").splitlines() == ["resolved", "missing"]
    assert user_files(session, HARNESS_FILES) == session.bystanders


@then("the repository contains no newly generated telemetry data")
def then_the_repository_holds_no_new_telemetry(session: Session) -> None:
    assert list(session.repository.iterdir()) == []


@then("the existing user database remains recoverable or removable by an explicit user action")
def then_the_database_is_recoverable_or_removable(session: Session) -> None:
    assert tree(session.home / ".ferret") == session.data_before
    listing = run_self(session, ["events", "list", "--json"])
    assert (listing.returncode, listing.stderr) == (0, b"")
    assert len(json.loads(listing.stdout)["items"]) == 1
    purged = run_self(session, ["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (purged.returncode, purged.stderr, json.loads(purged.stdout)["dataAction"]) == (0, b"", "deleted")
    assert not os.path.lexists(session.home / ".ferret")


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


@given(parsers.parse("a {harness} binding invokes the shared wrapper"))
def given_a_binding_invokes_the_wrapper(adapters: Adapters, harness: str) -> None:
    adapters.harness = harness


def send(adapters: Adapters, document: dict[str, Any] | bytes, *, event: str | None = None) -> None:
    adapters.ran[adapters.harness] = adapters.bench.forward(
        adapters.harness, event or VALID[adapters.harness].event, document, binary=adapters.binary
    )


@when("stdin is forwarded byte-for-byte for a supported event")
def when_stdin_is_forwarded(adapters: Adapters) -> None:
    # Valid JSON with CRLF line ends, tabs, and non-ASCII text: any re-encoding of these bytes changes the derived IDs.
    send(adapters, WRAPPER_BYTES)


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
    send(adapters, INVALID[adapters.harness])


@when("the child process hangs past the deadline")
def when_the_child_hangs(adapters: Adapters) -> None:
    adapters.binary = stand_in(adapters.bench.directory, "stubborn")
    adapters.stuck = True
    adapters.expected_rows = 0
    send(adapters, VALID[adapters.harness].document)


@then("the wrapper exits zero and writes nothing to either stream")
def then_the_wrapper_is_silent(adapters: Adapters) -> None:
    ran = adapters.ran[adapters.harness]
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")
    assert adapters.bench.stored() == adapters.expected_rows
    if adapters.expected_rows:
        [row] = stored_rows(adapters.bench)
        key = adapters.bench.key()
        assert row["harness"] == adapters.harness
        if row["tool_name"] == "Read" and adapters.harness == CLAUDE_CODE:
            assert row["workspace_id"] == derived(key, "ws", "/users/example/café")
            assert row["session_id"] == derived(key, "ss", CLAUDE_CODE, "séance-1")
        assert adapters.bench.leaks() == []


@then("any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds")
def then_a_surviving_child_is_terminated(adapters: Adapters) -> None:
    ran = adapters.ran[adapters.harness]
    minimum = 0.0
    if adapters.stuck:
        pid = recorded_pid(adapters.bench.directory)
        assert pid is not None
        assert not alive(pid)
        minimum = KILL_SECONDS - 0.05
    assert minimum <= ran.elapsed_seconds < HUNG_SECONDS
