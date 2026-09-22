"""Reading events back: one bounded page for ``events list`` and one lazily streamed scan for export and summaries."""

from collections.abc import Iterator
from dataclasses import dataclass
from datetime import datetime

from ferret.application.maintenance import open_store
from ferret.application.ports import EventRepository, Runtime
from ferret.domain.errors import FerretError
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


def _require_live(runtime: Runtime, position: Position, now: datetime) -> None:
    """Refuse a cursor whose event is gone or expired, or whose timestamp disagrees with that event.

    The agreement check means a cursor forged around a real event ID cannot steer the scan to an arbitrary place.
    """
    referenced = runtime.events.find(position.event_id, now=now)
    if referenced is None or (referenced.occurred_at, referenced.event_id) != (position.occurred_at, position.event_id):
        raise FerretError("ferret.cursor.invalid")


def list_events(runtime: Runtime, options: Options) -> EventPage:
    """One page of events matching the filters, newest first.

    Every argument is validated before the data home is inspected, so a malformed request never touches storage.
    Pagination is keyset based: the page holds one more event than it returns to learn whether another follows.
    """
    now = runtime.clock.now()
    criteria = criteria_from_options(options, now=now)
    limit = parse_limit(options)
    digest = filter_digest(criteria, limit)
    cursor = single_value(options, "--cursor", refusal="ferret.args.invalid")
    after = None if cursor is None else decode_cursor(cursor, digest)
    open_store(runtime)
    if after is not None:
        _require_live(runtime, after, now)
    rows = runtime.events.read(criteria, now=now, newest_first=True, after=after, limit=limit + 1)
    items = rows[:limit]
    if len(rows) <= limit:
        return EventPage(items, None)
    last = items[-1]
    return EventPage(items, encode_cursor(Position(last.occurred_at, last.event_id), digest))


def _batches(events: EventRepository, criteria: EventCriteria, now: datetime) -> Iterator[Event]:
    after: Position | None = None
    while True:
        batch = events.read(criteria, now=now, newest_first=False, after=after, limit=BATCH_SIZE)
        yield from batch
        if len(batch) < BATCH_SIZE:
            return
        last = batch[-1]
        after = Position(last.occurred_at, last.event_id)


def scan_events(runtime: Runtime, options: Options) -> Iterator[Event]:
    """Every event matching the filters, oldest first by ``(occurredAt, eventId)``, read in batches on demand.

    The filters are validated and the store checked when this is called rather than when the first event is read, so
    a failure is raised before the caller has produced any output. The clock is read once, so the window and the
    expiry cannot shift while the scan runs.
    """
    now = runtime.clock.now()
    criteria = criteria_from_options(options, now=now)
    open_store(runtime)
    return _batches(runtime.events, criteria, now)


# An export writes exactly the scan, so it is the same function under the name its caller reads best.
export_events = scan_events
