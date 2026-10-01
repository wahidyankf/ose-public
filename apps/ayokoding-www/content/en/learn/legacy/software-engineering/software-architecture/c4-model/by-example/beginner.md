---
title: "Beginner"
date: 2026-01-31T00:00:00+07:00
draft: false
weight: 10000001
description: "Examples 1-30: C4 Level 1 System Context diagrams for the procurement-platform-be — actors, external systems, boundaries, and integration patterns (0-40% coverage)"
tags: ["c4-model", "architecture", "tutorial", "by-example", "beginner", "diagrams"]
---

This beginner-level tutorial introduces C4 Model fundamentals through 30 annotated diagram examples. Every example uses the `procurement-platform-be` — a Procure-to-Pay (P2P) REST API backend — as the target system. All diagrams stay at System Context (Level 1): the platform is a black box and we draw only the actors, external systems, and their relationships at the boundary.

## C4 Model Fundamentals (Examples 1–5)

### Example 1: The Four Levels of C4

The C4 Model provides a hierarchical approach to visualizing software architecture through four levels of abstraction. Understanding this zoom hierarchy is the entry point to every diagram in this guide.

```mermaid
graph TD
    accTitle: Example 1: The Four Levels of C4
    accDescr: Graph with 4 nodes and 3 connections. Nodes: Level 1 — Context System relationships, Level 2 — Containers Deployable units & data stores, Level 3 — Components Internal container structure, Level 4 — Code Classes, functions, interfaces. Connections: Level 1 — Context System relationships to Level 2 — Containers Deployable units & data stores (zoom in), Level 2 — Containers Deployable units & data stores to Level 3 — Components Internal container structure (zoom in), Level 3 — Components Internal container structure to Level 4 — Code Classes, functions, interfaces (zoom in).
    A["Level 1 — Context<br/>System relationships"]
    B["Level 2 — Containers<br/>Deployable units &<br/>data stores"]
    C["Level 3 — Components<br/>Internal container<br/>structure"]
    D["Level 4 — Code<br/>Classes, functions,<br/>interfaces"]

    A -->|"zoom in"| B
    B -->|"zoom in"| C
    C -->|"zoom in"| D

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class B pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class C pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class D pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Level 1 Context** (blue): Who uses the system, what external systems does it touch?
- **Level 2 Containers** (orange): What are the separately deployable/runnable parts?
- **Level 3 Components** (teal): What logical groupings live inside one container?
- **Level 4 Code** (purple): What classes/functions implement a critical component?

**Design Rationale**: C4 uses four levels because different stakeholders need different detail. Executives need one-slide Context views; developers need Component diagrams with API contracts; a single flat diagram cannot serve both.

**Key Takeaway**: Choose the right level for your audience. Start at Context, zoom in only when the audience or decision requires more detail.

**Why It Matters**: Architecture diagrams routinely fail because they mix abstraction levels — placing a Kubernetes node next to a business actor in the same view. C4's four levels enforce separation of concerns at the diagram level, making communication cleaner and decisions more grounded. When you know which level you are at, you know which details belong and which are noise.

---

### Example 2: C4 Notation Basics — Person, System, External System

C4 notation uses three element types at Level 1. Understanding their shapes and labels is mandatory before reading any Context diagram.

```mermaid
graph TD
    accTitle: Example 2: C4 Notation Basics — Person, System, External System
    accDescr: Graph with 3 nodes and 2 connections. Nodes: [Person] Buyer Employee A human user of the system, [Software System] Procurement Platform The system we are documenting, [External System] Bank A system outside our boundary. Connections: [Person] Buyer Employee A human user of the system to [Software System] Procurement Platform The system we are documenting (Submits requisitions), [Software System] Procurement Platform The system we are documenting to [External System] Bank A system outside our boundary (Sends payment instructions).
    PersonEl["[Person]<br/>Buyer Employee<br/>A human user of the<br/>system"]
    SystemEl["[Software System]<br/>Procurement Platform<br/>The system we are<br/>documenting"]
    ExtEl["[External System]<br/>Bank<br/>A system outside our<br/>boundary"]

    PersonEl -->|"Submits<br/>requisitions"| SystemEl
    SystemEl -->|"Sends payment<br/>instructions"| ExtEl

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class PersonEl pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class SystemEl pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class ExtEl pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Person** (teal): A human role that interacts with the system
- **Software System** (blue): The system under discussion — drawn as a single box at this level
- **External System** (gray): A system outside your scope that you depend on or that depends on you

**Design Rationale**: Using explicit type labels `[Person]` and `[External System]` prevents ambiguity. Without labels, a box could be anything; with labels, every reader immediately knows the nature of the element.

**Key Takeaway**: Three element types — Person, Software System, External System — cover every actor at Level 1. Consistent labeling removes ambiguity for mixed technical/non-technical audiences.

**Why It Matters**: Ambiguous diagrams drive ambiguous conversations. When a product manager sees `[Person] Buyer Employee` instead of just `Employee`, they immediately grasp the human-to-system boundary, which anchors feature discussions in the right scope. Consistent notation across all diagrams also reduces the onboarding friction for new team members who must quickly understand who interacts with the system.

---

### Example 3: Relationship Labels and Direction

Every arrow in a C4 Context diagram carries a verb phrase explaining the nature of the relationship. Direction represents data or control flow.

```mermaid
graph TD
    accTitle: Example 3: Relationship Labels and Direction
    accDescr: Graph with 3 nodes and 3 connections. Nodes: [Person] Buyer Employee, [Software System] Procurement Platform, [External System] Internal ERP / GL. Connections: [Person] Buyer Employee to [Software System] Procurement Platform (Submits purchase requisitions), [Software System] Procurement Platform to [External System] Internal ERP / GL (Posts accounting entries [HTTPS/REST]), [External System] Internal ERP / GL to [Software System] Procurement Platform (Provides chart of accounts [HTTPS/REST]).
    Buyer["[Person]<br/>Buyer Employee"]
    Platform["[Software System]<br/>Procurement Platform"]
    ERP["[External System]<br/>Internal ERP / GL"]

    Buyer -->|"Submits purchase<br/>requisitions"| Platform
    Platform -->|"Posts accounting<br/>entries<br/>[HTTPS/REST]"| ERP
    ERP -->|"Provides chart of<br/>accounts<br/>[HTTPS/REST]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class ERP pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Verb phrases on arrows**: Describe purpose, not just "calls" or "uses"
- **Protocol hints** `[HTTPS/REST]`: Optional but valuable for engineers
- **Bidirectional flows**: ERP and Platform exchange data in both directions — modeled as two arrows

**Design Rationale**: Relationship labels distinguish architectural intent from accident. "Posts accounting entries" says why the integration exists; "calls" says nothing.

**Key Takeaway**: Always label relationships with a purposeful verb phrase. Adding protocol hints costs nothing and immediately answers "how do they talk?" for engineers in the room.

**Why It Matters**: In cross-team discussions, unlabeled arrows cause ten-minute debates about what the arrow means. Purposeful labels prevent those debates and double as documentation that survives meeting notes. Adding protocol hints such as `[REST]` or `[ISO 20022]` also gives engineers the integration contracts they need without requiring a separate API specification document at early architecture stages.

---

### Example 4: System Boundary Box

A system boundary box explicitly marks the edge of your system, separating internal from external. This clarifies scope for all readers.

```mermaid
graph TD
    accTitle: Example 4: System Boundary Box
    accDescr: Graph with 3 nodes and 3 connections. Nodes: [Software System] Procurement Platform P2P backend REST API, [Person] Buyer Employee Submits requisitions, [Person /External System] Supplier Receives POs, ships goods. Connections: [Person] Buyer Employee Submits requisitions to [Software System] Procurement Platform P2P backend REST API (Submits requisitions and approves POs), [Software System] Procurement Platform P2P backend REST API to [Person /External System] Supplier Receives POs, ships goods (Sends purchase orders [EDI /SMTP]), [Person /External System] Supplier Receives POs, ships goods to [Software System] Procurement Platform P2P backend REST API (Sends invoices [HTTPS]).
    subgraph Boundary["Procurement Platform<br/>— System Boundary"]
        Platform["[Software System]<br/>Procurement Platform<br/>P2P backend REST API"]
    end

    Buyer["[Person]<br/>Buyer Employee<br/>Submits requisitions"]
    Supplier["[Person /External<br/>System]<br/>Supplier<br/>Receives POs, ships<br/>goods"]

    Buyer -->|"Submits<br/>requisitions and<br/>approves POs"| Platform
    Platform -->|"Sends purchase<br/>orders [EDI /SMTP]"| Supplier
    Supplier -->|"Sends invoices<br/>[HTTPS]"| Platform

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Subgraph boundary**: The dashed box around `Procurement Platform` makes scope explicit
- **Supplier dual role**: A Supplier is both a person (human account manager) and an external system (supplier portal) — the label clarifies this duality
- **EDI / SMTP**: Real integration protocol shown on the PO delivery arrow

**Design Rationale**: Without a boundary box, readers may not know which boxes are "yours" vs. external dependencies. The boundary box resolves ownership instantly.

**Key Takeaway**: Use a boundary box whenever the system scope is non-obvious or when you are presenting to an audience unfamiliar with your organizational landscape.

**Why It Matters**: Scope disagreements between teams often trace back to diagrams with no explicit boundary. The boundary box is the cheapest contract you can draw. When ownership is visible at a glance, engineering teams can escalate cross-boundary decisions to the right stakeholders without ambiguity, reducing the cycle time for architecture reviews and preventing duplicate ownership claims over shared services.

---

### Example 5: C4 Level Selection Guide

Choosing the wrong level wastes diagram effort. This example shows a decision tree for selecting the right C4 level for a given situation.

