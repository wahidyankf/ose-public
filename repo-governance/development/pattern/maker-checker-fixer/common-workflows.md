---
description: "The three common maker-checker-fixer workflows."
when_to_use: "Use when choosing a workflow for a task."
---

# Common Workflows

## Basic Workflow: Create → Validate → Fix

**Scenario**: Creating new content from scratch

```mermaid
flowchart TD
    accTitle: Basic Workflow: Create → Validate → Fix
    accDescr: User requests new tutorial leads to Maker creates content; Maker creates content leads to User reviews content; User reviews content leads to Checker finds minor issues; and 3 more links.
    R["User requests<br/>new tutorial"] --> M["Maker creates<br/>content"]
    M --> U1["User reviews<br/>content"]
    U1 --> C["Checker finds<br/>minor issues"]
    C --> U2["User approves<br/>fixes in report"]
    U2 --> F["Fixer applies<br/>validated fixes"]
    F --> D["Done: content<br/>production-ready"]
```

The maker creates the content together with all its dependencies.

**Example**:

```bash
# Step 1: Create content
User: "Create TypeScript generics tutorial for ayokoding-www"
Agent: apps-ayokoding-www-general-maker (creates tutorial + navigation updates)

# Step 2: Validate
User: "Check the new tutorial"
Agent: apps-ayokoding-www-general-checker (generates audit report)

# Step 3: Fix
User: "Apply the fixes"
Agent: apps-ayokoding-www-general-fixer (applies validated fixes from audit)
```

## Iterative Workflow: Maker → Checker → Fixer → Checker

**Scenario**: Major content update requiring validation of fixes

```mermaid
flowchart TD
    accTitle: Iterative Workflow: Maker → Checker → Fixer → Checker
    accDescr: User requests content update leads to Maker updates content; Maker updates content leads to Checker finds issues; Checker finds issues leads to User approves fixes; User approves fixes leads to Fixer applies fixes; and 2 more links.
    R["User requests<br/>content update"] --> M["Maker updates<br/>content"]
    M --> C1["Checker finds<br/>issues"]
    C1 --> U["User approves<br/>fixes"]
    U --> F["Fixer applies<br/>fixes"]
    F --> C2["Checker confirms<br/>the fixes"]
    C2 --> D["Done: content<br/>verified clean"]
```

The maker updates the content together with its dependencies.

**When to use**: Critical content, major refactoring, or when fixer confidence is uncertain

## Update Workflow: Maker (update mode) → Checker

**Scenario**: Updating existing content that's already high quality

```mermaid
flowchart TD
    accTitle: Update Workflow: Maker (update mode) → Checker
    accDescr: User asks to add a section leads to Maker updates content; Maker updates content leads to Checker quick validation via optional; Checker quick validation leads to Done: quality preserved.
    R["User asks to<br/>add a section"] --> M["Maker updates<br/>content"]
    M -.->|optional| C["Checker quick<br/>validation"]
    C --> D["Done: quality<br/>preserved"]
```

The content was already validated during creation, so the quick check is only a confirmation.

**When to use**: Minor updates to well-maintained content
