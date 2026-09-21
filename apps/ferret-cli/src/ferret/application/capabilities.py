"""Capability snapshots: recording them under the store's guards, and reading what they say about a dimension."""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Final

from ferret.application.maintenance import open_store
from ferret.application.ports import CaptureResult, Runtime
from ferret.domain.capability import CapabilitySnapshot, snapshot_from_document

# The reporting dimensions a capability gates. Every other dimension is read from a field each event states itself.
CAPABILITY_OF_DIMENSION: Final[Mapping[str, str]] = {
    "agent": "agent_lifecycle",
    "skill": "skill_invocation",
    "tool": "tool_lifecycle",
    "outcome": "outcome",
    "duration": "duration",
}


@dataclass(frozen=True, slots=True)
class DimensionReport:
    """How visible one dimension is for a harness, and the count that may honestly be reported for it.

    ``observed_count`` is ``None`` when the dimension is unknown and nothing was recorded: an absent signal is not a
    count of zero.
    """

    dimension: str
    visibility: str
    observed_count: int | None


def record_snapshot(runtime: Runtime, document: Mapping[str, Any]) -> CaptureResult:
    """Validate one decoded snapshot before storage is touched, then store it.

    The same snapshot ID with the same content is a duplicate, and with different content an idempotency conflict.
    """
    snapshot = snapshot_from_document(document, now=runtime.clock.now())
    open_store(runtime)
    return runtime.capabilities.store_snapshot(snapshot)


def dimension_visibility(snapshot: CapabilitySnapshot | None, dimension: str) -> str:
    """The visibility a harness's latest snapshot gives ``dimension``: observed, derived, or unknown.

    A dimension a capability gates is unknown when the harness has never reported or its snapshot omits that
    capability. A dimension every event states itself needs no capability and is observed.
    """
    name = CAPABILITY_OF_DIMENSION.get(dimension)
    if name is None:
        return "observed"
    held = () if snapshot is None else snapshot.capabilities
    return {item.name: item.state for item in held}.get(name, "unknown")


def report_dimension(snapshot: CapabilitySnapshot | None, dimension: str, *, recorded: int) -> DimensionReport:
    """Pair a dimension's visibility with the count recorded for it, withholding a zero the harness cannot support.

    Events that were recorded are always counted. A zero is reported only where the dimension is visible, so an
    unobservable skill lifecycle is never presented as zero invocations.
    """
    visibility = dimension_visibility(snapshot, dimension)
    unsupported_zero = visibility == "unknown" and recorded == 0
    return DimensionReport(dimension, visibility, None if unsupported_zero else recorded)
