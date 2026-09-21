# FERRET CLI — Harness behaviours

Gherkin scenarios for how FERRET treats the coding-agent harnesses it records from: what it can observe about each
one, how a gap in that visibility is reported, and how FERRET installs and removes itself around them.

## Feature files

- [`fail-open-capabilities-and-platforms.feature`](./fail-open-capabilities-and-platforms.feature) — a capability
  a harness does not expose is reported as unknown, never as zero usage; the per-user install creates only private,
  manifest-owned files, and its removal leaves every harness, the repository, and the user's data as they were.

See the [Specs Directory Structure Convention](../../../../../../repo-governance/conventions/structure/specs-directory-structure.md)
for the canonical purpose of this folder.
