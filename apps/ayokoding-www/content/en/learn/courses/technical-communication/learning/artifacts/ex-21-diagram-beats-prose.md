---
title: "Artifact: Flow Diagram — Shipment Event Processing"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 61
---

> Shipment-event processing flow, diagram replacing a dense paragraph -- exercises co-11.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
%% Shipment-event processing flow
graph LR
    accTitle: graph diagram
    accDescr: Graph with 9 nodes and 8 connections. Nodes: Order Service, Shipment API, Shipment DB, Event Bus, Notification Worker, NotifyGate, Customer, ParcelLink, Carrier Adapter. Connections: Order Service to Shipment API, Shipment API to Shipment DB, Shipment API to Event Bus, Event Bus to Notification Worker, Notification Worker to NotifyGate, NotifyGate to Customer, ParcelLink to Carrier Adapter, Carrier Adapter to Event Bus.
    Order["Order Service"]:::blue --> API["Shipment API"]:::blue
    API --> DB["Shipment DB"]:::teal
    API --> Bus["Event Bus"]:::orange
    Bus --> Worker["Notification Worker"]:::blue
    Worker --> Notify["NotifyGate"]:::blue
    Notify --> Cust["Customer"]:::blue
    ParcelLink["ParcelLink"]:::blue --> Adapter["Carrier Adapter"]:::blue
    Adapter --> Bus

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Diagram: two flows converge on the Event Bus -- the order-to-notification path (Order Service through
to the Customer) and the carrier-status path (ParcelLink through the Carrier Adapter) -- and both feed
the Notification Worker._
