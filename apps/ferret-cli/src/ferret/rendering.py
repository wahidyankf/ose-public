"""Serializers: every command's JSON object and its human text derive from the same result."""

import json
from collections.abc import Iterable, Mapping, Sized
from typing import Any, Final

from ferret.application.analytics import Dimension, OutcomeRow, Summary, UsageRow
from ferret.application.capture import CaptureOutcome
from ferret.application.initialization import InitResult
from ferret.application.install import InstallOutcome, UninstallOutcome
from ferret.application.maintenance import MaintenanceReport
from ferret.application.queries import EventPage
from ferret.application.status import StatusReport
from ferret.cli import OutputMode
from ferret.domain.errors import EXIT_NEGATIVE_RESULT, EXIT_SUCCESS
from ferret.domain.event import Event
from ferret.domain.space import high_water_bytes

# The event columns a text listing shows, named by their document properties, in this order.
LIST_COLUMNS: Final = (
    "occurredAt",
    "eventId",
    "harness",
    "workspaceId",
    "eventType",
    "agentName",
    "skillName",
    "toolName",
    "outcome",
    "subjectVisibility",
    "outcomeVisibility",
    "durationVisibility",
)
NO_ROWS: Final = "No rows.\n"


def result_status(rows: Sized) -> int:
    """``0`` when a query matched something, ``1`` when it legitimately matched nothing.

    One decision in one place. A caller reading the status and a caller reading ``exitCode`` in the envelope are
    reading the same number, and a query that found nothing is not reported as one that found something.
    """
    return EXIT_SUCCESS if len(rows) else EXIT_NEGATIVE_RESULT


def json_line(document: Mapping[str, Any]) -> str:
    """One compact UTF-8 JSON object followed by LF, keys in the order the caller built them."""
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False) + "\n"


def render_init(result: InitResult, output: OutputMode) -> str:
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "init",
                "exitCode": 0,
                "result": result.result,
                "dataHome": str(result.data_home),
                "databasePath": str(result.database_path),
                "schemaNumber": result.schema_number,
                "installationId": result.installation_id,
                "retentionDays": result.retention_days,
                "permissionsState": result.permissions_state,
            }
        )
    return (
        f"FERRET init: {result.result}\n"
        f"Data home: {result.data_home}\n"
        f"Database: {result.database_path}\n"
        f"Schema: {result.schema_number}\n"
        f"Installation: {result.installation_id}\n"
        f"Retention days: {result.retention_days}\n"
        f"Permissions: {result.permissions_state}\n"
    )


def render_capture(outcome: CaptureOutcome, output: OutputMode) -> str:
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "capture",
                "exitCode": 0,
                "result": outcome.result,
                "eventId": outcome.event_id,
                "eventHash": outcome.event_hash,
            }
        )
    return f"FERRET capture: {outcome.result}\nEvent: {outcome.event_id}\nHash: {outcome.event_hash}\n"


def _tab_row(values: Iterable[object]) -> str:
    """One tab-separated line in which an absent value is a hyphen, never an empty cell or a zero."""
    return "\t".join("-" if value is None else str(value) for value in values) + "\n"


def render_events(page: EventPage, output: OutputMode) -> str:
    """A page as its JSON envelope, or as a header and one row per event; a page with no events has no text."""
    documents = [event.to_document() for event in page.items]
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "events.list",
                "exitCode": result_status(documents),
                "items": documents,
                "nextCursor": page.next_cursor,
            }
        )
    if not documents:
        return ""
    return _tab_row(LIST_COLUMNS) + "".join(
        _tab_row(document[column] for column in LIST_COLUMNS) for document in documents
    )


def render_export_line(event: Event) -> str:
    """One exported event: the canonical compact JSON object and a line feed."""
    return json_line(event.to_document())


def _render_summary(
    command: str,
    summary: Summary[Any],
    measured: list[tuple[tuple[Dimension, ...], Mapping[str, int | None]]],
    output: OutputMode,
) -> str:
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": command,
                "exitCode": result_status(measured),
                "groupBy": list(summary.group_by),
                "rows": [
                    {"dimensions": [{"name": name, "value": value} for name, value in dimensions], **metrics}
                    for dimensions, metrics in measured
                ],
                "interpretation": summary.interpretation,
            }
        )
    if not measured:
        return ""
    header = _tab_row([*summary.group_by, *measured[0][1]])
    return header + "".join(
        _tab_row([*(value for _, value in dimensions), *metrics.values()]) for dimensions, metrics in measured
    )


