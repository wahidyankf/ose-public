"""In-memory stand-ins for every OS-facing port, so a Unit test never touches a real file, clock, or random source."""

import hashlib
import threading
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Literal

from ferret.application.ports import (
    Budget,
    CaptureResult,
    Compaction,
    ExpiryCounters,
    FileFacts,
    InstalledFacts,
    InterpreterFacts,
    Kind,
    PruneResult,
    Runtime,
    SchemaState,
    SourceArtifact,
    StagedInstall,
    StagePlan,
    StoreCounts,
)
from ferret.domain.capability import CapabilitySnapshot
from ferret.domain.errors import FerretError
from ferret.domain.event import Event
from ferret.domain.identity import resolve_identity
from ferret.domain.install import (
    ARTIFACT_FILE,
    ARTIFACT_MODE,
    DIRECTORY_MODE,
    LAUNCHER_FILE,
    LAUNCHER_MODE,
    MANIFEST_FILE,
    MANIFEST_MODE,
    InstallPaths,
    Manifest,
    is_stage_name,
    launcher_script,
    stage_name,
)
from ferret.domain.query import EventCriteria, Position
from ferret.domain.space import StorageFacts
from ferret.domain.storage import PRIVATE_FILE_MODE
from ferret.domain.timestamps import format_timestamp

FAKE_HOME = Path("/users/example")
#: The interpreter a faked install pins, standing in for the one the real adapter reads from ``sys.executable``.
FAKE_INTERPRETER = Path("/usr/bin/python3.14")
FAKE_DATA_HOME = FAKE_HOME / ".local" / "share" / "ferret"
FIXED_NOW = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)
INSTALLATION_ID = "00000000-0000-4000-8000-000000000002"


class SimulatedCrash(Exception):  # noqa: N818 - a test signal, not an error type
    """Raised by a fake to model the process dying at a chosen point."""


@dataclass(slots=True)
class Entry:
    """One object in the fake data home."""

    kind: Kind = "file"
    content: bytes = b""
    mode: int = PRIVATE_FILE_MODE
    owned: bool = True
    links: int = 1

    def facts(self) -> FileFacts:
        return FileFacts(kind=self.kind, mode=self.mode, owned_by_current_user=self.owned, link_count=self.links)


class FixedClock:
    def __init__(self, now: datetime = FIXED_NOW) -> None:
        self._now = now

    def now(self) -> datetime:
        return self._now

    def advance(self, delta: timedelta) -> None:
        self._now += delta


class FakeMonotonic:
    """A monotonic clock that only moves when told to, or by ``step_ms`` on every reading."""

    def __init__(self, step_ms: int = 0) -> None:
        self._nanoseconds = 0
        self._step = step_ms * 1_000_000
        self.readings = 0

    def now_ns(self) -> int:
        self.readings += 1
        self._nanoseconds += self._step
        return self._nanoseconds

    def advance(self, milliseconds: int) -> None:
        self._nanoseconds += milliseconds * 1_000_000


class SequenceRandomness:
    """Hands out fixed UUIDs in order, then numbered ones, and deterministic key bytes."""

    def __init__(self, uuids: tuple[str, ...] = (INSTALLATION_ID,)) -> None:
        self._uuids = list(uuids)
        self.uuid_calls = 0
        self.key_calls = 0

    def uuid4(self) -> str:
        self.uuid_calls += 1
        if self._uuids:
            return self._uuids.pop(0)
        return f"00000000-0000-4000-8000-{self.uuid_calls:012d}"

    def token_bytes(self, count: int) -> bytes:
        self.key_calls += 1
        return bytes(range(count))


