# Physical Schema and Migration Contract

## Old Physical State

The predecessor schema already contains the global `ose_id.people`, `ose_id.auth_rate_limits`, and
`ose_id.identity_audit_events` tables from the local-email slice. It contains no upstream-provider link
or correlation row. Company tables remain separate tenant data; a Google identity attaches to a global
Person and therefore never carries `company_id` or participates in company row-level security.

## Common Audit and Ownership Contract

Both new tables append the existing six columns in this exact order:

| Column       | PostgreSQL type            | Nullability/default                  | Lifecycle                                      |
| ------------ | -------------------------- | ------------------------------------ | ---------------------------------------------- |
| `created_at` | `timestamp with time zone` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | immutable creation instant                     |
| `created_by` | `character varying(255)`   | `NOT NULL DEFAULT 'system'`          | immutable safe actor/correlation value         |
| `updated_at` | `timestamp with time zone` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | changes with every permitted mutation          |
| `updated_by` | `character varying(255)`   | `NOT NULL DEFAULT 'system'`          | changes with `updated_at`                      |
| `deleted_at` | `timestamp with time zone` | nullable                             | null while active; one-way soft-delete instant |
| `deleted_by` | `character varying(255)`   | nullable                             | non-null exactly when `deleted_at` is non-null |

Both tables inherit the OSE ID
[audit/soft-delete profile](../../../done/2026-09-17__ose-id-init-01-foundation/tech-docs/007-database-audit-and-soft-delete-contract.md),
including named update/delete time checks, active-row predicates, and `BEFORE DELETE` guards.
`ose_id_migrator` owns every object. `PUBLIC` receives no privilege. `ose_id_app` receives only
`SELECT, INSERT, UPDATE`; it receives no `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`, ownership, DDL,
or sequence privilege. UUIDs are application-generated. Each table has named soft-delete-pair,
update-time, and delete-time checks plus `trg_<table>_reject_hard_delete`. Integration tests inventory
catalogs/grants and attempt a real serving-role physical delete against each table.

## New Table: `ose_id.provider_links`

| Column                  | Type                       | Nullability/default            | Exact meaning and constraint                                                                     |
| ----------------------- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `provider_link_id`      | `uuid`                     | `NOT NULL`                     | application-generated primary key                                                                |
| `person_id`             | `uuid`                     | `NOT NULL`                     | global Person owner; FK to `people(person_id)` with `ON DELETE RESTRICT`                         |
| `provider_id`           | `character varying(32)`    | `NOT NULL`                     | internal adapter key; this migration permits only `google`                                       |
| `provider_issuer`       | `character varying(2048)`  | `NOT NULL`                     | exact canonical issuer after metadata/token validation; never display authority                  |
| `provider_subject`      | `character varying(255)`   | `NOT NULL`                     | non-empty stable upstream `sub`; never email                                                     |
| `profile_snapshot`      | `jsonb`                    | `NOT NULL DEFAULT '{}'::jsonb` | allowlisted display hints only; JSON object with keys `display_name`, `avatar_url`, `email_hint` |
| `status`                | `character varying(24)`    | `NOT NULL DEFAULT 'active'`    | `active` or `revoked`                                                                            |
| `last_authenticated_at` | `timestamp with time zone` | `NOT NULL`                     | last successful fully validated upstream authentication                                          |
| `revoked_at`            | `timestamp with time zone` | nullable                       | present exactly when status is `revoked`; never returns to null                                  |
| `row_version`           | `bigint`                   | `NOT NULL DEFAULT 0`           | non-negative optimistic-concurrency token; increases on every update                             |
| six audit columns       | common contract above      | common contract above          | no hard delete                                                                                   |

Exact constraints and indexes:

