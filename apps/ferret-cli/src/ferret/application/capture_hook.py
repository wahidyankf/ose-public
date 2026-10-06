"""Capture from a raw harness hook: the one place a vendor payload becomes a canonical event.

The payload is read, reduced to allowlisted scalars, mapped to lifecycle facts, and sealed into an event before the
store is opened for writing, so the raw bytes exist only in this process's memory and are dropped before SQLite is
touched. Every refusal is a returned failure or ``None``; turning all of them into a silent exit belongs to the command
that fronts this, because a hook must never disturb the harness that called it.
"""

from dataclasses import replace
from datetime import datetime

from typekit import Ok

from ferret.application.maintenance import prune_due
from ferret.application.ports import Budget, CaptureResult, Runtime
from ferret.application.privacy import RAW_LIMIT_BYTES, project_hook_payload
from ferret.application.store import installation_id_from, read_key, require_initialized
from ferret.domain.errors import FerretResult, as_internal_failure
from ferret.domain.event import EVENT_SCHEMA_VERSION, Event, event_from_document, event_hash
from ferret.domain.hook import HookFacts, allowed_paths, map_hook
from ferret.domain.identity import derive_identifier
from ferret.domain.storage import IDENTITY_FILE
from ferret.domain.timestamps import format_timestamp

_UNSEALED_HASH = "0" * 64
# A harness call must return inside the deadline AC-CLI-04 states, whatever the store is doing, so the wait for
# the write lock is bounded here rather than left to the durable default. The prune before it carries its own
# budget, and the two together leave the rest of the second to the interpreter and the mapping.
HOOK_CAPTURE_BUDGET_MS = 250


def _installation(runtime: Runtime) -> FerretResult[tuple[bytes, str]]:
    """The installation's key and ID, once the store is initialized and both of them are usable."""
    files = runtime.files
    return (
        require_initialized(files)
        .flat_map(lambda _: read_key(files))
        .flat_map(
            lambda key: installation_id_from(files.read_file(IDENTITY_FILE)).map(
                lambda installation: (key, installation)
            )
        )
    )


def _draft(runtime: Runtime, harness: str, facts: HookFacts, key: bytes, installation: str, moment: str) -> Event:
    """The event ``facts`` describe, with its identifiers derived under ``key`` and its hash not yet sealed."""
    return Event(
        schema_version=EVENT_SCHEMA_VERSION,
        event_id=runtime.randomness.uuid4(),
        event_hash=_UNSEALED_HASH,
        occurred_at=moment,
        captured_at=moment,
        harness=harness,
        harness_version=facts.harness_version,
        installation_id=installation,
        workspace_id=derive_identifier(key, "ws", runtime.workspaces.root_of(facts.directory)),
        session_id=derive_identifier(key, "ss", harness, facts.session),
        parent_session_id=(
            None if facts.parent_session is None else derive_identifier(key, "ss", harness, facts.parent_session)
        ),
        event_type=facts.event_type,
        agent_name=facts.agent_name,
        skill_name=facts.skill_name,
        tool_name=facts.tool_name,
        outcome=facts.outcome,
        duration_ms=facts.duration_ms,
        subject_visibility=facts.subject_visibility,
        outcome_visibility=facts.outcome_visibility,
        duration_visibility=facts.duration_visibility,
    )


def _sealed(draft: Event, now: datetime) -> FerretResult[Event]:
    """The draft with its hash filled in, validated as strictly as an event captured directly."""
    return event_hash(draft).flat_map(
        lambda digest: event_from_document(replace(draft, event_hash=digest).to_document(), now=now)
    )


def _seal(runtime: Runtime, harness: str, facts: HookFacts, held: tuple[bytes, str]) -> FerretResult[Event]:
    """The event ``facts`` describe under the installation's ``(key, ID)``, stamped with the current time and sealed."""
    key, installation = held
    now = runtime.clock.now()
    return (
        format_timestamp(now)
        .map_err(as_internal_failure)
        .map(lambda moment: _draft(runtime, harness, facts, key, installation, moment))
        .flat_map(lambda draft: _sealed(draft, now))
    )


def _store(runtime: Runtime, sealed: Event) -> CaptureResult:
    """Give retention its bounded turn, and then store the event inside the hook's own deadline."""
    prune_due(runtime)
    return runtime.events.capture(sealed, budget=Budget.start(runtime.monotonic, HOOK_CAPTURE_BUDGET_MS))


def _capture(runtime: Runtime, harness: str, facts: HookFacts | None) -> FerretResult[CaptureResult | None]:
    """Store the event ``facts`` describe, or nothing when the payload described none."""
    if facts is None:
        return Ok(None)
    return (
        _installation(runtime)
        .flat_map(lambda held: _seal(runtime, harness, facts, held))
        .map(lambda sealed: _store(runtime, sealed))
    )


def capture_hook(runtime: Runtime, *, harness: str, event: str) -> FerretResult[CaptureResult | None]:
    """Store the event the raw hook payload on standard input states for ``event``, or store nothing and say ``None``.

    One byte past the raw limit is read so an oversized payload is refused without being buffered. Identifiers are
    derived here, under the installation key, from the harness's session value and the repository root of the
    directory it reported; neither raw value is kept. The sealed event then goes through the same validation as a
    directly captured one, so a mapper mistake can never store an invalid row.
    """
    paths = allowed_paths(harness)
    if not paths:
        return Ok(None)
    return project_hook_payload(runtime.input.read(RAW_LIMIT_BYTES + 1), paths).flat_map(
        lambda payload: _capture(runtime, harness, map_hook(harness, event, payload))
    )
