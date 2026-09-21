# FERRET CLI — Behaviours

Recursive Gherkin corpus for the standalone `ferret` command line. Each folder groups the feature files of one
concern, and a scenario is added together with its step bindings in the owner's Unit and Integration adapters
and in the dedicated E2E adapter.

## Concerns

- [Storage](./storage/README.md) — the private per-user data home, its initialization, concurrent capture, and
  thirty-day retention.
- [Privacy](./privacy/README.md) — the metadata-only capture boundary and what it rejects.
- [Harness](./harness/README.md) — what each coding-agent harness exposes, and how a gap is reported.
- [Queries](./queries/README.md) — filtered reads, stable ordering, JSON Lines export, and the shared command result.
- [Analytics](./analytics/README.md) — usage and outcome summaries that keep unknown values apart.

The planned file layout is listed in the [CLI specification](../README.md#behaviours).

## Related

- [`apps/ferret-cli/README.md`](../../../../../apps/ferret-cli/README.md) — the implementing project (Unit and
  Integration adapters).
- [`apps/ferret-cli-e2e/README.md`](../../../../../apps/ferret-cli-e2e/README.md) — the built-artifact E2E adapter.