```mermaid
graph TD
    accTitle: Example 5: C4 Level Selection Guide
    accDescr: Graph with 7 nodes and 6 connections. Nodes: Who is the audience?, Do they need to see internal structure?, Do they need to see code-level detail?, Use Level 1 System Context, Use Level 2 Container Diagram, Use Level 3 Component Diagram, Use Level 4 Code Diagram. Connections: Who is the audience? to Use Level 1 System Context (Executive / Business), Who is the audience? to Do they need to see internal structure? (Tech lead / Architect), Do they need to see internal structure? to Use Level 2 Container Diagram (No — deployment boundaries only), Do they need to see internal structure? to Do they need to see code-level detail? (Yes — internal design of one container), Do they need to see code-level detail? to Use Level 3 Component Diagram (No), Do they need to see code-level detail? to Use Level 4 Code Diagram (Yes — class/function design).
    Q1{"Who is the audience?"}
    Q2{"Do they need to see<br/>internal structure?"}
    Q3{"Do they need to see<br/>code-level detail?"}
    L1["Use Level 1<br/>System Context"]
    L2["Use Level 2<br/>Container Diagram"]
    L3["Use Level 3<br/>Component Diagram"]
    L4["Use Level 4<br/>Code Diagram"]

    Q1 -->|"Executive /<br/>Business"| L1
    Q1 -->|"Tech lead /<br/>Architect"| Q2
    Q2 -->|"No — deployment<br/>boundaries only"| L2
    Q2 -->|"Yes — internal<br/>design of one<br/>container"| Q3
    Q3 -->|"No"| L3
    Q3 -->|"Yes —<br/>class/function<br/>design"| L4

    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class Q1 pal-DE8F05
    class Q2 pal-DE8F05
    class Q3 pal-DE8F05
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class L1 pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class L2 pal-029E73
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class L3 pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class L4 pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Audience-first decision**: The first branch is audience, not technical complexity
- **Incremental zoom**: Each level answers a progressively narrower question
- **Code diagrams are rare**: Most situations stop at Level 3; Level 4 is for critical algorithms

**Design Rationale**: Teams over-document at Level 3/4 and under-document at Level 1. Audience-first selection corrects this by forcing the author to identify the reader before picking a level.

**Key Takeaway**: Always ask "who reads this and what decision do they need to make?" before opening your diagram tool. The answer determines your level.

**Why It Matters**: Over-detailed diagrams for business audiences and under-detailed diagrams for engineers are equal failures. Selecting the right level is the single most impactful C4 skill. A business stakeholder overwhelmed by Kafka topic names disengages; an engineer shown only a single-box system cannot make implementation decisions — matching diagram depth to audience ensures every meeting produces actionable outcomes.

---

## System Context — Core Actors (Examples 6–12)

### Example 6: Minimal System Context — Buyer and Platform

The simplest valid Context diagram shows one person and the system they use. Start here when introducing the platform to a new audience.

```mermaid
graph TD
    accTitle: Example 6: Minimal System Context — Buyer and Platform
    accDescr: Graph with 2 nodes and 1 connections. Nodes: [Person] Buyer Employee Company staff who initiates procurement requests, [Software System] Procurement Platform Manages the full P2P lifecycle from requisition to payment. Connections: [Person] Buyer Employee Company staff who initiates procurement requests to [Software System] Procurement Platform Manages the full P2P lifecycle from requisition to payment (Submits purchase requisitions Tracks order status).
    Buyer["[Person]<br/>Buyer Employee<br/>Company staff who<br/>initiates<br/>procurement requests"]
    Platform["[Software System]<br/>Procurement Platform<br/>Manages the full P2P<br/>lifecycle<br/>from requisition to<br/>payment"]

    Buyer -->|"Submits purchase<br/>requisitions<br/>Tracks order status"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Single actor focus**: One person, one system — maximum clarity
- **Multi-line label on Platform**: Includes a brief responsibility statement
- **Bidirectional intent in one arrow**: "Submits" and "Tracks" are both outbound actions but represented on one label for brevity

**Design Rationale**: A two-element diagram is often the best starting slide for a new stakeholder. Complexity can always be added; once complexity is in, it cannot be removed without creating a second diagram.

**Key Takeaway**: Start with the minimum viable Context diagram. Add actors only when the additional relationship changes a decision or reveals a dependency.

**Why It Matters**: Most system presentations overwhelm stakeholders on the first diagram. Starting minimal builds a shared mental model before adding complexity, reducing misunderstanding in architectural reviews. Progressive disclosure also makes it easier to identify which relationships are in scope for a particular sprint or milestone, preventing premature architecture debates that derail planning sessions.

---

### Example 7: Adding the Supplier Actor

The Supplier is both a destination (receives POs) and a source (sends invoices back). This bidirectional relationship is central to P2P.

```mermaid
graph TD
    accTitle: Example 7: Adding the Supplier Actor
    accDescr: Graph with 3 nodes and 3 connections. Nodes: [Person] Buyer Employee Initiates and approves procurement, [Software System] Procurement Platform Core P2P backend, [Person /External System] Supplier Fulfills orders, sends invoices. Connections: [Person] Buyer Employee Initiates and approves procurement to [Software System] Procurement Platform Core P2P backend (Submits requisitions Approves POs), [Software System] Procurement Platform Core P2P backend to [Person /External System] Supplier Fulfills orders, sends invoices (Issues purchase orders [EDI /SMTP]), [Person /External System] Supplier Fulfills orders, sends invoices to [Software System] Procurement Platform Core P2P backend (Sends invoices [HTTPS portal]).
    Buyer["[Person]<br/>Buyer Employee<br/>Initiates and<br/>approves<br/>procurement"]
    Platform["[Software System]<br/>Procurement Platform<br/>Core P2P backend"]
    Supplier["[Person /External<br/>System]<br/>Supplier<br/>Fulfills orders,<br/>sends invoices"]

    Buyer -->|"Submits<br/>requisitions<br/>Approves POs"| Platform
    Platform -->|"Issues purchase<br/>orders [EDI /SMTP]"| Supplier
    Supplier -->|"Sends invoices<br/>[HTTPS portal]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Supplier dual nature**: Both a human contact and a machine-to-machine integration
- **Two protocols**: EDI for machine delivery, HTTPS portal for human submission
- **Separate arrows for each direction**: Avoids ambiguous bidirectional arrows

**Design Rationale**: Showing EDI vs. HTTPS on separate arrows signals that two different integration implementations are needed, which immediately surfaces an engineering conversation.

**Key Takeaway**: When a relationship has different protocols in each direction, draw separate labeled arrows. Bidirectional arrows hide protocol complexity.

**Why It Matters**: Integration decisions made early in a project (EDI vs. REST vs. portal) have long-term cost and maintenance implications. Surfacing them at Context level brings them into architectural conversations before contracts are signed. Discovering integration format requirements at diagram time costs nothing; discovering them after development is complete can delay go-live by months and require expensive supplier re-onboarding.

---

### Example 8: Adding the Bank External System

The Bank receives payment instructions from the platform. This is a pure system-to-system relationship — no human on the bank side at this level.

```mermaid
graph TD
    accTitle: Example 8: Adding the Bank External System
    accDescr: Graph with 4 nodes and 5 connections. Nodes: [Person] Buyer Employee, [Software System] Procurement Platform, [Person /External System] Supplier, [External System] Bank Processes supplier disbursements. Connections: [Person] Buyer Employee to [Software System] Procurement Platform (Submits and approves), [Software System] Procurement Platform to [Person /External System] Supplier (Issues purchase orders [EDI]), [Person /External System] Supplier to [Software System] Procurement Platform (Sends invoices [HTTPS]), [Software System] Procurement Platform to [External System] Bank Processes supplier disbursements (Sends payment instructions [ISO 20022]), [External System] Bank Processes supplier disbursements to [Software System] Procurement Platform (Confirms disbursement status [webhook]).
    Buyer["[Person]<br/>Buyer Employee"]
    Platform["[Software System]<br/>Procurement Platform"]
    Supplier["[Person /External<br/>System]<br/>Supplier"]
    Bank["[External System]<br/>Bank<br/>Processes supplier<br/>disbursements"]

    Buyer -->|"Submits and<br/>approves"| Platform
    Platform -->|"Issues purchase<br/>orders [EDI]"| Supplier
    Supplier -->|"Sends invoices<br/>[HTTPS]"| Platform
    Platform -->|"Sends payment<br/>instructions [ISO<br/>20022]"| Bank
    Bank -->|"Confirms<br/>disbursement status<br/>[webhook]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **ISO 20022**: Standard financial messaging format — naming it signals compliance requirements
- **Webhook callback**: Bank confirms success asynchronously — important for resilience design
- **Gray for external systems**: Visually separates internal platform from third-party dependencies

**Design Rationale**: Naming ISO 20022 at Context level is deliberate. It tells compliance and finance teams exactly which standard governs the payment integration before any code is written.

**Key Takeaway**: Use protocol and standard names (ISO 20022, EDI 850) as labels when they carry compliance or contractual weight. This surfaces non-functional requirements early.

**Why It Matters**: Financial integrations carry regulatory obligations. A Context diagram that names the payment standard anchors compliance discussions at the correct level of abstraction, preventing expensive late-stage discoveries. Teams that treat the Bank as an invisible dependency often discover compliance requirements — such as PCI-DSS scope or ISO 20022 format mandates — only during pre-production audits, when remediation costs are highest.

---

### Example 9: Adding the Internal ERP / GL

The Internal ERP receives accounting entries after payments are made. This closes the financial loop in P2P.

