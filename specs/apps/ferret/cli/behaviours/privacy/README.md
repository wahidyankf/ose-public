# FERRET CLI — Privacy behaviours

Gherkin scenarios for the metadata-only capture boundary: what a captured event may contain and what is rejected.

## Feature files

- [`metadata-envelope.feature`](./metadata-envelope.feature) — a valid lifecycle event is stored with exactly the
  opaque identifiers it was given, a raw path or session value in their place rejects the whole event, any
  content-bearing or unknown field rejects the whole event without echoing it, and a raw hook payload keeps only its
  allowlisted metadata however large the tool result it carries.

See the [Specs Directory Structure Convention](../../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.
