"""The ports every use case is written against; adapters implement them and Unit tests fake them."""

from contextlib import AbstractContextManager
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal, Protocol

from ferret.domain.capability import CapabilitySnapshot
from ferret.domain.event import Event
from ferret.domain.install import InstallPaths
from ferret.domain.query import EventCriteria, Position
from ferret.domain.space import StorageFacts

type Kind = Literal["missing", "file", "directory", "symlink", "other"]
type CaptureResult = Literal["stored", "duplicate"]


@dataclass(frozen=True, slots=True)
class FileFacts:
    """What a stat says about one object in the data home, read without following a symlink."""

    kind: Kind
    mode: int = 0
    owned_by_current_user: bool = True
    link_count: int = 1


@dataclass(frozen=True, slots=True)
class SchemaState:
    """The schema a database ended at, and whether this call created or upgraded it."""

    number: int
    applied_now: bool


class Clock(Protocol):
    def now(self) -> datetime:
        """The current moment as an aware UTC datetime."""
        ...


class Monotonic(Protocol):
    def now_ns(self) -> int:
        """A reading of a clock that never goes backwards, in nanoseconds from an arbitrary origin."""
        ...


@dataclass(frozen=True, slots=True)
class Budget:
    """A span of monotonic time one piece of work may spend, started when it is created.

    Every question reads the clock once, so a test can fix how much time each row costs. The span is a limit on
    monotonic time only; it says nothing about the wall clock, which may step at any moment.
    """

    clock: Monotonic
    limit_ns: int
    started_ns: int

    @classmethod
    def start(cls, clock: Monotonic, limit_ms: int) -> Budget:
        return cls(clock=clock, limit_ns=limit_ms * 1_000_000, started_ns=clock.now_ns())

    def elapsed_ms(self) -> int:
        return (self.clock.now_ns() - self.started_ns) // 1_000_000

    def remaining_ms(self) -> int:
        return max(0, (self.limit_ns - (self.clock.now_ns() - self.started_ns)) // 1_000_000)

    def spent(self) -> bool:
        return self.clock.now_ns() - self.started_ns >= self.limit_ns


class Randomness(Protocol):
    def uuid4(self) -> str:
        """A fresh lowercase UUIDv4 in canonical text form."""
        ...

    def token_bytes(self, count: int) -> bytes:
        """``count`` cryptographically random bytes."""
        ...


class DataHomeFiles(Protocol):
    """The private data-home directory and its files, all addressed by bare name."""

    def facts(self, name: str | None) -> FileFacts:
        """Facts about the directory (``None``) or one file, never following a symlink."""
        ...

    def ensure_directory(self, mode: int) -> None:
        """Create the directory with ``mode`` if it is absent; an existing one is left alone."""
        ...

    def create_file(self, name: str, content: bytes, mode: int) -> None:
        """Create a new file exclusively with ``mode`` and flush it; refuse an existing object or a symlink."""
        ...

    def read_file(self, name: str) -> bytes:
        """Read a small file without following a symlink."""
        ...

    def lock(self) -> AbstractContextManager[None]:
        """Hold the exclusive data-home lock, waiting a bounded time for another holder."""
        ...

    def purge(self) -> None:
        """Delete the data-home directory and everything in it; an absent directory is already purged."""
        ...


class Schema(Protocol):
    def migrate(self) -> SchemaState:
        """Apply every known forward migration transactionally; refuse a schema newer than this build."""
        ...


class Input(Protocol):
    def read(self, limit: int) -> bytes:
        """Standard input read until EOF or ``limit`` bytes, whichever comes first."""
        ...


class EventRepository(Protocol):
    def capture(self, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        """Durably store one validated event, or report that the same event is already stored.

        ``budget`` is how long the wait for the write lock may last, for a caller that has a deadline of its own;
        ``None`` means the durable default, which waits rather than dropping an event.
        """
        ...

    def read(
        self,
        criteria: EventCriteria,
        *,
        now: datetime,
        newest_first: bool,
        after: Position | None,
        limit: int,
    ) -> tuple[Event, ...]:
        """Up to ``limit`` events that match ``criteria`` and have not expired at ``now``, in one total order.

        The order is ``(occurredAt, eventId)``, descending when ``newest_first``. With ``after`` set, only events
        strictly beyond that position in the order are returned. Each call is one consistent read that holds nothing
        open afterwards.
        """
        ...

    def find(self, event_id: str, *, now: datetime) -> Event | None:
        """The event with ``event_id`` if it has not expired at ``now``, whatever any query's filters were."""
        ...


class CapabilityRepository(Protocol):
    def store_snapshot(self, snapshot: CapabilitySnapshot) -> CaptureResult:
        """Durably store one validated snapshot with its items, or report that it is already stored.

        The same snapshot ID with different content is an idempotency conflict, and nothing is changed.
        """
        ...

    def latest_snapshot(self, harness: str, *, now: datetime) -> CapabilitySnapshot | None:
        """The newest snapshot for ``harness`` that has not expired at ``now``, or ``None`` when there is none."""
        ...


@dataclass(frozen=True, slots=True)
class PruneResult:
    """What one bounded prune did.

    ``skipped`` means nothing was attempted or nothing committed, because the write lock could not be taken inside
    the budget or the budget was already gone. ``remaining`` says an expired row was still stored after the commit.
    ``completed`` is true only for a transaction that deleted nothing and saw nothing expired.
    """

    state: Literal["pruned", "skipped"]
    events: int = 0
    snapshots: int = 0
    workspaces: int = 0
    remaining: bool = False
    completed: bool = False


@dataclass(frozen=True, slots=True)
class ExpiryCounters:
    """The operational counters of rows that expired locally, kept across upgrades."""

    local_total: int
    before_ack_total: int


@dataclass(frozen=True, slots=True)
class StoreCounts:
    """What the store holds as of one moment: live rows, the oldest live capture, and rows about to go or already gone.

    Live means not expired at that moment. ``logically_expired`` counts the events and snapshots that are expired but
    not yet physically removed.
    """

    events: int
    snapshots: int
    oldest_captured_at: str | None
    near_expiry: int
    logically_expired: int


@dataclass(frozen=True, slots=True)
class Compaction:
    """How a rewrite of the database ended, and the files as they stood the moment it did.

    A rewrite goes through the write-ahead log, so ``measured`` is taken before the log is folded away and is the
    largest the two files are together. A ``failed`` rewrite leaves the readable original untouched.
    """

    outcome: Literal["compacted", "failed"]
    measured: StorageFacts


@dataclass(frozen=True, slots=True)
class InterpreterFacts:
    """The interpreter the process is running on, as the platform reports it; either field may be empty."""

    path: str
    version: str


class TelemetryRepository(Protocol):
    """Physical retention and space, and the counters and marker they keep; logical expiry is the readers' job."""

    def last_completed_at(self) -> str | None:
        """When a prune last found nothing left to delete, or ``None`` when none ever did."""
        ...

    def prune_batch(self, *, now: datetime, limit: int, budget: Budget) -> PruneResult:
        """Delete up to ``limit`` rows that expired at or before ``now`` in one transaction, inside ``budget``.

        Events and then capability snapshots are taken in ``(expires_at, id)`` order, and a snapshot takes its items
        with it. Workspaces left with no event go too. The local expiry counter grows in the same commit by the events
        and snapshots deleted, and the completion marker moves only when nothing was deleted and nothing expired
        remains. A lock that cannot be taken inside the remaining budget, or any failure, changes nothing.
        """
        ...

    def expiry_counters(self) -> ExpiryCounters:
        """The two expiry counters as they stand now."""
        ...

    def schema_number(self) -> int:
        """The newest schema migration applied to the database."""
        ...

    def storage_facts(self) -> StorageFacts:
        """The sizes of the database file and its log, and the free pages, taken before this call opens anything.

        An absent log is zero bytes. Reading the sizes first means a log left unfolded is reported as it stands and not
        as this call's own connection leaves it.
        """
        ...

    def counts(self, *, now: datetime, near_expiry_within: timedelta) -> StoreCounts:
        """Live and expired rows as of ``now``, one consistent read; near expiry ends within ``near_expiry_within``."""
        ...

    def check_integrity(self, *, thorough: bool) -> bool:
        """Whether the database passes SQLite's integrity check: the quick probe, or the whole file when thorough."""
        ...

    def checkpoint(self) -> Literal["truncated", "skipped"]:
        """Fold the log into the database and truncate it, unless an active reader or writer holds it, and never wait.

        A skipped checkpoint changes nothing.
        """
        ...

    def compact(self) -> Compaction:
        """Rewrite the database without its free pages, or fail with the original readable and unchanged."""
        ...


@dataclass(frozen=True, slots=True)
class SourceArtifact:
    """The artifact this process runs from: where its bytes can be read and their SHA-256."""

    path: Path
    sha256: str


@dataclass(frozen=True, slots=True)
class InstalledFacts:
    """What one installed object is, read without following a symlink.

    A regular file carries the SHA-256 of its bytes and a symlink carries the path it points at; a file too large
    to be a FERRET artifact carries an empty digest, which no artifact has.
    """

    kind: Kind
    mode: int = 0
    owned_by_current_user: bool = True
    sha256: str | None = None
    target: str | None = None


@dataclass(frozen=True, slots=True)
class StagePlan:
    """What an install is about to write: the version it installs and the manifest bytes that will record it."""

    version: str
    manifest: bytes


@dataclass(frozen=True, slots=True)
class StagedInstall:
    """The three staged files an install has written beside their final names, ready to replace them."""

    version: str
    artifact: Path
    launcher: Path
    manifest: Path


class UserInstall(Protocol):
    """The current user's install area. Every mutating call is one step, so a crash can only fall between steps."""

    @property
    def paths(self) -> InstallPaths:
        """Where this user's artifact, launcher, and manifest live."""
        ...

    @property
    def path_variable(self) -> str:
        """The ``PATH`` value the process was started with."""
        ...

    def source(self) -> SourceArtifact:
        """The running artifact and its digest, or ``storage_unavailable`` when it cannot be read as a file."""
        ...

    def facts(self, path: Path) -> InstalledFacts:
        """Facts about one object, never following a symlink; an object that cannot exist reads as missing."""
        ...

    def read_manifest(self) -> bytes | None:
        """The manifest file's bytes without following a symlink, or ``None`` when there is none."""
        ...

    def recover(self) -> None:
        """Delete every staged file an interrupted install left, and nothing else."""
        ...

    def stage(self, plan: StagePlan) -> StagedInstall:
        """Create any missing private directory and write, flush, and verify the three staged files.

        Nothing final is touched, and a failure leaves no staged file of this call behind.
        """
        ...

    def replace_artifact(self, staged: StagedInstall) -> None:
        """Atomically replace the version's artifact with its staged copy and flush the directory."""
        ...

    def replace_launcher(self, staged: StagedInstall) -> None:
        """Atomically replace the launcher with its staged link and flush the directory."""
        ...

    def replace_manifest(self, staged: StagedInstall) -> None:
        """Atomically replace the manifest with its staged copy and flush the directory: the ownership commit."""
        ...

    def remove(self, path: Path) -> None:
        """Delete one file or link; one already gone is not an error."""
        ...

    def remove_empty_directory(self, path: Path) -> None:
        """Delete a directory only if it is empty; a directory that is missing or still holds anything stays."""
        ...


class WorkspaceRoots(Protocol):
    """Where a harness's reported working directory belongs: the repository root that holds it."""

    def root_of(self, directory: str) -> str:
        """The normalized root of the repository containing ``directory``, or ``directory`` itself outside any.

        Symlinks are resolved so one repository reached by two paths is one workspace. A directory that does not exist
        is not an error: it is its own root, so a payload naming a path this machine lacks still identifies it.
        """
        ...


@dataclass(frozen=True, slots=True)
class Runtime:
    """One process's wiring: the resolved data home and the ports every use case needs."""

    data_home: Path
    files: DataHomeFiles
    schema: Schema
    clock: Clock
    randomness: Randomness
    input: Input
    events: EventRepository
    capabilities: CapabilityRepository
    telemetry: TelemetryRepository
    monotonic: Monotonic
    interpreter: InterpreterFacts
    installer: UserInstall
    workspaces: WorkspaceRoots
