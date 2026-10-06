"""Reading events back: one bounded page for ``events list`` and one lazily streamed scan for export and summaries."""

from collections.abc import Iterator
from dataclasses import dataclass
from datetime import datetime

from typekit import Err, Ok

from ferret.application.maintenance import open_store
from ferret.application.ports import EventRepository, Runtime
from ferret.domain.errors import FerretError, FerretResult
from ferret.domain.event import Event
from ferret.domain.query import (
    EventCriteria,
    Options,
    Position,
    criteria_from_options,
    decode_cursor,
    encode_cursor,
    filter_digest,
    parse_limit,
    single_value,
)

# How many events one repository read returns while streaming. A module value rather than a parameter so a test can
# shrink it and cross a batch boundary with a handful of events.
BATCH_SIZE = 500


@dataclass(frozen=True, slots=True)
class EventPage:
    """One page of events, newest first, and the cursor that resumes after it when more events remain."""

    items: tuple[Event, ...]
    next_cursor: str | None


@dataclass(frozen=True, slots=True)
class _Listing:
    """Every argument of one page request, validated: the filters, the page size, the query's digest, and the place."""

    criteria: EventCriteria
    limit: int
    digest: str
    after: Position | None


def _after(options: Options, digest: str) -> FerretResult[Position | None]:
    """The position the ``--cursor`` option resumes after, or ``None`` for the first page."""
    return single_value(options, "--cursor", refusal="ferret.args.invalid").flat_map(
        lambda cursor: Ok(None) if cursor is None else decode_cursor(cursor, digest)
    )


def _listing(options: Options, now: datetime) -> FerretResult[_Listing]:
    """The validated request, or the first argument that is refused: filters, then size, then the cursor."""
    return criteria_from_options(options, now=now).flat_map(
        lambda criteria: parse_limit(options).flat_map(
            lambda limit: filter_digest(criteria, limit).flat_map(
                lambda digest: _after(options, digest).map(lambda after: _Listing(criteria, limit, digest, after))
            )
        )
    )


def _require_live(runtime: Runtime, position: Position, now: datetime) -> FerretResult[None]:
    """Refuse a cursor whose event is gone or expired, or whose timestamp disagrees with that event.

    The agreement check means a cursor forged around a real event ID cannot steer the scan to an arbitrary place.
    """
    referenced = runtime.events.find(position.event_id, now=now)
    if referenced is None or (referenced.occurred_at, referenced.event_id) != (position.occurred_at, position.event_id):
        return Err(FerretError("ferret.cursor.invalid"))
    return Ok(None)


def _read_page(runtime: Runtime, listing: _Listing, now: datetime) -> FerretResult[EventPage]:
    """One more row than the page size is read, so a row left over says a cursor is owed."""
    rows = runtime.events.read(
        listing.criteria, now=now, newest_first=True, after=listing.after, limit=listing.limit + 1
    )
    items = rows[: listing.limit]
    if len(rows) <= listing.limit:
        return Ok(EventPage(items, None))
    last = items[-1]
    return encode_cursor(Position(last.occurred_at, last.event_id), listing.digest).map(
        lambda cursor: EventPage(items, cursor)
    )


def _page(runtime: Runtime, listing: _Listing, now: datetime) -> FerretResult[EventPage]:
    """The page of a validated request, once the store has been opened and a cursor has been found still live."""
    open_store(runtime)
    live = Ok(None) if listing.after is None else _require_live(runtime, listing.after, now)
    return live.flat_map(lambda _: _read_page(runtime, listing, now))


def list_events(runtime: Runtime, options: Options) -> FerretResult[EventPage]:
    """One page of events matching the filters, newest first, or the refusal of the first argument that is not valid.

    Every argument is validated before the data home is inspected, so a malformed request never touches storage.
    Pagination is keyset based: the page holds one more event than it returns to learn whether another follows.
    """
    now = runtime.clock.now()
    return _listing(options, now).flat_map(lambda listing: _page(runtime, listing, now))


def _batches(events: EventRepository, criteria: EventCriteria, now: datetime) -> Iterator[Event]:
    after: Position | None = None
    while True:
        batch = events.read(criteria, now=now, newest_first=False, after=after, limit=BATCH_SIZE)
        yield from batch
        if len(batch) < BATCH_SIZE:
            return
        last = batch[-1]
        after = Position(last.occurred_at, last.event_id)


def _scan(runtime: Runtime, criteria: EventCriteria, now: datetime) -> Iterator[Event]:
    """The lazy batches of a validated scan, once the store has been opened."""
    open_store(runtime)
    return _batches(runtime.events, criteria, now)


def scan_events(runtime: Runtime, options: Options) -> FerretResult[Iterator[Event]]:
    """Every event matching the filters, oldest first by ``(occurredAt, eventId)``, read in batches on demand.

    The filters are validated and the store checked when this is called rather than when the first event is read, so
    a refusal comes back before the caller has produced any output. The clock is read once, so the window and the
    expiry cannot shift while the scan runs.
    """
    now = runtime.clock.now()
    return criteria_from_options(options, now=now).map(lambda criteria: _scan(runtime, criteria, now))


# An export writes exactly the scan, so it is the same function under the name its caller reads best.
export_events = scan_events
