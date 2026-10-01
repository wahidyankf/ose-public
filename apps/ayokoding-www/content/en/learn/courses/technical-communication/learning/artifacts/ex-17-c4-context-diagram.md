---
title: "Artifact: C4 Context Diagram — Harborlight Shipment Tracker"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 57
---

> C4 Level 1 system-context diagram -- exercises co-11 and co-12.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% C4 Level 1 -- System Context: Harborlight Shipment Tracker
graph TD
    accTitle: graph diagram
    accDescr: Graph with 6 nodes and 6 connections. Nodes: Customer 40person41, Warehouse Operator 40person41, Order Service 40external system41, ParcelLink API 40external carrier system41, NotifyGate 40external SMS47email provider41, Harborlight Shipment Tracker 40this system41. Connections: Order Service 40external system41 to Harborlight Shipment Tracker 40this system41 (sends order-placed events), Warehouse Operator 40person41 to Harborlight Shipment Tracker 40this system41 (updates shipment status), Harborlight Shipment Tracker 40this system41 to ParcelLink API 40external carrier system41 (queries carrier status), Harborlight Shipment Tracker 40this system41 to NotifyGate 40external SMS47email provider41 (sends notifications via), NotifyGate 40external SMS47email provider41 to Customer 40person41 (delivers SMS47email to), Customer 40person41 to Harborlight Shipment Tracker 40this system41 (checks status on).
    Customer["Customer<br/>#40;person#41;"]:::purple
    Ops["Warehouse Operator<br/>#40;person#41;"]:::purple
    OrderSvc["Order Service<br/>#40;external<br/>system#41;"]:::brown
    ParcelLink["ParcelLink API<br/>#40;external carrier<br/>system#41;"]:::brown
    NotifyGate["NotifyGate<br/>#40;external<br/>SMS#47;email<br/>provider#41;"]:::brown
    Tracker["Harborlight Shipment<br/>Tracker<br/>#40;this system#41;"]:::blue

    OrderSvc -->|"sends order-placed<br/>events"| Tracker
    Ops -->|"updates shipment<br/>status"| Tracker
    Tracker -->|"queries carrier<br/>status"| ParcelLink
    Tracker -->|"sends notifications<br/>via"| NotifyGate
    NotifyGate -->|"delivers<br/>SMS#47;email to"| Customer
    Customer -->|"checks status on"| Tracker

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Diagram: two people (Customer, Warehouse Operator) and three external systems (Order Service,
ParcelLink API, NotifyGate) around the one system this diagram is scoped to, Harborlight Shipment
Tracker. No internal container is shown._
