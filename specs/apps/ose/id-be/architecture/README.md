# OSE ID BE — Architecture Companions

Detail documents for [`architecture.md`](../architecture.md), the canonical as-built description of
`ose-id-be`. Read the parent first: it carries the context, containers, and component summary, and
each file here expands one section of it.

## Contents

- [Hexagonal dependency boundary](./hexagonal-dependency-boundary.md) — the five logical rings, the
  inward-only dependency rule, the composition root, and the adapter seams reserved for transports
  that are not delivered.
- [Routes, configuration, and health](./routes-configuration-and-health.md) — the exhaustive route
  inventory, the startup configuration surface, and the liveness and readiness state model.

## Related

- [OSE ID BE Architecture](../architecture.md) — the canonical document these files expand.
- [Behaviours](../behaviours/README.md) — the scenarios that prove what is described here.
