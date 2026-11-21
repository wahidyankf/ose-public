# live — ose-be Gherkin Domain

Scenarios whose public messaging boundary needs a real NATS/JetStream broker. They retain in-process
Unit proof through the connection and demo ports, and `ose-be-e2e` binds them against a running
broker, which also covers the Integration level. The owner's static coverage includes this directory
recursively.

## Feature Files

- **[nats-connect.feature](./nats-connect.feature)** — NATS connection on startup (2 scenarios)
- **[jetstream-demo.feature](./jetstream-demo.feature)** — JetStream durable publish/consume
  demo (1 scenario)

## Related

- [Parent gherkin README](../README.md)
