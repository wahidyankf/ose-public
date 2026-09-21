"""When physical removal of expired telemetry is attempted, and how much of it one attempt may do.

Logical expiry needs no rule of its own: a row is hidden from every reader once its ``expires_at`` is not after the
reading's moment. These limits only govern the removal, which has no scheduler and so rides on the next operation.
"""

from datetime import datetime, timedelta
from typing import Final

from ferret.domain.storage import MAINTENANCE_INTERVAL_SECONDS
from ferret.domain.timestamps import parse_timestamp

# One attempt deletes at most this many events and capability snapshots, and stops when this much monotonic time is
# spent, counting the wait for the write lock. Whichever comes first ends the attempt.
PRUNE_ROW_LIMIT: Final = 100
PRUNE_BUDGET_MS: Final = 100
# Once a run has drained every expired row, the next attempt is not due for the interval the config records.
MAINTENANCE_INTERVAL: Final = timedelta(seconds=MAINTENANCE_INTERVAL_SECONDS)
# A row that will expire within this window is reported as near expiry.
NEAR_EXPIRY_WINDOW: Final = timedelta(hours=72)


def is_due(last_completed_at: str | None, now: datetime) -> bool:
    """Whether the next operation should attempt a prune.

    Maintenance is due when no run has completed, when the last one is at least ``MAINTENANCE_INTERVAL`` old, and
    when its marker is ahead of ``now`` or unreadable, since a clock that jumped must not silence retention.
    """
    if last_completed_at is None:
        return True
    try:
        completed = parse_timestamp(last_completed_at)
    except ValueError:
        return True
    return not completed <= now < completed + MAINTENANCE_INTERVAL
