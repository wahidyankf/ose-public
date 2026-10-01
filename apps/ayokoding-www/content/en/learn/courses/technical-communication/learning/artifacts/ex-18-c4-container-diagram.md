---
title: "Artifact: C4 Container Diagram — Harborlight Shipment Tracker"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 58
---

> C4 Level 2 container diagram -- exercises co-12.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% C4 Level 2 -- Containers inside Harborlight Shipment Tracker
graph TD
    accTitle: graph diagram
    accDescr: Graph with 8 nodes and 7 connections. Nodes: Order Service 40external41, ParcelLink API 40external41, NotifyGate 40external41, Shipment API Python47Flask, REST, Event Bus Kafka, Notification Worker Python consumer, Shipment DB PostgreSQL, Carrier Adapter Python, HTTPS47REST. Connections: Order Service 40external41 to Shipment API Python47Flask, REST (HTTPS47REST, order-placed event), Shipment API Python47Flask, REST to Shipment DB PostgreSQL (writes shipment record), Shipment API Python47Flask, REST to Event Bus Kafka (publishes shipment-event), Event Bus Kafka to Notification Worker Python consumer (consumes shipment-event), Notification Worker Python consumer to NotifyGate 40external41 (sends SMS47email), Carrier Adapter Python, HTTPS47REST to ParcelLink API 40external41 (HTTPS47REST, polls47webhook), Carrier Adapter Python, HTTPS47REST to Event Bus Kafka (writes carrier-status event).
    OrderSvc["Order Service<br/>#40;external#41;"]:::brown
    ParcelLink["ParcelLink API<br/>#40;external#41;"]:::brown
    NotifyGate["NotifyGate<br/>#40;external#41;"]:::brown

    API["Shipment API<br/>Python#47;Flask,<br/>REST"]:::blue
    Bus["Event Bus<br/>Kafka"]:::orange
    Worker["Notification Worker<br/>Python consumer"]:::blue
    DB["Shipment DB<br/>PostgreSQL"]:::teal
    Adapter["Carrier Adapter<br/>Python,<br/>HTTPS#47;REST"]:::blue

    OrderSvc -->|"HTTPS#47;REST,<br/>order-placed event"| API
    API -->|"writes shipment<br/>record"| DB
    API -->|"publishes<br/>shipment-event"| Bus
    Bus -->|"consumes<br/>shipment-event"| Worker
    Worker -->|"sends SMS#47;email"| NotifyGate
    Adapter -->|"HTTPS#47;REST,<br/>polls#47;webhook"| ParcelLink
    Adapter -->|"writes<br/>carrier-status<br/>event"| Bus

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Diagram: five containers (Shipment API, Event Bus, Notification Worker, Shipment DB, Carrier
Adapter) inside the Shipment Tracker boundary, each labeled with its technology, connected by edges
labeled with protocol and purpose._
