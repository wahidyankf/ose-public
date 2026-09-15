---
description: "The auditability, soft-delete, compliance, and production-debugging rationale behind the required audit columns."
when_to_use: "Use when justifying to a reviewer or teammate why a table must include the audit columns."
---

# Why This Pattern Exists

**Current-row attribution**: The six columns identify who created the current row, who made its
latest mutation, and who soft-deleted it, with the corresponding times. They do not reconstruct
intermediate states or the full history of a record.

**Soft-Delete**: Setting `deleted_at` and `deleted_by` hides a row from normal queries without destroying data. Hard deletes make recovery impossible and break foreign key history. Soft-delete preserves referential integrity and enables undelete workflows.

**Identity and authorization evidence**: Account status, company membership and role changes,
credential lifecycle, authorization decisions, sessions, revocations, and recovery actions are
security-relevant history. Store those transitions as append-only audit events with actor, target,
tenant/company context, action, outcome, timestamp, and correlation data. The six current-row
columns complement those events; they never replace them.

**Compliance**: Sharia-compliant financial systems need evidence about transactions, contracts, and
the identities authorized to act on them. Current-row attribution supports review and incident
triage, while append-only domain/security events preserve the sequence required for historical
reconstruction.

**Production Debugging**: When an incident occurs, `updated_at` narrows the time window and `updated_by` identifies the service or user responsible. Without these columns, incident investigation relies on log search, which is slower and less reliable.
