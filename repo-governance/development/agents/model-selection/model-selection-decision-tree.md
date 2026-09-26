---
description: "Gives the decision tree for walking from a task's characteristics to the correct model grade."
when_to_use: Use when unsure which model grade a new agent should declare.
---

# Model Selection Decision Tree

The tree is entered from the bottom. Each grade must be argued past, never assumed.

```mermaid
flowchart TD
    accTitle: Model Selection Decision Tree
    accDescr: Purely mechanical task? leads to Fast: haiku via Yes; Purely mechanical task? leads to Applies rules or checklists? via No; Applies rules or checklists? leads to Execution-Grade: sonnet via Yes; and 6 more links.
    Q1{"Purely<br/>mechanical task?"}
    Q1 -->|Yes| F["Fast:<br/>haiku"]
    Q1 -->|No| Q2{"Applies rules or<br/>checklists?"}
    Q2 -->|Yes| X["Execution-Grade:<br/>sonnet"]
    Q2 -->|No| Q3{"Needs creative<br/>reasoning?"}
    Q3 -->|Yes| P["Planning-Grade:<br/>opus"]
    Q3 -->|No| Q4{"Failed at<br/>planning grade?"}
    Q4 -->|Yes, with evidence| U["Ultra:<br/>fable"]
    Q4 -->|No, but feels hard| P
    Q4 -->|None or ambiguous| X
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

Structured procedures count as applying rules; code generation, architectural decisions, and nuanced content
creation count as creative reasoning. Ultra needs recorded evidence of failure at the planning grade on a task that
is expensive to detect and expensive to undo. Execution-Grade is the default for ambiguous cases because it is safer
than fast.

Ultra is the only grade that cannot be reached by prediction. It requires the recorded evidence
described in [Model Tiers — Ultra](./model-tiers-ultra.md#admission-evidence); anticipated
difficulty is not evidence.