- `pk_provider_links(provider_link_id)`;
- `fk_provider_links_people(person_id) REFERENCES ose_id.people(person_id) ON DELETE RESTRICT`;
- `ck_provider_links_provider_id(provider_id IN ('google'))`;
- `ck_provider_links_issuer(btrim(provider_issuer) <> '')`;
- `ck_provider_links_subject(btrim(provider_subject) <> '')`;
- `ck_provider_links_profile_object(jsonb_typeof(profile_snapshot) = 'object')`;
- `ck_provider_links_status(status IN ('active','revoked'))`;
- `ck_provider_links_revoked_state((status = 'revoked') = (revoked_at IS NOT NULL))`;
- `ck_provider_links_row_version_nonnegative(row_version >= 0)`;
- `ck_provider_links_soft_delete_pair((deleted_at IS NULL) = (deleted_by IS NULL))`;
- `ck_provider_links_update_time(updated_at >= created_at)`;
- `ck_provider_links_delete_time(deleted_at IS NULL OR deleted_at >= created_at)`;
- `ux_provider_links_subject_active(provider_issuer, provider_subject) UNIQUE WHERE status = 'active'
AND deleted_at IS NULL` prevents one upstream identity from owning two Persons; and
- `ux_provider_links_person_provider_active(person_id, provider_id) UNIQUE WHERE status = 'active'
AND deleted_at IS NULL` permits at most one active Google link per Person.

`profile_snapshot` is never used for lookup, account linking, company selection, authorization, or
email verification. The application rejects unknown JSON keys before persistence. No upstream access,
ID, or refresh token is stored.

## New Table: `ose_id.external_provider_transactions`