```mermaid
graph TD
    accTitle: Example 9: Adding the Internal ERP / GL
    accDescr: Graph with 5 nodes and 7 connections. Nodes: [Person] Buyer Employee, [Software System] Procurement Platform, [Person /External System] Supplier, [External System] Bank, [External System] Internal ERP / GL SAP or equivalent — chart of accounts and accounting postings. Connections: [Person] Buyer Employee to [Software System] Procurement Platform (Submits and approves), [Software System] Procurement Platform to [Person /External System] Supplier (Issues POs [EDI]), [Person /External System] Supplier to [Software System] Procurement Platform (Sends invoices), [Software System] Procurement Platform to [External System] Bank (Sends payment instructions [ISO 20022]), [External System] Bank to [Software System] Procurement Platform (Confirms disbursement), [Software System] Procurement Platform to [External System] Internal ERP / GL SAP or equivalent — chart of accounts and accounting postings (Posts accounting journal entries [REST]), [External System] Internal ERP / GL SAP or equivalent — chart of accounts and accounting postings to [Software System] Procurement Platform (Provides chart of accounts and GL codes [REST]).
    Buyer["[Person]<br/>Buyer Employee"]
    Platform["[Software System]<br/>Procurement Platform"]
    Supplier["[Person /External<br/>System]<br/>Supplier"]
    Bank["[External System]<br/>Bank"]
    ERP["[External System]<br/>Internal ERP / GL<br/>SAP or equivalent —<br/>chart of accounts<br/>and<br/>accounting postings"]

    Buyer -->|"Submits and<br/>approves"| Platform
    Platform -->|"Issues POs [EDI]"| Supplier
    Supplier -->|"Sends invoices"| Platform
    Platform -->|"Sends payment<br/>instructions [ISO<br/>20022]"| Bank
    Bank -->|"Confirms<br/>disbursement"| Platform
    Platform -->|"Posts accounting<br/>journal entries<br/>[REST]"| ERP
    ERP -->|"Provides chart of<br/>accounts and GL<br/>codes [REST]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ERP pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **ERP as data provider**: The ERP gives GL codes to the platform; the platform posts entries back
- **Bidirectional REST**: Both directions use REST but serve different purposes
- **Purple for ERP**: Visually distinguishes internal enterprise systems from external third parties

**Design Rationale**: Showing the ERP as both a source (GL codes) and a sink (accounting postings) reveals that P2P cannot function without ERP master data — a dependency that must be addressed in integration planning.

**Key Takeaway**: Show bidirectional ERP relationships explicitly. Hidden data dependencies on ERP master data are among the most common causes of P2P implementation delays.

**Why It Matters**: Finance and IT teams often treat ERP integration as an afterthought. A Context diagram that shows ERP as a dependency from day one forces the conversation onto the project timeline before it becomes a blocker. Omitting ERP from early architecture discussions commonly leads to last-minute schema mismatches between the GL chart of accounts and what the P2P platform expects to post during go-live.

---

### Example 10: Full Level 1 — All Four Actors

This is the complete System Context diagram for the Procurement Platform with all primary actors in one view.

```mermaid
graph TD
    accTitle: Example 10: Full Level 1 — All Four Actors
    accDescr: Graph with 6 nodes and 8 connections. Nodes: [Person] Buyer Employee Submits requisitions, approves POs, [Person] Approving Manager Approves or rejects requisitions, [Software System] Procurement Platform End-to-end P2P backend, [Person /External System] Supplier Receives POs, ships goods, invoices, [External System] Bank Disburses payments, [External System] Internal ERP / GL Chart of accounts, accounting postings. Connections: [Person] Buyer Employee Submits requisitions, approves POs to [Software System] Procurement Platform End-to-end P2P backend (Submits purchase requisitions), [Person] Approving Manager Approves or rejects requisitions to [Software System] Procurement Platform End-to-end P2P backend (Approves or rejects requisitions and POs), [Software System] Procurement Platform End-to-end P2P backend to [Person /External System] Supplier Receives POs, ships goods, invoices (Issues purchase orders [EDI /SMTP]), [Person /External System] Supplier Receives POs, ships goods, invoices to [Software System] Procurement Platform End-to-end P2P backend (Delivers invoices [HTTPS portal]), [Software System] Procurement Platform End-to-end P2P backend to [External System] Bank Disburses payments (Disburses payments [ISO 20022]), [External System] Bank Disburses payments to [Software System] Procurement Platform End-to-end P2P backend (Confirms payment status [webhook]), [Software System] Procurement Platform End-to-end P2P backend to [External System] Internal ERP / GL Chart of accounts, accounting postings (Posts accounting entries [REST]), [External System] Internal ERP / GL Chart of accounts, accounting postings to [Software System] Procurement Platform End-to-end P2P backend (Provides GL codes and chart of accounts [REST]).
    Buyer["[Person]<br/>Buyer Employee<br/>Submits<br/>requisitions,<br/>approves POs"]
    Manager["[Person]<br/>Approving Manager<br/>Approves or rejects<br/>requisitions"]
    Platform["[Software System]<br/>Procurement Platform<br/>End-to-end P2P<br/>backend"]
    Supplier["[Person /External<br/>System]<br/>Supplier<br/>Receives POs,<br/>ships goods,<br/>invoices"]
    Bank["[External System]<br/>Bank<br/>Disburses payments"]
    ERP["[External System]<br/>Internal ERP / GL<br/>Chart of accounts,<br/>accounting postings"]

    Buyer -->|"Submits purchase<br/>requisitions"| Platform
    Manager -->|"Approves or rejects<br/>requisitions and<br/>POs"| Platform
    Platform -->|"Issues purchase<br/>orders [EDI /SMTP]"| Supplier
    Supplier -->|"Delivers invoices<br/>[HTTPS portal]"| Platform
    Platform -->|"Disburses payments<br/>[ISO 20022]"| Bank
    Bank -->|"Confirms payment<br/>status [webhook]"| Platform
    Platform -->|"Posts accounting<br/>entries [REST]"| ERP
    ERP -->|"Provides GL codes<br/>and chart of<br/>accounts [REST]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    class Manager pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ERP pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two person roles**: Buyer Employee (initiator) vs. Approving Manager (approver) — distinct responsibilities
- **Four external touchpoints**: Supplier, Bank, ERP — each with distinct integration pattern
- **Complete P2P loop**: Requisition → PO → Goods → Invoice → Payment → Accounting

**Design Rationale**: This is the "executive slide" — one diagram that answers "what does the platform do and who uses it?" without any internal detail.

**Key Takeaway**: A complete Level 1 diagram fits on one slide and tells the full system story. If it requires more than six actors to be comprehensible, consider splitting into multiple context diagrams.

**Why It Matters**: Executive sign-off on a platform investment requires understanding scope and boundary. This diagram provides that understanding in thirty seconds, enabling faster and more informed decision-making. Showing all actors — Buyer, Approving Manager, Supplier, Bank, and ERP — in a single view surfaces integration complexity and compliance obligations at a level executives can assess without needing technical details from individual engineers.

---

### Example 11: Approval Workflow Actor — The Approving Manager

The Approving Manager is a distinct person from the Buyer. Showing them separately clarifies the approval chain that drives L1/L2/L3 approval levels.

```mermaid
graph TD
    accTitle: Example 11: Approval Workflow Actor — The Approving Manager
    accDescr: Graph with 4 nodes and 5 connections. Nodes: [Person] Buyer Employee Requests goods and services, [Person] Approving Manager L1 approver for POs ≤ $1k L2 for POs ≤ $10k, [Person] CFO /Finance Director L3 approver for POs > $10k, [Software System] Procurement Platform. Connections: [Person] Buyer Employee Requests goods and services to [Software System] Procurement Platform (Submits purchase requisition), [Software System] Procurement Platform to [Person] Approving Manager L1 approver for POs ≤ $1k L2 for POs ≤ $10k (Notifies approver by email), [Person] Approving Manager L1 approver for POs ≤ $1k L2 for POs ≤ $10k to [Software System] Procurement Platform (Approves or rejects [web portal]), [Software System] Procurement Platform to [Person] CFO /Finance Director L3 approver for POs > $10k (Escalates high-value requests), [Person] CFO /Finance Director L3 approver for POs > $10k to [Software System] Procurement Platform (Approves or rejects [web portal]).
    Buyer["[Person]<br/>Buyer Employee<br/>Requests goods and<br/>services"]
    Manager["[Person]<br/>Approving Manager<br/>L1 approver for POs<br/>≤ $1k<br/>L2 for POs ≤ $10k"]
    CFO["[Person]<br/>CFO /Finance<br/>Director<br/>L3 approver for POs<br/>> $10k"]
    Platform["[Software System]<br/>Procurement Platform"]

    Buyer -->|"Submits purchase<br/>requisition"| Platform
    Platform -->|"Notifies approver<br/>by email"| Manager
    Manager -->|"Approves or rejects<br/>[web portal]"| Platform
    Platform -->|"Escalates<br/>high-value requests"| CFO
    CFO -->|"Approves or rejects<br/>[web portal]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    class Manager pal-029E73
    class CFO pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Three approval tiers**: L1 (Manager), L2 (Manager), L3 (CFO) — dollar thresholds shown in labels
- **Email notification**: Platform actively routes approval requests — not a passive inbox
- **Web portal approval**: Both Manager and CFO use the same portal channel

**Design Rationale**: Approval routing levels (L1/L2/L3) are a business requirement, not a technical one. Showing them in the Context diagram keeps finance stakeholders engaged and prevents developers from hard-coding approval logic.

**Key Takeaway**: When approval chains have business-defined tiers, model each tier as a distinct person in the Context diagram. This makes the routing logic visible to business stakeholders who own the rules.

**Why It Matters**: Approval threshold rules change frequently as organizations grow. Surfacing them at Context level keeps business owners accountable for defining and maintaining them, rather than burying the rules in code. When approval actors are invisible in architecture diagrams, threshold changes require both code deployments and undocumented process updates, increasing the risk that a limit change is applied inconsistently across environments.

---

### Example 12: Supplier as External System — EDI Integration

When the supplier is a large enterprise with machine-to-machine EDI capability, model them as an External System rather than a Person.

```mermaid
graph TD
    accTitle: Example 12: Supplier as External System — EDI Integration
    accDescr: Graph with 3 nodes and 5 connections. Nodes: [Software System] Procurement Platform, [Person /External System] Small Supplier Uses web portal (human interaction), [External System] Large Supplier ERP Machine-to-machine EDI X12 integration. Connections: [Software System] Procurement Platform to [Person /External System] Small Supplier Uses web portal (human interaction) (Sends PO [SMTP / portal]), [Person /External System] Small Supplier Uses web portal (human interaction) to [Software System] Procurement Platform (Sends invoice [web upload]), [Software System] Procurement Platform to [External System] Large Supplier ERP Machine-to-machine EDI X12 integration (Sends PO [EDI 850 transaction set]), [External System] Large Supplier ERP Machine-to-machine EDI X12 integration to [Software System] Procurement Platform (Sends invoice [EDI 810 transaction set]), [External System] Large Supplier ERP Machine-to-machine EDI X12 integration to [Software System] Procurement Platform (Sends ASN /shipping notice [EDI 856]).
    Platform["[Software System]<br/>Procurement Platform"]
    SupplierPortal["[Person /External<br/>System]<br/>Small Supplier<br/>Uses web portal<br/>(human interaction)"]
    SupplierEDI["[External System]<br/>Large Supplier ERP<br/>Machine-to-machine<br/>EDI X12 integration"]

    Platform -->|"Sends PO [SMTP /<br/>portal]"| SupplierPortal
    SupplierPortal -->|"Sends invoice [web<br/>upload]"| Platform
    Platform -->|"Sends PO [EDI 850<br/>transaction set]"| SupplierEDI
    SupplierEDI -->|"Sends invoice [EDI<br/>810 transaction<br/>set]"| Platform
    SupplierEDI -->|"Sends ASN /shipping<br/>notice [EDI 856]"| Platform

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class SupplierPortal pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SupplierEDI pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two supplier archetypes**: Small suppliers use a web portal; large suppliers use EDI
- **EDI transaction set numbers**: 850 (PO), 810 (Invoice), 856 (ASN) — precise and contractual
- **ASN (Advance Ship Notice)**: EDI-capable suppliers send shipping notices proactively

**Design Rationale**: Platform must support both integration patterns simultaneously. Showing both archetypes in one diagram surfaces the need for two separate adapter implementations early in design.

**Key Takeaway**: Model different integration patterns for the same logical actor as separate elements when they require different implementations. Conflating them hides adapter complexity.

**Why It Matters**: EDI integration with large suppliers is contractually mandated in many industries. Discovering this requirement at the Context level prevents the late-stage realization that a portal-only implementation cannot onboard key suppliers. Treating a supplier as a simple REST endpoint when they require ANSI X12 or EDIFACT format is a common and expensive architecture mistake that only surfaces during supplier onboarding.

