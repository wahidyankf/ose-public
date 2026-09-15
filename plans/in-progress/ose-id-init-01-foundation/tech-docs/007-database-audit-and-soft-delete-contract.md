# Database Audit and Soft-Delete Contract

## Why This Is Mandatory

Identity data controls account access, credentials, sessions, company membership, entitlements, and
protocol grants. A current row alone is not enough to explain who created or changed it, and physical
deletion would erase evidence needed to investigate security and authorization events. Therefore every
persisted table delivered by the OSE ID plan family carries the same audit envelope and rejects hard
delete. This plan specializes the repository-wide
[`database-audit-trail`](../../../../repo-governance/development/pattern/database-audit-trail.md)
contract for identity data; it does not redefine that canonical rule.

The six columns record the current row's creation, latest mutation, and deletion disposition. They do
not replace the append-only identity/company audit-event records required for security-relevant domain
transitions.

## Universal Six-Column Envelope

Every table in the `ose_id` and `ose_id_web` schemas, including migration/framework metadata,
OpenIddict protocol tables, append-only audit-event tables, rate-limit buckets, and web sessions, has
these columns in this exact order:

| Column       | PostgreSQL definition                                         | Contract                                                                  |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `created_at` | `timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP` | Immutable creation instant                                                |
| `created_by` | `character varying(255) NOT NULL DEFAULT 'system'`            | Immutable safe actor identifier                                           |
| `updated_at` | `timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP` | Changes on every permitted mutation, including soft-delete                |
| `updated_by` | `character varying(255) NOT NULL DEFAULT 'system'`            | Changes atomically with `updated_at`                                      |
| `deleted_at` | `timestamp with time zone NULL`                               | Null for an active row; set once when the row is soft-deleted             |
| `deleted_by` | `character varying(255) NULL`                                 | Null exactly with `deleted_at`; set to the same operation's safe actor ID |

Each table has named constraints equivalent to:

```sql
CHECK ((deleted_at IS NULL) = (deleted_by IS NULL));

CHECK (updated_at >= created_at);

CHECK (
  deleted_at IS NULL
  OR deleted_at >= created_at
);
```

`created_at` and `created_by` never change. Ordinary updates set `updated_at` and `updated_by`
together. Soft-delete is a single bounded `UPDATE` that sets `deleted_at`, `deleted_by`, `updated_at`,
and `updated_by` to the same operation time/actor and advances the row's concurrency version where one
exists. A deleted row is never restored by clearing its deletion columns; an allowed re-enrollment or
reactivation uses its domain lifecycle command and preserves the prior tombstone/audit events.

Actor values are safe opaque identifiers such as `person:<uuid>`, `service:<stable-name>`, or
`system:<stable-job>`. They never contain email, provider claims, access tokens, capability values,
cookies, network addresses, or other secret/personal payload. The repository-standard `system`
defaults exist only for migration/bootstrap writes. A request or worker mutation must supply the
verified actor explicitly.

## No-Hard-Delete Enforcement

No shipped application, worker, cleanup job, migration downgrade, or protocol-store method issues a
physical `DELETE`, `TRUNCATE`, cascading delete, or destructive table rewrite for persisted OSE ID
rows. Enforcement is defense in depth:

1. Runtime roles receive only the exact `SELECT`, `INSERT`, and `UPDATE` privileges they need; never
   `DELETE`, `TRUNCATE`, table ownership, DDL, trigger, or bypass privileges.
2. Every foreign key uses `ON DELETE RESTRICT`; `CASCADE`, `SET NULL`, and implicit physical-delete
   propagation are forbidden.
3. Every owned table installs a named `BEFORE DELETE` guard trigger that raises the stable SQLSTATE/
   message contract selected in Phase 0. Catalog tests prove the guard exists and a real delete fails.
4. Migration/static SQL checks reject `DELETE FROM`, `TRUNCATE`, destructive `DROP TABLE`, and an
   `ON DELETE` action other than `RESTRICT` in OSE ID migration/runtime SQL. Forward repair is the only
   shared-schema recovery path.
5. Query adapters include `deleted_at IS NULL` explicitly in every active lookup, join, count,
   authorization decision, cleanup candidate query, and active-row index predicate. Immutable IDs,
   capability/token/session digests, and other anti-reuse security identifiers remain globally unique
   across tombstones when their table contract says so. Administrative audit readers use a separately
   authorized include-deleted query; request input cannot disable the filter.