def render_usage(summary: Summary[UsageRow], output: OutputMode) -> str:
    return _render_summary(
        "usage",
        summary,
        [
            (
                row.dimensions,
                {
                    "eventCount": row.event_count,
                    "observedSubjectCount": row.observed_subject_count,
                    "derivedSubjectCount": row.derived_subject_count,
                    "unknownSubjectCount": row.unknown_subject_count,
                },
            )
            for row in summary.rows
        ],
        output,
    )


def render_outcomes(summary: Summary[OutcomeRow], output: OutputMode) -> str:
    return _render_summary(
        "outcomes",
        summary,
        [
            (
                row.dimensions,
                {
                    "eventCount": row.event_count,
                    "successCount": row.success_count,
                    "failureCount": row.failure_count,
                    "cancelledCount": row.cancelled_count,
                    "unknownOutcomeCount": row.unknown_outcome_count,
                    "observedOutcomeCount": row.observed_outcome_count,
                    "derivedOutcomeCount": row.derived_outcome_count,
                    "durationSampleCount": row.duration_sample_count,
                    "durationTotalMs": row.duration_total_ms,
                    "durationMinMs": row.duration_min_ms,
                    "durationMaxMs": row.duration_max_ms,
                },
            )
            for row in summary.rows
        ],
        output,
    )


def _scalar(value: object) -> str:
    """A scalar as the human report spells it: an absent value is a hyphen and a boolean is yes or no."""
    if value is None:
        return "-"
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def render_status(report: StatusReport, output: OutputMode) -> str:
    counts, facts, counters = report.counts, report.facts, report.counters
    high_water = high_water_bytes([facts])
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "status",
                "exitCode": 0,
                "runtime": {
                    "ferretVersion": report.ferret_version,
                    "interpreterPath": report.interpreter.path,
                    "interpreterVersion": report.interpreter.version,
                    "interpreterState": report.interpreter_state,
                },
                "databaseState": report.DATABASE_STATE,
                "dataHome": str(report.data_home),
                "databasePath": str(report.database_path),
                "schemaNumber": report.schema_number,
                "integrityState": report.INTEGRITY_STATE,
                "permissionsState": report.PERMISSIONS_STATE,
                "eventCount": counts.events,
                "capabilitySnapshotCount": counts.snapshots,
                "oldestCapturedAt": counts.oldest_captured_at,
                "nearExpiryCount": counts.near_expiry,
                "logicallyExpiredCount": counts.logically_expired,
                "databaseBytes": facts.database_bytes,
                "walBytes": facts.wal_bytes,
                "freelistBytes": facts.freelist_bytes,
                "highWaterBytes": high_water,
                "expiredLocalTotal": counters.local_total,
                "expiredBeforeAckTotal": counters.before_ack_total,
                "hookFailureCount": report.hook_failure_count,
                "lastHookFailureAt": report.last_hook_failure_at,
                "lastMaintenanceAt": report.last_maintenance_at,
                "maintenanceDue": report.maintenance_due,
                "backend": {"state": report.BACKEND_STATE},
                "adapters": [
                    {
                        "harness": adapter.harness,
                        "platformSupport": adapter.platform_support,
                        "configurationState": adapter.configuration_state,
                        "latestSnapshotId": None if adapter.snapshot is None else adapter.snapshot.snapshot_id,
                        "latestSnapshotHash": None if adapter.snapshot is None else adapter.snapshot.snapshot_hash,
                        "snapshotCapturedAt": None if adapter.snapshot is None else adapter.snapshot.captured_at,
                        "capabilities": []
                        if adapter.snapshot is None
                        else [item.to_document() for item in adapter.snapshot.capabilities],
                    }
                    for adapter in report.adapters
                ],
            }
        )
    lines = [
        f"FERRET status: {report.DATABASE_STATE}",
        f"Version: {report.ferret_version}",
        f"Interpreter: {report.interpreter_state} {report.interpreter.version} {report.interpreter.path}",
        f"Data home: {report.data_home}",
        f"Database: {report.database_path}",
        f"Schema: {report.schema_number}",
        f"Integrity: {report.INTEGRITY_STATE}",
        f"Permissions: {report.PERMISSIONS_STATE}",
        f"Events: {counts.events}",
        f"Capability snapshots: {counts.snapshots}",
        f"Oldest capture: {_scalar(counts.oldest_captured_at)}",
        f"Near expiry: {counts.near_expiry}",
        f"Logical expiry: {counts.logically_expired}",
        f"Physical bytes: database={facts.database_bytes} wal={facts.wal_bytes} freelist={facts.freelist_bytes}"
        f" high-water={high_water}",
        f"Expired local: {counters.local_total}",
        f"Expired before ACK: {counters.before_ack_total}",
        f"Maintenance: last={_scalar(report.last_maintenance_at)} due={_scalar(report.maintenance_due)}",
        f"Hook failures: count={report.hook_failure_count} last={_scalar(report.last_hook_failure_at)}",
        f"Backend: {report.BACKEND_STATE}",
        *(
            f"Adapter {adapter.harness}: {adapter.platform_support}/{adapter.configuration_state}"
            f"/{_scalar(None if adapter.snapshot is None else adapter.snapshot.snapshot_id)}"
            for adapter in report.adapters
        ),
    ]
    return "\n".join(lines) + "\n"


