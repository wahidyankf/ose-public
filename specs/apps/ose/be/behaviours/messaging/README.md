# messaging — ose-be Gherkin Domain

Scenarios for the OSE Application backend NATS/JetStream messaging infrastructure. The owner
project's static coverage discovers this directory and `live/` recursively. Every scenario has
in-process Unit proof, either through injected messaging ports or through the startup configuration
checks. Scenarios whose public boundary requires a real NATS/JetStream broker are bound by
`ose-be-e2e`, whose reference also covers the Integration level.

## Feature Files

- **[nats-config.feature](./nats-config.feature)** — Messaging configuration validation
  (1 scenario)

## Related

- [Parent gherkin README](../README.md)

- [live](./live/README.md) — ose-be Gherkin Domain
