# OSE LMS BE — Specification Corpus

Audience: engineers and technical product managers working on
[`apps/ose-lms-be`](../../../../apps/ose-lms-be/README.md) — the LMS backend.

This corpus is the single source of truth for what the service answers. A scenario here defines a
route's status code and its response body. The service has no domain model and no database yet;
what it does have is a proven request-to-response path that later LMS work is added to.

## Contents

- [Architecture](./architecture.md) — the current as-built system: its context, the process it
  deploys, its components, and the constraints that bind them.
- [Behaviours](./behaviours/) — the Gherkin corpus, grouped by domain.
- [Contracts](./contracts/) — the OpenAPI 3.1 specification the service generates its
  response models from.

## Related

- [`apps/ose-lms-be/README.md`](../../../../apps/ose-lms-be/README.md) — the implementing project.
- [OSE BE](../be/README.md) — the sibling backend whose health-probe shape this service reuses.
