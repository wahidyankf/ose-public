# live — organiclever-be Gherkin Domain

Scenarios whose public messaging boundary needs a real NATS/JetStream broker. They have a Unit
reference and are bound by `organiclever-be-e2e`, which runs against a local broker.

## Feature Files

- **[nats-connect.feature](./nats-connect.feature)** — NATS connection on startup (2 scenarios)
- **[jetstream-demo.feature](./jetstream-demo.feature)** — JetStream durable publish/consume
  demo (1 scenario)

## Related

- [Parent gherkin README](../README.md)