HTTP `DELETE` remains valid transport vocabulary for commands such as session revocation or provider
unlinking. Such commands transition or soft-delete rows; they never authorize SQL hard delete.
Test-only PostgreSQL probes may issue a real SQL `DELETE` through the least-privilege serving role only
to prove that privileges and the guard reject it; the assertion must fail if any row disappears.

## Sensitive Material on Soft-Delete

Auditability must not keep a credential usable. The same terminal transaction revokes the domain
object and destroys usable secret material while retaining the row and audit metadata:

- token/reference/capability/cookie digests become terminal and cannot match an active lookup;
- nullable protected payloads, private-key ciphertext, TOTP secret ciphertext, CSRF material, and
  provider transaction ciphertext are set to null when their lifecycle permits;
- password hashes and passkey public material remain unreachable through active queries and are
  governed by the explicit security-retention contract; a later privacy/retention plan may redact
  fields but still may not physically delete the row under this invariant;
- append-only audit-event payloads remain allowlisted, non-secret, and immutable.

## Query-Builder and OpenIddict Contract

All runtime persistence, including OpenIddict applications, scopes, authorizations, and tokens, uses
SqlKata's PostgreSQL compiler with Npgsql execution behind query-specific outbound ports. Plan 04
implements the four version-resolved OpenIddict store interfaces in infrastructure and registers those
stores through the supported OpenIddict replacement seam. The stores map `DeleteAsync` and pruning
requests to bounded soft-delete updates, exclude tombstones from normal reads, and preserve OpenIddict
concurrency semantics. EF Core remains migration-time tooling only.

The executor must first freeze the exact store-interface surface from the resolved OpenIddict package.
Every member receives contract tests; newly added upstream members fail compilation/typecheck until
implemented. No generic repository, runtime `DbContext`, EF change tracking, or unbounded
`IQueryable` escape is introduced.

## Verification Contract

For every table added or changed by a plan, its delivery packet must produce:

- Unit proof that insert/update/soft-delete commands stamp the correct actor/time fields, active reads
  contain the tombstone predicate, and hard-delete syntax cannot be compiled;
- Integration proof against PostgreSQL catalog/constraints/partial indexes/triggers/role grants plus
  a real attempted `DELETE` that fails and a soft-delete that succeeds atomically;
- E2E proof through every distinct built public lifecycle class introduced by the slice that the
  affected resource disappears from active behavior, remains present to the authorized audit probe,
  cannot authenticate/authorize/replay, and records the actor. Integration remains the exhaustive
  per-table control: metadata and internal join tables do not each invent a public lifecycle solely for
  E2E. When an actual canonical scenario has no E2E-expressible boundary, that scenario—not a table or
  feature—carries `@e2e-exempt` with the exhaustive PostgreSQL alternative proof;
- migration/no-loss proof comparing row counts and stable non-secret digests before and after upgrade,
  soft-delete, restart, concurrent retry, and forward repair;
- manual API proof for every applicable HTTP delete/revoke/unlink operation showing the public response
  and a sanitized audit read, never direct mutation with an elevated database role.

The canonical behavior owner is
`specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature`; the web-session
adapter also maps its own behavior under `specs/apps/ose/id-web/behaviours/session/`. Unit is mandatory
for every scenario. Integration inventories and probes every table exhaustively. E2E is mandatory for
each application lifecycle that can be driven through the built service; schema-internal tables are
covered by that slice's exhaustive Integration catalog rather than fabricated public commands.

## Compatibility, Rollback, and Revisit Trigger

New tables include the envelope from creation. An already-created predecessor table is expanded with
nullable/defaulted fields, backfilled in bounded batches with a stable system actor, verified, and only
then constrained. Old code may ignore new columns; new code refuses readiness while any owned table is
missing a column, constraint, guard, grant, or active-row predicate.

Rollback reverts code while retaining additive columns, tombstones, and audit records. A forward
migration repairs mistakes. Revisit this invariant only through a separately authorized plan that
defines legal/privacy retention, proves an equivalent immutable audit trail, and explicitly changes the
no-hard-delete requirement; an executor may not create a hidden purge exception.
