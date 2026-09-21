# FERRET CLI — Specification Corpus

Audience: engineers and technical product managers working on [`apps/ferret-cli`](../../../../apps/ferret-cli/README.md),
the standalone local FERRET command-line tool, and on the harness adapters that feed it.

This corpus is the single source of truth for what `ferret` does. A scenario here defines a command's accepted
arguments, what it writes to stdout and stderr, and its exit code.

## Contents

- [Architecture](./architecture.md) — the current as-built system: its context, containers, components, the privacy
  boundary, and the constraints that bind them.

## Behaviours

The recursive Gherkin corpus lives under `behaviours/`, grouped by concern. Each file holds the scenarios of one
concern; a scenario is added together with its step definition and lands in exactly one of these files:

| Concern   | Feature file                                                      |
| --------- | ----------------------------------------------------------------- |
| Storage   | `behaviours/storage/initialization-and-concurrency.feature`       |
| Storage   | `behaviours/storage/retention-and-space.feature`                  |
| Privacy   | `behaviours/privacy/metadata-envelope.feature`                    |
| Queries   | `behaviours/queries/local-query-and-export.feature`               |
| Analytics | `behaviours/analytics/usage-and-outcomes.feature`                 |
| Harness   | `behaviours/harness/fail-open-capabilities-and-platforms.feature` |

## Consumers

Harness adapters call `ferret capture-hook`, scripts call the machine forms of the other commands, and people read
the human forms. A change to a command's JSON is a change to a contract, so a scenario that asserts a field is the
record of that contract.

## Related

- [`apps/ferret-cli/README.md`](../../../../apps/ferret-cli/README.md) — the implementing project.
- [`apps/ferret-cli-e2e/README.md`](../../../../apps/ferret-cli-e2e/README.md) — the process-level adapter for this
  corpus.
- [BDD Spec-to-Test Mapping Convention](../../../../repo-governance/development/infra/bdd-spec-test-mapping.md) — the
  repository-wide rule this corpus follows.
