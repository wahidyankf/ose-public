# OSE BE — Specification Corpus

Audience: engineers and technical product managers working on
[`apps/ose-be`](../../../../apps/ose-be/README.md) — the compliance gap-analysis API.

This corpus is the single source of truth for what the service answers. A scenario here defines a
route's status code, its response body, what it persists, and what it asks a language model.

## Contents

- [Architecture](./architecture.md) — the current as-built system: its context, the process it
  deploys, its bounded contexts, and the constraints that bind them.
- [Behaviours](./behaviours/) — the recursive Gherkin corpus, grouped by bounded context.
- [Contracts](./contracts/) — the OpenAPI 3.1 specification the service and its clients
  generate from.

## Related

- [`apps/ose-be/README.md`](../../../../apps/ose-be/README.md) — the implementing project.
- [OSE App Web](../app-web/README.md) — the sibling corpus for the client that calls it.
