# Technical Design — OSE ID Init 09 Local Scale and Composition

## Purpose

These documents define the local runtime topology, state ownership, runner protocol, failure handling,
dependent-app composition, and proof required before LMS integration can begin.

## Document Map

1. [Runtime topology and state ownership](001-runtime-topology-and-state-ownership.md)
2. [Owned stack lifecycle and cleanup](002-owned-stack-lifecycle-and-cleanup.md)
3. [Dependent-app runner contract](003-dependent-app-runner-contract.md)
4. [Verification, decisions, and file impact](004-verification-decisions-and-file-impact.md)
5. [BDD spec delta and adapter map](005-bdd-spec-delta-and-adapter-map.md)
6. [API contract delta](006-api-contract-delta.md)
7. [Physical schema and no-loss contract](007-physical-schema-and-no-loss-contract.md)

## Non-Negotiable Contracts

- Two backend and two web instances complete representative journeys without affinity.
- Correctness state and keys are shared; process memory/local disk are disposable.
- PostgreSQL, Mailpit, fake provider, proxies, processes, fixtures, and temp files have one ownership manifest.
- Readiness is observable/bounded; cleanup is unconditional, idempotent, target-validated, and non-destructive.
- Dependent apps compose an explicit versioned runner contract and never copy private lifecycle code.
- App-only runs fail clearly when OSE ID is unavailable and never create a debug/local-auth fallback.
- Local proof is not production deployment or HA certification.
- Root MIT covers OSE-authored code/docs; third-party components retain their licenses.

## Traceability

| Product area                                 | Technical owner |
| -------------------------------------------- | --------------- |
| Stateless/no-affinity architecture           | Document 001    |
| Startup, readiness, diagnostics, cleanup     | Document 002    |
| Downstream/LMS composition seam              | Document 003    |
| Test matrix, decisions, rollback, file scope | Document 004    |
| Canonical Gherkin and adapter ownership      | Document 005    |
| Runner API and evidenced HTTP no-delta proof | Document 006    |
| Physical schema baseline and no-loss proof   | Document 007    |
