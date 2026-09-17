# OSE ID BE — Specification Corpus

Audience: engineers and technical product managers working on the OSE ID backend — the identity
service that OSE products will authenticate against.

This corpus is the single source of truth for what the service does while its identity features are
still switched off: how a local stack starts and stops, what liveness and readiness each mean, which
database role may change the schema, which runtime modes may serve at all, and what a stored row must
keep about itself.

## Contents

- [Architecture](./architecture.md) — the current as-built system: its context, the process it
  deploys, its components, and the constraints that bind them.
- [Contracts](./contracts/README.md) — the OpenAPI source of truth for every HTTP method and path
  this service publishes while identity stays switched off.
- [Behaviours](./behaviours/README.md) — the recursive Gherkin corpus, grouped by domain.

## Related

- [OSE ID Web](../id-web/README.md) — the sibling corpus for the status shell this service reports to.
- [OSE BE](../be/README.md) — the sibling backend whose health-probe shape this service builds on.
