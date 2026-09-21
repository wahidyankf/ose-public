"""Numbered, time-shifted events for query and analytics tests, and a fake machine already holding them."""

from datetime import UTC, datetime, timedelta
from typing import Any

from ferret.application.initialization import initialize_store
from ferret.domain.event import Event, event_from_document
from support.events import event_document
from support.fakes import FIXED_NOW, World, make_world

FAR_FUTURE = datetime(2030, 1, 1, tzinfo=UTC)
WORKSPACE_A = "ws_00000000000000000000000000000001"
WORKSPACE_B = "ws_00000000000000000000000000000002"

# The field values an event type that names no outcome and no duration must carry.
NO_OUTCOME: dict[str, Any] = {
    "outcome": "not_applicable",
    "durationMs": None,
    "outcomeVisibility": "not_applicable",
    "durationVisibility": "not_applicable",
}


def stamp(moment: datetime) -> str:
    """The canonical millisecond spelling of ``moment``, formatted independently of the code under test."""
    return f"{moment:%Y-%m-%dT%H:%M:%S}.{moment.microsecond // 1000:03d}Z"


def make_event(
    number: int, *, ago: timedelta = timedelta(seconds=1), now: datetime = FIXED_NOW, **overrides: Any
) -> Event:
    """One valid event that occurred, and was captured, ``ago`` before ``now``, numbered for a stable event ID.

    By default the event is a second old, so it lies inside the default window, whose end is exclusive.
    """
    moment = stamp(now - ago)
    fields: dict[str, Any] = {
        "eventId": f"00000000-0000-4000-8000-{number:012d}",
        "occurredAt": moment,
        "capturedAt": moment,
        **overrides,
    }
    return event_from_document(event_document(**fields), now=FAR_FUTURE)


def world_with(*events: Event, initialized: bool = True) -> World:
    """A fake machine, initialized unless told otherwise, whose event store already holds ``events``."""
    world = make_world()
    if initialized:
        initialize_store(world.runtime)
    world.events.stored.extend(events)
    return world


def numbers(items: tuple[Event, ...]) -> list[int]:
    """The test-assigned numbers of ``items``, read back from their event IDs."""
    return [int(item.event_id[-12:]) for item in items]


def event_shapes() -> list[dict[str, Any]]:
    """Five event shapes that between them fill every filterable column."""
    return [
        {},
        {"eventType": "tool.failed", "outcome": "failure", "toolName": "Write"},
        {"eventType": "skill.invoked", "skillName": "tdd", "toolName": None, **NO_OUTCOME},
        {"eventType": "agent.ended", "agentName": "reviewer", "toolName": None, "outcome": "cancelled"},
        {"eventType": "session.started", "toolName": None, "subjectVisibility": "not_applicable", **NO_OUTCOME},
    ]


def mixed_events(now: datetime) -> list[Event]:
    """Sixty events in groups of four sharing one timestamp, plus one expired and one that lies ahead of ``now``.

    The harness cycles through three, the workspace through two, and the shape through five, so every combination of
    those three columns appears and every event ID is unique.
    """
    harnesses = ("claude_code", "codex", "opencode")
    workspaces = (WORKSPACE_A, WORKSPACE_B)
    shapes = event_shapes()
    events = [
        make_event(
            index + 1,
            ago=timedelta(minutes=(index // 4) * 10),
            now=now,
            harness=harnesses[index % 3],
            workspaceId=workspaces[index % 2],
            **shapes[index % 5],
        )
        for index in range(60)
    ]
    events.append(make_event(101, ago=timedelta(days=31), now=now))
    events.append(make_event(102, ago=timedelta(hours=-2), now=now))
    return events
