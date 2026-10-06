"""Physical space: what a store weighs, when a rewrite of it is worth the cost, and the size it is held to."""

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Final, Literal

from typekit import Err, Ok, Result

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


def high_water_bytes(measurements: Iterable[StorageFacts]) -> Result[int, ValueError]:
    """The largest footprint among ``measurements``, so a peak taken mid-operation is never reported as smaller."""
    footprints = [facts.footprint_bytes for facts in measurements]
    if not footprints:
        return Err(ValueError("a high-water mark needs at least one measurement"))
    return Ok(max(footprints))


def should_compact(facts: StorageFacts) -> bool:
    """Whether the free pages are worth a full rewrite: at least the absolute amount and the share of the file."""
    return (
        facts.freelist_bytes >= COMPACTION_MIN_FREELIST_BYTES
        and facts.freelist_bytes >= COMPACTION_MIN_FREELIST_SHARE * facts.database_bytes
    )


def bytes_per_event(database_bytes: int, events: int) -> Result[float, ValueError]:
    if events <= 0:
        return Err(ValueError("bytes per event is undefined without events"))
    return Ok(database_bytes / events)


def index_share(index_bytes: int, database_bytes: int) -> Result[float, ValueError]:
    """The fraction of the database file that its indexes hold."""
    if database_bytes <= 0:
        return Err(ValueError("the index share of an empty database is undefined"))
    return Ok(index_bytes / database_bytes)


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


def size_report(
    *, events: int, database_bytes: int, index_bytes: int, explanation: str | None = None
) -> Result[SizeReport, ValueError]:
    """The storage acceptance gate: inside the envelope, or outside it and explained, or outside it and not.

    An explanation is kept only when it is needed and is not blank; a size inside the envelope needs none. Either
    figure the report divides by being zero makes it an ``Err``.
    """

    def report(per_event: float, share: float) -> SizeReport:
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
            index_share=share,
            acceptance=acceptance,
            explanation=reason,
        )

    return bytes_per_event(database_bytes, events).flat_map(
        lambda per_event: index_share(index_bytes, database_bytes).map(lambda share: report(per_event, share))
    )