@dataclass(slots=True)
class FakeDataHome:
    """The data home as a dict, recording every create with its requested mode and every lock."""

    directory: Entry | None = None
    files: dict[str, Entry] = field(default_factory=lambda: dict[str, Entry]())
    creates: list[tuple[str, int]] = field(default_factory=lambda: list[tuple[str, int]]())
    lock_depth: int = 0
    lock_count: int = 0
    crash_after_creates: int | None = None
    touched: list[str] = field(default_factory=lambda: list[str]())
    purges: int = 0

    def facts(self, name: str | None) -> FileFacts:
        self.touched.append("" if name is None else name)
        entry = self.directory if name is None else self.files.get(name)
        return FileFacts(kind="missing") if entry is None else entry.facts()

    def ensure_directory(self, mode: int) -> None:
        if self.directory is None:
            self.directory = Entry(kind="directory", mode=mode)

    def create_file(self, name: str, content: bytes, mode: int) -> None:
        assert self.lock_depth > 0, "a file must be created while the exclusive lock is held"
        assert name not in self.files, f"{name} already exists: creation must be exclusive"
        if self.crash_after_creates is not None and len(self.creates) >= self.crash_after_creates:
            raise SimulatedCrash
        self.files[name] = Entry(content=content, mode=mode)
        self.creates.append((name, mode))

    def read_file(self, name: str) -> bytes:
        return self.files[name].content

    def purge(self) -> None:
        self.purges += 1
        self.files.clear()
        self.directory = None

    @contextmanager
    def lock(self) -> Generator[None]:
        assert self.directory is not None, "the data home must exist before it can be locked"
        self.lock_depth += 1
        self.lock_count += 1
        self.files.setdefault("ferret.lock", Entry())
        try:
            yield
        finally:
            self.lock_depth -= 1


@dataclass(slots=True)
class FakeSchema:
    """A schema that reports the current number and whether this call created it."""

    number: int = 1
    applied: bool = False
    calls: int = 0
    crash: bool = False

    def migrate(self) -> SchemaState:
        self.calls += 1
        if self.crash:
            raise SimulatedCrash
        applied_now = not self.applied
        self.applied = True
        return SchemaState(number=self.number, applied_now=applied_now)


class FakeInput:
    """Standard input as a fixed byte string, read at most ``limit`` bytes at a time like the real one."""

    def __init__(self, data: bytes = b"") -> None:
        self.data = data
        self.reads: list[int] = []

    def read(self, limit: int) -> bytes:
        self.reads.append(limit)
        return self.data[:limit]


def _position(event: Event) -> tuple[str, str]:
    return event.occurred_at, event.event_id


def _matches(criteria: EventCriteria, event: Event) -> bool:
    """Whether ``event`` satisfies every filter: a half-open interval and exact equality on each present name."""
    if criteria.start is not None and event.occurred_at < criteria.start:
        return False
    if criteria.end is not None and event.occurred_at >= criteria.end:
        return False
    wanted = (
        (criteria.harness, event.harness),
        (criteria.workspace, event.workspace_id),
        (criteria.event_type, event.event_type),
        (criteria.agent, event.agent_name),
        (criteria.skill, event.skill_name),
        (criteria.tool, event.tool_name),
        (criteria.outcome, event.outcome),
    )
    return all(want is None or have == want for want, have in wanted)


