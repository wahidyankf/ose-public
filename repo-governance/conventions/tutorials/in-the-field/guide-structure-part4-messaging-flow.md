---
description: Mermaid diagrams for point-to-point JMS messaging and Kafka pub/sub progression with partitioning.
when_to_use: Use when building a messaging-pattern progression diagram.
---

# Guide Structure Part 4: Messaging Flow Diagrams

**Example 6a: Messaging - Point-to-Point (JMS Queue)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Messaging Flow Diagrams
    accDescr: Producer 1 leads to Queue OrderQueue via send message; Producer 2 leads to Queue OrderQueue via send message; Queue OrderQueue leads to Consumer 1 via consume once; and 2 more links.
    A1[Producer 1] -- send message --> A2[Queue<br/>OrderQueue]
    A3[Producer 2] -- send message --> A2
    A2 -- consume once --> A4[Consumer 1]
    A2 -- waits --> A5[Consumer 2]
    A4 -.-> note1[Message deleted<br/>after processing]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class A1,A2,A3,A4,A5 blue
    class note1 purple
```

**Use case**: Work queue distribution, only one consumer should process each message.

**Example 6b: Messaging - Pub/Sub (Kafka Topic)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Messaging Flow Diagrams (2)
    accDescr: Producer 1 leads to Topic OrderEvents via Publish event; Producer 2 leads to Topic OrderEvents via Publish event; Topic OrderEvents leads to Consumer Group 1 Inventory Service via All subscribers receive; and 3 more links.
    B1[Producer 1] -->|Publish event| B2[Topic<br/>OrderEvents]
    B3[Producer 2] -->|Publish event| B2
    B2 -->|All subscribers receive| B4[Consumer Group 1<br/>Inventory Service]
    B2 -->|All subscribers receive| B5[Consumer Group 2<br/>Email Service]
    B2 -->|All subscribers receive| B6[Consumer Group 3<br/>Analytics Service]

    note1[Messages retained<br/>for 7 days<br/>Multiple consumers<br/>get copy]
    B2 -.-> note1

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class B1,B2,B3,B4,B5,B6 orange
    class note1 purple
```

**Use case**: Event broadcasting, multiple services need same events for different purposes.

**Example 6c: Messaging - Production (Kafka Partitions)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Messaging Flow Diagrams (3)
    accDescr: Producer leads to Partition 0 via key routing; Producer leads to Partition 1 via key routing; Partition 0 leads to Consumer 1 via assigned; Partition 1 leads to Consumer 2 via assigned; and 3 more links.
    C1[Producer] -- key routing --> C2[Partition 0]
    C1 -- key routing --> C3[Partition 1]
    C2 -- assigned --> C5[Consumer 1]
    C3 -- assigned --> C6[Consumer 2]
    C5 -- part of --> C8[Consumer Group]
    C6 -- part of --> C8
    C2 -.-> note1[Parallel processing<br/>Order within<br/>partition]

    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    class C1,C2,C3,C5,C6,C8 teal
    class note1 purple
```

**Production benefit**: Parallel processing with ordering guarantees within partition, horizontal scalability.