---

## System Context — External System Integrations (Examples 13–20)

### Example 13: Bank Integration — Payment Disbursement

Modeling the bank relationship precisely prevents incorrect assumptions about synchronous vs. asynchronous payment confirmation.

```mermaid
graph TD
    accTitle: Example 13: Bank Integration — Payment Disbursement
    accDescr: Graph with 3 nodes and 3 connections. Nodes: [Software System] Procurement Platform, [External System] Bank Processes outbound payment runs, [Person /External System] Supplier Receives payment to bank account. Connections: [Software System] Procurement Platform to [External System] Bank Processes outbound payment runs (Sends payment file [ISO 20022 pain.001]), [External System] Bank Processes outbound payment runs to [Software System] Procurement Platform (Sends payment status report [ISO 20022 pain.002]), [External System] Bank Processes outbound payment runs to [Person /External System] Supplier Receives payment to bank account (Disburses funds to supplier account).
    Platform["[Software System]<br/>Procurement Platform"]
    Bank["[External System]<br/>Bank<br/>Processes outbound<br/>payment runs"]
    Supplier["[Person /External<br/>System]<br/>Supplier<br/>Receives payment<br/>to bank account"]

    Platform -->|"Sends payment file<br/>[ISO 20022<br/>pain.001]"| Bank
    Bank -->|"Sends payment<br/>status report [ISO<br/>20022 pain.002]"| Platform
    Bank -->|"Disburses funds to<br/>supplier account"| Supplier

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **pain.001 / pain.002**: ISO 20022 message types for payment initiation and status
- **Asynchronous confirmation**: Bank sends status back as a separate message, not as a synchronous response
- **Indirect to supplier**: The platform never pays the supplier directly — the bank handles fund transfer

**Design Rationale**: Naming pain.001 and pain.002 at this level signals to architects that the payment subsystem must handle asynchronous status reconciliation, not a simple HTTP response check.

**Key Takeaway**: Use standard message type identifiers (pain.001, EDI 810) as labels when they carry compliance or contractual weight. This prevents implementation teams from choosing incompatible formats.

**Why It Matters**: Payment file format is often mandated by the bank. Discovering a pain.001 requirement after building a custom CSV-based integration forces a complete rewrite — a costly lesson that a labeled Context diagram prevents. Naming the Bank explicitly in the Context diagram also triggers the security review needed to classify payment infrastructure under PCI-DSS scope before the team begins implementation.

---

### Example 14: ERP Integration — Chart of Accounts

The ERP is not just a data sink. It provides master data (GL codes) that the platform needs before it can post entries.

```mermaid
graph TD
    accTitle: Example 14: ERP Integration — Chart of Accounts
    accDescr: Graph with 2 nodes and 4 connections. Nodes: [Software System] Procurement Platform, [External System] Internal ERP / GL SAP or equivalent. Connections: [External System] Internal ERP / GL SAP or equivalent to [Software System] Procurement Platform (Provides GL codes on demand [REST]), [External System] Internal ERP / GL SAP or equivalent to [Software System] Procurement Platform (Provides cost center master data [REST]), [Software System] Procurement Platform to [External System] Internal ERP / GL SAP or equivalent (Posts journal entries on payment [REST]), [Software System] Procurement Platform to [External System] Internal ERP / GL SAP or equivalent (Posts accrual entries on PO approval [REST]).
    Platform["[Software System]<br/>Procurement Platform"]
    ERP["[External System]<br/>Internal ERP / GL<br/>SAP or equivalent"]

    ERP -->|"Provides GL codes<br/>on demand [REST]"| Platform
    ERP -->|"Provides cost<br/>center master data<br/>[REST]"| Platform
    Platform -->|"Posts journal<br/>entries on payment<br/>[REST]"| ERP
    Platform -->|"Posts accrual<br/>entries on PO<br/>approval [REST]"| ERP

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ERP pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two ERP data feeds**: GL codes and cost center data — separate calls with different caching needs
- **Two posting events**: Journal entries on payment AND accrual entries on PO approval
- **REST in both directions**: Same protocol, but the data shape and business rules differ per call

**Design Rationale**: Many P2P implementations post only on payment and skip accrual entries. Showing accrual posting at Context level forces finance stakeholders to confirm or deny this requirement before development begins.

**Key Takeaway**: Show all ERP integration points including read dependencies. Hidden master-data dependencies on ERP are the most common P2P integration blocker.

**Why It Matters**: Accrual accounting is a generally accepted accounting principle (GAAP) requirement in many organizations. Surfacing it at Context level brings the finance team into the design conversation before the posting architecture is locked. A Context diagram that shows the chart-of-accounts dependency ensures that finance architects review the GL integration design before development, not during audit remediation when changes are far more expensive.

---

### Example 15: Supplier Notification System

The platform must notify suppliers of PO status changes. This can flow through email, EDI, or a supplier portal — the choice belongs at Context level.

```mermaid
graph TD
    accTitle: Example 15: Supplier Notification System
    accDescr: Graph with 4 nodes and 4 connections. Nodes: [Software System] Procurement Platform, [External System] Email Service SMTP relay (SendGrid / SES), [External System] Supplier Self-Service Portal Web portal for PO tracking, [Person /External System] Supplier. Connections: [Software System] Procurement Platform to [External System] Email Service SMTP relay (SendGrid / SES) (Sends PO notification email [SMTP]), [External System] Email Service SMTP relay (SendGrid / SES) to [Person /External System] Supplier (Delivers to supplier inbox), [Software System] Procurement Platform to [External System] Supplier Self-Service Portal Web portal for PO tracking (Updates PO status in portal [REST]), [Person /External System] Supplier to [External System] Supplier Self-Service Portal Web portal for PO tracking (Checks order status [HTTPS browser]).
    Platform["[Software System]<br/>Procurement Platform"]
    EmailSvc["[External System]<br/>Email Service<br/>SMTP relay<br/>(SendGrid / SES)"]
    SupplierPortal["[External System]<br/>Supplier<br/>Self-Service Portal<br/>Web portal for PO<br/>tracking"]
    Supplier["[Person /External<br/>System]<br/>Supplier"]

    Platform -->|"Sends PO<br/>notification email<br/>[SMTP]"| EmailSvc
    EmailSvc -->|"Delivers to<br/>supplier inbox"| Supplier
    Platform -->|"Updates PO status<br/>in portal [REST]"| SupplierPortal
    Supplier -->|"Checks order status<br/>[HTTPS browser]"| SupplierPortal

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class EmailSvc pal-808080
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class SupplierPortal pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Dual notification channels**: Email for push notification, portal for pull status check
- **External email relay**: Platform does not send SMTP directly — uses a managed relay
- **Supplier portal as separate system**: Could be built in-house or third-party SaaS

**Design Rationale**: Separating email relay from portal access shows that two different integration adapters are required. If both are lumped into "notify supplier," the distinct implementation needs are invisible.

**Key Takeaway**: When a single business action (notify supplier) involves multiple external systems, draw each external system as a separate node. Lumping them into one box hides adapter complexity.

**Why It Matters**: Supplier experience directly affects supply chain reliability. Platform teams that treat notification as a single checkbox find supplier complaints about missed POs are often a system integration problem, not a human one. A Context diagram that makes the Notification System visible ensures that supplier communication SLAs are agreed upon and tested before launch, not added as afterthoughts when delivery delays surface.

---

### Example 16: Secret Manager Integration

The platform must retrieve database credentials and API keys at runtime without storing them in configuration files.

```mermaid
graph TD
    accTitle: Example 16: Secret Manager Integration
    accDescr: Graph with 3 nodes and 3 connections. Nodes: [Software System] Procurement Platform, [External System] Secret Manager AWS Secrets Manager or HashiCorp Vault, [External System] PostgreSQL Database Primary write store. Connections: [Software System] Procurement Platform to [External System] Secret Manager AWS Secrets Manager or HashiCorp Vault (Requests DB credentials at startup [HTTPS]), [External System] Secret Manager AWS Secrets Manager or HashiCorp Vault to [Software System] Procurement Platform (Returns rotated credentials [HTTPS]), [Software System] Procurement Platform to [External System] PostgreSQL Database Primary write store (Connects with retrieved credentials [TCP/5432]).
    Platform["[Software System]<br/>Procurement Platform"]
    SecretMgr["[External System]<br/>Secret Manager<br/>AWS Secrets Manager<br/>or HashiCorp Vault"]
    DB["[External System]<br/>PostgreSQL Database<br/>Primary write store"]

    Platform -->|"Requests DB<br/>credentials at<br/>startup [HTTPS]"| SecretMgr
    SecretMgr -->|"Returns rotated<br/>credentials [HTTPS]"| Platform
    Platform -->|"Connects with<br/>retrieved<br/>credentials<br/>[TCP/5432]"| DB

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class SecretMgr pal-808080
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class DB pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **No hardcoded credentials**: Platform retrieves credentials at runtime, not deploy time
- **Credential rotation**: Secret Manager handles rotation; platform re-fetches on rotation event
- **TCP/5432**: PostgreSQL native protocol — distinct from the HTTPS used for secret retrieval

**Design Rationale**: Showing Secret Manager at Context level makes credential management a first-class architectural concern, not a deployment afterthought.

**Key Takeaway**: Include secret management infrastructure in Context diagrams. Treating credentials as a deploy-time concern rather than a runtime integration produces systems that fail silently when credentials rotate.

**Why It Matters**: Credential leaks are the most common cause of cloud data breaches. Architectural diagrams that normalize secret management at the system boundary set the security standard for the entire implementation team. A Context diagram that names Secret Manager as an explicit dependency forces the security team to review secret rotation policies and access control boundaries during the design phase rather than after a credential exposure incident.

---

### Example 17: Murabaha Bank — Optional Sharia Financing

For organizations operating under Sharia-compliant procurement rules, a Murabaha Bank finances asset purchases under a cost-plus markup contract.