| Column                    | Type                       | Nullability/default          | Exact meaning and constraint                                                                      |
| ------------------------- | -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider_transaction_id` | `uuid`                     | `NOT NULL`                   | application-generated primary key                                                                 |
| `person_id`               | `uuid`                     | nullable                     | required for `link`; null for signed-out `sign_in`; FK with `ON DELETE RESTRICT`                  |
| `provider_id`             | `character varying(32)`    | `NOT NULL`                   | exact adapter key; only `google`                                                                  |
| `purpose`                 | `character varying(16)`    | `NOT NULL`                   | `sign_in` or `link`                                                                               |
| `callback_uri`            | `character varying(2048)`  | `NOT NULL`                   | exact registered OSE callback; loopback-only in this local slice                                  |
| `return_path`             | `character varying(1024)`  | `NOT NULL`                   | allowlisted same-origin relative path, never an arbitrary URL                                     |
| `state_digest`            | `bytea`                    | `NOT NULL`                   | keyed digest used to locate the row; raw OAuth state is never stored                              |
| `protected_payload`       | `bytea`                    | `NOT NULL`                   | authenticated encryption of nonce, PKCE verifier, and provider request metadata using shared keys |
| `status`                  | `character varying(24)`    | `NOT NULL DEFAULT 'pending'` | `pending`, `consumed`, `failed`, or `expired`                                                     |
| `expires_at`              | `timestamp with time zone` | `NOT NULL`                   | strictly later than creation and bounded by configured correlation lifetime                       |
| `consumed_at`             | `timestamp with time zone` | nullable                     | set once for every terminal status; atomic single-use boundary                                    |
| `row_version`             | `bigint`                   | `NOT NULL DEFAULT 0`         | non-negative optimistic-concurrency token                                                         |
| six audit columns         | common contract above      | common contract above        | cleanup is soft-delete/expiry processing, never request-path hard delete                          |

Exact constraints and indexes:

- `pk_external_provider_transactions(provider_transaction_id)`;
- `fk_external_provider_transactions_people(person_id) REFERENCES ose_id.people(person_id) ON DELETE RESTRICT`;
- `ck_external_provider_transactions_provider_id(provider_id IN ('google'))`;
- `ck_external_provider_transactions_purpose(purpose IN ('sign_in','link'))`;
- `ck_external_provider_transactions_link_person(purpose <> 'link' OR person_id IS NOT NULL)`;
- `ck_external_provider_transactions_callback(btrim(callback_uri) <> '')`;
- `ck_external_provider_transactions_return_path(return_path ~ '^/[^/]')`;
- `ck_external_provider_transactions_status(status IN ('pending','consumed','failed','expired'))`;
- `ck_external_provider_transactions_expiry(expires_at > created_at)`;
- `ck_external_provider_transactions_terminal((status = 'pending') = (consumed_at IS NULL))`;
- `ck_external_provider_transactions_consumed(consumed_at IS NULL OR consumed_at >= created_at)`;
- `ck_external_provider_transactions_row_version_nonnegative(row_version >= 0)`;
- `ck_external_provider_transactions_soft_delete_pair((deleted_at IS NULL) = (deleted_by IS NULL))`;
- `ck_external_provider_transactions_update_time(updated_at >= created_at)`;
- `ck_external_provider_transactions_delete_time(deleted_at IS NULL OR deleted_at >= created_at)`;
- `ux_external_provider_transactions_state_digest(state_digest) UNIQUE`; and
- `ix_external_provider_transactions_pending_expiry(status, expires_at) WHERE status = 'pending' AND
deleted_at IS NULL`.

Atomic consumption is `UPDATE ... WHERE state_digest = @digest AND status = 'pending' AND expires_at >
@now AND deleted_at IS NULL`. Exactly one caller may change it to a terminal state and increment
`row_version`. Callback retries receive the same safe replay result and cannot create a Person, link, or
session. Instance A may insert and instance B may consume because neither correctness state nor key
material is process-local.

## Existing Constraint Updates

The migration replaces two exact checks with strict supersets; no column or prior value changes:

- `ck_auth_rate_limits_action` adds `provider_challenge`, `provider_callback`, `provider_link`, and
  `provider_unlink` to the predecessor action values.
- `ck_identity_audit_events_kind` adds `provider_sign_in_succeeded`, `provider_sign_in_failed`,
  `provider_linked`, `provider_link_failed`, and `provider_unlinked`.

All earlier values remain permitted. Federation audit `safe_payload` may contain only `provider_id`,
`purpose`, and a normalized result code. It must not contain email hints, issuer subject, state, nonce,
code, token, protected payload, callback query, IP address, or upstream body.

## Migration Artifacts and Sequence

Generate one additive EF Core migration pair at the delivered migration location matching
`*_AddGoogleFederation.cs` plus `.Designer.cs`, and update the model snapshot. The migration transaction:

1. creates both tables, constraints, indexes, and exact grants;
2. replaces the two predecessor checks with their named supersets;
3. verifies object ownership and removes implicit `PUBLIC` privileges; and
4. records no fixture or real provider value.

There is no data backfill: predecessor releases have no provider rows. Catalog tests must compare exact
columns, order, types, nullability, defaults, constraints, indexes, predicates, owners, and grants.

EF is migration-time schema tooling here, not the runtime data-access path. Provider-link and correlation
queries use the inherited SqlKata PostgreSQL compiler plus Npgsql execution, explicit projections, bound
values, transaction/cancellation/timeouts, and generated-SQL/query-plan tests. No EF entity, change
tracker, navigation loading, or `IQueryable` enters federation Application/Domain code.

## Compatibility, Rollback, and No-Loss Proof

- **Old code/new schema:** predecessor binaries ignore the additive tables and accept the superset
  checks; all email, OIDC, passkey/MFA, and company behavior remains unchanged.
- **New code/old schema:** readiness returns `schema_incompatible`; federation routes admit no request.
- **Expand:** apply this migration before enabling Google locally.
- **Verify:** migrate an empty database and a fully seeded predecessor database; retain counts and
  stable non-secret digests for every predecessor table; exercise create/link/replay/unlink races.
- **Contract:** none in this slice. Do not remove predecessor values, columns, indexes, or constraints.
- **Rollback:** disable Google and deploy predecessor code while retaining both tables and every row.
  Never down-migrate or delete provider data to recover service.
- **Forward fix:** repair a defect through a new migration; never edit an applied migration or weaken
  uniqueness/single-use checks.

The no-loss assertion passes only when all predecessor row counts/digests are identical before and after
migration, every new row remains readable after rollback to predecessor code, and a later forward deploy
resumes without relinking or account duplication.
