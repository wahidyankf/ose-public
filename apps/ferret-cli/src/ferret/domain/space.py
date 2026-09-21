"""Physical space: what a store weighs, when a rewrite of it is worth the cost, and the size it is held to."""

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Final, Literal

KIB: Final = 1024
MIB: Final = 1024 * KIB

# The planning envelope for one stored event, database bytes divided by events. A result outside it blocks completion
# until the schema and index policy or the documented budget is corrected, or the size is explained.
ENVELOPE_MIN_BYTES_PER_EVENT: Final = 0.7 * KIB
ENVELOPE_MAX_BYTES_PER_EVENT: Final = 1.5 * KIB

# Compaction rewrites the whole file, so it runs only when the free pages are both a large amount and a large share.
COMPACTION_MIN_FREELIST_BYTES: Final = 16 * MIB
COMPACTION_MIN_FREELIST_SHARE: Final = 0.25

type Acceptance = Literal["within_envelope", "explained", "unexplained"]


@dataclass(frozen=True, slots=True)
class StorageFacts:
    """The physical size of a store: its two files and the free pages inside the database file, in bytes."""

    database_bytes: int
    wal_bytes: int
    freelist_bytes: int

    @property
    def footprint_bytes(self) -> int:
        """What the store occupies on disk at this moment: the database file and its write-ahead log together."""
        return self.database_bytes + self.wal_bytes


def high_water_bytes(measurements: Iterable[StorageFacts]) -> int:
    """The largest footprint among ``measurements``, so a peak taken mid-operation is never reported as smaller."""
    footprints = [facts.footprint_bytes for facts in measurements]
    if not footprints:
        raise ValueError("a high-water mark needs at least one measurement")
    return max(footprints)


def should_compact(facts: StorageFacts) -> bool:
    """Whether the free pages are worth a full rewrite: at least the absolute amount and the share of the file."""
    return (
        facts.freelist_bytes >= COMPACTION_MIN_FREELIST_BYTES
        and facts.freelist_bytes >= COMPACTION_MIN_FREELIST_SHARE * facts.database_bytes
    )


def bytes_per_event(database_bytes: int, events: int) -> float:
    if events <= 0:
        raise ValueError("bytes per event is undefined without events")
    return database_bytes / events


def index_share(index_bytes: int, database_bytes: int) -> float:
    """The fraction of the database file that its indexes hold."""
    if database_bytes <= 0:
        raise ValueError("the index share of an empty database is undefined")
    return index_bytes / database_bytes


@dataclass(frozen=True, slots=True)
class SizeReport:
    """A measured size against the planning envelope, with the explanation that lets an outside size pass."""

    events: int
    database_bytes: int
    index_bytes: int
    bytes_per_event: float
    index_share: float
    acceptance: Acceptance
    explanation: str | None

    @property
    def passes(self) -> bool:
        return self.acceptance != "unexplained"


def size_report(*, events: int, database_bytes: int, index_bytes: int, explanation: str | None = None) -> SizeReport:
    """The storage acceptance gate: inside the envelope, or outside it and explained, or outside it and not.

    An explanation is kept only when it is needed and is not blank; a size inside the envelope needs none.
    """
    per_event = bytes_per_event(database_bytes, events)
    reason = (explanation or "").strip() or None
    acceptance: Acceptance
    if ENVELOPE_MIN_BYTES_PER_EVENT <= per_event <= ENVELOPE_MAX_BYTES_PER_EVENT:
        acceptance, reason = "within_envelope", None
    else:
        acceptance = "unexplained" if reason is None else "explained"
    return SizeReport(
        events=events,
        database_bytes=database_bytes,
        index_bytes=index_bytes,
        bytes_per_event=per_event,
        index_share=index_share(index_bytes, database_bytes),
        acceptance=acceptance,
        explanation=reason,
    )