```mermaid
graph TD
    accTitle: Example 17: Murabaha Bank — Optional Sharia Financing
    accDescr: Graph with 4 nodes and 5 connections. Nodes: [Software System] Procurement Platform, [External System] Bank Standard disbursement, [External System] Murabaha Bank Sharia-compliant Islamic finance institution, [Person /External System] Supplier. Connections: [Software System] Procurement Platform to [External System] Murabaha Bank Sharia-compliant Islamic finance institution (Requests murabaha financing for PO [REST]), [External System] Murabaha Bank Sharia-compliant Islamic finance institution to [Person /External System] Supplier (Acquires asset from supplier on behalf of buyer [wire]), [External System] Murabaha Bank Sharia-compliant Islamic finance institution to [Software System] Procurement Platform (Resells asset to buyer at cost-plus markup [contract]), [Software System] Procurement Platform to [External System] Murabaha Bank Sharia-compliant Islamic finance institution (Schedules installment payments [ISO 20022]), [Software System] Procurement Platform to [External System] Bank Standard disbursement (Sends standard payments [ISO 20022]).
    Platform["[Software System]<br/>Procurement Platform"]
    Bank["[External System]<br/>Bank<br/>Standard<br/>disbursement"]
    MurabahaBank["[External System]<br/>Murabaha Bank<br/>Sharia-compliant<br/>Islamic finance<br/>institution"]
    Supplier["[Person /External<br/>System]<br/>Supplier"]

    Platform -->|"Requests murabaha<br/>financing for PO<br/>[REST]"| MurabahaBank
    MurabahaBank -->|"Acquires asset from<br/>supplier on behalf<br/>of buyer [wire]"| Supplier
    MurabahaBank -->|"Resells asset to<br/>buyer at cost-plus<br/>markup [contract]"| Platform
    Platform -->|"Schedules<br/>installment payments<br/>[ISO 20022]"| MurabahaBank
    Platform -->|"Sends standard<br/>payments [ISO<br/>20022]"| Bank

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class MurabahaBank pal-CC78BC
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Murabaha flow**: Bank buys asset from supplier, then resells to buyer at markup — two transactions
- **Installment payments**: Buyer pays the bank in installments, not a lump sum to the supplier
- **Optional context**: This financing path coexists with standard payment — not all POs use murabaha

**Design Rationale**: Murabaha financing changes the payment flow fundamentally: the bank, not the platform, pays the supplier. Showing this at Context level makes the three-party contract visible to legal and compliance stakeholders.

**Key Takeaway**: Model optional financing paths as separate external system relationships. Murabaha financing is architecturally distinct from standard bank disbursement and must not be conflated.

**Why It Matters**: Islamic finance compliance is a regulatory requirement in many markets. Surfacing the Murabaha Bank as a distinct external system anchors legal, finance, and engineering conversations in the correct contractual structure from the first design session. Retrofitting profit-rate accounting and Sharia audit trails into a platform designed for conventional lending is a multi-sprint rework that early architecture visibility prevents entirely.

---

### Example 18: System Context with Compliance and Audit

Regulated industries require audit trails accessible to external auditors. This example shows the compliance integration.

```mermaid
graph TD
    accTitle: Example 18: System Context with Compliance and Audit
    accDescr: Graph with 4 nodes and 3 connections. Nodes: [Software System] Procurement Platform, [External System] Immutable Audit Log Append-only event store (AWS S3 + Athena or equivalent), [Person] External Auditor Regulatory or internal audit, [External System] Regulatory Authority Receives compliance reports. Connections: [Software System] Procurement Platform to [External System] Immutable Audit Log Append-only event store (AWS S3 + Athena or equivalent) (Streams all state-change events [async]), [Person] External Auditor Regulatory or internal audit to [External System] Immutable Audit Log Append-only event store (AWS S3 + Athena or equivalent) (Queries audit trail [read-only REST]), [Software System] Procurement Platform to [External System] Regulatory Authority Receives compliance reports (Submits periodic compliance reports [SFTP]).
    Platform["[Software System]<br/>Procurement Platform"]
    AuditLog["[External System]<br/>Immutable Audit Log<br/>Append-only event<br/>store<br/>(AWS S3 + Athena or<br/>equivalent)"]
    Auditor["[Person]<br/>External Auditor<br/>Regulatory or<br/>internal audit"]
    Regulator["[External System]<br/>Regulatory Authority<br/>Receives compliance<br/>reports"]

    Platform -->|"Streams all<br/>state-change events<br/>[async]"| AuditLog
    Auditor -->|"Queries audit trail<br/>[read-only REST]"| AuditLog
    Platform -->|"Submits periodic<br/>compliance reports<br/>[SFTP]"| Regulator

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class AuditLog pal-CA9161
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Auditor pal-029E73
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Regulator pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Immutable audit log**: Separate from the operational database — cannot be altered
- **Auditor read-only**: Auditor queries the log, never the live system
- **SFTP compliance reports**: Regulatory submissions use SFTP, not REST

**Design Rationale**: Compliance requirements mandate that audit evidence is tamper-evident and separate from operational data. Showing the immutable log as an external system signals this separation to architects.

**Key Takeaway**: Model compliance and audit infrastructure as distinct external systems, not as features of the primary database. Tamper-evident audit trails require architectural separation, not just a log table.

**Why It Matters**: Regulatory audits that discover audit trails co-mingled with operational data can result in findings that invalidate the entire audit. Architectural separation is not optional in regulated procurement environments. Regulatory frameworks such as SOX and ISO 27001 require immutable audit logs that are accessible independently of the operational system, making early architectural separation a compliance prerequisite rather than a design preference.

---

### Example 19: Notification Service — Multiple Channels

A dedicated notification service decouples the platform from channel-specific delivery logic.

```mermaid
graph TD
    accTitle: Example 19: Notification Service — Multiple Channels
    accDescr: Graph with 6 nodes and 6 connections. Nodes: [Software System] Procurement Platform, [External System] Notification Service Multi-channel delivery (internal or SaaS), [External System] Email Provider SendGrid / SES, [External System] SMS Provider Twilio, [Person] Buyer Employee, [Person] Approving Manager. Connections: [Software System] Procurement Platform to [External System] Notification Service Multi-channel delivery (internal or SaaS) (Publishes notification events [async queue]), [External System] Notification Service Multi-channel delivery (internal or SaaS) to [External System] Email Provider SendGrid / SES (Sends approval request email), [External System] Notification Service Multi-channel delivery (internal or SaaS) to [External System] SMS Provider Twilio (Sends urgent SMS for high-value POs), [External System] Email Provider SendGrid / SES to [Person] Approving Manager (Delivers to manager inbox), [External System] SMS Provider Twilio to [Person] Approving Manager (Sends text to manager mobile), [External System] Email Provider SendGrid / SES to [Person] Buyer Employee (Delivers status update).
    Platform["[Software System]<br/>Procurement Platform"]
    NotifSvc["[External System]<br/>Notification Service<br/>Multi-channel<br/>delivery<br/>(internal or SaaS)"]
    Email["[External System]<br/>Email Provider<br/>SendGrid / SES"]
    SMS["[External System]<br/>SMS Provider<br/>Twilio"]
    Buyer["[Person]<br/>Buyer Employee"]
    Manager["[Person]<br/>Approving Manager"]

    Platform -->|"Publishes<br/>notification events<br/>[async queue]"| NotifSvc
    NotifSvc -->|"Sends approval<br/>request email"| Email
    NotifSvc -->|"Sends urgent SMS<br/>for high-value POs"| SMS
    Email -->|"Delivers to manager<br/>inbox"| Manager
    SMS -->|"Sends text to<br/>manager mobile"| Manager
    Email -->|"Delivers status<br/>update"| Buyer

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class NotifSvc pal-DE8F05
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Email pal-808080
    class SMS pal-808080
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    class Manager pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Notification Service mediator**: Platform publishes one event; service routes to correct channel
- **Async queue**: Platform does not wait for delivery confirmation — fire and forget
- **Channel selection logic**: Urgent high-value POs escalate to SMS; routine POs use email

**Design Rationale**: Publishing to a notification service rather than calling email/SMS directly means the platform is not impacted if a delivery channel goes down. Decoupling is visible at Context level.

**Key Takeaway**: Introduce a notification mediator when multi-channel delivery is required. Letting the platform call each channel directly creates tight coupling that makes channel changes expensive.

**Why It Matters**: Notification channel preferences change. SMS costs, email deliverability issues, and push notification adoption each affect channel strategy. Decoupling through a notification service makes channel changes a configuration concern, not a code change. This abstraction also enables suppliers and buyers to set their own preferred channels without requiring platform re-deployment or cross-team coordination for each channel addition.

---

### Example 20: Observability and Monitoring Integration

The platform must emit telemetry to an external observability stack for production monitoring.

```mermaid
graph TD
    accTitle: Example 20: Observability and Monitoring Integration
    accDescr: Graph with 5 nodes and 6 connections. Nodes: [Software System] Procurement Platform, [External System] OpenTelemetry Collector Receives traces and metrics, [External System] Grafana / Prometheus Metrics dashboards, [External System] Jaeger / Tempo Distributed tracing, [Person] On-Call Engineer Monitors production health. Connections: [Software System] Procurement Platform to [External System] OpenTelemetry Collector Receives traces and metrics (Emits traces [OTLP/gRPC]), [Software System] Procurement Platform to [External System] OpenTelemetry Collector Receives traces and metrics (Emits metrics [OTLP/gRPC]), [External System] OpenTelemetry Collector Receives traces and metrics to [External System] Grafana / Prometheus Metrics dashboards (Forwards metrics), [External System] OpenTelemetry Collector Receives traces and metrics to [External System] Jaeger / Tempo Distributed tracing (Forwards traces), [External System] Grafana / Prometheus Metrics dashboards to [Person] On-Call Engineer Monitors production health (Alerts on threshold breach), [External System] Jaeger / Tempo Distributed tracing to [Person] On-Call Engineer Monitors production health (Shows slow traces on demand).
    Platform["[Software System]<br/>Procurement Platform"]
    OtelCollector["[External System]<br/>OpenTelemetry<br/>Collector<br/>Receives traces and<br/>metrics"]
    Grafana["[External System]<br/>Grafana / Prometheus<br/>Metrics dashboards"]
    Jaeger["[External System]<br/>Jaeger / Tempo<br/>Distributed tracing"]
    OnCall["[Person]<br/>On-Call Engineer<br/>Monitors production<br/>health"]

    Platform -->|"Emits traces<br/>[OTLP/gRPC]"| OtelCollector
    Platform -->|"Emits metrics<br/>[OTLP/gRPC]"| OtelCollector
    OtelCollector -->|"Forwards metrics"| Grafana
    OtelCollector -->|"Forwards traces"| Jaeger
    Grafana -->|"Alerts on threshold<br/>breach"| OnCall
    Jaeger -->|"Shows slow traces<br/>on demand"| OnCall

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class OtelCollector pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Grafana pal-CA9161
    class Jaeger pal-CA9161
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class OnCall pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **OpenTelemetry Collector**: Vendor-neutral collector receives all telemetry; backends are swappable
- **OTLP/gRPC**: Standard telemetry protocol — not vendor-specific
- **On-call engineer**: The human consumer of observability data

**Design Rationale**: Using OpenTelemetry Collector as the intermediary decouples the platform from specific observability vendors. Swapping Jaeger for Tempo or Prometheus for Datadog requires only collector config changes.

