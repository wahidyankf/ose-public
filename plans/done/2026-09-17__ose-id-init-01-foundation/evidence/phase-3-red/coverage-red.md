# Phase 3 RED — Coverage-Tool Undefined Bindings

Both Phase 3 features (`database-privilege.feature`, `database-audit-and-soft-delete.feature`) were
written into `specs/` during Phase 1's canonical-specs work, before any Phase 3 binding existed. The
Phase 2 Gate's Mandatory Nx Quality Matrix run captured — as part of its own permitted-nonzero
evidence — the coverage tool's undefined-binding findings for every not-yet-opened phase, including
Phase 3's two features. That run is `evidence/phase-2-gate/nx-quality.txt`; this file extracts the 18
lines belonging to Phase 3, which is the RED state Phase 3 GREEN work closes.

## RED findings (18 lines, all `undefined ... binding`, zero violations)

```
specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature: Deny a schema change attempted by the application role / PostgreSQL denies the operation: undefined E2E binding.
specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature: Deny a schema change attempted by the application role / the application role attempts to create or alter a table: undefined E2E binding.
specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature: Deny a schema change attempted by the application role / the application role can execute only the granted runtime health query: undefined E2E binding.
specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature: Deny a schema change attempted by the application role / the migration role has applied the current empty OSE ID schema: undefined E2E binding.
specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature: Reject physical deletion of migration history / PostgreSQL rejects the operation: undefined E2E binding.
specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature: Reject physical deletion of migration history / an ordinary readiness check still sees the active migration state: undefined E2E binding.
```

(and the matching set for the Unit and Integration adapters, following the same shape — full 18-line
set preserved verbatim in `evidence/phase-2-gate/nx-quality.txt`, lines matching these two feature
paths.)

## Acceptance

The RED state names exactly the two Phase 3 features, with `undefined ... binding` as the only
finding kind — no orphan, ambiguous, or unused binding, and no violation from a different phase. This
is the failure Phase 3 GREEN work closes: three Unit steps, three Integration steps, and two E2E step
classes, one pair of bindings for each of the two scenarios' three layers.
