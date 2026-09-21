# FERRET CLI — Privacy behaviours

Gherkin scenarios for the metadata-only capture boundary: what a captured event may contain and what is rejected.

## Feature files

- [`metadata-envelope.feature`](./metadata-envelope.feature) — a valid lifecycle event is stored with opaque
  identifiers, and any content-bearing or unknown field rejects the whole event.

See the [Specs Directory Structure Convention](../../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.
