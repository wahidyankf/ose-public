"""Capture: read one bounded canonical event, validate it before storage is touched, then store it."""

from dataclasses import dataclass

from ferret.application.maintenance import open_store
from ferret.application.ports import CaptureResult, Runtime
from ferret.application.privacy import CANONICAL_LIMIT_BYTES, validate_capture


@dataclass(frozen=True, slots=True)
class CaptureOutcome:
    """Whether the event was newly stored, and which event and hash the store now holds."""

    result: CaptureResult
    event_id: str
    event_hash: str


def capture_event(runtime: Runtime) -> CaptureOutcome:
    """Store the one canonical event on standard input.

    One byte past the canonical limit is read so an oversized event is detected without buffering it, and the whole
    payload is validated before the data home is inspected, so a rejected event never touches storage.
    """
    raw = runtime.input.read(CANONICAL_LIMIT_BYTES + 1)
    event = validate_capture(raw, now=runtime.clock.now())
    open_store(runtime)
    return CaptureOutcome(runtime.events.capture(event), event.event_id, event.event_hash)