**Key Takeaway**: Model observability infrastructure in Context diagrams. Teams that treat monitoring as a post-launch concern regularly deploy platforms that are blind in production.

**Why It Matters**: P2P platforms handle financial transactions. Production incidents with no telemetry result in extended outages and financial data integrity questions. Observability is an architectural requirement, not an operational nicety. A Context diagram that makes Observability a named external system ensures monitoring budgets, SLA definitions, and alerting thresholds are agreed upon during architecture review rather than negotiated reactively during an incident.

---

## System Context — Integration Patterns (Examples 21–30)

### Example 21: Synchronous vs. Asynchronous Relationships

Some relationships in the system are synchronous (blocking), others asynchronous (event-driven). C4 Context diagrams can show this distinction.

```mermaid
graph TD
    accTitle: Example 21: Synchronous vs. Asynchronous Relationships
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Software System] Procurement Platform, [External System] Internal ERP / GL, [External System] Bank, [External System] Event Bus Kafka cluster, [External System] Supplier Notification Service. Connections: [Software System] Procurement Platform to [External System] Internal ERP / GL (Reads GL codes synchronously [REST, blocking]), [Software System] Procurement Platform to [External System] Bank (Submits payment file synchronously [ISO 20022]), [Software System] Procurement Platform to [External System] Event Bus Kafka cluster (Publishes domain events asynchronously [Kafka]), [External System] Event Bus Kafka cluster to [External System] Supplier Notification Service (Delivers events asynchronously).
    Platform["[Software System]<br/>Procurement Platform"]
    ERP["[External System]<br/>Internal ERP / GL"]
    Bank["[External System]<br/>Bank"]
    EventBus["[External System]<br/>Event Bus<br/>Kafka cluster"]
    SupplierSvc["[External System]<br/>Supplier<br/>Notification<br/>Service"]

    Platform -->|"Reads GL codes<br/>synchronously [REST,<br/>blocking]"| ERP
    Platform -->|"Submits payment<br/>file synchronously<br/>[ISO 20022]"| Bank
    Platform -->|"Publishes domain<br/>events<br/>asynchronously<br/>[Kafka]"| EventBus
    EventBus -->|"Delivers events<br/>asynchronously"| SupplierSvc

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ERP pal-CC78BC
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class EventBus pal-DE8F05
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class SupplierSvc pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Blocking label**: `[REST, blocking]` signals that ERP latency directly impacts P2P response times
- **Asynchronous label**: `[Kafka]` signals eventual consistency; the platform does not wait for delivery
- **Event Bus as mediator**: Kafka sits between platform and downstream consumers

**Design Rationale**: Distinguishing synchronous from asynchronous relationships at Context level surfaces latency risk. If ERP is slow, blocking REST calls will make the platform slow too — a performance requirement that must be addressed in design.

**Key Takeaway**: Label relationship synchronicity in Context diagrams. Synchronous dependencies create cascading latency risk; asynchronous dependencies create eventual consistency risk. Both risks must be acknowledged.

**Why It Matters**: P2P platforms often fail performance SLAs because synchronous ERP dependencies were not visible at design time. Making synchronicity explicit at Context level forces the team to plan for circuit breakers or caching. Identifying that ERP chart-of-accounts calls are synchronous allows architects to implement response caching before those calls become the bottleneck under peak purchase order volume in production.

---

### Example 22: Approval Workflow — Three Levels Shown

The approval chain for purchase orders spans three authorization levels. Modeling them at Context shows the business rule before it becomes code.

```mermaid
graph TD
    accTitle: Example 22: Approval Workflow — Three Levels Shown
    accDescr: Graph with 5 nodes and 7 connections. Nodes: [Person] Buyer Employee Requisition initiator, [Person] Line Manager L1: POs ≤ $1,000, [Person] Department Head L2: POs ≤ $10,000, [Person] CFO L3: POs > $10,000, [Software System] Procurement Platform. Connections: [Person] Buyer Employee Requisition initiator to [Software System] Procurement Platform (Submits requisition), [Software System] Procurement Platform to [Person] Line Manager L1: POs ≤ $1,000 (Routes to line manager for L1 approval), [Person] Line Manager L1: POs ≤ $1,000 to [Software System] Procurement Platform (Approves or rejects [portal]), [Software System] Procurement Platform to [Person] Department Head L2: POs ≤ $10,000 (Escalates to department head for L2), [Person] Department Head L2: POs ≤ $10,000 to [Software System] Procurement Platform (Approves or rejects [portal]), [Software System] Procurement Platform to [Person] CFO L3: POs > $10,000 (Escalates to CFO for L3), [Person] CFO L3: POs > $10,000 to [Software System] Procurement Platform (Approves or rejects [portal]).
    Buyer["[Person]<br/>Buyer Employee<br/>Requisition<br/>initiator"]
    L1Manager["[Person]<br/>Line Manager<br/>L1: POs ≤ $1,000"]
    L2Manager["[Person]<br/>Department Head<br/>L2: POs ≤ $10,000"]
    L3Finance["[Person]<br/>CFO<br/>L3: POs > $10,000"]
    Platform["[Software System]<br/>Procurement Platform"]

    Buyer -->|"Submits<br/>requisition"| Platform
    Platform -->|"Routes to line<br/>manager for L1<br/>approval"| L1Manager
    L1Manager -->|"Approves or rejects<br/>[portal]"| Platform
    Platform -->|"Escalates to<br/>department head for<br/>L2"| L2Manager
    L2Manager -->|"Approves or rejects<br/>[portal]"| Platform
    Platform -->|"Escalates to CFO<br/>for L3"| L3Finance
    L3Finance -->|"Approves or rejects<br/>[portal]"| Platform

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    class L1Manager pal-029E73
    class L2Manager pal-029E73
    class L3Finance pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Three approval persons**: Each with distinct dollar threshold — drives dynamic routing logic
- **Platform routes actively**: Platform does not just notify; it routes to the correct approver
- **Consistent portal channel**: All approvers use the same web portal regardless of level

**Design Rationale**: Showing three approval persons forces business stakeholders to confirm the routing rules. If L2 is actually a committee rather than a single person, this diagram reveals that gap immediately.

**Key Takeaway**: Model each approval role as a distinct person with threshold labels. Collapsing all approvers into one generic "Manager" actor hides routing logic that the platform must implement.

**Why It Matters**: Approval routing errors are a primary audit finding in P2P systems. Incorrect routing allows purchases above an employee's authority threshold to be approved without appropriate oversight — a financial controls failure. A Context diagram that makes approval tiers visible ensures that finance and compliance stakeholders validate the routing logic during architecture review before it is encoded in the system and before any purchases are processed.

---

### Example 23: Goods Receipt — Warehouse Actor

Goods receipt introduces a new person: the Warehouse Operator who physically verifies delivery and enters receipt data.

```mermaid
graph TD
    accTitle: Example 23: Goods Receipt — Warehouse Actor
    accDescr: Graph with 4 nodes and 5 connections. Nodes: [Software System] Procurement Platform, [Person] Warehouse Operator Physically receives goods, enters GRN data, [Person /External System] Supplier Delivers goods to warehouse, [Person] Buyer Employee. Connections: [Person] Buyer Employee to [Software System] Procurement Platform (Submits purchase requisition), [Software System] Procurement Platform to [Person /External System] Supplier Delivers goods to warehouse (Issues PO to supplier), [Person /External System] Supplier Delivers goods to warehouse to [Person] Warehouse Operator Physically receives goods, enters GRN data (Physically delivers goods to warehouse), [Person] Warehouse Operator Physically receives goods, enters GRN data to [Software System] Procurement Platform (Enters Goods Receipt Note [web portal]), [Software System] Procurement Platform to [Person] Buyer Employee (Notifies buyer: goods received).
    Platform["[Software System]<br/>Procurement Platform"]
    Warehouse["[Person]<br/>Warehouse Operator<br/>Physically receives<br/>goods,<br/>enters GRN data"]
    Supplier["[Person /External<br/>System]<br/>Supplier<br/>Delivers goods to<br/>warehouse"]
    Buyer["[Person]<br/>Buyer Employee"]

    Buyer -->|"Submits purchase<br/>requisition"| Platform
    Platform -->|"Issues PO to<br/>supplier"| Supplier
    Supplier -->|"Physically delivers<br/>goods to warehouse"| Warehouse
    Warehouse -->|"Enters Goods<br/>Receipt Note [web<br/>portal]"| Platform
    Platform -->|"Notifies buyer:<br/>goods received"| Buyer

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Warehouse pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    class Buyer pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Warehouse Operator**: A new person role distinct from Buyer — performs physical verification
- **Physical delivery outside system**: The actual goods movement is not mediated by the platform
- **GRN as platform event**: Only the receipt acknowledgment enters the system digitally

**Design Rationale**: Showing the physical delivery as an arrow from Supplier to Warehouse (not to Platform) is architecturally accurate. The platform cannot track physical goods; it records the human confirmation.

**Key Takeaway**: Model the boundary between physical and digital accurately. Physical events (goods delivery) happen outside the system; the platform records only the human-entered acknowledgment.

**Why It Matters**: Three-way matching (PO ↔ GRN ↔ Invoice) is the cornerstone of P2P fraud prevention. The matching cannot succeed if goods receipt data is incomplete. Showing the Warehouse Operator as a first-class actor signals the data quality dependency to operations teams. Naming this actor in the Context diagram also prompts the decision to build a GRN portal or mobile interface before development begins, not after matching failures surface in production.

---

### Example 24: Invoice Registration — Finance Clerk Actor

Invoice processing introduces the Finance Clerk who registers supplier invoices into the platform for three-way matching.

```mermaid
graph TD
    accTitle: Example 24: Invoice Registration — Finance Clerk Actor
    accDescr: Graph with 4 nodes and 6 connections. Nodes: [Software System] Procurement Platform, [Person /External System] Supplier, [Person] Finance Clerk Registers invoices, resolves matching exceptions, [Person] Buyer Employee. Connections: [Person /External System] Supplier to [Person] Finance Clerk Registers invoices, resolves matching exceptions (Sends paper or email invoice), [Person] Finance Clerk Registers invoices, resolves matching exceptions to [Software System] Procurement Platform (Registers invoice in platform [web portal]), [Software System] Procurement Platform to [Software System] Procurement Platform (Runs three-way match: PO vs GRN vs Invoice [auto]), [Software System] Procurement Platform to [Person] Finance Clerk Registers invoices, resolves matching exceptions (Alerts clerk on matching exception), [Person] Finance Clerk Registers invoices, resolves matching exceptions to [Software System] Procurement Platform (Resolves dispute [web portal]), [Software System] Procurement Platform to [Person] Buyer Employee (Notifies buyer of matched invoice).
    Platform["[Software System]<br/>Procurement Platform"]
    Supplier["[Person /External<br/>System]<br/>Supplier"]
    FinanceClerk["[Person]<br/>Finance Clerk<br/>Registers invoices,<br/>resolves matching<br/>exceptions"]
    Buyer["[Person]<br/>Buyer Employee"]

    Supplier -->|"Sends paper or<br/>email invoice"| FinanceClerk
    FinanceClerk -->|"Registers invoice<br/>in platform [web<br/>portal]"| Platform
    Platform -->|"Runs three-way<br/>match: PO vs GRN vs<br/>Invoice [auto]"| Platform
    Platform -->|"Alerts clerk on<br/>matching exception"| FinanceClerk
    FinanceClerk -->|"Resolves dispute<br/>[web portal]"| Platform
    Platform -->|"Notifies buyer of<br/>matched invoice"| Buyer

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class FinanceClerk pal-029E73
    class Buyer pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Finance Clerk**: Manual entry role for invoice registration — a common process gap in P2P
