---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Networking Essentials](../networking-essentials/learning/overview.md)
  establishes latency, loss, timeouts, and the limits of the network; [Concurrency & Parallelism](../concurrency-and-parallelism/learning/overview.md) establishes locally concurrent
  state and synchronization.
- **Tools and environment**: Python 3, a terminal, and the standard library. Examples simulate
  delay, loss, reordering, and partitions locally rather than claiming a real cluster.
- **Assumed knowledge**: a timeout is evidence, not proof; a local concurrent task can interleave
  with another; and a request can fail after changing remote state.

## Why this exists

Once a system uses more than one machine, it must reason about partial failure, no shared clock, and
replicas that learn facts at different times. This course builds that reasoning from causal clocks
and consistency choices through replication, consensus, CRDTs, coordination services, and the
failure modes each mechanism cannot erase.

**Scope boundary**: this course teaches the models and small simulations needed to judge distributed
trade-offs. It does not implement a production Raft engine; a later construction course covers that
work. It also does not substitute a toy simulation for operational testing against a real
coordination-service deployment.

## How the course is organized

- **[Learning](./learning/overview.md)** moves from clocks, CAP/PACELC, and delivery semantics to
  replication, quorums, failure detection, Raft/Paxos/CRDTs, and coordination-service judgment.
- **[Drilling](./drilling/overview.md)** makes the failure assumptions, trade-offs, and safety
  properties retrievable before a reader designs a distributed boundary.

The 85 worked examples are runnable Python simulations where code expresses the claim, plus one
explicit decision artifact for the coordination-service choice. Each simulation states the limited
property it demonstrates; none presents a teaching model as a production implementation.

Next: [Learning Overview](./learning/overview.md) →
