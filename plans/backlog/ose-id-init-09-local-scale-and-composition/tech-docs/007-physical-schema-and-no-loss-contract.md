# 007 — Physical Schema and No-Loss Contract

## Expected Physical State

Plans 01–07 already own every OSE ID PostgreSQL table, column, constraint, index, owner, grant, migration,
and RLS policy. Plan 09 expects no new application table or migration: it proves that two backend and two
web processes use the already-shared stores and keys. Its runner creates only manifest-owned ephemeral
PostgreSQL volumes/databases for an individual stack and applies predecessor migrations unchanged.

The default schema delta is exactly empty. Phase 0 must capture:

- ordered migration history and model-snapshot hash;
- catalog signatures for columns, types, nullability, defaults, keys, indexes, constraints, owners,
  grants, functions, triggers, and RLS policies;
- row counts and non-secret stable digests for a fully seeded personal/Company A/Company B database; and
- the exact tables used by sessions, correlation, keys, rate limits, idempotency, revocation, passkey/MFA,
  federation, tenancy, consent, and audit state.

## No-Loss and Multi-Instance Proof

Run the complete predecessor migration chain against both an empty ephemeral database and a fully
seeded predecessor snapshot. Start backend A/B and web A/B, perform every representative no-affinity
journey, stop instance A at the documented handoff, and complete through B. After the run:

1. migration history/model snapshot and catalog signatures equal the Phase 0 baseline;
2. every committed Person, company, membership, invitation, entitlement, provider link, credential,
   grant, session, consent, key-generation, revocation, idempotency, and audit outcome occurs exactly once;
3. unrelated predecessor row counts/digests are unchanged;
4. restart from the same ephemeral database reads all committed state without re-seeding or relinking;
5. cleanup removes only the manifest-owned ephemeral database/volume, never a developer/shared database;
   and
6. two concurrent stack IDs cannot address, adopt, migrate, seed, or remove each other's database.

Validate with the Phase 0-resolved migration/RLS targets and the explicit no-affinity command:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be:test:integration
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-be-e2e:test:e2e
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web-e2e:test:e2e
```

Sanitized evidence stores migration IDs, counts, catalog/digest values, instance markers, and ownership
IDs only. It excludes real data, contacts, tokens, capabilities, key bytes, passwords, and private
descriptors.

## Unexpected Schema Requirement

If the state inventory finds process-local correctness state that cannot use a predecessor-owned table,
stop before RED implementation. Amend the plan through review with the exact old/new physical schema,
forward migration, model snapshot, owners/grants/RLS, empty and seeded upgrade proof, mixed-version
compatibility, rollback/forward-fix policy, and no-loss digests. Do not silently add a table, reuse an
unrelated JSON column, introduce Redis, or edit an applied migration.

Ordinary rollback removes the local runner/proxy tooling only. OSE ID application data and migration
history remain unchanged; any later migration defect is forward-fixed under its owning plan.
