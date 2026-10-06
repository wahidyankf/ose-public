# OSE App Web — Specification Corpus

Audience: engineers and technical product managers working on
[`apps/ose-app-web`](../../../../apps/ose-app-web/README.md) — the compliance gap-analysis client.

This corpus is the single source of truth for what a compliance officer can do in the browser: load
a regulator document, load an internal policy, run a gap analysis, and read the report.

## Contents

- [Architecture](./architecture.md) — the current as-built system: its context, the container it
  deploys, its bounded contexts, and the constraints that bind them.
- [Behaviours](./behaviours/) — the recursive Gherkin corpus, grouped by domain.

## Related

- [`apps/ose-app-web/README.md`](../../../../apps/ose-app-web/README.md) — the implementing project.
- [OSE BE](../be/README.md) — the sibling corpus for the API this client calls.