@dataclass(slots=True)
class FakeEvents:
    """The event repository as a list under one lock, applying the same identity policy as the real one.

    ``reads`` counts ``read`` calls, so a test can prove how many batches a consumer pulled.
    """

    stored: list[Event] = field(default_factory=lambda: list[Event]())
    captures: int = 0
    reads: int = 0
    lock: threading.Lock = field(default_factory=threading.Lock)

    def capture(self, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        with self.lock:
            self.captures += 1
            existing = next((held for held in self.stored if held.event_id == event.event_id), None)
            outcome = resolve_identity(None if existing is None else existing.event_hash, event.event_hash)
            if outcome == "duplicate":
                return "duplicate"
            self.stored.append(event)
            return "stored"

    def read(
        self,
        criteria: EventCriteria,
        *,
        now: datetime,
        newest_first: bool,
        after: Position | None,
        limit: int,
    ) -> tuple[Event, ...]:
        """Up to ``limit`` unexpired matches in one total order, strictly past ``after`` in the direction of travel."""
        horizon = format_timestamp(now)
        with self.lock:
            self.reads += 1
            rows = sorted(
                (held for held in self.stored if held.expires_at > horizon and _matches(criteria, held)),
                key=_position,
                reverse=newest_first,
            )
        if after is not None:
            edge = (after.occurred_at, after.event_id)
            rows = [row for row in rows if (_position(row) < edge if newest_first else _position(row) > edge)]
        return tuple(rows[:limit])

    def find(self, event_id: str, *, now: datetime) -> Event | None:
        """The unexpired event with ``event_id``, whatever filters a query had."""
        horizon = format_timestamp(now)
        with self.lock:
            return next((held for held in self.stored if held.event_id == event_id and held.expires_at > horizon), None)


def _recency(snapshot: CapabilitySnapshot) -> tuple[str, str]:
    return snapshot.captured_at, snapshot.snapshot_id


@dataclass(slots=True)
class FakeCapabilities:
    """The capability repository as a list under one lock, applying the same identity policy as the real one."""

    stored: list[CapabilitySnapshot] = field(default_factory=lambda: list[CapabilitySnapshot]())
    lock: threading.Lock = field(default_factory=threading.Lock)

    def store_snapshot(self, snapshot: CapabilitySnapshot) -> CaptureResult:
        with self.lock:
            existing = next((held for held in self.stored if held.snapshot_id == snapshot.snapshot_id), None)
            outcome = resolve_identity(None if existing is None else existing.snapshot_hash, snapshot.snapshot_hash)
            if outcome == "duplicate":
                return "duplicate"
            self.stored.append(snapshot)
            return "stored"

    def latest_snapshot(self, harness: str, *, now: datetime) -> CapabilitySnapshot | None:
        horizon = format_timestamp(now)
        with self.lock:
            live = (held for held in self.stored if held.harness == harness and held.expires_at > horizon)
            return max(live, key=_recency, default=None)


@dataclass(slots=True)
class FakeTelemetry:
    """Retention and counters over the fake event and snapshot stores, following the port's contract row for row.

    ``lock_held`` makes every prune skip as if the write lock could not be taken inside the budget, and ``broken``
    makes every call raise that failure. ``prunes`` keeps every result so a test can read the whole history.
    """

    events: FakeEvents
    capabilities: FakeCapabilities
    marker: str | None = None
    local_total: int = 0
    before_ack_total: int = 0
    lock_held: bool = False
    broken: FerretError | None = None
    prunes: list[PruneResult] = field(default_factory=lambda: list[PruneResult]())
    facts: StorageFacts = field(default_factory=lambda: StorageFacts(0, 0, 0))
    stored_schema: int = 1
    integrity_ok: bool = True
    reader_open: bool = False
    compaction_fails: bool = False
    checkpoints: list[str] = field(default_factory=lambda: list[str]())
    compactions: list[str] = field(default_factory=lambda: list[str]())
    integrity_checks: list[bool] = field(default_factory=lambda: list[bool]())

    def last_completed_at(self) -> str | None:
        if self.broken is not None:
            raise self.broken
        return self.marker

    def expiry_counters(self) -> ExpiryCounters:
        self._require_reachable()
        return ExpiryCounters(self.local_total, self.before_ack_total)

    def prune_batch(self, *, now: datetime, limit: int, budget: Budget) -> PruneResult:
        if self.broken is not None:
            raise self.broken
        if budget.remaining_ms() == 0 or self.lock_held:
            return self._record(PruneResult("skipped"))
        horizon = format_timestamp(now)
        expired_events = sorted(
            (held for held in self.events.stored if held.expires_at <= horizon),
            key=lambda held: (held.expires_at, held.event_id),
        )
        expired_snapshots = sorted(
            (held for held in self.capabilities.stored if held.expires_at <= horizon),
            key=lambda held: (held.expires_at, held.snapshot_id),
        )
        removed_events: list[Event] = []
        removed_snapshots: list[CapabilitySnapshot] = []
        for row in (*expired_events, *expired_snapshots):
            if len(removed_events) + len(removed_snapshots) >= limit or budget.spent():
                break
            if isinstance(row, Event):
                removed_events.append(row)
            else:
                removed_snapshots.append(row)
        for gone in removed_events:
            self.events.stored.remove(gone)
        for gone in removed_snapshots:
            self.capabilities.stored.remove(gone)
        retained = {held.workspace_id for held in self.events.stored}
        orphaned = {gone.workspace_id for gone in removed_events} - retained
        deleted = len(removed_events) + len(removed_snapshots)
        remaining = any(held.expires_at <= horizon for held in self.events.stored) or any(
            held.expires_at <= horizon for held in self.capabilities.stored
        )
        completed = deleted == 0 and not remaining
        self.local_total += deleted
        if completed:
            self.marker = horizon
        return self._record(
            PruneResult(
                "pruned",
                events=len(removed_events),
                snapshots=len(removed_snapshots),
                workspaces=len(orphaned),
                remaining=remaining,
                completed=completed,
            )
        )

    def _record(self, result: PruneResult) -> PruneResult:
        self.prunes.append(result)
        return result

    def _require_reachable(self) -> None:
        if self.broken is not None:
            raise self.broken

    def schema_number(self) -> int:
        self._require_reachable()
        return self.stored_schema

    def storage_facts(self) -> StorageFacts:
        self._require_reachable()
        return self.facts

    def counts(self, *, now: datetime, near_expiry_within: timedelta) -> StoreCounts:
        """Live and expired rows counted the way the real store does: live means not expired at ``now``."""
        self._require_reachable()
        horizon, near = format_timestamp(now), format_timestamp(now + near_expiry_within)
        live_events = [held for held in self.events.stored if held.expires_at > horizon]
        live_snapshots = [held for held in self.capabilities.stored if held.expires_at > horizon]
        stored = len(self.events.stored) + len(self.capabilities.stored)
        return StoreCounts(
            events=len(live_events),
            snapshots=len(live_snapshots),
            oldest_captured_at=min((held.captured_at for held in live_events), default=None),
            near_expiry=sum(1 for held in (*live_events, *live_snapshots) if held.expires_at <= near),
            logically_expired=stored - len(live_events) - len(live_snapshots),
        )

    def check_integrity(self, *, thorough: bool) -> bool:
        self._require_reachable()
        self.integrity_checks.append(thorough)
        return self.integrity_ok

    def checkpoint(self) -> Literal["truncated", "skipped"]:
        """Fold the log into the database unless a reader is open; a skipped checkpoint leaves every byte as it was."""
        if self.reader_open:
            self.checkpoints.append("skipped")
            return "skipped"
        self.facts = replace(self.facts, wal_bytes=0)
        self.checkpoints.append("truncated")
        return "truncated"

    def compact(self) -> Compaction:
        """Rewrite the database without its free pages, through the log like the real thing, or fail unchanged."""
        if self.compaction_fails:
            self.compactions.append("failed")
            return Compaction("failed", self.facts)
        shrunk = self.facts.database_bytes - self.facts.freelist_bytes
        self.facts = StorageFacts(database_bytes=shrunk, wal_bytes=self.facts.wal_bytes + shrunk, freelist_bytes=0)
        self.compactions.append("compacted")
        return Compaction("compacted", self.facts)


ARTIFACT_BYTES = b"#!/usr/bin/env python3\nthe artifact under test\n"
SOURCE_PATH = Path("/work/dist/ferret.pyz")
AN_OLDER_VERSION = "0.0.9"
INSTALLED_LONG_AGO = "2026-09-01T00:00:00.000Z"


@dataclass(slots=True)
class Node:
    """One object in the fake install area: a directory, a regular file, or a symlink and where it points."""

    kind: Kind = "file"
    content: bytes = b""
    mode: int = 0
    target: str | None = None
    owned: bool = True


class FakeInstall:
    """The per-user install area as an in-memory tree.

    Every mutating step is recorded by name, and ``crash_before`` makes the process die just before the first step
    of that name, so a test sees exactly the objects a crash at that point leaves behind.
    """

    def __init__(self, home: Path = FAKE_HOME, *, artifact: bytes = ARTIFACT_BYTES, path_variable: str = "") -> None:
        self.paths = InstallPaths(home)
        self.path_variable = path_variable
        self.interpreter = FAKE_INTERPRETER
        self.artifact = artifact
        self.nodes: dict[Path, Node] = {}
        self.steps: list[str] = []
        self.crash_before: str | None = None
        self.stage_fails = False
        self.source_fails = False
        self._stages = 0

    def put_directory(self, path: Path, mode: int = DIRECTORY_MODE) -> None:
        self.nodes[path] = Node(kind="directory", mode=mode)

    def put_file(self, path: Path, content: bytes, mode: int) -> None:
        self.nodes[path] = Node(kind="file", content=content, mode=mode)

    def put_symlink(self, path: Path, target: str) -> None:
        self.nodes[path] = Node(kind="symlink", target=target)

    def arrange_install(self, version: str, artifact: bytes, *, installed_at: str = INSTALLED_LONG_AGO) -> Manifest:
        """Lay down exactly what a finished install of ``artifact`` at ``version`` leaves behind."""
        paths = self.paths
        for directory in (paths.share, paths.version_directory(version), paths.bin):
            self.put_directory(directory)
        self.put_file(paths.artifact(version), artifact, ARTIFACT_MODE)
        self.put_file(paths.launcher, launcher_script(FAKE_INTERPRETER, paths.artifact(version)), LAUNCHER_MODE)
        manifest = Manifest(
            version=version,
            artifact_path=paths.artifact(version),
            artifact_sha256=hashlib.sha256(artifact).hexdigest(),
            launcher_path=paths.launcher,
            installed_at=installed_at,
        )
        self.put_file(paths.manifest, manifest.to_bytes(), MANIFEST_MODE)
        return manifest

    def snapshot(self) -> dict[str, tuple[str, int, bytes | str | None]]:
        """Every object as plain values, so a test can compare two moments or a whole tree at once."""
        return {
            str(path): (node.kind, node.mode, node.content if node.kind == "file" else node.target)
            for path, node in sorted(self.nodes.items())
        }

    def _step(self, name: str) -> None:
        self.steps.append(name)
        if name == self.crash_before:
            raise SimulatedCrash

    def source(self) -> SourceArtifact:
        if self.source_fails:
            raise FerretError("ferret.storage.unavailable")
        return SourceArtifact(path=SOURCE_PATH, sha256=hashlib.sha256(self.artifact).hexdigest())

    def facts(self, path: Path) -> InstalledFacts:
        node = self.nodes.get(path)
        if node is None:
            return InstalledFacts(kind="missing")
        digest = hashlib.sha256(node.content).hexdigest() if node.kind == "file" else None
        return InstalledFacts(
            kind=node.kind, mode=node.mode, owned_by_current_user=node.owned, sha256=digest, target=node.target
        )

    def read_manifest(self) -> bytes | None:
        node = self.nodes.get(self.paths.manifest)
        return None if node is None else node.content

    def read_launcher(self) -> bytes | None:
        node = self.nodes.get(self.paths.launcher)
        # A link reads as nothing here, exactly as O_NOFOLLOW makes it on a real filesystem.
        return None if node is None or node.kind != "file" else node.content

    def recover(self) -> None:
        self._step("recover")
        stray = [
            path
            for path, node in self.nodes.items()
            if node.kind in ("file", "symlink")
            and node.owned
            and any(is_stage_name(path.name, name) for name in (ARTIFACT_FILE, LAUNCHER_FILE, MANIFEST_FILE))
        ]
        for path in stray:
            del self.nodes[path]

    def stage(self, plan: StagePlan) -> StagedInstall:
        self._step("stage")
        if self.stage_fails:
            raise FerretError("ferret.storage.unavailable")
        self._stages += 1
        nonce = f"{self._stages:032x}"
        paths = self.paths
        for directory in (paths.share, paths.version_directory(plan.version), paths.bin):
            self.nodes.setdefault(directory, Node(kind="directory", mode=DIRECTORY_MODE))
        staged = StagedInstall(
            version=plan.version,
            artifact=paths.version_directory(plan.version) / stage_name(ARTIFACT_FILE, nonce),
            launcher=paths.bin / stage_name(LAUNCHER_FILE, nonce),
            manifest=paths.share / stage_name(MANIFEST_FILE, nonce),
        )
        self.put_file(staged.artifact, self.artifact, ARTIFACT_MODE)
        self.put_file(staged.launcher, plan.launcher, LAUNCHER_MODE)
        self.put_file(staged.manifest, plan.manifest, MANIFEST_MODE)
        return staged

    def replace_artifact(self, staged: StagedInstall) -> None:
        self._step("replace_artifact")
        self.nodes[self.paths.artifact(staged.version)] = self.nodes.pop(staged.artifact)

    def replace_launcher(self, staged: StagedInstall) -> None:
        self._step("replace_launcher")
        self.nodes[self.paths.launcher] = self.nodes.pop(staged.launcher)

    def replace_manifest(self, staged: StagedInstall) -> None:
        self._step("replace_manifest")
        self.nodes[self.paths.manifest] = self.nodes.pop(staged.manifest)

    def remove(self, path: Path) -> None:
        self._step("remove")
        assert self.nodes[path].kind in ("file", "symlink"), f"{path} is not a file or a link"
        del self.nodes[path]

    def remove_empty_directory(self, path: Path) -> None:
        self._step("remove_empty_directory")
        if self.nodes.get(path, Node()).kind == "directory" and not any(other.parent == path for other in self.nodes):
            del self.nodes[path]


@dataclass(slots=True)
class FakeWorkspaces:
    """Repository roots as a table: a directory below a listed root belongs to the longest one, else to itself."""

    roots: tuple[str, ...] = ()
    asked: list[str] = field(default_factory=lambda: list[str]())

    def root_of(self, directory: str) -> str:
        self.asked.append(directory)
        held = [root for root in self.roots if directory == root or directory.startswith(root + "/")]
        return max(held, key=len, default=directory)


@dataclass(slots=True)
class FakeHookFailures:
    """The hook-failure record held in memory: each record is the clock's reading and the closed code."""

    clock: FixedClock
    records: list[tuple[str, str]] = field(default_factory=lambda: list[tuple[str, str]]())

    def record(self, code: str) -> None:
        self.records.append((self.clock.now().strftime("%Y-%m-%dT%H:%M:%SZ"), code))

    def read(self) -> tuple[int, str | None]:
        return (len(self.records), self.records[-1][0] if self.records else None)

    def codes(self) -> list[str]:
        return [code for _, code in self.records]


@dataclass(slots=True)
class World:
    """One fake machine: the ports plus the runtime that wires them together."""

    files: FakeDataHome
    schema: FakeSchema
    clock: FixedClock
    randomness: SequenceRandomness
    input: FakeInput
    events: FakeEvents
    capabilities: FakeCapabilities
    monotonic: FakeMonotonic
    telemetry: FakeTelemetry
    installer: FakeInstall
    workspaces: FakeWorkspaces
    hook_failures: FakeHookFailures
    runtime: Runtime


def make_world(
    *,
    files: FakeDataHome | None = None,
    schema: FakeSchema | None = None,
    randomness: SequenceRandomness | None = None,
    input_data: bytes = b"",
    installer: FakeInstall | None = None,
    workspaces: FakeWorkspaces | None = None,
) -> World:
    home = FakeDataHome() if files is None else files
    fake_schema = FakeSchema() if schema is None else schema
    clock = FixedClock()
    entropy = SequenceRandomness() if randomness is None else randomness
    stdin = FakeInput(input_data)
    events = FakeEvents()
    capabilities = FakeCapabilities()
    monotonic = FakeMonotonic()
    telemetry = FakeTelemetry(events, capabilities)
    install = FakeInstall() if installer is None else installer
    roots = FakeWorkspaces() if workspaces is None else workspaces
    failures = FakeHookFailures(clock)
    runtime = Runtime(
        data_home=FAKE_DATA_HOME,
        files=home,
        schema=fake_schema,
        clock=clock,
        randomness=entropy,
        input=stdin,
        events=events,
        capabilities=capabilities,
        telemetry=telemetry,
        monotonic=monotonic,
        interpreter=InterpreterFacts(path="/usr/local/bin/python3.14", version="3.14.7"),
        installer=install,
        workspaces=roots,
        hook_failures=failures,
    )
    return World(
        files=home,
        schema=fake_schema,
        clock=clock,
        randomness=entropy,
        input=stdin,
        events=events,
        capabilities=capabilities,
        monotonic=monotonic,
        telemetry=telemetry,
        installer=install,
        workspaces=roots,
        hook_failures=failures,
        runtime=runtime,
    )