- **Auto three-way match**: Platform performs matching automatically after registration
- **Exception loop**: Clerk receives alert on exception and resolves it — a process loop in the diagram

**Design Rationale**: Showing the Finance Clerk as a distinct actor makes the manual invoice entry step visible. Many P2P implementations underestimate this step and fail to budget for the clerk portal UI.

**Key Takeaway**: Model every human touchpoint in the P2P process as a distinct Person actor. Hidden manual steps lead to under-designed user interfaces and process bottlenecks.

**Why It Matters**: Invoice matching exceptions are the most common cause of payment delays in P2P. A platform that makes the exception resolution workflow invisible during design will deliver a poor finance user experience, resulting in slow payment runs and supplier relationship damage. Making the Finance Clerk explicit in the Context diagram ensures that the exception management interface, notification flows, and SLA targets are scoped during architecture review rather than discovered during user acceptance testing.

---

### Example 25: Complete P2P Flow — All Actors

A single Context diagram that traces the full Procure-to-Pay lifecycle from requisition to accounting entry, showing every person and external system.

```mermaid
graph TD
    accTitle: Example 25: Complete P2P Flow — All Actors
    accDescr: Graph with 8 nodes and 11 connections. Nodes: [Person] Buyer Employee, [Person] Approving Manager, [Person] Warehouse Operator, [Person] Finance Clerk, [Software System] Procurement Platform, [Person /Ext System] Supplier, [External System] Bank, [External System] Internal ERP / GL. Connections: [Person] Buyer Employee to [Software System] Procurement Platform (1. Submits requisition), [Software System] Procurement Platform to [Person] Approving Manager (2. Routes for approval), [Person] Approving Manager to [Software System] Procurement Platform (3. Approves PO), [Software System] Procurement Platform to [Person /Ext System] Supplier (4. Issues PO), [Person /Ext System] Supplier to [Person] Warehouse Operator (5. Delivers goods), [Person] Warehouse Operator to [Software System] Procurement Platform (6. Enters GRN), [Person /Ext System] Supplier to [Person] Finance Clerk (7. Sends invoice), [Person] Finance Clerk to [Software System] Procurement Platform (8. Registers invoice), [Software System] Procurement Platform to [External System] Bank (9. Disburses payment), [External System] Bank to [Person /Ext System] Supplier (10. Pays supplier), [Software System] Procurement Platform to [External System] Internal ERP / GL (11. Posts accounting).
    Buyer["[Person]<br/>Buyer Employee"]
    Manager["[Person]<br/>Approving Manager"]
    Warehouse["[Person]<br/>Warehouse Operator"]
    FinClerk["[Person]<br/>Finance Clerk"]
    Platform["[Software System]<br/>Procurement Platform"]
    Supplier["[Person /Ext System]<br/>Supplier"]
    Bank["[External System]<br/>Bank"]
    ERP["[External System]<br/>Internal ERP / GL"]

    Buyer -->|"1. Submits<br/>requisition"| Platform
    Platform -->|"2. Routes for<br/>approval"| Manager
    Manager -->|"3. Approves PO"| Platform
    Platform -->|"4. Issues PO"| Supplier
    Supplier -->|"5. Delivers goods"| Warehouse
    Warehouse -->|"6. Enters GRN"| Platform
    Supplier -->|"7. Sends invoice"| FinClerk
    FinClerk -->|"8. Registers<br/>invoice"| Platform
    Platform -->|"9. Disburses<br/>payment"| Bank
    Bank -->|"10. Pays supplier"| Supplier
    Platform -->|"11. Posts<br/>accounting"| ERP

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    class Manager pal-029E73
    class Warehouse pal-029E73
    class FinClerk pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Bank pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class ERP pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Numbered arrows**: 11-step P2P lifecycle made explicit
- **Numbered flow layout**: Matches the temporal flow of the business process
- **All eight actors**: Every person and system involved in P2P in one view

**Design Rationale**: Using numbered arrows transforms a static Context diagram into a process walkthrough. Business stakeholders can trace the flow and immediately spot missing steps or incorrect ordering.

**Key Takeaway**: For process-oriented systems, number the relationship arrows in execution order. This converts a static view into an interactive walkthrough for business stakeholder meetings.

**Why It Matters**: P2P process reviews with stakeholders often uncover missing steps, incorrect approval routing, or missing actors. A numbered-arrow Context diagram makes these gaps findable in a meeting rather than in a production incident. When all roles and external systems appear in a single diagram with numbered flow steps, finance, procurement, and IT stakeholders can jointly verify completeness in a single review session.

---

### Example 26: System Boundary — What Is In and What Is Out

Explicitly marking what the Procurement Platform owns vs. what external systems own prevents scope creep and misaligned expectations.

```mermaid
graph TD
    accTitle: Example 26: System Boundary — What Is In and What Is Out
    accDescr: Graph with 9 nodes and 5 connections. Nodes: Requisition lifecycle mgmt, PO issuance and tracking, Goods receipt recording, Invoice three-way matching, Payment run scheduling, GL and chart of accounts, Actual fund disbursement, EDI value-added network, Warehouse inventory management. Connections: Requisition lifecycle mgmt to PO issuance and tracking, PO issuance and tracking to Goods receipt recording, Goods receipt recording to Invoice three-way matching, Invoice three-way matching to Payment run scheduling, Payment run scheduling to GL and chart of accounts (Integrates via REST and events).
    subgraph InScope["IN SCOPE —<br/>Procurement Platform<br/>owns"]
        PRLifecycle["Requisition<br/>lifecycle mgmt"]
        POLifecycle["PO issuance and<br/>tracking"]
        GRNEntry["Goods receipt<br/>recording"]
        InvMatching["Invoice three-way<br/>matching"]
        PayRun["Payment run<br/>scheduling"]
    end

    subgraph OutOfScope["OUT OF SCOPE —<br/>External systems own"]
        ERPAccounting["GL and chart of<br/>accounts"]
        BankDisbursement["Actual fund<br/>disbursement"]
        EDINetwork["EDI value-added<br/>network"]
        InventoryMgmt["Warehouse inventory<br/>management"]
    end

    PRLifecycle --> POLifecycle
    POLifecycle --> GRNEntry
    GRNEntry --> InvMatching
    InvMatching --> PayRun
    PayRun -->|"Integrates via REST<br/>and events"| ERPAccounting

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class PRLifecycle pal-0173B2
    class POLifecycle pal-0173B2
    class GRNEntry pal-0173B2
    class InvMatching pal-0173B2
    class PayRun pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class ERPAccounting pal-808080
    class BankDisbursement pal-808080
    class EDINetwork pal-808080
    class InventoryMgmt pal-808080
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Two subgraphs**: In-scope and out-of-scope separated visually
- **Capability list**: Each box names a capability, not a technical component
- **Inventory management is out-of-scope**: Common misunderstanding — P2P does not manage inventory

**Design Rationale**: Scope boundaries prevent feature creep and misaligned budget expectations. The "OUT OF SCOPE" box is as important as the "IN SCOPE" box.

**Key Takeaway**: Draw the out-of-scope boundary explicitly. Unspecified scope is assumed to be in-scope by stakeholders, leading to scope creep and budget overruns.

**Why It Matters**: P2P implementations frequently expand to absorb inventory management, ERP functionality, and supplier master data management — all out of scope for a P2P backend. A boundary diagram prevents these expansions from silently entering the project. When boundaries are documented in an architecture diagram, adding out-of-scope features requires an explicit architecture review decision rather than a quiet addition to the backlog that bypasses scope governance.

---

### Example 27: Multiple Buyer Organizations — Multi-Tenancy at Context

A SaaS Procurement Platform serves multiple buyer organizations. Each organization is a distinct tenant with isolated data.

