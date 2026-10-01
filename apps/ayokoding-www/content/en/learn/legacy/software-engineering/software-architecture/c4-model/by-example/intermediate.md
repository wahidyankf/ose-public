---
title: "Intermediate"
date: 2026-01-31T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 31-60: C4 Level 2 Container and Level 3 Component diagrams for procurement-platform-be — web-ui, APIs, event bus, postgres, and internal component structure (40-75% coverage)"
tags: ["c4-model", "architecture", "tutorial", "by-example", "intermediate", "diagrams"]
---

This intermediate-level tutorial builds on the System Context foundation with 30 examples covering C4 Level 2 (Container) and Level 3 (Component) diagrams. Every example zooms into the `procurement-platform-be` containers — `web-ui`, `purchasing-api`, `receiving-api`, `invoicing-api`, `payments-worker`, `event-bus`, `postgres`, `read-store`, and `secret-manager` — and then into the internal component structure of `purchasing-api`.

## Container Diagrams — Core Containers (Examples 31–38)

### Example 31: Minimal Container Diagram — web-ui and purchasing-api

The first Container diagram zooms inside the system boundary and reveals the two most visible containers: the browser-based portal and the primary REST API.

```mermaid
graph TD
    accTitle: Example 31: Minimal Container Diagram — web-ui and purchasing-api
    accDescr: Graph with 3 nodes and 2 connections. Nodes: [Person] Buyer Employee, [Container: Browser App] web-ui Next.js portal Requisition and PO management, [Container: REST API] purchasing-api Requisition and PO commands Node.js / TypeScript. Connections: [Person] Buyer Employee to [Container: Browser App] web-ui Next.js portal Requisition and PO management (Submits requisitions [HTTPS browser]), [Container: Browser App] web-ui Next.js portal Requisition and PO management to [Container: REST API] purchasing-api Requisition and PO commands Node.js / TypeScript (POST /requisitions [HTTPS/JSON]).
    Buyer["[Person]<br/>Buyer Employee"]
    WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js portal<br/>Requisition and PO<br/>management"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Requisition and PO<br/>commands<br/>Node.js / TypeScript"]

    Buyer -->|"Submits<br/>requisitions [HTTPS<br/>browser]"| WebUI
    WebUI -->|"POST /requisitions<br/>[HTTPS/JSON]"| PurchAPI

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Container type labels**: `[Container: Browser App]` and `[Container: REST API]` prevent ambiguity
- **Technology stack in label**: Next.js for web-ui, Node.js/TypeScript for API — architectural decisions visible
- **Single data flow**: web-ui calls purchasing-api for all state changes; no direct DB access from browser

**Design Rationale**: Starting with two containers and one relationship establishes the pattern before adding complexity. Every additional container is easier to understand once the basic browser-to-API pattern is established.

**Key Takeaway**: Begin Container diagrams with the user-facing containers and their primary relationship. Add internal plumbing (databases, queues) only once the primary data flow is clear.

**Why It Matters**: Container diagrams are the primary communication tool for engineering teams planning deployment topology. Starting with the user-facing path grounds the conversation in user value before infrastructure detail. Progressive disclosure from the user-facing container outward also ensures that infrastructure decisions are driven by actual user flows rather than by technology preferences, reducing over-engineering of back-end containers that do not serve the primary user path.

---

### Example 32: Adding PostgreSQL — the Write Store

The primary datastore for all P2P state. Every command that changes PO or requisition state writes to PostgreSQL.

```mermaid
graph TD
    accTitle: Example 32: Adding PostgreSQL — the Write Store
    accDescr: Graph with 3 nodes and 3 connections. Nodes: [Container: Browser App] web-ui Next.js portal, [Container: REST API] purchasing-api Command handling, [Container: Database] postgres PostgreSQL 16 Primary write store. Connections: [Container: Browser App] web-ui Next.js portal to [Container: REST API] purchasing-api Command handling (POST /requisitions [HTTPS/JSON]), [Container: REST API] purchasing-api Command handling to [Container: Database] postgres PostgreSQL 16 Primary write store (Writes PO and requisition state [TCP/5432]), [Container: REST API] purchasing-api Command handling to [Container: Database] postgres PostgreSQL 16 Primary write store (Reads PO details for responses [TCP/5432]).
    WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js portal"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Command handling"]
    PG["[Container:<br/>Database]<br/>postgres<br/>PostgreSQL 16<br/>Primary write store"]

    WebUI -->|"POST /requisitions<br/>[HTTPS/JSON]"| PurchAPI
    PurchAPI -->|"Writes PO and<br/>requisition state<br/>[TCP/5432]"| PG
    PurchAPI -->|"Reads PO details<br/>for responses<br/>[TCP/5432]"| PG

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Separate read and write arrows**: Command path writes; query path reads — different SQL patterns
- **TCP/5432**: PostgreSQL native protocol — not an abstracted HTTP API
- **PostgreSQL version 16**: Versioning in Container diagrams surfaces upgrade planning needs

**Design Rationale**: Showing separate read and write arrows from purchasing-api to postgres signals that CQRS or read optimization patterns may apply. If both arrows are identical, the optimization opportunity is invisible.

**Key Takeaway**: Show separate read and write relationships between an API and its database. This makes query optimization, read replicas, and CQRS patterns visible at Container level.

**Why It Matters**: P2P systems have read-heavy query patterns (order tracking, status checks) and write-heavy command patterns (approvals, PO issuance). Treating reads and writes identically in the diagram produces a database that is over-provisioned for writes and under-provisioned for reads. Teams that surface this distinction at Container diagram time can plan for read replicas and connection pooling before the first performance test reveals the bottleneck under production-scale query volume.

---

### Example 33: Adding the Event Bus — Kafka

Domain events flow between containers through Kafka. This decouples purchasing-api from receiving-api and invoicing-api.

```mermaid
graph TD
    accTitle: Example 33: Adding the Event Bus — Kafka
    accDescr: Graph with 4 nodes and 4 connections. Nodes: [Container: REST API] purchasing-api Requisition and PO commands, [Container: Message Broker] event-bus Apache Kafka Domain event streaming, [Container: REST API] receiving-api Goods receipt recording, [Container: REST API] invoicing-api Invoice registration. Connections: [Container: REST API] purchasing-api Requisition and PO commands to [Container: Message Broker] event-bus Apache Kafka Domain event streaming (Publishes PurchaseOrderIssued [Kafka topic: po-events]), [Container: REST API] purchasing-api Requisition and PO commands to [Container: Message Broker] event-bus Apache Kafka Domain event streaming (Publishes Purchase OrderAcknowledged [Kafka topic: po-events]), [Container: Message Broker] event-bus Apache Kafka Domain event streaming to [Container: REST API] receiving-api Goods receipt recording (Delivers po-events to receiving subscriber), [Container: Message Broker] event-bus Apache Kafka Domain event streaming to [Container: REST API] invoicing-api Invoice registration (Delivers po-events to invoicing subscriber).
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Requisition and PO<br/>commands"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus<br/>Apache Kafka<br/>Domain event<br/>streaming"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api<br/>Goods receipt<br/>recording"]
    InvAPI["[Container: REST<br/>API]<br/>invoicing-api<br/>Invoice registration"]

    PurchAPI -->|"Publishes<br/>PurchaseOrderIssued<br/>[Kafka topic:<br/>po-events]"| EventBus
    PurchAPI -->|"Publishes Purchase<br/>OrderAcknowledged<br/>[Kafka topic:<br/>po-events]"| EventBus
    EventBus -->|"Delivers po-events<br/>to receiving<br/>subscriber"| RecvAPI
    EventBus -->|"Delivers po-events<br/>to invoicing<br/>subscriber"| InvAPI

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class EventBus pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Domain event names**: `PurchaseOrderIssued`, `PurchaseOrderAcknowledged` — not generic messages
- **Kafka topic names**: `po-events` on arrow labels — contractual interface between producer and consumers
- **Fan-out pattern**: One topic, two subscribers — each processes events independently

**Design Rationale**: Naming domain events (not just "sends message") in Container diagrams makes the event contract visible. This prevents publishing teams from changing event shapes without updating consumers.

**Key Takeaway**: Show Kafka topic names and domain event names in Container diagrams. Generic "sends message" labels hide the event contract that drives cross-container consistency.

**Why It Matters**: Event schema mismatches between producer and consumer cause silent data corruption in P2P. A Kafka consumer expecting `PurchaseOrderIssued` with a `supplierId` field that the producer drops will silently skip notifications — a failure that surfaces weeks later in supplier audits. Naming Kafka as a Container also triggers the schema registry discussion, ensuring that event contracts are version-controlled and consumer teams are notified before breaking schema changes are published.

---

### Example 34: Adding the payments-worker Container

The payments-worker is a background process, not a REST API. It polls for payment-ready invoices and triggers bank disbursement.

```mermaid
graph TD
    accTitle: Example 34: Adding the payments-worker Container
    accDescr: Graph with 5 nodes and 6 connections. Nodes: [Container: REST API] invoicing-api Invoice registration and matching, [Container: Message Broker] event-bus Kafka, [Container: Background Worker] payments-worker Payment run scheduling and bank disbursement, [External System] Bank ISO 20022 payment processing, [Container: Database] postgres Primary write store. Connections: [Container: REST API] invoicing-api Invoice registration and matching to [Container: Message Broker] event-bus Kafka (Publishes InvoiceMatched [Kafka topic: invoice-events]), [Container: Message Broker] event-bus Kafka to [Container: Background Worker] payments-worker Payment run scheduling and bank disbursement (Delivers invoice-events), [Container: Background Worker] payments-worker Payment run scheduling and bank disbursement to [Container: Database] postgres Primary write store (Reads payment schedule [TCP/5432]), [Container: Background Worker] payments-worker Payment run scheduling and bank disbursement to [Container: Database] postgres Primary write store (Writes payment status [TCP/5432]), [Container: Background Worker] payments-worker Payment run scheduling and bank disbursement to [External System] Bank ISO 20022 payment processing (Sends payment file [ISO 20022 pain.001]), [External System] Bank ISO 20022 payment processing to [Container: Background Worker] payments-worker Payment run scheduling and bank disbursement (Returns status report [ISO 20022 pain.002]).
    InvAPI["[Container: REST<br/>API]<br/>invoicing-api<br/>Invoice registration<br/>and matching"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus<br/>Kafka"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker<br/>Payment run<br/>scheduling<br/>and bank<br/>disbursement"]
    Bank["[External System]<br/>Bank<br/>ISO 20022 payment<br/>processing"]
    PG["[Container:<br/>Database]<br/>postgres<br/>Primary write store"]

    InvAPI -->|"Publishes<br/>InvoiceMatched<br/>[Kafka topic:<br/>invoice-events]"| EventBus
    EventBus -->|"Delivers<br/>invoice-events"| PayWorker
    PayWorker -->|"Reads payment<br/>schedule [TCP/5432]"| PG
    PayWorker -->|"Writes payment<br/>status [TCP/5432]"| PG
    PayWorker -->|"Sends payment file<br/>[ISO 20022<br/>pain.001]"| Bank
    Bank -->|"Returns status<br/>report [ISO 20022<br/>pain.002]"| PayWorker

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class InvAPI pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class EventBus pal-0173B2
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Background Worker type**: Distinct container type from REST API — no HTTP server, no user-facing port
- **Event-triggered execution**: Worker subscribes to `invoice-events` rather than being polled
- **pain.001/pain.002**: ISO 20022 payment messages on both arrows — contractual format

**Design Rationale**: Background workers are a distinct deployment unit with different scaling characteristics from REST APIs. Showing the worker as a separate container forces separate scaling and monitoring discussions.

**Key Takeaway**: Model background workers as distinct Container elements with their own type label. Workers have different deployment, scaling, and failure characteristics from REST APIs — conflating them hides operational complexity.

**Why It Matters**: Payment workers that share infrastructure with REST APIs suffer from noisy-neighbor problems during payment runs. Container separation makes the case for isolated worker nodes with dedicated resources during batch disbursement windows. Isolated payment worker containers also simplify PCI-DSS scope reduction — a named container boundary maps directly to a network security zone that auditors can verify independently of the general API infrastructure.

---

### Example 35: Adding the read-store Container

A read-store (materialized views or read-optimized DB) separates query concerns from the primary write store, enabling CQRS.

