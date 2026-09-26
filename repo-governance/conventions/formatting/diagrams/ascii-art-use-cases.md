---
description: "Lists concrete ASCII art use cases — directory structures, simple diagrams, process flow, component relationships, tables."
when_to_use: "Use when you need a worked ASCII art example for a specific use case like directory trees or simple flows."
---

# ASCII Art Use Cases

## Directory Structure

Perfect for showing file and folder hierarchies:

```
open-sharia-enterprise/
 ├── .opencode/                   # Secondary coding-agent binding
 │   ├── agent/               # Specialized AI agents
 │   └── skill/               # Progressive knowledge packages
 ├── docs/                      # Documentation (Diátaxis framework)
│   ├── tutorials/            # Learning-oriented guides
│   ├── how-to/               # Problem-oriented guides
│   ├── reference/            # Technical reference
│   └── explanation/          # Conceptual documentation
├── src/                       # Source code
├── package.json              # Node.js manifest
└── README.md                 # Project README
```

## Simple Diagrams

Basic flowcharts and relationships:

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Validation  │────▶│   Process   │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Response   │
                    └─────────────┘
```

## Process Flow

Sequential steps with connectors:

```
User Action
    │
    ├──▶ Authentication Check
    │        │
    │        ├─ Success ──▶ Process Request ──▶ Return Result
    │        │
    │        └─ Failure ──▶ Return 401
    │
    └──▶ Log Event
```

## Component Relationships

System architecture overview:

```
┌──────────────────────────────────────┐
│           Frontend (React)           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│         API Gateway (Express)        │
└─────┬──────────────┬─────────────────┘
      │              │
      ▼              ▼
┌─────────┐    ┌─────────────┐
│ Auth    │    │  Business   │
│ Service │    │  Logic      │
└─────────┘    └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │  Database   │
               └─────────────┘
```

## Tables and Matrices

Structured data representation:

```
┌──────────────┬─────────────────────────┐
│   Category   │         Example         │
├──────────────┼─────────────────────────┤
│  Tutorials   │  docs/tutorials/start.md│
│  How-To      │  docs/how-to/api.md     │
│  Reference   │  docs/reference/spec.md │
│  Explanation │  docs/explanation/arch.md│
└──────────────┴─────────────────────────┘
```
