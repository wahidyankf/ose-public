"""Capture from a raw harness hook: the one place a vendor payload becomes a canonical event.

The payload is read, reduced to allowlisted scalars, mapped to lifecycle facts, and sealed into an event before the
store is opened for writing, so the raw bytes exist only in this process's memory and are dropped before SQLite is
touched. Every refusal is a raised failure or ``None``; turning all of them into a silent exit belongs to the command
that fronts this, because a hook must never disturb the harness that called it.
"""

from dataclasses import replace

from ferret.application.maintenance import prune_due
from ferret.application.ports import CaptureResult, Runtime
from ferret.application.privacy import RAW_LIMIT_BYTES, project_hook_payload
from ferret.application.store import installation_id_from, read_key, require_initialized
from ferret.domain.event import EVENT_SCHEMA_VERSION, Event, event_from_document, event_hash
from ferret.domain.hook import allowed_paths, map_hook
from ferret.domain.identity import derive_identifier
from ferret.domain.storage import IDENTITY_FILE
from ferret.domain.timestamps import format_timestamp

_UNSEALED_HASH = "0" * 64


def capture_hook(runtime: Runtime, *, harness: str, event: str) -> CaptureResult | None:
    """Store the event the raw hook payload on standard input states for ``event``, or store nothing and say ``None``.

    One byte past the raw limit is read so an oversized payload is refused without being buffered. Identifiers are
    derived here, under the installation key, from the harness's session value and the repository root of the
    directory it reported; neither raw value is kept. The sealed event then goes through the same validation as a
    directly captured one, so a mapper mistake can never store an invalid row.
    """
    paths = allowed_paths(harness)
    if not paths:
        return None
    facts = map_hook(harness, event, project_hook_payload(runtime.input.read(RAW_LIMIT_BYTES + 1), paths))
    if facts is None:
        return None
    require_initialized(runtime.files)
    key = read_key(runtime.files)
    installation = installation_id_from(runtime.files.read_file(IDENTITY_FILE))
    now = runtime.clock.now()
    moment = format_timestamp(now)
    draft = Event(
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
    sealed = event_from_document(replace(draft, event_hash=event_hash(draft)).to_document(), now=now)
    prune_due(runtime)
    return runtime.events.capture(sealed)