def render_maintenance(report: MaintenanceReport, output: OutputMode) -> str:
    pruned, counters, before, after = report.pruned, report.counters, report.before, report.after
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "maintenance",
                "exitCode": 0,
                "result": report.result,
                "expiredEventCount": pruned.events,
                "expiredWorkspaceCount": pruned.workspaces,
                "expiredCapabilitySnapshotCount": pruned.snapshots,
                "expiredLocalTotal": counters.local_total,
                "expiredBeforeAckTotal": counters.before_ack_total,
                "databaseBytesBefore": before.database_bytes,
                "databaseBytesAfter": after.database_bytes,
                "walBytesAfter": after.wal_bytes,
                "freelistBytesAfter": after.freelist_bytes,
                "highWaterBytes": report.high_water_bytes,
            }
        )
    return (
        f"FERRET maintenance: {report.result}\n"
        f"Expired: events={pruned.events} workspaces={pruned.workspaces} snapshots={pruned.snapshots}\n"
        f"Counters: local={counters.local_total} before-ack={counters.before_ack_total}\n"
        f"Physical bytes: before={before.database_bytes} after={after.database_bytes} wal={after.wal_bytes}"
        f" freelist={after.freelist_bytes} high-water={report.high_water_bytes}\n"
    )


def render_install(outcome: InstallOutcome, output: OutputMode) -> str:
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "self.install",
                "exitCode": 0,
                "result": outcome.result,
                "version": outcome.version,
                "artifactPath": str(outcome.artifact_path),
                "launcherPath": str(outcome.launcher_path),
                "manifestPath": str(outcome.manifest_path),
                "pathAction": outcome.path_action,
                "replacedOwnedVersion": outcome.replaced_owned_version,
            }
        )
    return (
        f"FERRET self.install: {outcome.result}\n"
        f"Version: {outcome.version}\n"
        f"Artifact: {outcome.artifact_path}\n"
        f"Launcher: {outcome.launcher_path}\n"
        f"Manifest: {outcome.manifest_path}\n"
        f"PATH action: {outcome.path_action}\n"
        f"Replaced version: {_scalar(outcome.replaced_owned_version)}\n"
    )


def render_uninstall(outcome: UninstallOutcome, output: OutputMode) -> str:
    removed = [str(path) for path in outcome.removed_paths]
    if output == "json":
        return json_line(
            {
                "schemaVersion": 1,
                "command": "self.uninstall",
                "exitCode": 0,
                "result": outcome.result,
                "removedPaths": removed,
                "pathAction": outcome.path_action,
                "dataAction": outcome.data_action,
            }
        )
    return (
        f"FERRET self.uninstall: {outcome.result}\n"
        f"Removed: {', '.join(removed) or '-'}\n"
        f"PATH action: {outcome.path_action}\n"
        f"Data action: {outcome.data_action}\n"
    )
