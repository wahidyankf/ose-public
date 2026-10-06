"""When a row expires, when physical removal of expired telemetry is attempted, and how much one attempt may do.

Logical expiry needs no rule beyond the boundary ``expiry_of`` gives: a row is hidden from every reader once its
``expires_at`` is not after the reading's moment. The limits only govern the removal, which has no scheduler and so
rides on the next operation.
"""

from datetime import datetime, timedelta
from typing import Final

from typekit import Err

from ferret.domain.errors import FerretResult, as_internal_failure
from ferret.domain.storage import MAINTENANCE_INTERVAL_SECONDS, RETENTION_DAYS
from ferret.domain.timestamps import add_days, format_timestamp, parse_timestamp

# One attempt deletes at most this many events and capability snapshots, and stops when this much monotonic time is
# spent, counting the wait for the write lock. Whichever comes first ends the attempt.
PRUNE_ROW_LIMIT: Final = 100
PRUNE_BUDGET_MS: Final = 100
# Once a run has drained every expired row, the next attempt is not due for the interval the config records.
MAINTENANCE_INTERVAL: Final = timedelta(seconds=MAINTENANCE_INTERVAL_SECONDS)
# A row that will expire within this window is reported as near expiry.
NEAR_EXPIRY_WINDOW: Final = timedelta(hours=72)


def expiry_of(captured_at: str) -> FerretResult[str]:
    """The logical retention boundary of a row captured at ``captured_at``: ``RETENTION_DAYS`` days later.

    A capture time that is no real moment is a defect no validated event or snapshot carries, so it is an internal
    failure.
    """
    return (
        parse_timestamp(captured_at)
        .flat_map(lambda captured: format_timestamp(add_days(captured, RETENTION_DAYS)))
        .map_err(as_internal_failure)
    )


def is_due(last_completed_at: str | None, now: datetime) -> bool:
    """Whether the next operation should attempt a prune.

    Maintenance is due when no run has completed, when the last one is at least ``MAINTENANCE_INTERVAL`` old, and
    when its marker is ahead of ``now`` or unreadable, since a clock that jumped must not silence retention.
    """
    if last_completed_at is None:
        return True
    parsed = parse_timestamp(last_completed_at)
    if isinstance(parsed, Err):
        return True
    completed = parsed.value
    return not completed <= now < completed + MAINTENANCE_INTERVAL
