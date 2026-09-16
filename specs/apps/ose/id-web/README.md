# OSE ID Web — Specification Corpus

Audience: engineers and technical product managers working on the OSE ID web shell — the local
status surface that reports whether the identity service is usable.

This corpus is the single source of truth for what a developer can see in the browser while identity
features are switched off: which runtime modes may serve the shell at all, and how backend, database,
and schema readiness are conveyed without a mouse or color perception. The shell offers no sign-in,
account, or provider action.

## Contents

- [Architecture](./architecture.md) — the current as-built system: its context, the container it
  deploys, its components, and the constraints that bind them.
- [Behaviours](./behaviours/README.md) — the recursive Gherkin corpus, grouped by domain.

## Related

- [OSE ID BE](../id-be/README.md) — the sibling corpus for the service whose readiness this shell reports.
- [OSE App Web](../app-web/README.md) — the sibling client corpus whose shared UI primitives this shell reuses.