```mermaid
graph TD
    accTitle: Example 27: Multiple Buyer Organizations — Multi-Tenancy at Context
    accDescr: Graph with 6 nodes and 5 connections. Nodes: [Person] Buyer Employee — Org A, [Person] Buyer Employee — Org B, [Software System] Procurement Platform Multi-tenant SaaS, [External System] Bank A Org As bank, [External System] Bank B Org Bs bank, [External System] ERP Shared across orgs. Connections: [Person] Buyer Employee — Org A to [Software System] Procurement Platform Multi-tenant SaaS (Submits requisitions [tenant: org-a]), [Person] Buyer Employee — Org B to [Software System] Procurement Platform Multi-tenant SaaS (Submits requisitions [tenant: org-b]), [Software System] Procurement Platform Multi-tenant SaaS to [External System] Bank A Org As bank (Disburses org-a payments), [Software System] Procurement Platform Multi-tenant SaaS to [External System] Bank B Org Bs bank (Disburses org-b payments), [Software System] Procurement Platform Multi-tenant SaaS to [External System] ERP Shared across orgs (Posts accounting entries [org-scoped GL codes]).
    OrgA["[Person]<br/>Buyer Employee — Org<br/>A"]
    OrgB["[Person]<br/>Buyer Employee — Org<br/>B"]
    Platform["[Software System]<br/>Procurement Platform<br/>Multi-tenant SaaS"]
    BankA["[External System]<br/>Bank A<br/>Org A's bank"]
    BankB["[External System]<br/>Bank B<br/>Org B's bank"]
    SharedERP["[External System]<br/>ERP<br/>Shared across orgs"]

    OrgA -->|"Submits<br/>requisitions<br/>[tenant: org-a]"| Platform
    OrgB -->|"Submits<br/>requisitions<br/>[tenant: org-b]"| Platform
    Platform -->|"Disburses org-a<br/>payments"| BankA
    Platform -->|"Disburses org-b<br/>payments"| BankB
    Platform -->|"Posts accounting<br/>entries [org-scoped<br/>GL codes]"| SharedERP

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class OrgA pal-029E73
    class OrgB pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class BankA pal-808080
    class BankB pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class SharedERP pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Tenant labels on arrows**: `[tenant: org-a]` makes tenant isolation visible at Context
- **Per-org banks**: Each organization may have a different banking relationship
- **Shared ERP with org-scoped GL codes**: Single ERP instance, per-org chart of accounts

**Design Rationale**: Showing tenant labels at Context level forces the team to plan data isolation from the beginning. Systems designed without explicit multi-tenancy at Context routinely leak cross-tenant data.

**Key Takeaway**: Model multi-tenancy at Context level with explicit tenant labels on actor-to-system arrows. Invisible multi-tenancy in diagrams produces invisible data isolation bugs in production.

**Why It Matters**: Cross-tenant data leaks in SaaS procurement platforms expose supplier pricing and purchase volumes — commercially sensitive data that damages customer trust and triggers regulatory action. Architectural visibility is the first line of defense. Retrofitting row-level tenant isolation into a schema designed without it requires full table migrations and extended downtime — a cost that early architecture visibility eliminates entirely.

---

### Example 28: Geographic Distribution — Regional Deployments

A globally-deployed platform must show regional instances and data residency boundaries.

```mermaid
graph TD
    accTitle: Example 28: Geographic Distribution — Regional Deployments
    accDescr: Graph with 7 nodes and 6 connections. Nodes: [Person] Buyer — APAC, [Software System] Procurement Platform APAC instance, [External System] APAC Regional Bank, [Person] Buyer — EU, [Software System] Procurement Platform EU instance (GDPR-compliant), [External System] EU Bank, [External System] Global ERP / GL Cross-region consolidation. Connections: [Person] Buyer — APAC to [Software System] Procurement Platform APAC instance, [Software System] Procurement Platform APAC instance to [External System] APAC Regional Bank (Disburses payments), [Person] Buyer — EU to [Software System] Procurement Platform EU instance (GDPR-compliant), [Software System] Procurement Platform EU instance (GDPR-compliant) to [External System] EU Bank (Disburses payments), [Software System] Procurement Platform APAC instance to [External System] Global ERP / GL Cross-region consolidation (Posts entries [region-scoped]), [Software System] Procurement Platform EU instance (GDPR-compliant) to [External System] Global ERP / GL Cross-region consolidation (Posts entries [EU data stays in EU]).
    subgraph APAC["APAC Region"]
        APACBuyer["[Person]<br/>Buyer — APAC"]
        APACPlatform["[Software System]<br/>Procurement Platform<br/>APAC instance"]
        APACBank["[External System]<br/>APAC Regional Bank"]
    end

    subgraph EU["EU Region"]
        EUBuyer["[Person]<br/>Buyer — EU"]
        EUPlatform["[Software System]<br/>Procurement Platform<br/>EU instance<br/>(GDPR-compliant)"]
        EUBank["[External System]<br/>EU Bank"]
    end

    GlobalERP["[External System]<br/>Global ERP / GL<br/>Cross-region<br/>consolidation"]

    APACBuyer --> APACPlatform
    APACPlatform -->|"Disburses payments"| APACBank
    EUBuyer --> EUPlatform
    EUPlatform -->|"Disburses payments"| EUBank
    APACPlatform -->|"Posts entries<br/>[region-scoped]"| GlobalERP
    EUPlatform -->|"Posts entries [EU<br/>data stays in EU]"| GlobalERP

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class APACBuyer pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class APACPlatform pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class APACBank pal-808080
    class EUBuyer pal-029E73
    class EUPlatform pal-0173B2
    class EUBank pal-808080
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class GlobalERP pal-CC78BC
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Regional subgraphs**: APAC and EU instances in separate boundary boxes
- **GDPR label**: EU data residency requirement noted on platform box
- **Global ERP consolidation**: Single ERP consolidates across regions with region-scoped entries

**Design Rationale**: Regional subgraphs make data residency visible. GDPR compliance requires EU data to stay in EU — this cannot be discovered at deployment time.

**Key Takeaway**: Show regional deployments and data residency constraints at Context level. Data sovereignty requirements discovered post-deployment require expensive re-architecture.

**Why It Matters**: GDPR fines for cross-border data transfers reach 4% of global annual turnover. Architectural diagrams that make data residency constraints explicit from day one prevent regulatory exposure. Teams that discover cross-border data residency requirements after deployment must retrofit data partitioning, replication boundaries, and consent mechanisms under regulatory deadline pressure — a far more expensive remediation than early design clarity.

---

### Example 29: System Context with Security Boundary

A security-focused Context diagram highlights trust boundaries and authentication checkpoints.

```mermaid
graph TD
    accTitle: Example 29: System Context with Security Boundary
    accDescr: Graph with 5 nodes and 4 connections. Nodes: [Person] Buyer Employee Authenticates via SSO, [Person /External System] Supplier Authenticates via API key, [External System] API Gateway WAF, rate limiting, auth token validation, [Software System] Procurement Platform, [External System] PostgreSQL No public access. Connections: [Person] Buyer Employee Authenticates via SSO to [External System] API Gateway WAF, rate limiting, auth token validation (HTTPS + JWT [SSO/OIDC]), [Person /External System] Supplier Authenticates via API key to [External System] API Gateway WAF, rate limiting, auth token validation (HTTPS + API key), [External System] API Gateway WAF, rate limiting, auth token validation to [Software System] Procurement Platform (Validated requests [internal mTLS]), [Software System] Procurement Platform to [External System] PostgreSQL No public access (Queries data [TCP/5432, VPC internal]).
    subgraph Internet["Untrusted Zone —<br/>Public Internet"]
        Buyer["[Person]<br/>Buyer Employee<br/>Authenticates via<br/>SSO"]
        Supplier["[Person /External<br/>System]<br/>Supplier<br/>Authenticates via<br/>API key"]
    end

    subgraph DMZ["DMZ — API Gateway"]
        APIGW["[External System]<br/>API Gateway<br/>WAF, rate limiting,<br/>auth token<br/>validation"]
    end

    subgraph TrustedZone["Trusted Zone —<br/>Private Network"]
        Platform["[Software System]<br/>Procurement Platform"]
        DB["[External System]<br/>PostgreSQL<br/>No public access"]
    end

    Buyer -->|"HTTPS + JWT<br/>[SSO/OIDC]"| APIGW
    Supplier -->|"HTTPS + API key"| APIGW
    APIGW -->|"Validated requests<br/>[internal mTLS]"| Platform
    Platform -->|"Queries data<br/>[TCP/5432, VPC<br/>internal]"| DB

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class Buyer pal-029E73
    classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
    class Supplier pal-CA9161
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class APIGW pal-DE8F05
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class Platform pal-0173B2
    class DB pal-CA9161
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Three security zones**: Untrusted (internet), DMZ (gateway), Trusted (private network)
- **mTLS inside trusted zone**: Mutual TLS for service-to-service — not just external TLS
- **Database no public access**: DB is in trusted zone and not reachable from DMZ

**Design Rationale**: Security zone diagrams communicate the defense-in-depth strategy. Each zone boundary is a security enforcement point, not just a deployment boundary.

**Key Takeaway**: Model security trust zones explicitly in Context diagrams for security-sensitive systems. Each zone boundary represents a distinct authentication/authorization enforcement point.

**Why It Matters**: P2P platforms hold payment credentials and supplier contracts — high-value targets. Security architecture decisions made at Context level (DMZ, mTLS, private DB) drive implementation decisions across every container and component in the system. Security architects can annotate trust boundaries directly on the Context diagram, creating a shared threat model that engineers reference during implementation and reviewers verify during security assessments.

---

### Example 30: Context Diagram Anti-Patterns to Avoid

Understanding what makes a Context diagram fail is as important as knowing what makes one succeed.

```mermaid
graph TD
    accTitle: Example 30: Context Diagram Anti-Patterns to Avoid
    accDescr: Graph with 8 nodes and 6 connections. Nodes: Person, Our System, PostgreSQL DB users table orders table, Redis Cache session store, RabbitMQ order.created topic, [Person] Buyer Employee, [Software System] Procurement Platform, [External System] Bank. Connections: Person to Our System, Our System to PostgreSQL DB users table orders table, Our System to Redis Cache session store, Our System to RabbitMQ order.created topic, [Person] Buyer Employee to [Software System] Procurement Platform (Submits requisitions), [Software System] Procurement Platform to [External System] Bank (Disburses payments).
    subgraph Bad["Anti-Pattern: Too<br/>Much Detail"]
        User2["Person"]
        System2["Our System"]
        DB2["PostgreSQL DB<br/>users table<br/>orders table"]
        Cache2["Redis Cache<br/>session store"]
        MQ2["RabbitMQ<br/>order.created topic"]
        User2 --> System2
        System2 --> DB2
        System2 --> Cache2
        System2 --> MQ2
    end

    subgraph Good["Correct Level 1:<br/>System Boundary Only"]
        User1["[Person]<br/>Buyer Employee"]
        System1["[Software System]<br/>Procurement Platform"]
        Ext1["[External System]<br/>Bank"]
        User1 -->|"Submits<br/>requisitions"| System1
        System1 -->|"Disburses payments"| Ext1
    end

    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class User1 pal-029E73
    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class System1 pal-0173B2
    classDef pal-808080 fill:#808080,stroke:#000000,color:#000000
    class Ext1 pal-808080
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class User2 pal-DE8F05
    class System2 pal-DE8F05
    class DB2 pal-DE8F05
    class Cache2 pal-DE8F05
    class MQ2 pal-DE8F05
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key Elements**:

- **Anti-pattern (orange)**: Database tables, cache, and message queue are Level 2/3 concerns shown at Level 1
- **Correct pattern (green/blue)**: Only persons, the system, and external systems appear at Level 1
- **No internal infrastructure at Level 1**: Redis and RabbitMQ belong in Container diagrams

**Design Rationale**: The most common C4 mistake is leaking container and component detail into Context diagrams. This happens because developers think in terms of technology rather than actors.

**Key Takeaway**: Level 1 Context diagrams contain only three element types: Person, Software System, External System. If you see a database, cache, or queue in a Context diagram, the diagram is at the wrong level.

**Why It Matters**: Context diagrams that mix abstraction levels confuse both technical and non-technical audiences. Business stakeholders disengage when they see Redis; engineers miss the boundary-level relationships because their eyes go to the technology they recognize. Pure Level 1 diagrams serve both audiences cleanly. Documenting anti-patterns in a shared reference also enables reviewers to reject non-compliant diagrams during pull request reviews with a concrete, agreed-upon standard rather than subjective feedback.
