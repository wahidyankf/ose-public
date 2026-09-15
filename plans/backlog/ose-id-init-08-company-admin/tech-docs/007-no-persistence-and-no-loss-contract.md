# 007 — No-Persistence and No-Loss Contract

## Physical-State Decision

Plan 08 creates no physical database state. Plan 03 remains the sole owner of all company,
membership, invitation, entitlement, audit, migration, and PostgreSQL row-level-security objects. Plan
08 adds only Next.js route/BFF/component state that is reconstructed from the current server session and
authoritative Plan 03 responses.

The required physical-schema delta is therefore exactly empty:

- no EF Core migration/model-snapshot edit and no SqlKata/Npgsql persistence query;
- no table, column, index, sequence, constraint, trigger, view, function, grant, owner, or RLS change;
- no new browser, process-memory, filesystem, or Next.js cache authority;
- no invitation capability, notification body, company roster, entitlement, or upstream response stored
  outside Plan 03; and
- no backend OpenAPI operation or serialized shape change.

## No-Loss Proof

Phase 0 records a sanitized catalog/schema digest and row counts for every Plan 03 company table in a
seeded Company A/Company B database. After Plan 08 browser, Integration, and E2E journeys, rerun the same
catalog digest. Only mutations explicitly requested through existing Plan 03 APIs may change business
rows; the schema digest, migration history, owners, grants, RLS policies, and unrelated row digests must
remain identical.

The execution diff must satisfy:

```bash
rtk git diff --exit-code -- apps/ose-id-be apps/ose-id-be-e2e specs/apps/ose/id-be
```

The delivered Plan 03 migration/catalog/RLS suites also run unchanged through:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-id-be:test:integration
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e
```

Both commands must pass against an empty database and a fully seeded predecessor database. Evidence
stores only counts and non-secret stable digests, never member contacts, invitation capabilities, or
private audit payloads.

## Failure, Rollback, and Ownership Escalation

Any backend/schema/OpenAPI diff, new migration, catalog drift, RLS drift, or need for a missing company
operation fails this plan. Stop before implementation, return the gap to Plan 03 ownership through a
separately authorized correction, and update Plan 08 only after that dependency lands.

Rollback disables/removes the guarded web routes and BFF adapters. Because Plan 08 owns no durable
state, there is no down migration, data backfill, or destructive cleanup. Existing Plan 03 data and
authorization remain untouched.
