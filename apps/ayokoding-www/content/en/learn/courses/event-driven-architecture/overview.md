---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Software Architecture](../software-architecture/overview.md) and
  [Backend Essentials](../backend-essentials/learning/overview.md).
- **Tools and environment**: Python 3.x, a terminal, and an editor with a Python type
  checker. The examples use the standard library and a local in-process broker fake; no broker
  account, cloud service, or credentials are required.
- **Assumed knowledge**: a synchronous request/response call, a message queue, and why a handler
  must tolerate retry.

## Why this exists -- the big idea

Synchronous service-to-service calls couple a successful business change to every downstream
service being available at that instant. Event-driven architecture turns an immutable fact such as
`OrderPlaced` into a durable message that independent consumers may handle at their own pace.

Keep this if you forget everything else: an event says what _did_ happen, not what another service
must do; delivery can repeat, arrive later, or fail; correct systems therefore make consumers
idempotent, observe eventual consistency explicitly, and keep the state change and its publishable
event in one atomic outbox transaction.

## How this topic is organized

- **[Learning](./learning/overview.md)** contains 80 runnable, annotated Python examples. Beginner
  examples establish facts, commands, pub/sub, delivery semantics, idempotency, and dead letters.
  Intermediate examples add event sourcing, CQRS, broker logs, partitions, offsets, and retention.
  Advanced examples close the reliability gap with an outbox, sagas, compensation, topology choices,
  retry, and an integrated event-driven slice.
- **[Capstone](./learning/capstone/overview.md)** assembles an event-sourced order flow with a CQRS
  read model, transactional outbox, idempotent consumer, compensating saga, and DLQ.
- **[Drilling](./drilling/overview.md)** supplies retrieval questions, applied scenarios, a runnable
  kata, a self-check, and elaborative prompts in the fixed course-library sequence.

## Boundaries and trade-offs

EDA is not a synonym for “use a broker.” A simple CRUD action that needs an immediate answer and has
one owner is usually clearer as one synchronous transaction. Use events when independent consumers,
failure isolation, replay, or asynchronous integration justify the costs: duplicate delivery,
operational visibility, schema evolution, and a period in which read models are intentionally stale.

The course uses a deterministic in-process bus to make those trade-offs executable. Production
Kafka, RabbitMQ, or cloud-broker configuration is product-specific and deliberately out of scope;
the invariants taught here transfer to any of them.

## References

- Event notification, event-carried state transfer, event sourcing, and CQRS use the terminology
  established in Martin Fowler’s event-driven architecture writing.
- A Kafka-style log retains records independently of a consumer’s offset; a queue-style broker can
  remove a record after acknowledgement. This course models the semantic distinction rather than a
  vendor protocol.
- “Exactly once” is an end-to-end property, not a magic broker setting. The practical result is
  at-least-once delivery plus idempotent effects, and the examples make that boundary visible.

Next: [Learning Overview](./learning/overview.md) →
