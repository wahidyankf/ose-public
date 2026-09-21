# FERRET CLI — Storage behaviours

Gherkin scenarios for the private per-user data home and the SQLite store inside it.

## Feature files

- [`initialization-and-concurrency.feature`](./initialization-and-concurrency.feature) — one private store shared by
  every repository, and concurrent capture into it.
- [`retention-and-space.feature`](./retention-and-space.feature) — telemetry is invisible thirty days after capture,
  pruned in bounded steps by the next operation, and counted once when it is.

See the [Specs Directory Structure Convention](../../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.
