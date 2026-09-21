"""Populations that straddle the thirty-day cutoff, shared by the retention tests of every in-process adapter."""

from datetime import datetime, timedelta
from typing import Any

from ferret.domain.capability import CapabilitySnapshot, snapshot_from_document
from ferret.domain.event import Event
from support.populate import FAR_FUTURE, make_event, stamp
from support.snapshots import snapshot_document

CUTOFF = timedelta(days=30)
EXPIRED = timedelta(days=31)
FRESH = timedelta(hours=1)
SNAPSHOT_BASE = 5000


def expired_events(count: int, *, now: datetime, first: int = 1, tied: bool = False, **overrides: Any) -> list[Event]:
    """``count`` events captured beyond the cutoff, numbered from ``first``.

    By default the first expires earliest, so number order is prune order. With ``tied`` every event expires at the
    same instant and only the event ID orders them.
    """
    return [
        make_event(
            first + index,
            ago=EXPIRED if tied else EXPIRED + timedelta(seconds=count - index),
            now=now,
            **overrides,
        )
        for index in range(count)
    ]


def fresh_events(count: int, *, now: datetime, first: int = 1001, **overrides: Any) -> list[Event]:
    """``count`` events captured an hour before ``now``, still far inside retention."""
    return [
        make_event(first + index, ago=FRESH + timedelta(seconds=index), now=now, **overrides) for index in range(count)
    ]


def edge_events(now: datetime) -> tuple[Event, Event]:
    """The event that expires exactly at ``now`` (hidden), and the one a millisecond short of that (visible)."""
    return (
        make_event(2001, ago=CUTOFF, now=now),
        make_event(2002, ago=CUTOFF - timedelta(milliseconds=1), now=now),
    )


def aged_snapshot(number: int, *, now: datetime, ago: timedelta, harness: str = "codex") -> CapabilitySnapshot:
    """A capability snapshot with two items, captured ``ago`` before ``now``."""
    return snapshot_from_document(
        snapshot_document(
            snapshotId=f"00000000-0000-4000-8000-{SNAPSHOT_BASE + number:012d}",
            capturedAt=stamp(now - ago),
            harness=harness,
        ),
        now=FAR_FUTURE,
    )


def cutoff_stamp(now: datetime) -> str:
    """The moment thirty days before ``now``: a row captured then expires exactly at ``now``."""
    return stamp(now - CUTOFF)
