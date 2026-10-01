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
    accDescr: Graph with 6 nodes and 6 connections. Nodes: Customer (person), Warehouse Operator (person), Order Service (external system), ParcelLink API (external carrier system), NotifyGate (external SMS/email provider), Harborlight Shipment Tracker (this system). Connections: Order Service (external system) to Harborlight Shipment Tracker (this system) (sends order-placed events), Warehouse Operator (person) to Harborlight Shipment Tracker (this system) (updates shipment status), Harborlight Shipment Tracker (this system) to ParcelLink API (external carrier system) (queries carrier status), Harborlight Shipment Tracker (this system) to NotifyGate (external SMS/email provider) (sends notifications via), NotifyGate (external SMS/email provider) to Customer (person) (delivers SMS/email to), Customer (person) to Harborlight Shipment Tracker (this system) (checks status on).
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
