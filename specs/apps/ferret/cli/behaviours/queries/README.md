# FERRET CLI — Query behaviours

Gherkin scenarios for reading the locally stored events back: filters, stable ordering, JSON Lines export, and the
machine-readable result every command shares.

## Feature files

- [`local-query-and-export.feature`](./local-query-and-export.feature) — filtered reads return a stable order,
  export streams one canonical event per line, every command answers with one stable JSON result or one closed
  error, and the whole command set runs from the local data home alone, with no backend and no network.

See the [Specs Directory Structure Convention](../../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.
