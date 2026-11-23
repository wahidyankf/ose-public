# messaging — organiclever-be Gherkin Domain

Scenarios for the OrganicLever backend NATS/JetStream messaging infrastructure. Every scenario has a
Unit reference. Scenarios that need a real NATS/JetStream broker are bound by `organiclever-be-e2e`,
which runs against a local broker and so also counts at Integration level.

## Feature Files

- **[nats-config.feature](./nats-config.feature)** — Messaging configuration validation
  (1 scenario)

## Related

- [Parent gherkin README](../README.md)

- [live](./live/README.md) — organiclever-be Gherkin Domain