```mermaid
graph TD
    accTitle: Example 35: Adding the read-store Container
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Container: REST API] purchasing-api Commands — write path, [Container: Database] postgres Primary write store, [Container: Message Broker] event-bus Kafka, [Container: Database] read-store Materialized views PostgreSQL read replica or ElasticSearch, [Container: Browser App] web-ui Next.js portal. Connections: [Container: REST API] purchasing-api Commands — write path to [Container: Database] postgres Primary write store (Writes state [TCP/5432]), [Container: Database] postgres Primary write store to [Container: Message Broker] event-bus Kafka (Publishes change events [CDC / Debezium]), [Container: Message Broker] event-bus Kafka to [Container: Database] read-store Materialized views PostgreSQL read replica or ElasticSearch (Delivers change events), [Container: Browser App] web-ui Next.js portal to [Container: Database] read-store Materialized views PostgreSQL read replica or ElasticSearch (Queries order list and status [HTTPS/JSON]).
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Commands — write<br/>path"]
    PG["[Container:<br/>Database]<br/>postgres<br/>Primary write store"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus<br/>Kafka"]
    ReadStore["[Container:<br/>Database]<br/>read-store<br/>Materialized views<br/>PostgreSQL read<br/>replica<br/>or ElasticSearch"]
    WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js portal"]

    PurchAPI -->|"Writes state<br/>[TCP/5432]"| PG
    PG -->|"Publishes change<br/>events [CDC /<br/>Debezium]"| EventBus
    EventBus -->|"Delivers change<br/>events"| ReadStore
    WebUI -->|"Queries order list<br/>and status<br/>[HTTPS/JSON]"| ReadStore

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class EventBus pal-0173B2
    class ReadStore pal-CA9161
    class WebUI pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **CDC / Debezium**: Change Data Capture populates read-store from write-store events
- **WebUI reads from read-store, not postgres**: Read path is isolated from write path
- **Eventual consistency**: CDC introduces lag — read-store is eventually consistent

**Design Rationale**: CQRS at Container level separates the write path (purchasing-api → postgres) from the read path (web-ui → read-store). This separation makes eventual consistency visible and forces the team to plan for it.

**Key Takeaway**: When query patterns differ significantly from write patterns, model a separate read-store container. Eventual consistency introduced by CDC must be acknowledged at Container level, not discovered by users.

**Why It Matters**: P2P dashboards (order status lists, spend analytics) have very different query patterns from command handlers. Without a read-store, complex reporting queries compete with transactional writes on the same database, causing performance degradation during month-end reporting runs. Surfacing the read-store as a named Container forces the team to define eventual consistency guarantees for dashboards before the UI is built, preventing surprise data-freshness complaints after launch.

---

### Example 36: Adding the secret-manager Container

The secret-manager container stores and rotates credentials used by all other containers.

```mermaid
graph TD
    accTitle: Example 36: Adding the secret-manager Container
    accDescr: Graph with 5 nodes and 5 connections. Nodes: [Container: REST API] purchasing-api, [Container: REST API] receiving-api, [Container: REST API] invoicing-api, [Container: Background Worker] payments-worker, [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault. Connections: [Container: REST API] purchasing-api to [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault (Retrieves DB credentials on startup [HTTPS]), [Container: REST API] receiving-api to [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault (Retrieves DB credentials on startup [HTTPS]), [Container: REST API] invoicing-api to [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault (Retrieves DB credentials on startup [HTTPS]), [Container: Background Worker] payments-worker to [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault (Retrieves bank API key on startup [HTTPS]), [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault to [Container: Secret Store] secret-manager AWS Secrets Manager or HashiCorp Vault (Rotates credentials on schedule [internal]).
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api"]
    InvAPI["[Container: REST<br/>API]<br/>invoicing-api"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker"]
    SecretMgr["[Container: Secret<br/>Store]<br/>secret-manager<br/>AWS Secrets Manager<br/>or HashiCorp Vault"]

    PurchAPI -->|"Retrieves DB<br/>credentials on<br/>startup [HTTPS]"| SecretMgr
    RecvAPI -->|"Retrieves DB<br/>credentials on<br/>startup [HTTPS]"| SecretMgr
    InvAPI -->|"Retrieves DB<br/>credentials on<br/>startup [HTTPS]"| SecretMgr
    PayWorker -->|"Retrieves bank API<br/>key on startup<br/>[HTTPS]"| SecretMgr
    SecretMgr -->|"Rotates credentials<br/>on schedule<br/>[internal]"| SecretMgr

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SecretMgr pal-808080
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Key Elements**:

- **All containers fetch credentials**: No hardcoded secrets in any container's environment variables
- **On startup retrieval**: Credentials fetched at container start — rotation triggers restart or cache refresh
- **Bank API key in payments-worker**: Only the worker holds the bank credential — least-privilege

**Design Rationale**: Drawing the secret-manager at Container level makes secret management a first-class architectural concern. Teams that leave it implicit discover credential rotation failures in production.

**Key Takeaway**: Show secret-manager as a container that every credential-consuming container depends on. Secret management is an architectural dependency, not a deployment detail.

**Why It Matters**: Hardcoded or environment-variable credentials cannot be rotated without redeployment. Secret manager integration enables zero-downtime credential rotation — a requirement in financial services where credential compromise triggers immediate rotation mandates. In a P2P platform with bank API keys and supplier portal credentials, secret rotation without downtime is a production-continuity requirement that must be designed as a named Container early, not retrofitted after a credential exposure incident.

---

### Example 37: Full Container Diagram — All Nine Containers

The complete Level 2 view of the Procurement Platform with all containers in one diagram.

```mermaid
graph TD
    accTitle: Example 37: Full Container Diagram — All Nine Containers
    accDescr: Graph with 13 nodes and 19 connections. Nodes: [Person] Buyer Employee, [Person /Ext System] Supplier, [External System] Bank, [External System] Internal ERP / GL, [Container: Browser App] web-ui Next.js portal, [Container: REST API] purchasing-api Requisition and PO, [Container: REST API] receiving-api Goods receipt, [Container: REST API] invoicing-api Invoice matching, [Container: Background Worker] payments-worker Payment runs, [Container: Message Broker] event-bus Kafka, [Container: Database] postgres Primary write store, [Container: Database] read-store Query projections, and 1 more. Connections: [Person] Buyer Employee to [Container: Browser App] web-ui Next.js portal (Uses portal [HTTPS]), [Container: Browser App] web-ui Next.js portal to [Container: REST API] purchasing-api Requisition and PO (Commands [REST]), [Container: Browser App] web-ui Next.js portal to [Container: Database] read-store Query projections (Queries [REST]), [Container: REST API] purchasing-api Requisition and PO to [Container: Database] postgres Primary write store (Writes [TCP/5432]), [Container: REST API] purchasing-api Requisition and PO to [Container: Message Broker] event-bus Kafka (Publishes events [Kafka]), [Container: REST API] receiving-api Goods receipt to [Container: Database] postgres Primary write store (Writes GRNs [TCP/5432]), [Container: REST API] receiving-api Goods receipt to [Container: Message Broker] event-bus Kafka (Publishes GoodsReceived [Kafka]), [Container: REST API] invoicing-api Invoice matching to [Container: Database] postgres Primary write store (Writes invoices [TCP/5432]), [Container: REST API] invoicing-api Invoice matching to [Container: Message Broker] event-bus Kafka (Publishes InvoiceMatched [Kafka]), [Container: Message Broker] event-bus Kafka to [Container: REST API] receiving-api Goods receipt (Delivers po-events), [Container: Message Broker] event-bus Kafka to [Container: Background Worker] payments-worker Payment runs (Delivers invoice-events), [Container: Database] postgres Primary write store to [Container: Database] read-store Query projections (CDC to read-store [Debezium]), and 7 more.
    Buyer["[Person]<br/>Buyer Employee"]
    Supplier["[Person /Ext System]<br/>Supplier"]
    Bank["[External System]<br/>Bank"]
    ERP["[External System]<br/>Internal ERP / GL"]

    WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js portal"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Requisition and PO"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api<br/>Goods receipt"]
    InvAPI["[Container: REST<br/>API]<br/>invoicing-api<br/>Invoice matching"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker<br/>Payment runs"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus<br/>Kafka"]
    PG["[Container:<br/>Database]<br/>postgres<br/>Primary write store"]
    ReadStore["[Container:<br/>Database]<br/>read-store<br/>Query projections"]
    SecretMgr["[Container: Secret<br/>Store]<br/>secret-manager"]

    Buyer -->|"Uses portal<br/>[HTTPS]"| WebUI
    WebUI -->|"Commands [REST]"| PurchAPI
    WebUI -->|"Queries [REST]"| ReadStore
    PurchAPI -->|"Writes [TCP/5432]"| PG
    PurchAPI -->|"Publishes events<br/>[Kafka]"| EventBus
    RecvAPI -->|"Writes GRNs<br/>[TCP/5432]"| PG
    RecvAPI -->|"Publishes<br/>GoodsReceived<br/>[Kafka]"| EventBus
    InvAPI -->|"Writes invoices<br/>[TCP/5432]"| PG
    InvAPI -->|"Publishes<br/>InvoiceMatched<br/>[Kafka]"| EventBus
    EventBus -->|"Delivers po-events"| RecvAPI
    EventBus -->|"Delivers<br/>invoice-events"| PayWorker
    PG -->|"CDC to read-store<br/>[Debezium]"| ReadStore
    PayWorker -->|"Writes payment<br/>status [TCP/5432]"| PG
    PayWorker -->|"Sends payment file<br/>[ISO 20022]"| Bank
    Bank -->|"Returns status [ISO<br/>20022]"| PayWorker
    PurchAPI -->|"Posts accounting<br/>[REST]"| ERP
    Supplier -->|"Sends invoice<br/>[portal]"| InvAPI
    PurchAPI -->|"Fetches credentials<br/>[HTTPS]"| SecretMgr
    PayWorker -->|"Fetches bank key<br/>[HTTPS]"| SecretMgr

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ERP pal-CC78BC
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    class PayWorker pal-CC78BC
    class EventBus pal-0173B2
    class PG pal-CA9161
    class ReadStore pal-CA9161
    class SecretMgr pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Nine internal containers**: All deployment units in one view
- **Four external actors**: Buyer, Supplier, Bank, ERP from Level 1
- **Event-driven backbone**: Kafka connects all three API containers asynchronously

**Design Rationale**: The full Container diagram is the engineering team's primary shared mental model. It is updated when new containers are introduced and reviewed at every major architecture decision.

**Key Takeaway**: Maintain one authoritative full Container diagram per system. It serves as the reference point for all technical discussions about deployment, scaling, and integration.

**Why It Matters**: Engineering teams without a shared Container diagram make siloed decisions that create integration problems at deployment time. One authoritative diagram prevents duplicate containers, conflicting technology choices, and missed integration points. When every team sees the same complete picture before parallel development begins, interface contracts between containers can be agreed upon in advance, eliminating the integration surprises that otherwise surface only during deployment or load testing.

---

### Example 38: Container Diagram — Technology Choices

Annotating technology choices at Container level makes the architecture decision record visible without requiring a separate ADR document.

```mermaid
graph TD
    accTitle: Example 38: Container Diagram — Technology Choices
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Container: Browser App] web-ui Next.js 16 (App Router) TypeScript — deployed to Vercel, [Container: REST API] purchasing-api Node.js 22 + Express TypeScript — Docker on ECS, [Container: Message Broker] event-bus Apache Kafka 3.7 MSK managed — 3 brokers, [Container: Database] postgres PostgreSQL 16 AWS RDS Multi-AZ, [Container: Secret Store] secret-manager AWS Secrets Manager KMS encrypted. Connections: [Container: Browser App] web-ui Next.js 16 (App Router) TypeScript — deployed to Vercel to [Container: REST API] purchasing-api Node.js 22 + Express TypeScript — Docker on ECS (REST commands [HTTPS/JSON]), [Container: REST API] purchasing-api Node.js 22 + Express TypeScript — Docker on ECS to [Container: Message Broker] event-bus Apache Kafka 3.7 MSK managed — 3 brokers (Publishes events [Kafka]), [Container: REST API] purchasing-api Node.js 22 + Express TypeScript — Docker on ECS to [Container: Database] postgres PostgreSQL 16 AWS RDS Multi-AZ (Reads/writes state [TCP/5432]), [Container: REST API] purchasing-api Node.js 22 + Express TypeScript — Docker on ECS to [Container: Secret Store] secret-manager AWS Secrets Manager KMS encrypted (Retrieves credentials [HTTPS]).
    WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js 16 (App<br/>Router)<br/>TypeScript —<br/>deployed to Vercel"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Node.js 22 + Express<br/>TypeScript — Docker<br/>on ECS"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus<br/>Apache Kafka 3.7<br/>MSK managed — 3<br/>brokers"]
    PG["[Container:<br/>Database]<br/>postgres<br/>PostgreSQL 16<br/>AWS RDS Multi-AZ"]
    SecretMgr["[Container: Secret<br/>Store]<br/>secret-manager<br/>AWS Secrets Manager<br/>KMS encrypted"]

    WebUI -->|"REST commands<br/>[HTTPS/JSON]"| PurchAPI
    PurchAPI -->|"Publishes events<br/>[Kafka]"| EventBus
    PurchAPI -->|"Reads/writes state<br/>[TCP/5432]"| PG
    PurchAPI -->|"Retrieves<br/>credentials [HTTPS]"| SecretMgr

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    class EventBus pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SecretMgr pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Version pinning in labels**: Next.js 16, Node.js 22, Kafka 3.7, PostgreSQL 16 — upgrade surface visible
- **Deployment target in label**: Vercel, ECS, MSK, RDS — infrastructure ownership visible
- **Managed vs. self-managed**: MSK (managed Kafka) vs. self-managed Kafka is architecturally significant

**Design Rationale**: Technology choices in container labels transform diagrams from architecture into architecture decision records. Version numbers make upgrade planning visible without a separate document.

**Key Takeaway**: Include technology name and version in container labels when those choices are consequential. Labels double as lightweight ADRs visible at a glance.

**Why It Matters**: Teams that omit versions from Container diagrams routinely discover incompatible dependency updates during deployments. Version visibility at Container level enables proactive upgrade planning before security advisories force emergency patches. When runtime versions are visible in the diagram, upgrade planning discussions happen in architecture reviews rather than being triggered by a security advisory two weeks before a production deployment under deadline pressure.

---

## Container Diagrams — Integration Patterns (Examples 39–46)

### Example 39: Request-Response vs. Event-Driven Containers

The Container diagram can explicitly show which relationships are synchronous request-response and which are asynchronous event-driven.

```mermaid
graph TD
    accTitle: Example 39: Request-Response vs. Event-Driven Containers
    accDescr: Graph with 5 nodes and 5 connections. Nodes: [Container: Browser App] web-ui, [Container: REST API] purchasing-api, [Container: Message Broker] event-bus / Kafka, [Container: REST API] receiving-api, [Container: Database] postgres. Connections: [Container: Browser App] web-ui to [Container: REST API] purchasing-api (SYNC: POST /requisitions [blocking HTTP]), [Container: REST API] purchasing-api to [Container: Database] postgres (SYNC: INSERT into po table [TCP]), [Container: REST API] purchasing-api to [Container: Message Broker] event-bus / Kafka (ASYNC: Publish PurchaseOrderIssued [fire-and-forget]), [Container: Message Broker] event-bus / Kafka to [Container: REST API] receiving-api (ASYNC: Deliver to receiving subscriber), [Container: REST API] receiving-api to [Container: Database] postgres (SYNC: INSERT into grn table [TCP]).
    WebUI["[Container: Browser<br/>App]<br/>web-ui"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api"]
    PG["[Container:<br/>Database]<br/>postgres"]

    WebUI -->|"SYNC: POST<br/>/requisitions<br/>[blocking HTTP]"| PurchAPI
    PurchAPI -->|"SYNC: INSERT into<br/>po table [TCP]"| PG
    PurchAPI -->|"ASYNC: Publish<br/>PurchaseOrderIssued<br/>[fire-and-forget]"| EventBus
    EventBus -->|"ASYNC: Deliver to<br/>receiving<br/>subscriber"| RecvAPI
    RecvAPI -->|"SYNC: INSERT into<br/>grn table [TCP]"| PG

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    class EventBus pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **SYNC / ASYNC prefixes**: Every arrow labeled with synchronicity character
- **Fire-and-forget on Kafka**: Platform does not wait for receiving-api to consume the event
- **Both sync writes to postgres**: Even event consumers write synchronously to their own tables

**Design Rationale**: Mixing SYNC and ASYNC labels forces the team to identify failure modes for each path. Sync failures propagate up the call stack; async failures require independent retry mechanisms.

**Key Takeaway**: Label every arrow with its synchronicity pattern (SYNC or ASYNC). This surfaces dead-letter queue requirements, retry policy needs, and user-facing latency commitments.

**Why It Matters**: P2P teams frequently debug timeouts that trace to synchronous ERP calls blocking the user-facing requisition API. If the blocking call was labeled SYNC in the Container diagram, the latency risk would have been addressed at design time. Surfacing the synchronous call path in a Container diagram also triggers the circuit-breaker and timeout design discussions needed to protect purchasing-api availability when ERP becomes degraded or temporarily unavailable.

---

### Example 40: Container Diagram — Scaling Annotations

Adding scaling strategy to container labels makes horizontal scaling decisions explicit.

```mermaid
graph TD
    accTitle: Example 40: Container Diagram — Scaling Annotations
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Container: Browser App] web-ui CDN-distributed Stateless, scales to edge, [Container: REST API] purchasing-api Horizontally scalable 3–10 instances behind ALB, [Container: Message Broker] event-bus / Kafka 3-broker cluster 6 partitions per topic, [Container: Background Worker] payments-worker Single-instance preferred during payment runs, [Container: Database] postgres Primary + 2 read replicas Multi-AZ failover. Connections: [Container: Browser App] web-ui CDN-distributed Stateless, scales to edge to [Container: REST API] purchasing-api Horizontally scalable 3–10 instances behind ALB (REST [HTTPS]), [Container: REST API] purchasing-api Horizontally scalable 3–10 instances behind ALB to [Container: Message Broker] event-bus / Kafka 3-broker cluster 6 partitions per topic (Publishes events), [Container: Message Broker] event-bus / Kafka 3-broker cluster 6 partitions per topic to [Container: Background Worker] payments-worker Single-instance preferred during payment runs (Delivers payment events), [Container: REST API] purchasing-api Horizontally scalable 3–10 instances behind ALB to [Container: Database] postgres Primary + 2 read replicas Multi-AZ failover (Writes [TCP/5432 primary]).
    WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>CDN-distributed<br/>Stateless, scales to<br/>edge"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Horizontally<br/>scalable<br/>3–10 instances<br/>behind ALB"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka<br/>3-broker cluster<br/>6 partitions per<br/>topic"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker<br/>Single-instance<br/>preferred<br/>during payment runs"]
    PG["[Container:<br/>Database]<br/>postgres<br/>Primary + 2 read<br/>replicas<br/>Multi-AZ failover"]

    WebUI -->|"REST [HTTPS]"| PurchAPI
    PurchAPI -->|"Publishes events"| EventBus
    EventBus -->|"Delivers payment<br/>events"| PayWorker
    PurchAPI -->|"Writes [TCP/5432<br/>primary]"| PG

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    class EventBus pal-0173B2
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Scale-out containers**: web-ui and purchasing-api labeled as horizontally scalable
- **Single-instance payments-worker**: Payment runs require idempotency guarantees; multiple instances risk double-payment
- **PostgreSQL Multi-AZ**: High availability for the write store
- **Kafka partitions**: 6 partitions allows up to 6 parallel consumer instances per topic

**Design Rationale**: Scaling annotations in container labels make the deployment topology's scaling constraints visible. The single-instance payments-worker constraint is critical — it must be enforced by infrastructure, not convention.

**Key Takeaway**: Annotate scaling strategy on container labels. Single-instance constraints and scale-out expectations are architectural decisions that must survive into infrastructure configuration.

**Why It Matters**: Accidental horizontal scaling of a payment worker that lacks idempotency protection causes double-payments — a financial error that is expensive to reverse and damages supplier relationships permanently. When scaling behavior is documented in the Container diagram, platform engineers and SREs share a common reference that prevents well-intentioned but dangerous auto-scaling rules from being applied uniformly across all containers regardless of their idempotency properties.

---

### Example 41: Container Diagram — Failure Modes

Annotating what happens when each container fails makes resilience design explicit.

```mermaid
graph TD
    accTitle: Example 41: Container Diagram — Failure Modes
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Container: REST API] purchasing-api FAIL: Returns 503 Retry with exponential backoff, [Container: Message Broker] event-bus / Kafka FAIL: Events queued in outbox Delivered on recovery, [Container: REST API] receiving-api FAIL: GRN entry blocked Alert warehouse team, [Container: Database] postgres FAIL: Failover to standby ~30s RTO via Multi-AZ, [Container: Background Worker] payments-worker FAIL: Payment run delayed Resume from last checkpoint. Connections: [Container: REST API] purchasing-api FAIL: Returns 503 Retry with exponential backoff to [Container: Message Broker] event-bus / Kafka FAIL: Events queued in outbox Delivered on recovery (Publishes to outbox if Kafka unavailable), [Container: Message Broker] event-bus / Kafka FAIL: Events queued in outbox Delivered on recovery to [Container: REST API] receiving-api FAIL: GRN entry blocked Alert warehouse team (Delivers GoodsReceived to receiving), [Container: REST API] purchasing-api FAIL: Returns 503 Retry with exponential backoff to [Container: Database] postgres FAIL: Failover to standby ~30s RTO via Multi-AZ (Writes [with circuit breaker]), [Container: Message Broker] event-bus / Kafka FAIL: Events queued in outbox Delivered on recovery to [Container: Background Worker] payments-worker FAIL: Payment run delayed Resume from last checkpoint (Delivers InvoiceMatched to worker).
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>FAIL: Returns 503<br/>Retry with<br/>exponential backoff"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka<br/>FAIL: Events queued<br/>in outbox<br/>Delivered on<br/>recovery"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api<br/>FAIL: GRN entry<br/>blocked<br/>Alert warehouse team"]
    PG["[Container:<br/>Database]<br/>postgres<br/>FAIL: Failover to<br/>standby<br/>~30s RTO via<br/>Multi-AZ"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker<br/>FAIL: Payment run<br/>delayed<br/>Resume from last<br/>checkpoint"]

    PurchAPI -->|"Publishes to outbox<br/>if Kafka<br/>unavailable"| EventBus
    EventBus -->|"Delivers<br/>GoodsReceived to<br/>receiving"| RecvAPI
    PurchAPI -->|"Writes [with<br/>circuit breaker]"| PG
    EventBus -->|"Delivers<br/>InvoiceMatched to<br/>worker"| PayWorker

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class EventBus pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **FAIL annotation per container**: Each container has an explicit failure mode in its label
- **Outbox pattern**: Events stored in postgres outbox when Kafka is unavailable — no event loss
- **Circuit breaker on DB**: Prevents cascading failure when postgres is slow or unavailable

**Design Rationale**: Failure mode annotations force the team to design for resilience, not just the happy path. Each failure annotation becomes a test scenario in the integration test suite.

**Key Takeaway**: Annotate failure behavior in container labels. If you cannot describe what happens when a container fails, you have not designed its resilience.

**Why It Matters**: P2P platforms that lose events when Kafka is down require manual reconciliation of POs and GRNs — a time-consuming audit task. Outbox patterns prevent this, but only if they are designed in from the start. Container diagrams that model failure modes surface durability requirements before Kafka cluster sizing and replication configuration decisions are made, enabling SRE teams to write runbooks before incidents occur rather than during them.

---

### Example 42: Container Diagram — Network Topology

Showing which containers are in which network zones reveals security and latency design.

```mermaid
graph TD
    accTitle: Example 42: Container Diagram — Network Topology
    accDescr: Graph with 12 nodes and 10 connections. Nodes: [Person] Buyer Employee, [Person /Ext System] Supplier, [Container: Browser App] web-ui Next.js — Vercel Edge, [Container: API Gateway] API Gateway WAF + rate limiting, [Container: REST API] purchasing-api, [Container: REST API] receiving-api, [Container: REST API] invoicing-api, [Container: Background Worker] payments-worker, [Container: Message Broker] event-bus / Kafka, [Container: Database] postgres, [Container: Database] read-store, [Container: Secret Store] secret-manager. Connections: [Person] Buyer Employee to [Container: Browser App] web-ui Next.js — Vercel Edge (HTTPS), [Person /Ext System] Supplier to [Container: API Gateway] API Gateway WAF + rate limiting (HTTPS), [Container: Browser App] web-ui Next.js — Vercel Edge to [Container: API Gateway] API Gateway WAF + rate limiting (REST [HTTPS]), [Container: API Gateway] API Gateway WAF + rate limiting to [Container: REST API] purchasing-api (mTLS), [Container: API Gateway] API Gateway WAF + rate limiting to [Container: REST API] receiving-api (mTLS), [Container: API Gateway] API Gateway WAF + rate limiting to [Container: REST API] invoicing-api (mTLS), [Container: REST API] purchasing-api to [Container: Database] postgres (TCP/5432), [Container: REST API] purchasing-api to [Container: Message Broker] event-bus / Kafka (Kafka), [Container: Message Broker] event-bus / Kafka to [Container: Background Worker] payments-worker (Kafka), [Container: Background Worker] payments-worker to [Container: Database] postgres (TCP/5432).
    subgraph PublicInternet["Public Internet"]
        Buyer["[Person]<br/>Buyer Employee"]
        Supplier["[Person /Ext System]<br/>Supplier"]
    end

    subgraph PublicSubnet["Public Subnet — DMZ"]
        WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js — Vercel<br/>Edge"]
        APIGW["[Container: API<br/>Gateway]<br/>API Gateway<br/>WAF + rate limiting"]
    end

    subgraph PrivateSubnet["Private Subnet —<br/>Application Tier"]
        PurchAPI["[Container: REST<br/>API]<br/>purchasing-api"]
        RecvAPI["[Container: REST<br/>API]<br/>receiving-api"]
        InvAPI["[Container: REST<br/>API]<br/>invoicing-api"]
        PayWorker["[Container:<br/>Background Worker]<br/>payments-worker"]
        EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]
    end

    subgraph DataSubnet["Data Subnet —<br/>Storage Tier"]
        PG["[Container:<br/>Database]<br/>postgres"]
        ReadStore["[Container:<br/>Database]<br/>read-store"]
        SecretMgr["[Container: Secret<br/>Store]<br/>secret-manager"]
    end

    Buyer -->|"HTTPS"| WebUI
    Supplier -->|"HTTPS"| APIGW
    WebUI -->|"REST [HTTPS]"| APIGW
    APIGW -->|"mTLS"| PurchAPI
    APIGW -->|"mTLS"| RecvAPI
    APIGW -->|"mTLS"| InvAPI
    PurchAPI -->|"TCP/5432"| PG
    PurchAPI -->|"Kafka"| EventBus
    EventBus -->|"Kafka"| PayWorker
    PayWorker -->|"TCP/5432"| PG

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class APIGW pal-DE8F05
    class PurchAPI pal-DE8F05
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    class EventBus pal-0173B2
    class PG pal-CA9161
    class ReadStore pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SecretMgr pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Three subnet tiers**: DMZ, Application, Data — defense-in-depth visible
- **mTLS inside private subnet**: Service-to-service authentication within the trusted tier
- **Data subnet has no public access**: postgres, read-store, and secret-manager cannot be reached from internet

**Design Rationale**: Network topology at Container level makes security zone boundaries architectural, not operational. Security engineering can validate zone assignments before any infrastructure is provisioned.

**Key Takeaway**: Show network zones in Container diagrams for security-sensitive systems. Zone assignment is an architectural decision — moving a container between zones after deployment is expensive.

**Why It Matters**: Procurement platforms that accidentally expose postgres or secret-manager to public subnets have a misconfiguration that persists until a security audit or breach discovers it. Architectural diagrams with explicit zone labels prevent misconfigurations at provisioning time. Security reviewers who can annotate network boundaries directly on the Container diagram produce actionable findings that infrastructure engineers translate directly into security group rules before any environment is provisioned.

---

### Example 43: Container Diagram — Data Ownership

Each container owns specific data. Making data ownership explicit prevents accidental cross-container data access.

```mermaid
graph TD
    accTitle: Example 43: Container Diagram — Data Ownership
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Container: REST API] purchasing-api OWNS: purchase_ requisitions purchase_orders tables, [Container: REST API] receiving-api OWNS: goods_receipt_notes table, [Container: REST API] invoicing-api OWNS: invoices table, [Container: Background Worker] payments-worker OWNS: payments table, [Container: Database] postgres Shared infrastructure Separate schemas per service. Connections: [Container: REST API] purchasing-api OWNS: purchase_ requisitions purchase_orders tables to [Container: Database] postgres Shared infrastructure Separate schemas per service (Reads/writes schema: purchasing), [Container: REST API] receiving-api OWNS: goods_receipt_notes table to [Container: Database] postgres Shared infrastructure Separate schemas per service (Reads/writes schema: receiving), [Container: REST API] invoicing-api OWNS: invoices table to [Container: Database] postgres Shared infrastructure Separate schemas per service (Reads/writes schema: invoicing), [Container: Background Worker] payments-worker OWNS: payments table to [Container: Database] postgres Shared infrastructure Separate schemas per service (Reads/writes schema: payments).
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>OWNS: purchase_<br/>requisitions<br/>purchase_orders<br/>tables"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api<br/>OWNS:<br/>goods_receipt_notes<br/>table"]
    InvAPI["[Container: REST<br/>API]<br/>invoicing-api<br/>OWNS: invoices table"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker<br/>OWNS: payments table"]
    PG["[Container:<br/>Database]<br/>postgres<br/>Shared<br/>infrastructure<br/>Separate schemas per<br/>service"]

    PurchAPI -->|"Reads/writes<br/>schema: purchasing"| PG
    RecvAPI -->|"Reads/writes<br/>schema: receiving"| PG
    InvAPI -->|"Reads/writes<br/>schema: invoicing"| PG
    PayWorker -->|"Reads/writes<br/>schema: payments"| PG

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Key Elements**:

- **OWNS annotation**: Each container's label includes the tables it owns
- **Schema-per-service**: Shared postgres instance but separate schemas enforce ownership
- **No cross-schema SQL**: Containers read each other's data through events, not JOIN queries

**Design Rationale**: Schema-per-service in a shared postgres instance delivers microservice data isolation without the operational overhead of separate databases. Container labels make the ownership contract explicit.

**Key Takeaway**: Annotate data ownership in container labels. Teams that leave data ownership implicit routinely introduce cross-service SQL JOINs that create tight coupling and make service extraction impossible.

**Why It Matters**: P2P services that share tables develop hidden dependencies that prevent independent deployment. Schema-per-service boundaries enforced at the Container diagram level prevent these dependencies from forming in the first place. When two containers own separate tables, each team can evolve its schema independently — a critical prerequisite for the continuous delivery pipelines that modern P2P platforms require for frequent, low-risk releases.

---

### Example 44: Three-Way Match Flow — Container Interaction

The invoice three-way matching process spans three containers. A container-level view shows which containers participate and in what order.

```mermaid
graph LR
    accTitle: Example 44: Three-Way Match Flow — Container Interaction
    accDescr: Graph with 5 nodes and 5 connections. Nodes: [Container: REST API] purchasing-api Source: PO data, [Container: Message Broker] event-bus / Kafka, [Container: REST API] receiving-api Source: GRN data, [Container: REST API] invoicing-api Matcher: PO vs GRN vs Invoice, [Container: Background Worker] payments-worker Disburser on match. Connections: [Container: REST API] purchasing-api Source: PO data to [Container: Message Broker] event-bus / Kafka (1. PurchaseOrderIssued), [Container: REST API] receiving-api Source: GRN data to [Container: Message Broker] event-bus / Kafka (2. GoodsReceived), [Container: Message Broker] event-bus / Kafka to [Container: REST API] invoicing-api Matcher: PO vs GRN vs Invoice (3. Delivers both events), [Container: REST API] invoicing-api Matcher: PO vs GRN vs Invoice to [Container: Message Broker] event-bus / Kafka (4. InvoiceMatched (if all three match)), [Container: Message Broker] event-bus / Kafka to [Container: Background Worker] payments-worker Disburser on match (5. Triggers payment run).
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>Source: PO data"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]
    RecvAPI["[Container: REST<br/>API]<br/>receiving-api<br/>Source: GRN data"]
    InvAPI["[Container: REST<br/>API]<br/>invoicing-api<br/>Matcher: PO vs GRN<br/>vs Invoice"]
    PayWorker["[Container:<br/>Background Worker]<br/>payments-worker<br/>Disburser on match"]

    PurchAPI -->|"1.<br/>PurchaseOrderIssued"| EventBus
    RecvAPI -->|"2. GoodsReceived"| EventBus
    EventBus -->|"3. Delivers both<br/>events"| InvAPI
    InvAPI -->|"4. InvoiceMatched<br/>(if all three<br/>match)"| EventBus
    EventBus -->|"5. Triggers payment<br/>run"| PayWorker

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class EventBus pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Numbered arrows**: Five-step matching flow made explicit
- **invoicing-api as the matcher**: invoicing-api holds the three-way match logic, not a shared service
- **Event-driven trigger**: Payment starts on InvoiceMatched event — no polling

**Design Rationale**: Showing the three-way match as a numbered event flow makes the temporal dependency visible. invoicing-api cannot match until it has received both `PurchaseOrderIssued` and `GoodsReceived`.

**Key Takeaway**: Use numbered arrows in Container diagrams to show multi-container process flows. The temporal dependency between events reveals the correlation logic that invoicing-api must implement.

**Why It Matters**: Three-way match failures are the primary cause of incorrect payments in P2P. Architectural clarity about which container holds the match logic and which events trigger it makes the matching algorithm testable and auditable. When the three-way match flow is visible across containers, test coverage responsibilities are clearly assignable to each container's team, preventing gaps in integration test coverage that could allow matching edge cases to reach production.

---

### Example 45: Container Diagram — Deployment Units and Teams

Aligning containers to teams makes Conway's Law visible and enables autonomous team deployment.

```mermaid
graph TD
    accTitle: Example 45: Container Diagram — Deployment Units and Teams
    accDescr: Graph with 9 nodes and 5 connections. Nodes: [Container: Browser App] web-ui Next.js portal, [Container: REST API] purchasing-api, [Container: REST API] receiving-api, [Container: REST API] invoicing-api, [Container: Background Worker] payments-worker, [Container: Message Broker] event-bus / Kafka, [Container: Database] postgres, [Container: Database] read-store, [Container: Secret Store] secret-manager. Connections: [Container: Browser App] web-ui Next.js portal to [Container: REST API] purchasing-api (REST), [Container: REST API] purchasing-api to [Container: Message Broker] event-bus / Kafka (Events), [Container: Message Broker] event-bus / Kafka to [Container: REST API] receiving-api (Events), [Container: Message Broker] event-bus / Kafka to [Container: REST API] invoicing-api (Events), [Container: Message Broker] event-bus / Kafka to [Container: Background Worker] payments-worker (Events).
    subgraph BuyerTeam["Buyer Experience<br/>Team"]
        WebUI["[Container: Browser<br/>App]<br/>web-ui<br/>Next.js portal"]
        PurchAPI["[Container: REST<br/>API]<br/>purchasing-api"]
    end

    subgraph OperationsTeam["Operations Team"]
        RecvAPI["[Container: REST<br/>API]<br/>receiving-api"]
    end

    subgraph FinanceTeam["Finance Team"]
        InvAPI["[Container: REST<br/>API]<br/>invoicing-api"]
        PayWorker["[Container:<br/>Background Worker]<br/>payments-worker"]
    end

    subgraph PlatformTeam["Platform Team"]
        EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]
        PG["[Container:<br/>Database]<br/>postgres"]
        ReadStore["[Container:<br/>Database]<br/>read-store"]
        SecretMgr["[Container: Secret<br/>Store]<br/>secret-manager"]
    end

    WebUI -->|"REST"| PurchAPI
    PurchAPI -->|"Events"| EventBus
    EventBus -->|"Events"| RecvAPI
    EventBus -->|"Events"| InvAPI
    EventBus -->|"Events"| PayWorker

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class WebUI pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PurchAPI pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class RecvAPI pal-029E73
    class InvAPI pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PayWorker pal-CC78BC
    class EventBus pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    class ReadStore pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SecretMgr pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Team subgraphs**: Container ownership aligned to team — Conway's Law made visible
- **Event-based inter-team communication**: Teams communicate through Kafka, not direct API calls
- **Platform Team owns shared infrastructure**: EventBus, postgres, read-store

**Design Rationale**: When container ownership matches team ownership, teams can deploy their containers independently. When multiple teams own one container, every deployment requires coordination.

**Key Takeaway**: Align container boundaries to team boundaries. Containers shared across teams create deployment bottlenecks. Kafka as the inter-team communication layer enables independent deployment schedules.

**Why It Matters**: Deployment coordination between teams is a leading cause of slow release cycles. Container diagrams that make team boundaries visible enable autonomous deployment — a prerequisite for continuous delivery in P2P platforms. When deployment boundaries match team boundaries, each team can maintain its own release cadence without requiring synchronized deployment windows, reducing the organizational overhead of coordinated releases.

---

### Example 46: Container Diagram — Health and Readiness Boundaries

Annotating health check behavior on containers makes the deployment contract explicit.

```mermaid
graph TD
    accTitle: Example 46: Container Diagram — Health and Readiness Boundaries
    accDescr: Graph with 4 nodes and 3 connections. Nodes: [Container: Load Balancer] ALB Routes traffic to healthy instances, [Container: REST API] purchasing-api GET /health → 200 OK (liveness) GET /ready → 200 if DB connected (readiness), [Container: Database] postgres Monitored by RDS health checks Failover triggered at 30s timeout, [Container: Message Broker] event-bus / Kafka Lag monitored per consumer group Alert if lag > 10k messages. Connections: [Container: Load Balancer] ALB Routes traffic to healthy instances to [Container: REST API] purchasing-api GET /health → 200 OK (liveness) GET /ready → 200 if DB connected (readiness) (Routes only to ready instances), [Container: REST API] purchasing-api GET /health → 200 OK (liveness) GET /ready → 200 if DB connected (readiness) to [Container: Database] postgres Monitored by RDS health checks Failover triggered at 30s timeout (Checks connectivity [TCP/5432]), [Container: REST API] purchasing-api GET /health → 200 OK (liveness) GET /ready → 200 if DB connected (readiness) to [Container: Message Broker] event-bus / Kafka Lag monitored per consumer group Alert if lag > 10k messages (Consumes and publishes events).
    LB["[Container: Load<br/>Balancer]<br/>ALB<br/>Routes traffic to<br/>healthy instances"]
    PurchAPI["[Container: REST<br/>API]<br/>purchasing-api<br/>GET /health → 200 OK<br/>(liveness)<br/>GET /ready → 200 if<br/>DB connected<br/>(readiness)"]
    PG["[Container:<br/>Database]<br/>postgres<br/>Monitored by RDS<br/>health checks<br/>Failover triggered<br/>at 30s timeout"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka<br/>Lag monitored per<br/>consumer group<br/>Alert if lag > 10k<br/>messages"]

    LB -->|"Routes only to<br/>ready instances"| PurchAPI
    PurchAPI -->|"Checks connectivity<br/>[TCP/5432]"| PG
    PurchAPI -->|"Consumes and<br/>publishes events"| EventBus

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class LB pal-DE8F05
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class PurchAPI pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PG pal-CA9161
    class EventBus pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Liveness vs. readiness**: Two distinct health endpoints with different failure behaviors
- **Readiness checks DB connectivity**: An instance without a DB connection is not ready for traffic
- **Kafka lag alerting**: Consumer lag is a health signal for event-driven containers

**Design Rationale**: Health check design at Container level ensures all deployment platforms (Kubernetes, ECS) use consistent liveness and readiness semantics. Inconsistent health checks cause false-positive restarts that disrupt payment runs.

**Key Takeaway**: Define liveness and readiness health check behavior in container labels. The distinction between "still running" (liveness) and "ready to serve traffic" (readiness) is critical for zero-downtime deployment.

**Why It Matters**: payments-worker restarts during an active payment run can leave payments in an ambiguous state — initiated at the bank but not confirmed in postgres. Correct readiness checks prevent the load balancer from routing new work to a restarting worker. Making readiness probe behavior explicit at the architecture stage also prevents the common misconfiguration where Kubernetes routes traffic to a container that has not yet established its database or Kafka connection after a restart.

---

## Component Diagrams — Inside purchasing-api (Examples 47–60)

### Example 47: Component Overview — purchasing-api Layer Structure

purchasing-api is organized in four horizontal layers. The Component diagram zooms inside the container and reveals these layers.

```mermaid
graph TD
    accTitle: Example 47: Component Overview — purchasing-api Layer Structure
    accDescr: Graph with 4 nodes and 4 connections. Nodes: [Component] HTTP Layer HttpController + request DTOs Express routers, [Component] Application Services SubmitRequisition Handler ApprovePOHandler, [Component] Domain Layer PurchaseRequisition aggregate PurchaseOrder aggregate, [Component] Infrastructure Adapters PgPurchaseOrder Repository OutboxEventPublisher. Connections: [Component] HTTP Layer HttpController + request DTOs Express routers to [Component] Application Services SubmitRequisition Handler ApprovePOHandler (Invokes use case handlers), [Component] Application Services SubmitRequisition Handler ApprovePOHandler to [Component] Domain Layer PurchaseRequisition aggregate PurchaseOrder aggregate (Calls aggregate methods), [Component] Application Services SubmitRequisition Handler ApprovePOHandler to [Component] Infrastructure Adapters PgPurchaseOrder Repository OutboxEventPublisher (Persists via repository port), [Component] Domain Layer PurchaseRequisition aggregate PurchaseOrder aggregate to [Component] Application Services SubmitRequisition Handler ApprovePOHandler (Emits domain events).
    subgraph PurchAPI["purchasing-api<br/>Container"]
        HTTP["[Component]<br/>HTTP Layer<br/>HttpController +<br/>request DTOs<br/>Express routers"]
        AppSvc["[Component]<br/>Application Services<br/>SubmitRequisition<br/>Handler<br/>ApprovePOHandler"]
        Domain["[Component]<br/>Domain Layer<br/>PurchaseRequisition<br/>aggregate<br/>PurchaseOrder<br/>aggregate"]
        Infra["[Component]<br/>Infrastructure<br/>Adapters<br/>PgPurchaseOrder<br/>Repository<br/>OutboxEventPublisher"]
    end

    HTTP -->|"Invokes use case<br/>handlers"| AppSvc
    AppSvc -->|"Calls aggregate<br/>methods"| Domain
    AppSvc -->|"Persists via<br/>repository port"| Infra
    Domain -->|"Emits domain<br/>events"| AppSvc

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class HTTP pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class AppSvc pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Domain pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Infra pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Four layers**: HTTP → Application Services → Domain → Infrastructure — classic hexagonal structure
- **Domain emits events up**: Domain events bubble up to Application Services for publishing
- **Infrastructure at bottom**: Adapters depend on domain interfaces, not the reverse

**Design Rationale**: The four-layer component structure enforces the dependency rule: outer layers depend on inner layers, never the reverse. The Domain layer has zero dependencies on infrastructure.

**Key Takeaway**: Component diagrams for API containers should show the dependency direction explicitly. Domain → Infrastructure arrows that point inward (infrastructure depends on domain) signal correct hexagonal structure; outward arrows signal an architecture violation.

**Why It Matters**: Applications where domain logic depends on infrastructure (e.g., importing a database ORM directly into aggregate methods) cannot be unit-tested without a running database. Correct layer dependency enables fast, deterministic unit tests for the P2P business rules. Agreeing on layer boundaries in a Component diagram before coding begins establishes a shared vocabulary that code reviewers use to reject boundary violations during pull requests, enforcing the architecture consistently across the team.

---

### Example 48: HTTP Layer Components — Controllers and DTOs

The HTTP layer contains controllers that translate HTTP requests into use case commands.

```mermaid
graph TD
    accTitle: Example 48: HTTP Layer Components — Controllers and DTOs
    accDescr: Graph with 6 nodes and 7 connections. Nodes: [Person / Container] web-ui or API consumer, [Component] Express Router Route definitions and middleware Auth, validation, error handling, [Component] Requisition Controller POST /requisitions GET /requisitions/:id, [Component] PurchaseOrder Controller POST /purchase-orders PATCH / purchase-orders/:id/ approve, [Component] Request DTOs SubmitRequisition Request ApprovePORequest — Zod validated, [Component] Application Services. Connections: [Person / Container] web-ui or API consumer to [Component] Express Router Route definitions and middleware Auth, validation, error handling (HTTPS requests), [Component] Express Router Route definitions and middleware Auth, validation, error handling to [Component] Requisition Controller POST /requisitions GET /requisitions/:id (Routes to controller), [Component] Express Router Route definitions and middleware Auth, validation, error handling to [Component] PurchaseOrder Controller POST /purchase-orders PATCH / purchase-orders/:id/ approve (Routes to controller), [Component] Requisition Controller POST /requisitions GET /requisitions/:id to [Component] Request DTOs SubmitRequisition Request ApprovePORequest — Zod validated (Validates and maps to command), [Component] PurchaseOrder Controller POST /purchase-orders PATCH / purchase-orders/:id/ approve to [Component] Request DTOs SubmitRequisition Request ApprovePORequest — Zod validated (Validates and maps to command), [Component] Requisition Controller POST /requisitions GET /requisitions/:id to [Component] Application Services (Invokes Submit RequisitionHandler), [Component] PurchaseOrder Controller POST /purchase-orders PATCH / purchase-orders/:id/ approve to [Component] Application Services (Invokes ApprovePOHandler).
    Client["[Person / Container]<br/>web-ui or API<br/>consumer"]

    subgraph HTTPLayer["HTTP Layer —<br/>purchasing-api"]
        Router["[Component]<br/>Express Router<br/>Route definitions<br/>and middleware<br/>Auth, validation,<br/>error handling"]
        ReqCtrl["[Component]<br/>Requisition<br/>Controller<br/>POST /requisitions<br/>GET<br/>/requisitions/:id"]
        POCtrl["[Component]<br/>PurchaseOrder<br/>Controller<br/>POST<br/>/purchase-orders<br/>PATCH /<br/>purchase-orders/:id/<br/>approve"]
        ReqDTO["[Component]<br/>Request DTOs<br/>SubmitRequisition<br/>Request<br/>ApprovePORequest —<br/>Zod validated"]
    end

    AppSvc["[Component]<br/>Application Services"]

    Client -->|"HTTPS requests"| Router
    Router -->|"Routes to<br/>controller"| ReqCtrl
    Router -->|"Routes to<br/>controller"| POCtrl
    ReqCtrl -->|"Validates and maps<br/>to command"| ReqDTO
    POCtrl -->|"Validates and maps<br/>to command"| ReqDTO
    ReqCtrl -->|"Invokes Submit<br/>RequisitionHandler"| AppSvc
    POCtrl -->|"Invokes<br/>ApprovePOHandler"| AppSvc

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Client pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Router pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class ReqCtrl pal-DE8F05
    class POCtrl pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class ReqDTO pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class AppSvc pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two controllers**: RequisitionController and PurchaseOrderController — aligned to domain aggregates
- **Request DTOs with Zod**: Validation at the HTTP boundary before any business logic runs
- **Router as dispatcher**: Express Router handles authentication and routes — not the controllers
- **Controllers call Application Services**: Controllers do not contain business logic

**Design Rationale**: Separating router (authentication/routing) from controllers (use case invocation) and DTOs (validation) gives each component a single responsibility. Adding a new endpoint requires touching only the router, controller, and DTO — not the domain.

**Key Takeaway**: HTTP layer components should be thin: route, validate, translate to command, delegate. Business logic that appears in controllers is an architecture violation that should be flagged in code review.

**Why It Matters**: Controllers that contain business logic cannot be reused when adding a new interface (e.g., a CLI or a Kafka consumer). Thin controllers with DTO validation enforce the boundary that makes business logic independently testable and reusable. Thin controllers that delegate immediately to application services also enable contract testing at the HTTP boundary without requiring the full application context, reducing the scope and execution time of API-level tests.

---

### Example 49: Application Services — Use Case Handlers

Application services orchestrate the business use case: load aggregate, call method, persist, publish events.

```mermaid
graph TD
    accTitle: Example 49: Application Services — Use Case Handlers
    accDescr: Graph with 6 nodes and 9 connections. Nodes: [Component] HTTP Layer, [Component] SubmitRequisition Handler Orchestrates: load supplier → create requisition → persist → publish, [Component] ApprovePOHandler Orchestrates: load PO → call approve() → persist → publish, [Component] IssuePOHandler Orchestrates: load PO → call issue() → notify supplier, [Component] Domain Layer, [Component] Infrastructure Adapters. Connections: [Component] HTTP Layer to [Component] SubmitRequisition Handler Orchestrates: load supplier → create requisition → persist → publish (Invokes with validated command), [Component] HTTP Layer to [Component] ApprovePOHandler Orchestrates: load PO → call approve() → persist → publish (Invokes with validated command), [Component] HTTP Layer to [Component] IssuePOHandler Orchestrates: load PO → call issue() → notify supplier (Invokes with validated command), [Component] SubmitRequisition Handler Orchestrates: load supplier → create requisition → persist → publish to [Component] Domain Layer (Creates PurchaseRequisition), [Component] ApprovePOHandler Orchestrates: load PO → call approve() → persist → publish to [Component] Domain Layer (Calls PurchaseOrder. approve()), [Component] IssuePOHandler Orchestrates: load PO → call issue() → notify supplier to [Component] Domain Layer (Calls PurchaseOrder. issue()), [Component] SubmitRequisition Handler Orchestrates: load supplier → create requisition → persist → publish to [Component] Infrastructure Adapters (Persists via Requisition Repository), [Component] ApprovePOHandler Orchestrates: load PO → call approve() → persist → publish to [Component] Infrastructure Adapters (Persists via PurchaseOrder Repository), [Component] IssuePOHandler Orchestrates: load PO → call issue() → notify supplier to [Component] Infrastructure Adapters (Publishes PurchaseOrderIssued).
    HTTP["[Component]<br/>HTTP Layer"]

    subgraph AppServices["Application Services<br/>— purchasing-api"]
        SubmitHandler["[Component]<br/>SubmitRequisition<br/>Handler<br/>Orchestrates: load<br/>supplier →<br/>create requisition →<br/>persist → publish"]
        ApproveHandler["[Component]<br/>ApprovePOHandler<br/>Orchestrates: load<br/>PO →<br/>call approve() →<br/>persist → publish"]
        IssuePOHandler["[Component]<br/>IssuePOHandler<br/>Orchestrates: load<br/>PO →<br/>call issue() →<br/>notify supplier"]
    end

    Domain["[Component]<br/>Domain Layer"]
    Infra["[Component]<br/>Infrastructure<br/>Adapters"]

    HTTP -->|"Invokes with<br/>validated command"| SubmitHandler
    HTTP -->|"Invokes with<br/>validated command"| ApproveHandler
    HTTP -->|"Invokes with<br/>validated command"| IssuePOHandler
    SubmitHandler -->|"Creates<br/>PurchaseRequisition"| Domain
    ApproveHandler -->|"Calls<br/>PurchaseOrder.<br/>approve()"| Domain
    IssuePOHandler -->|"Calls<br/>PurchaseOrder.<br/>issue()"| Domain
    SubmitHandler -->|"Persists via<br/>Requisition<br/>Repository"| Infra
    ApproveHandler -->|"Persists via<br/>PurchaseOrder<br/>Repository"| Infra
    IssuePOHandler -->|"Publishes<br/>PurchaseOrderIssued"| Infra

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class HTTP pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class SubmitHandler pal-DE8F05
    class ApproveHandler pal-DE8F05
    class IssuePOHandler pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Domain pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Infra pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **One handler per use case**: SubmitRequisition, ApprovePO, IssuePO — single responsibility per handler
- **Handler orchestrates but does not decide**: Business rules live in Domain, not in handlers
- **Handler description as comment**: Each label includes the orchestration steps as documentation

**Design Rationale**: Application Services follow the "thin orchestrator" pattern: load aggregate from repository, call aggregate method, save aggregate, publish events. No business logic belongs in the handler.

**Key Takeaway**: Name each Application Service handler after its use case (SubmitRequisitionHandler, not GenericHandler). The handler name is the first piece of documentation a new developer reads.

**Why It Matters**: Use case handlers that contain business logic (validating approval thresholds in the handler instead of in the aggregate) distribute business rules across layers, making them impossible to test in isolation and easy to miss when rules change. When use case handlers are limited to orchestration, adding a new delivery channel — such as a batch processing job — requires only wiring the handler to the new entry point, not reimplementing or duplicating business rules.

---

### Example 50: Domain Layer — Aggregate Components

The Domain layer contains the aggregates, value objects, and domain events that implement the P2P business rules.

```mermaid
graph TD
    accTitle: Example 50: Domain Layer — Aggregate Components
    accDescr: Graph with 6 nodes and 7 connections. Nodes: [Component] Application Services, [Component] PurchaseRequisition aggregate States: Draft → Submitted → ManagerReview → Approved → ConvertedToPO, [Component] PurchaseOrder aggregate States: Draft → AwaitingApproval → Approved → Issued → ... → Paid, [Component] Value Objects Money, PurchaseOrderId, RequisitionId, SupplierId, ApprovalLevel, SkuCode, [Component] Domain Events Requisition Submitted, PurchaseOrderIssued, PurchaseOrder Acknowledged, [Component] Repository Ports (interfaces) PurchaseOrder Repository, Requisition Repository. Connections: [Component] Application Services to [Component] PurchaseRequisition aggregate States: Draft → Submitted → ManagerReview → Approved → ConvertedToPO (Calls aggregate methods), [Component] Application Services to [Component] PurchaseOrder aggregate States: Draft → AwaitingApproval → Approved → Issued → ... → Paid (Calls aggregate methods), [Component] PurchaseRequisition aggregate States: Draft → Submitted → ManagerReview → Approved → ConvertedToPO to [Component] Value Objects Money, PurchaseOrderId, RequisitionId, SupplierId, ApprovalLevel, SkuCode (Uses), [Component] PurchaseOrder aggregate States: Draft → AwaitingApproval → Approved → Issued → ... → Paid to [Component] Value Objects Money, PurchaseOrderId, RequisitionId, SupplierId, ApprovalLevel, SkuCode (Uses), [Component] PurchaseRequisition aggregate States: Draft → Submitted → ManagerReview → Approved → ConvertedToPO to [Component] Domain Events Requisition Submitted, PurchaseOrderIssued, PurchaseOrder Acknowledged (Emits), [Component] PurchaseOrder aggregate States: Draft → AwaitingApproval → Approved → Issued → ... → Paid to [Component] Domain Events Requisition Submitted, PurchaseOrderIssued, PurchaseOrder Acknowledged (Emits), [Component] Application Services to [Component] Repository Ports (interfaces) PurchaseOrder Repository, Requisition Repository (Calls via port interface).
    AppSvc["[Component]<br/>Application Services"]

    subgraph DomainLayer["Domain Layer —<br/>purchasing-api"]
        PRAggregate["[Component]<br/>PurchaseRequisition<br/>aggregate<br/>States: Draft →<br/>Submitted →<br/>ManagerReview →<br/>Approved →<br/>ConvertedToPO"]
        POAggregate["[Component]<br/>PurchaseOrder<br/>aggregate<br/>States: Draft →<br/>AwaitingApproval →<br/>Approved → Issued →<br/>... → Paid"]
        VOs["[Component]<br/>Value Objects<br/>Money,<br/>PurchaseOrderId,<br/>RequisitionId,<br/>SupplierId,<br/>ApprovalLevel,<br/>SkuCode"]
        Events["[Component]<br/>Domain Events<br/>Requisition<br/>Submitted,<br/>PurchaseOrderIssued,<br/>PurchaseOrder<br/>Acknowledged"]
        Ports["[Component]<br/>Repository Ports<br/>(interfaces)<br/>PurchaseOrder<br/>Repository,<br/>Requisition<br/>Repository"]
    end

    AppSvc -->|"Calls aggregate<br/>methods"| PRAggregate
    AppSvc -->|"Calls aggregate<br/>methods"| POAggregate
    PRAggregate -->|"Uses"| VOs
    POAggregate -->|"Uses"| VOs
    PRAggregate -->|"Emits"| Events
    POAggregate -->|"Emits"| Events
    AppSvc -->|"Calls via port<br/>interface"| Ports

    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class AppSvc pal-808080
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class PRAggregate pal-029E73
    class POAggregate pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class VOs pal-CC78BC
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Events pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Ports pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two aggregate roots**: PurchaseRequisition and PurchaseOrder — each with state machine labels
- **Value Objects shared**: Money, IDs, ApprovalLevel used by both aggregates
- **Repository ports as interfaces**: Application Services call the port interface; adapters implement it
- **Events emitted by aggregates**: Domain events come from aggregate methods, not from services

**Design Rationale**: Repository ports (interfaces) in the domain layer enforce the dependency inversion principle. The domain defines the interface shape; infrastructure provides the implementation. This makes the domain layer testable with in-memory adapters.

**Key Takeaway**: Domain layer components should contain no import from infrastructure. If a domain aggregate imports a database ORM or a Kafka client, the dependency direction is inverted and the layer is corrupted.

**Why It Matters**: Domain layers contaminated with infrastructure imports require a running database to unit test approval threshold logic. Pure domain layers with interface-only repository ports run their full business rule test suite in milliseconds without any external dependencies. A clean domain layer is also the prerequisite for hexagonal architecture, which allows swapping persistence technologies or adding new output adapters without rewriting any business logic.

---

### Example 51: Infrastructure Adapters — Repository Implementations

Infrastructure adapters implement the domain ports. Each adapter maps between domain objects and persistence technology.

```mermaid
graph TD
    accTitle: Example 51: Infrastructure Adapters — Repository Implementations
    accDescr: Graph with 7 nodes and 8 connections. Nodes: [Component] Repository Ports (interfaces) Domain layer — purchasing-api, [Component] PgPurchaseOrder Repository Implements Purchase OrderRepository Maps PO aggregate to pg rows, [Component] PgRequisition Repository Implements Requisition Repository Maps Requisition to pg rows, [Component] OutboxEventPublisher Implements EventPublisher Writes events to outbox table, [Component] KafkaRelayJob Reads outbox → publishes to Kafka Deletes on ACK, [Container: Database] postgres, [Container: Message Broker] event-bus / Kafka. Connections: [Component] Repository Ports (interfaces) Domain layer — purchasing-api to [Component] PgPurchaseOrder Repository Implements Purchase OrderRepository Maps PO aggregate to pg rows (Implemented by), [Component] Repository Ports (interfaces) Domain layer — purchasing-api to [Component] PgRequisition Repository Implements Requisition Repository Maps Requisition to pg rows (Implemented by), [Component] Repository Ports (interfaces) Domain layer — purchasing-api to [Component] OutboxEventPublisher Implements EventPublisher Writes events to outbox table (Implemented by), [Component] PgPurchaseOrder Repository Implements Purchase OrderRepository Maps PO aggregate to pg rows to [Container: Database] postgres (SQL queries [TCP/5432]), [Component] PgRequisition Repository Implements Requisition Repository Maps Requisition to pg rows to [Container: Database] postgres (SQL queries [TCP/5432]), [Component] OutboxEventPublisher Implements EventPublisher Writes events to outbox table to [Container: Database] postgres (INSERT into outbox table [TCP/5432]), [Component] KafkaRelayJob Reads outbox → publishes to Kafka Deletes on ACK to [Container: Database] postgres (SELECT from outbox [TCP/5432]), [Component] KafkaRelayJob Reads outbox → publishes to Kafka Deletes on ACK to [Container: Message Broker] event-bus / Kafka (Publish events [Kafka]).
    Ports["[Component]<br/>Repository Ports<br/>(interfaces)<br/>Domain layer —<br/>purchasing-api"]

    subgraph InfraLayer["Infrastructure<br/>Adapters —<br/>purchasing-api"]
        PgPORepo["[Component]<br/>PgPurchaseOrder<br/>Repository<br/>Implements Purchase<br/>OrderRepository<br/>Maps PO aggregate to<br/>pg rows"]
        PgReqRepo["[Component]<br/>PgRequisition<br/>Repository<br/>Implements<br/>Requisition<br/>Repository<br/>Maps Requisition to<br/>pg rows"]
        OutboxPublisher["[Component]<br/>OutboxEventPublisher<br/>Implements<br/>EventPublisher<br/>Writes events to<br/>outbox table"]
        KafkaRelay["[Component]<br/>KafkaRelayJob<br/>Reads outbox →<br/>publishes to Kafka<br/>Deletes on ACK"]
    end

    PG["[Container:<br/>Database]<br/>postgres"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]

    Ports -->|"Implemented by"| PgPORepo
    Ports -->|"Implemented by"| PgReqRepo
    Ports -->|"Implemented by"| OutboxPublisher
    PgPORepo -->|"SQL queries<br/>[TCP/5432]"| PG
    PgReqRepo -->|"SQL queries<br/>[TCP/5432]"| PG
    OutboxPublisher -->|"INSERT into outbox<br/>table [TCP/5432]"| PG
    KafkaRelay -->|"SELECT from outbox<br/>[TCP/5432]"| PG
    KafkaRelay -->|"Publish events<br/>[Kafka]"| EventBus

    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Ports pal-808080
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PgPORepo pal-CA9161
    class PgReqRepo pal-CA9161
    class OutboxPublisher pal-CA9161
    class KafkaRelay pal-CA9161
    class PG pal-808080
    class EventBus pal-808080
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Key Elements**:

- **Adapter naming**: `Pg` prefix signals PostgreSQL implementation — easy to swap for in-memory adapter
- **Outbox pattern**: Events written to postgres first, relayed to Kafka by a separate job
- **KafkaRelayJob**: Background component that ensures at-least-once delivery even if Kafka is down

**Design Rationale**: The outbox pattern ensures that state changes and event publications are atomic — both succeed or neither does. Without it, a crash between postgres commit and Kafka publish loses events permanently.

**Key Takeaway**: Show the outbox pattern as two distinct infrastructure components: OutboxEventPublisher (writes to DB) and KafkaRelayJob (reads from DB, publishes to Kafka). The two-step pattern makes atomicity explicit.

**Why It Matters**: Lost domain events cause P2P state machine desynchronization between bounded contexts. A receiving-api that never gets `PurchaseOrderIssued` cannot open a GRN expectation, blocking the entire receiving flow. Without the outbox pattern, a process crash between the database commit and the Kafka publish leaves downstream consumers in a state that no amount of retry logic can automatically recover without manual reconciliation intervention.

---

### Example 52: Component Diagram — SubmitRequisitionHandler Flow

Tracing one use case through all four layers shows how components collaborate for a single business operation.

```mermaid
graph TD
    accTitle: Example 52: Component Diagram — SubmitRequisitionHandler Flow
    accDescr: Graph with 7 nodes and 8 connections. Nodes: [Person / Container] web-ui, [Component] Requisition Controller HTTP Layer, [Component] SubmitRequisition Request DTO Zod validated, [Component] SubmitRequisition Handler Application Services, [Component] PurchaseRequisition Domain Layer, [Component] PgRequisition Repository Infrastructure, [Component] OutboxEventPublisher Infrastructure. Connections: [Person / Container] web-ui to [Component] Requisition Controller HTTP Layer (POST /requisitions [HTTPS]), [Component] Requisition Controller HTTP Layer to [Component] SubmitRequisition Request DTO Zod validated (Validates body), [Component] SubmitRequisition Request DTO Zod validated to [Component] SubmitRequisition Handler Application Services (Returns Submit RequisitionCommand), [Component] SubmitRequisition Handler Application Services to [Component] PurchaseRequisition Domain Layer (Creates PurchaseRequisition. createDraft()), [Component] PurchaseRequisition Domain Layer to [Component] SubmitRequisition Handler Application Services (Returns RequisitionSubmitted event), [Component] SubmitRequisition Handler Application Services to [Component] PgRequisition Repository Infrastructure (Saves requisition), [Component] SubmitRequisition Handler Application Services to [Component] OutboxEventPublisher Infrastructure (Publishes Requisition Submitted), [Component] OutboxEventPublisher Infrastructure to [Component] PgRequisition Repository Infrastructure (Inserts into outbox table).
    Client["[Person / Container]<br/>web-ui"]
    ReqCtrl["[Component]<br/>Requisition<br/>Controller<br/>HTTP Layer"]
    ReqDTO["[Component]<br/>SubmitRequisition<br/>Request DTO<br/>Zod validated"]
    SubmitHandler["[Component]<br/>SubmitRequisition<br/>Handler<br/>Application Services"]
    PRAggregate["[Component]<br/>PurchaseRequisition<br/>Domain Layer"]
    PgReqRepo["[Component]<br/>PgRequisition<br/>Repository<br/>Infrastructure"]
    OutboxPub["[Component]<br/>OutboxEventPublisher<br/>Infrastructure"]

    Client -->|"POST /requisitions<br/>[HTTPS]"| ReqCtrl
    ReqCtrl -->|"Validates body"| ReqDTO
    ReqDTO -->|"Returns Submit<br/>RequisitionCommand"| SubmitHandler
    SubmitHandler -->|"Creates<br/>PurchaseRequisition.<br/>createDraft()"| PRAggregate
    PRAggregate -->|"Returns<br/>RequisitionSubmitted<br/>event"| SubmitHandler
    SubmitHandler -->|"Saves requisition"| PgReqRepo
    SubmitHandler -->|"Publishes<br/>Requisition<br/>Submitted"| OutboxPub
    OutboxPub -->|"Inserts into outbox<br/>table"| PgReqRepo

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Client pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class ReqCtrl pal-0173B2
    class ReqDTO pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class SubmitHandler pal-DE8F05
    class PRAggregate pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PgReqRepo pal-CA9161
    class OutboxPub pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Seven-step flow**: One business operation touches seven components across four layers
- **Aggregate returns event**: The aggregate's `createDraft()` method returns the domain event — not a side effect
- **Outbox writes to same repo**: The event publisher uses the same postgres connection as the repo — atomic transaction

**Design Rationale**: Tracing a single use case through all components is the most effective way to validate that the component structure is correct. If a step requires crossing an unexpected layer boundary, the architecture has a gap.

**Key Takeaway**: Draw use-case-specific Component flows in addition to structural Component diagrams. Structural diagrams show what exists; flow diagrams show whether the structure actually enables the use case.

**Why It Matters**: Use case flows that cross unexpected layer boundaries reveal architecture violations before they are coded. A handler that calls a repository directly without going through the domain aggregate bypasses business rule enforcement — a gap that only a flow diagram makes visible. When architects review handler-level flow diagrams during sprint planning, they can redirect implementation before incorrect layer dependencies are established and before tests are written that cement the wrong architecture.

---

### Example 53: Component Diagram — ApprovePOHandler with FSM Guard

The approval use case demonstrates how the domain aggregate enforces FSM transition guards at the component level.

```mermaid
graph TD
    accTitle: Example 53: Component Diagram — ApprovePOHandler with FSM Guard
    accDescr: Graph with 6 nodes and 9 connections. Nodes: [Component] PurchaseOrder Controller HTTP Layer, [Component] ApprovePOHandler Application Services, [Component] PurchaseOrder aggregate Domain Layer — FSM guard: must be in AwaitingApproval state, [Component] ApprovalLevel value object L1 ≤ $1k /L2 ≤ $10k /L3 > $10k, [Component] PgPurchaseOrder Repository Infrastructure, [Component] OutboxEventPublisher Infrastructure. Connections: [Component] PurchaseOrder Controller HTTP Layer to [Component] ApprovePOHandler Application Services (PATCH / purchase-orders/:id/ approve), [Component] ApprovePOHandler Application Services to [Component] PgPurchaseOrder Repository Infrastructure (Loads PO by id), [Component] PgPurchaseOrder Repository Infrastructure to [Component] ApprovePOHandler Application Services (Returns PurchaseOrder aggregate), [Component] ApprovePOHandler Application Services to [Component] PurchaseOrder aggregate Domain Layer — FSM guard: must be in AwaitingApproval state (Calls PurchaseOrder. approve(approverId)), [Component] PurchaseOrder aggregate Domain Layer — FSM guard: must be in AwaitingApproval state to [Component] ApprovalLevel value object L1 ≤ $1k /L2 ≤ $10k /L3 > $10k (Validates ApprovalLevel for PO total), [Component] PurchaseOrder aggregate Domain Layer — FSM guard: must be in AwaitingApproval state to [Component] ApprovePOHandler Application Services (Throws if not AwaitingApproval state), [Component] PurchaseOrder aggregate Domain Layer — FSM guard: must be in AwaitingApproval state to [Component] ApprovePOHandler Application Services (Returns Purchase OrderApproved event on success), [Component] ApprovePOHandler Application Services to [Component] PgPurchaseOrder Repository Infrastructure (Saves updated PO), [Component] ApprovePOHandler Application Services to [Component] OutboxEventPublisher Infrastructure (Publishes event).
    POCtrl["[Component]<br/>PurchaseOrder<br/>Controller<br/>HTTP Layer"]
    ApproveHandler["[Component]<br/>ApprovePOHandler<br/>Application Services"]
    POAggregate["[Component]<br/>PurchaseOrder<br/>aggregate<br/>Domain Layer — FSM<br/>guard:<br/>must be in<br/>AwaitingApproval<br/>state"]
    ApprovalLevelVO["[Component]<br/>ApprovalLevel value<br/>object<br/>L1 ≤ $1k /L2 ≤ $10k<br/>/L3 > $10k"]
    PgPORepo["[Component]<br/>PgPurchaseOrder<br/>Repository<br/>Infrastructure"]
    OutboxPub["[Component]<br/>OutboxEventPublisher<br/>Infrastructure"]

    POCtrl -->|"PATCH /<br/>purchase-orders/:id/<br/>approve"| ApproveHandler
    ApproveHandler -->|"Loads PO by id"| PgPORepo
    PgPORepo -->|"Returns<br/>PurchaseOrder<br/>aggregate"| ApproveHandler
    ApproveHandler -->|"Calls<br/>PurchaseOrder.<br/>approve(approverId)"| POAggregate
    POAggregate -->|"Validates<br/>ApprovalLevel for PO<br/>total"| ApprovalLevelVO
    POAggregate -->|"Throws if not<br/>AwaitingApproval<br/>state"| ApproveHandler
    POAggregate -->|"Returns Purchase<br/>OrderApproved event<br/>on success"| ApproveHandler
    ApproveHandler -->|"Saves updated PO"| PgPORepo
    ApproveHandler -->|"Publishes event"| OutboxPub

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class POCtrl pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class ApproveHandler pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class POAggregate pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ApprovalLevelVO pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PgPORepo pal-CA9161
    class OutboxPub pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **FSM guard in aggregate label**: `must be in AwaitingApproval state` — constraint visible at component level
- **ApprovalLevel value object**: Encapsulates L1/L2/L3 logic — not in the handler
- **Error path shown**: Aggregate throws if state guard fails — handler propagates as 409 Conflict

**Design Rationale**: Showing the FSM guard in the aggregate component label signals that state validation is the aggregate's responsibility. If a reviewer sees FSM guard logic in the handler, it is an architecture violation.

**Key Takeaway**: Annotate FSM state guards in Domain layer component labels. Guards that live outside the aggregate are guards that can be bypassed by callers.

**Why It Matters**: A PO that can be approved when it is not in `AwaitingApproval` state creates phantom approvals that corrupt the P2P audit trail. FSM guards enforced in the aggregate are the last line of defense against state machine violations. Component diagrams that name the approval guard as an architectural element also signal to test engineers that state-transition boundary conditions require explicit test coverage, not just happy-path approval scenarios.

---

### Example 54: Component Diagram — Infrastructure Adapter Swapping

The port/adapter pattern enables swapping infrastructure adapters without touching the domain. This example shows the in-memory adapter used in tests.

```mermaid
graph TD
    accTitle: Example 54: Component Diagram — Infrastructure Adapter Swapping
    accDescr: Graph with 6 nodes and 5 connections. Nodes: [Component] ApprovePOHandler Application Services, [Component] PgPurchaseOrder Repository Implements Purchase OrderRepository Writes to PostgreSQL, [Component] OutboxEventPublisher Implements EventPublisher Writes to postgres outbox, [Component] InMemoryPurchase OrderRepository Implements Purchase OrderRepository Stores in Map — no DB needed, [Component] FakeEventPublisher Implements EventPublisher Captures events for assertions, [Component] PurchaseOrder Repository (interface) Domain Port. Connections: [Component] ApprovePOHandler Application Services to [Component] PurchaseOrder Repository (interface) Domain Port (Calls interface methods), [Component] PurchaseOrder Repository (interface) Domain Port to [Component] PgPurchaseOrder Repository Implements Purchase OrderRepository Writes to PostgreSQL (Production: implemented by), [Component] PurchaseOrder Repository (interface) Domain Port to [Component] InMemoryPurchase OrderRepository Implements Purchase OrderRepository Stores in Map — no DB needed (Test: implemented by), [Component] ApprovePOHandler Application Services to [Component] OutboxEventPublisher Implements EventPublisher Writes to postgres outbox (Calls EventPublisher interface), [Component] ApprovePOHandler Application Services to [Component] FakeEventPublisher Implements EventPublisher Captures events for assertions (Test: uses).
    AppSvc["[Component]<br/>ApprovePOHandler<br/>Application Services"]

    subgraph ProdAdapters["Production Adapters"]
        PgRepo["[Component]<br/>PgPurchaseOrder<br/>Repository<br/>Implements Purchase<br/>OrderRepository<br/>Writes to PostgreSQL"]
        KafkaPub["[Component]<br/>OutboxEventPublisher<br/>Implements<br/>EventPublisher<br/>Writes to postgres<br/>outbox"]
    end

    subgraph TestAdapters["Test Adapters"]
        MemRepo["[Component]<br/>InMemoryPurchase<br/>OrderRepository<br/>Implements Purchase<br/>OrderRepository<br/>Stores in Map — no<br/>DB needed"]
        FakePub["[Component]<br/>FakeEventPublisher<br/>Implements<br/>EventPublisher<br/>Captures events for<br/>assertions"]
    end

    Port["[Component]<br/>PurchaseOrder<br/>Repository<br/>(interface)<br/>Domain Port"]

    AppSvc -->|"Calls interface<br/>methods"| Port
    Port -->|"Production:<br/>implemented by"| PgRepo
    Port -->|"Test: implemented<br/>by"| MemRepo
    AppSvc -->|"Calls<br/>EventPublisher<br/>interface"| KafkaPub
    AppSvc -->|"Test: uses"| FakePub

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class AppSvc pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PgRepo pal-CA9161
    class KafkaPub pal-CA9161
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class MemRepo pal-029E73
    class FakePub pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Port pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two adapter sets**: Production (postgres, outbox) and Test (in-memory, fake publisher)
- **Interface as pivot**: Application services depend only on the interface — adapters are interchangeable
- **Test adapters enable unit tests**: FakeEventPublisher captures events for assertions without Kafka

**Design Rationale**: Drawing both production and test adapters in the Component diagram makes the testability architecture explicit. Teams that see only production adapters assume testing requires a running database.

**Key Takeaway**: Show test adapters alongside production adapters in Component diagrams. The presence of in-memory adapters is an architectural feature — it enables a fast unit test suite for the business rules.

**Why It Matters**: A P2P business rule test suite that requires PostgreSQL takes minutes to run. The same tests with in-memory adapters run in seconds. Over the lifetime of a project, this difference determines whether developers run tests before every commit or only in CI. Fast tests that run on every commit surface regressions within minutes of introduction; slow tests surface them hours later after multiple commits have accumulated, making root cause identification significantly harder.

---

### Example 55: Component Diagram — Receiving-api Internal Structure

receiving-api has its own component structure mirroring purchasing-api but optimized for GRN entry workflows.

```mermaid
graph TD
    accTitle: Example 55: Component Diagram — Receiving-api Internal Structure
    accDescr: Graph with 8 nodes and 7 connections. Nodes: [Component] GoodsReceipt Controller POST /grn Entry point for GRN data, [Component] RecordGoodsReceipt Handler Validates GRN against open PO Checks quantity tolerances, [Component] GoodsReceiptNote aggregate States: Draft → Verified → Submitted Tolerance: ≤ 10 quantity variance, [Component] PgGoodsReceipt Repository Stores GRN records, [Component] GoodsReceivedEvent Publisher Publishes GoodsReceived event, [Component] PurchaseOrderEvent Consumer Subscribes to po-events Kafka topic Opens GRN expectation on PO Issued, [Container: Database] postgres receiving schema, [Container: Message Broker] event-bus / Kafka. Connections: [Component] PurchaseOrderEvent Consumer Subscribes to po-events Kafka topic Opens GRN expectation on PO Issued to [Container: Message Broker] event-bus / Kafka (Consumes PurchaseOrderIssued), [Component] GoodsReceipt Controller POST /grn Entry point for GRN data to [Component] RecordGoodsReceipt Handler Validates GRN against open PO Checks quantity tolerances (Invokes handler), [Component] RecordGoodsReceipt Handler Validates GRN against open PO Checks quantity tolerances to [Component] GoodsReceiptNote aggregate States: Draft → Verified → Submitted Tolerance: ≤ 10 quantity variance (Creates GRN aggregate), [Component] RecordGoodsReceipt Handler Validates GRN against open PO Checks quantity tolerances to [Component] PgGoodsReceipt Repository Stores GRN records (Saves GRN), [Component] RecordGoodsReceipt Handler Validates GRN against open PO Checks quantity tolerances to [Component] GoodsReceivedEvent Publisher Publishes GoodsReceived event (Publishes GoodsReceived), [Component] PgGoodsReceipt Repository Stores GRN records to [Container: Database] postgres receiving schema (SQL [TCP/5432]), [Component] GoodsReceivedEvent Publisher Publishes GoodsReceived event to [Container: Message Broker] event-bus / Kafka (Publishes to grn-events topic).
    subgraph RecvAPI["receiving-api<br/>Container"]
        GRNCtrl["[Component]<br/>GoodsReceipt<br/>Controller<br/>POST /grn<br/>Entry point for GRN<br/>data"]
        GRNHandler["[Component]<br/>RecordGoodsReceipt<br/>Handler<br/>Validates GRN<br/>against open PO<br/>Checks quantity<br/>tolerances"]
        GRNAggregate["[Component]<br/>GoodsReceiptNote<br/>aggregate<br/>States: Draft →<br/>Verified → Submitted<br/>Tolerance: ≤ 10%<br/>quantity variance"]
        GRNRepo["[Component]<br/>PgGoodsReceipt<br/>Repository<br/>Stores GRN records"]
        GRNEventPub["[Component]<br/>GoodsReceivedEvent<br/>Publisher<br/>Publishes<br/>GoodsReceived event"]
        POConsumer["[Component]<br/>PurchaseOrderEvent<br/>Consumer<br/>Subscribes to<br/>po-events Kafka<br/>topic<br/>Opens GRN<br/>expectation on PO<br/>Issued"]
    end

    PG["[Container:<br/>Database]<br/>postgres<br/>receiving schema"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]

    POConsumer -->|"Consumes<br/>PurchaseOrderIssued"| EventBus
    GRNCtrl -->|"Invokes handler"| GRNHandler
    GRNHandler -->|"Creates GRN<br/>aggregate"| GRNAggregate
    GRNHandler -->|"Saves GRN"| GRNRepo
    GRNHandler -->|"Publishes<br/>GoodsReceived"| GRNEventPub
    GRNRepo -->|"SQL [TCP/5432]"| PG
    GRNEventPub -->|"Publishes to<br/>grn-events topic"| EventBus

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class GRNCtrl pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class GRNHandler pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class GRNAggregate pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class GRNRepo pal-CA9161
    class GRNEventPub pal-CA9161
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class POConsumer pal-CC78BC
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class PG pal-808080
    class EventBus pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Kafka consumer as component**: POConsumer subscribes to po-events — receiving-api is both HTTP server and event consumer
- **GRN aggregate with tolerance**: 10% quantity variance tolerance is a domain rule in the aggregate label
- **Separate event schema**: receiving-api publishes to `grn-events`, not to `po-events`

**Design Rationale**: receiving-api has a dual interface: HTTP for warehouse operator input, Kafka consumer for PO-issued event. Both interfaces trigger the same GRN aggregate. Showing both in the Component diagram prevents treating them as separate systems.

**Key Takeaway**: Model Kafka consumer components alongside HTTP controllers in receiving containers. Event-driven entry points deserve the same architectural clarity as HTTP entry points.

**Why It Matters**: receiving-api implementations that do not model the Kafka consumer as a first-class component routinely skip GRN expectation tracking — the feature that prevents warehouse staff from receiving against non-existent POs, a source of ghost receipts and financial loss. Naming the consumer component also makes it the natural owner of dead-letter queue handling, preventing GRN event loss from becoming a silent production failure that only surfaces during supplier payment disputes.

---

### Example 56: Component Diagram — invoicing-api Three-Way Match

invoicing-api's core component implements three-way match logic: compare PO, GRN, and Invoice values within tolerance.

```mermaid
graph TD
    accTitle: Example 56: Component Diagram — invoicing-api Three-Way Match
    accDescr: Graph with 9 nodes and 8 connections. Nodes: [Component] InvoiceController POST /invoices Invoice registration endpoint, [Component] RegisterInvoice Handler Orchestrates registration and match trigger, [Component] Invoice aggregate States: Registered → Matching → Matched → Disputed, [Component] ThreeWayMatchService Compares: PO unit price × GRN qty vs Invoice amount ± Tolerance 2, [Component] PgInvoiceRepository, [Component] POEventConsumer Subscribes to po-events Caches PO data for matching, [Component] GRNEventConsumer Subscribes to grn-events Caches GRN data for matching, [Container: Database] postgres invoicing schema, [Container: Message Broker] event-bus / Kafka. Connections: [Component] POEventConsumer Subscribes to po-events Caches PO data for matching to [Container: Message Broker] event-bus / Kafka (Consumes po-events), [Component] GRNEventConsumer Subscribes to grn-events Caches GRN data for matching to [Container: Message Broker] event-bus / Kafka (Consumes grn-events), [Component] InvoiceController POST /invoices Invoice registration endpoint to [Component] RegisterInvoice Handler Orchestrates registration and match trigger (Invokes handler), [Component] RegisterInvoice Handler Orchestrates registration and match trigger to [Component] Invoice aggregate States: Registered → Matching → Matched → Disputed (Creates Invoice aggregate), [Component] RegisterInvoice Handler Orchestrates registration and match trigger to [Component] ThreeWayMatchService Compares: PO unit price × GRN qty vs Invoice amount ± Tolerance 2 (Triggers match), [Component] ThreeWayMatchService Compares: PO unit price × GRN qty vs Invoice amount ± Tolerance 2 to [Container: Database] postgres invoicing schema (Reads cached PO and GRN data), [Component] RegisterInvoice Handler Orchestrates registration and match trigger to [Component] PgInvoiceRepository (Saves invoice and match result), [Component] PgInvoiceRepository to [Container: Database] postgres invoicing schema (SQL [TCP/5432]).
    subgraph InvAPI["invoicing-api<br/>Container"]
        InvCtrl["[Component]<br/>InvoiceController<br/>POST /invoices<br/>Invoice registration<br/>endpoint"]
        InvHandler["[Component]<br/>RegisterInvoice<br/>Handler<br/>Orchestrates<br/>registration<br/>and match trigger"]
        InvAggregate["[Component]<br/>Invoice aggregate<br/>States: Registered →<br/>Matching →<br/>Matched → Disputed"]
        MatchSvc["[Component]<br/>ThreeWayMatchService<br/>Compares: PO unit<br/>price × GRN qty<br/>vs Invoice amount ±<br/>Tolerance 2%"]
        InvRepo["[Component]<br/>PgInvoiceRepository"]
        POConsumer["[Component]<br/>POEventConsumer<br/>Subscribes to<br/>po-events<br/>Caches PO data for<br/>matching"]
        GRNConsumer["[Component]<br/>GRNEventConsumer<br/>Subscribes to<br/>grn-events<br/>Caches GRN data for<br/>matching"]
    end

    PG["[Container:<br/>Database]<br/>postgres<br/>invoicing schema"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]

    POConsumer -->|"Consumes po-events"| EventBus
    GRNConsumer -->|"Consumes<br/>grn-events"| EventBus
    InvCtrl -->|"Invokes handler"| InvHandler
    InvHandler -->|"Creates Invoice<br/>aggregate"| InvAggregate
    InvHandler -->|"Triggers match"| MatchSvc
    MatchSvc -->|"Reads cached PO and<br/>GRN data"| PG
    InvHandler -->|"Saves invoice and<br/>match result"| InvRepo
    InvRepo -->|"SQL [TCP/5432]"| PG

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class InvCtrl pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class InvHandler pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class InvAggregate pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class MatchSvc pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class InvRepo pal-CA9161
    class POConsumer pal-CA9161
    class GRNConsumer pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class PG pal-808080
    class EventBus pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **ThreeWayMatchService**: Encapsulates the matching algorithm — not buried in the handler
- **Two Kafka consumers**: invoicing-api caches PO and GRN data from upstream events
- **2% tolerance**: Match tolerance is a business parameter visible in the component label

**Design Rationale**: Extracting ThreeWayMatchService as a distinct component makes the matching algorithm independently testable. A service buried in the handler cannot be tested without the full HTTP request context.

**Key Takeaway**: Extract complex business algorithms into named Application Service components. ThreeWayMatchService as a named component signals that the matching logic has defined inputs, outputs, and test cases.

**Why It Matters**: Incorrect three-way matching results in overpayments or blocked invoices. A named, independently testable match service enables comprehensive edge-case testing (exact match, within tolerance, over tolerance, missing GRN) that protects against payment errors. Centralizing the matching engine in a single component also allows tolerance thresholds — acceptable quantity variances between PO and GRN — to be configured in one place rather than hardcoded independently across multiple services.

---

### Example 57: Component Diagram — payments-worker Internal Structure

payments-worker's internal components show how a background worker is organized differently from a REST API.

```mermaid
graph TD
    accTitle: Example 57: Component Diagram — payments-worker Internal Structure
    accDescr: Graph with 9 nodes and 11 connections. Nodes: [Component] InvoiceMatched Consumer Subscribes to invoice-events Triggers payment scheduling, [Component] PaymentScheduler Groups invoices into payment runs Respects bank cut-off times, [Component] PaymentExecutor Builds ISO 20022 pain.001 file Sends to bank, handles pain.002, [Component] PgPaymentRepository Saves payment state and checkpoints, [Component] BankApiAdapter Implements BankingPort REST + retry + circuit breaker, [Component] IdempotencyChecker Prevents double-payment Checks payment_id uniqueness, [Container: Message Broker] event-bus / Kafka, [Container: Database] postgres payments schema, [External System] Bank. Connections: [Component] InvoiceMatched Consumer Subscribes to invoice-events Triggers payment scheduling to [Container: Message Broker] event-bus / Kafka (Consumes InvoiceMatched), [Component] InvoiceMatched Consumer Subscribes to invoice-events Triggers payment scheduling to [Component] PaymentScheduler Groups invoices into payment runs Respects bank cut-off times (Schedules payment), [Component] PaymentScheduler Groups invoices into payment runs Respects bank cut-off times to [Component] PgPaymentRepository Saves payment state and checkpoints (Persists payment schedule), [Component] PaymentScheduler Groups invoices into payment runs Respects bank cut-off times to [Component] IdempotencyChecker Prevents double-payment Checks payment_id uniqueness (Checks idempotency), [Component] IdempotencyChecker Prevents double-payment Checks payment_id uniqueness to [Component] PgPaymentRepository Saves payment state and checkpoints (Queries payment_id), [Component] PaymentScheduler Groups invoices into payment runs Respects bank cut-off times to [Component] PaymentExecutor Builds ISO 20022 pain.001 file Sends to bank, handles pain.002 (Triggers executor), [Component] PaymentExecutor Builds ISO 20022 pain.001 file Sends to bank, handles pain.002 to [Component] BankApiAdapter Implements BankingPort REST + retry + circuit breaker (Sends pain.001 via adapter), [Component] BankApiAdapter Implements BankingPort REST + retry + circuit breaker to [External System] Bank (HTTPS to bank API), [External System] Bank to [Component] BankApiAdapter Implements BankingPort REST + retry + circuit breaker (Returns pain.002 status), [Component] BankApiAdapter Implements BankingPort REST + retry + circuit breaker to [Component] PgPaymentRepository Saves payment state and checkpoints (Updates payment status), [Component] PgPaymentRepository Saves payment state and checkpoints to [Container: Database] postgres payments schema (SQL [TCP/5432]).
    subgraph PayWorker["payments-worker<br/>Container"]
        InvoiceConsumer["[Component]<br/>InvoiceMatched<br/>Consumer<br/>Subscribes to<br/>invoice-events<br/>Triggers payment<br/>scheduling"]
        PayScheduler["[Component]<br/>PaymentScheduler<br/>Groups invoices into<br/>payment runs<br/>Respects bank<br/>cut-off times"]
        PayExecutor["[Component]<br/>PaymentExecutor<br/>Builds ISO 20022<br/>pain.001 file<br/>Sends to bank,<br/>handles pain.002"]
        PayRepo["[Component]<br/>PgPaymentRepository<br/>Saves payment state<br/>and checkpoints"]
        BankAdapter["[Component]<br/>BankApiAdapter<br/>Implements<br/>BankingPort<br/>REST + retry +<br/>circuit breaker"]
        IdempotencyChecker["[Component]<br/>IdempotencyChecker<br/>Prevents<br/>double-payment<br/>Checks payment_id<br/>uniqueness"]
    end

    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]
    PG["[Container:<br/>Database]<br/>postgres<br/>payments schema"]
    Bank["[External System]<br/>Bank"]

    InvoiceConsumer -->|"Consumes<br/>InvoiceMatched"| EventBus
    InvoiceConsumer -->|"Schedules payment"| PayScheduler
    PayScheduler -->|"Persists payment<br/>schedule"| PayRepo
    PayScheduler -->|"Checks idempotency"| IdempotencyChecker
    IdempotencyChecker -->|"Queries payment_id"| PayRepo
    PayScheduler -->|"Triggers executor"| PayExecutor
    PayExecutor -->|"Sends pain.001 via<br/>adapter"| BankAdapter
    BankAdapter -->|"HTTPS to bank API"| Bank
    Bank -->|"Returns pain.002<br/>status"| BankAdapter
    BankAdapter -->|"Updates payment<br/>status"| PayRepo
    PayRepo -->|"SQL [TCP/5432]"| PG

    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class InvoiceConsumer pal-CC78BC
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class PayScheduler pal-DE8F05
    class PayExecutor pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PayRepo pal-CA9161
    class BankAdapter pal-CA9161
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class IdempotencyChecker pal-029E73
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class EventBus pal-808080
    class PG pal-808080
    class Bank pal-808080
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Key Elements**:

- **IdempotencyChecker**: A dedicated component for preventing double-payments — not an afterthought
- **BankApiAdapter with retry and circuit breaker**: Resilience built into the adapter, not the caller
- **PaymentScheduler respects cut-off times**: Business constraint (bank cut-off) in component label

**Design Rationale**: IdempotencyChecker as a distinct component signals that idempotency is a first-class concern in the payment worker. Teams that skip this component routinely produce double-payment bugs when the worker retries after a crash.

**Key Takeaway**: Name idempotency and circuit breaker components explicitly. Making them anonymous "utilities" inside another component hides a critical safety mechanism from reviewers.

**Why It Matters**: Double-payments are irreversible in real-time banking systems. An explicit IdempotencyChecker component ensures that idempotency requirements are tested, monitored, and maintained separately from general payment logic. In ISO 20022 payment flows, the idempotency key must survive worker restarts, Kafka consumer rebalances, and database failovers — requirements that only surface when the component is designed explicitly rather than treated as an implementation detail.

---

### Example 58: Component Diagram — Approval Router Component

The approval router component routes requisitions to the correct approval level based on PO total and organizational policy.

```mermaid
graph TD
    accTitle: Example 58: Component Diagram — Approval Router Component
    accDescr: Graph with 6 nodes and 5 connections. Nodes: [Component] SubmitRequisition Handler Application Services, [Component] ApprovalRouter Adapter Implements ApprovalRouterPort Determines ApprovalLevel from PO total, [Component] ApproverNotification Adapter Sends approval request to manager via email or workflow engine, [Component] ApprovalLevel value object L1: PO total ≤ $1,000 L2: PO total ≤ $10,000 L3: PO total > $10,000, [Person] Approving Manager, [External System] Email Service. Connections: [Component] SubmitRequisition Handler Application Services to [Component] ApprovalRouter Adapter Implements ApprovalRouterPort Determines ApprovalLevel from PO total (Routes requisition via ApprovalRouterPort), [Component] ApprovalRouter Adapter Implements ApprovalRouterPort Determines ApprovalLevel from PO total to [Component] ApprovalLevel value object L1: PO total ≤ $1,000 L2: PO total ≤ $10,000 L3: PO total > $10,000 (Derives ApprovalLevel), [Component] ApprovalRouter Adapter Implements ApprovalRouterPort Determines ApprovalLevel from PO total to [Component] ApproverNotification Adapter Sends approval request to manager via email or workflow engine (Notifies correct approver), [Component] ApproverNotification Adapter Sends approval request to manager via email or workflow engine to [External System] Email Service (Sends approval request email [SMTP]), [External System] Email Service to [Person] Approving Manager (Delivers to manager inbox).
    SubmitHandler["[Component]<br/>SubmitRequisition<br/>Handler<br/>Application Services"]

    subgraph ApprovalComponents["Approval Routing —<br/>purchasing-api"]
        ApprovalRouter["[Component]<br/>ApprovalRouter<br/>Adapter<br/>Implements<br/>ApprovalRouterPort<br/>Determines<br/>ApprovalLevel from<br/>PO total"]
        NotifyAdapter["[Component]<br/>ApproverNotification<br/>Adapter<br/>Sends approval<br/>request to manager<br/>via email or<br/>workflow engine"]
        ApprovalLevelVO["[Component]<br/>ApprovalLevel value<br/>object<br/>L1: PO total ≤<br/>$1,000<br/>L2: PO total ≤<br/>$10,000<br/>L3: PO total ><br/>$10,000"]
    end

    Manager["[Person]<br/>Approving Manager"]
    EmailSvc["[External System]<br/>Email Service"]

    SubmitHandler -->|"Routes requisition<br/>via<br/>ApprovalRouterPort"| ApprovalRouter
    ApprovalRouter -->|"Derives<br/>ApprovalLevel"| ApprovalLevelVO
    ApprovalRouter -->|"Notifies correct<br/>approver"| NotifyAdapter
    NotifyAdapter -->|"Sends approval<br/>request email<br/>[SMTP]"| EmailSvc
    EmailSvc -->|"Delivers to manager<br/>inbox"| Manager

    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SubmitHandler pal-808080
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class ApprovalRouter pal-CA9161
    class NotifyAdapter pal-CA9161
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ApprovalLevelVO pal-CC78BC
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Manager pal-029E73
    class EmailSvc pal-808080
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Key Elements**:

- **ApprovalRouterPort implementation**: Adapter implements the domain port — approval routing is pluggable
- **ApprovalLevel value object drives routing**: Dollar threshold logic lives in a value object
- **NotifyAdapter wraps email delivery**: Direct SMTP coupling lives only in the adapter

**Design Rationale**: Implementing approval routing as a port/adapter makes it replaceable. Organizations that switch from email to Slack or a workflow engine need to replace only the adapter, not the handler or the domain.

**Key Takeaway**: Model approval routing as an infrastructure adapter that implements a domain port. Routing strategy changes are then configuration decisions, not refactoring tasks.

**Why It Matters**: Approval workflow engines change as organizations grow (email → Slack → ServiceNow). Port/adapter routing isolation means these transitions are adapter swaps — one class replaced — not invasive refactors across multiple layers. When the routing adapter is a named, replaceable component in the architecture diagram, migrating to a new approval tool is scoped to a single adapter implementation rather than a system-wide refactor that touches business logic.

---

### Example 59: Component Diagram — Event Consumer Registration Pattern

Kafka consumer components need explicit registration and offset management. This example shows the pattern inside purchasing-api.

```mermaid
graph TD
    accTitle: Example 59: Component Diagram — Event Consumer Registration Pattern
    accDescr: Graph with 6 nodes and 7 connections. Nodes: [Component] PaymentDisbursed Consumer Subscribes to payment-events topic Updates PO state to Paid, [Component] InvoiceDisputed Consumer Subscribes to invoice-events topic Transitions PO to Disputed state, [Component] KafkaConsumer Registry Manages consumer group offsets Handles rebalance events, [Component] PurchaseOrder aggregate Domain Layer, [Component] PgPurchaseOrder Repository Infrastructure, [Container: Message Broker] event-bus / Kafka. Connections: [Component] KafkaConsumer Registry Manages consumer group offsets Handles rebalance events to [Container: Message Broker] event-bus / Kafka (Registers consumers on startup), [Container: Message Broker] event-bus / Kafka to [Component] PaymentDisbursed Consumer Subscribes to payment-events topic Updates PO state to Paid (Delivers PaymentDisbursed), [Container: Message Broker] event-bus / Kafka to [Component] InvoiceDisputed Consumer Subscribes to invoice-events topic Transitions PO to Disputed state (Delivers InvoiceDisputed), [Component] PaymentDisbursed Consumer Subscribes to payment-events topic Updates PO state to Paid to [Component] PurchaseOrder aggregate Domain Layer (Loads PO, calls pay()), [Component] InvoiceDisputed Consumer Subscribes to invoice-events topic Transitions PO to Disputed state to [Component] PurchaseOrder aggregate Domain Layer (Loads PO, calls dispute()), [Component] PaymentDisbursed Consumer Subscribes to payment-events topic Updates PO state to Paid to [Component] PgPurchaseOrder Repository Infrastructure (Saves updated PO), [Component] InvoiceDisputed Consumer Subscribes to invoice-events topic Transitions PO to Disputed state to [Component] PgPurchaseOrder Repository Infrastructure (Saves updated PO).
    subgraph EventConsumers["Event Consumers —<br/>purchasing-api"]
        PaymentConsumer["[Component]<br/>PaymentDisbursed<br/>Consumer<br/>Subscribes to<br/>payment-events topic<br/>Updates PO state to<br/>Paid"]
        DisputeConsumer["[Component]<br/>InvoiceDisputed<br/>Consumer<br/>Subscribes to<br/>invoice-events topic<br/>Transitions PO to<br/>Disputed state"]
        ConsumerRegistry["[Component]<br/>KafkaConsumer<br/>Registry<br/>Manages consumer<br/>group offsets<br/>Handles rebalance<br/>events"]
    end

    POAggregate["[Component]<br/>PurchaseOrder<br/>aggregate<br/>Domain Layer"]
    PgPORepo["[Component]<br/>PgPurchaseOrder<br/>Repository<br/>Infrastructure"]
    EventBus["[Container: Message<br/>Broker]<br/>event-bus / Kafka"]

    ConsumerRegistry -->|"Registers consumers<br/>on startup"| EventBus
    EventBus -->|"Delivers<br/>PaymentDisbursed"| PaymentConsumer
    EventBus -->|"Delivers<br/>InvoiceDisputed"| DisputeConsumer
    PaymentConsumer -->|"Loads PO, calls<br/>pay()"| POAggregate
    DisputeConsumer -->|"Loads PO, calls<br/>dispute()"| POAggregate
    PaymentConsumer -->|"Saves updated PO"| PgPORepo
    DisputeConsumer -->|"Saves updated PO"| PgPORepo

    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class PaymentConsumer pal-CC78BC
    class DisputeConsumer pal-CC78BC
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class ConsumerRegistry pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class POAggregate pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class PgPORepo pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class EventBus pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **ConsumerRegistry**: Manages offset tracking and group rebalance — not buried in each consumer
- **Two consumer components**: purchasing-api subscribes to events from downstream contexts
- **Consumers call domain aggregate**: Event consumers follow the same handler pattern as HTTP controllers

**Design Rationale**: Centralizing offset management in a ConsumerRegistry component prevents each consumer from re-implementing Kafka coordination logic. The registry is the single point for offset commit strategy and rebalance handling.

**Key Takeaway**: Model a KafkaConsumerRegistry component when a container has multiple Kafka consumers. Shared offset management prevents duplicate processing and simplifies rebalance handling.

**Why It Matters**: Kafka consumer groups that mismanage offsets reprocess events on restart, causing duplicate state transitions in PO aggregates. Explicit registry components with correct at-least-once semantics and idempotent aggregate methods prevent reprocessing errors. Explicit ownership of offset management also makes it possible to alert on consumer lag as a leading indicator of processing bottlenecks before they cause visible P2P delays that affect purchase order approval SLAs.

---

### Example 60: Component Diagram — Anti-Corruption Layer Between Contexts

When purchasing-api receives events from receiving-api, an Anti-Corruption Layer (ACL) translates the receiving context's domain model into purchasing's domain model.

```mermaid
graph TD
    accTitle: Example 60: Component Diagram — Anti-Corruption Layer Between Contexts
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Component] GoodsReceivedEvent Consumer purchasing-api — subscribes to grn-events, [Component] GoodsReceipt Translator Maps GoodsReceived event (receiving context) to PurchaseOrder ReceivedEvent (purchasing context), [Component] ReceivingContext Mapper Translates SupplierId, Quantity, SkuCode to purchasing context value objects, [Component] PurchaseOrder aggregate purchasing context domain, [Component] RecordGoodsReceipt Handler Application Services — purchasing context. Connections: [Component] GoodsReceivedEvent Consumer purchasing-api — subscribes to grn-events to [Component] GoodsReceipt Translator Maps GoodsReceived event (receiving context) to PurchaseOrder ReceivedEvent (purchasing context) (Raw GoodsReceived event from receiving), [Component] GoodsReceipt Translator Maps GoodsReceived event (receiving context) to PurchaseOrder ReceivedEvent (purchasing context) to [Component] ReceivingContext Mapper Translates SupplierId, Quantity, SkuCode to purchasing context value objects (Maps receiving types to purchasing types), [Component] ReceivingContext Mapper Translates SupplierId, Quantity, SkuCode to purchasing context value objects to [Component] RecordGoodsReceipt Handler Application Services — purchasing context (Returns purchasing context command), [Component] RecordGoodsReceipt Handler Application Services — purchasing context to [Component] PurchaseOrder aggregate purchasing context domain (Calls PO.partialReceive() or PO.fullReceive()).
    GRNConsumer["[Component]<br/>GoodsReceivedEvent<br/>Consumer<br/>purchasing-api —<br/>subscribes to<br/>grn-events"]

    subgraph ACL["Anti-Corruption<br/>Layer —<br/>purchasing-api"]
        GRNTranslator["[Component]<br/>GoodsReceipt<br/>Translator<br/>Maps GoodsReceived<br/>event (receiving<br/>context)<br/>to PurchaseOrder<br/>ReceivedEvent<br/>(purchasing context)"]
        ContextMapper["[Component]<br/>ReceivingContext<br/>Mapper<br/>Translates<br/>SupplierId,<br/>Quantity, SkuCode<br/>to purchasing<br/>context value<br/>objects"]
    end

    POAggregate["[Component]<br/>PurchaseOrder<br/>aggregate<br/>purchasing context<br/>domain"]
    Handler["[Component]<br/>RecordGoodsReceipt<br/>Handler<br/>Application Services<br/>— purchasing context"]

    GRNConsumer -->|"Raw GoodsReceived<br/>event from<br/>receiving"| GRNTranslator
    GRNTranslator -->|"Maps receiving<br/>types to purchasing<br/>types"| ContextMapper
    ContextMapper -->|"Returns purchasing<br/>context command"| Handler
    Handler -->|"Calls<br/>PO.partialReceive()<br/>or PO.fullReceive()"| POAggregate

    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class GRNConsumer pal-CC78BC
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class GRNTranslator pal-DE8F05
    class ContextMapper pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class POAggregate pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Handler pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **GoodsReceiptTranslator**: Converts receiving context event to purchasing context language
- **ContextMapper**: Translates value objects across context boundaries
- **PO.partialReceive() or fullReceive()**: Receiving events drive PO state transitions in purchasing

**Design Rationale**: The ACL prevents the receiving context's domain model from polluting the purchasing context. Without it, purchasing aggregates contain receiving-context terminology — a bounded context violation.

**Key Takeaway**: Model Anti-Corruption Layers as distinct components at context boundaries. ACLs are the architectural mechanism that allows bounded contexts to evolve independently.

**Why It Matters**: Bounded contexts without ACLs develop implicit coupling through shared domain terminology. When the receiving team renames `GRN` to `ReceivingRecord`, every consumer that imports receiving types without an ACL breaks — a change that should have had zero blast radius. When the ACL is a named component in the Component diagram, schema changes in the external supplier API are contained to a single translation layer rather than propagating through the domain model and all its consumers.
