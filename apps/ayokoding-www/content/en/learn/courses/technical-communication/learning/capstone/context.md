---
title: "Context Diagram: Notification Worker (C4 Level 1)"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 6
---

This is the system boundary the [postmortem](./postmortem.md) refers to throughout: the Notification
Worker, the people it affects, and the external systems it depends on at the time of the 2026-04-02
incident. Every node below is named in the postmortem's own timeline and impact sections, and every
system or actor the postmortem names appears here.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% C4 Level 1 -- System Context: Notification Worker, at the time of the 2026-04-02 incident
graph TD
    accTitle: graph diagram
    accDescr: Graph with 6 nodes and 6 connections. Nodes: Customer 40person41, On-call engineer 40person41, Shipment API 40external system, event producer41, Event Bus 40Kafka41 40external, at-least-once delivery41, NotifyGate 40external SMS47email provider41, Notification Worker 40this system41. Connections: Shipment API 40external system, event producer41 to Event Bus 40Kafka41 40external, at-least-once delivery41 (publishes shipment events), Event Bus 40Kafka41 40external, at-least-once delivery41 to Notification Worker 40this system41 (delivers events, at-least-once), Notification Worker 40this system41 to NotifyGate 40external SMS47email provider41 (sends notification), NotifyGate 40external SMS47email provider41 to Customer 40person41 (delivers SMS47email to), Customer 40person41 to On-call engineer 40person41 (reports duplicate via support ticket), On-call engineer 40person41 to Notification Worker 40this system41 (investigates send logs of).
    Customer["Customer<br/>#40;person#41;"]:::purple
    OnCall["On-call engineer<br/>#40;person#41;"]:::purple
    ShipmentAPI["Shipment API<br/>#40;external system,<br/>event producer#41;"]:::brown
    EventBus["Event Bus<br/>#40;Kafka#41;<br/>#40;external,<br/>at-least-once<br/>delivery#41;"]:::brown
    NotifyGate["NotifyGate<br/>#40;external<br/>SMS#47;email<br/>provider#41;"]:::brown
    Worker["Notification Worker<br/>#40;this system#41;"]:::blue

    ShipmentAPI -->|"publishes shipment<br/>events"| EventBus
    EventBus -->|"delivers events,<br/>at-least-once"| Worker
    Worker -->|"sends notification"| NotifyGate
    NotifyGate -->|"delivers<br/>SMS#47;email to"| Customer
    Customer -->|"reports duplicate<br/>via support ticket"| OnCall
    OnCall -->|"investigates send<br/>logs of"| Worker

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Diagram: two people (Customer, On-call engineer) and three external systems (Shipment API, the
Kafka-based Event Bus, NotifyGate) around the Notification Worker, the system this incident concerns.
The Event Bus is labeled with the exact property (at-least-once delivery) that this incident's root
cause depends on -- the same property named in the postmortem's root-cause section and in the RFC's
Context section._

## Reading this diagram against the postmortem

- **Shipment API** is the upstream system whose events, once duplicated by a rebalance, is what the
  Notification Worker reprocessed -- named in the postmortem's root-cause step 1.
- **Event Bus (Kafka)** is where the consumer-group rebalance that caused the replay actually
  happened -- named in the postmortem's timeline (14:02 entries) and root-cause steps 1 and 3.
- **Notification Worker** is the system whose missing idempotency check is the postmortem's systemic
  root cause, and the system this capstone's ADR and PR change.
- **NotifyGate** is the external provider that actually delivered the duplicate SMS/email messages to
  customers -- the postmortem's Impact section describes what customers received through this system.
- **Customer** and **On-call engineer** are the two people named in the postmortem's timeline: the
  customers who received duplicates and filed support tickets, and the on-call engineer who
  correlated those tickets into a confirmed pattern.

No node in this diagram is absent from the postmortem's prose, and no system or actor named in the
postmortem is missing from this diagram.

---

← Previous: [Capstone Overview](./overview.md)
