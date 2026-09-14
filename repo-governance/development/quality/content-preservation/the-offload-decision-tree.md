---
description: "The decision tree for choosing an offload option."
when_to_use: "Use when deciding which of the four offload options to apply."
---

# The Offload Decision Tree

When condensing content, ask these questions:

```mermaid
flowchart TD
    accTitle: The Offload Decision Tree
    accDescr: Unique and valuable? leads to Link instead of duplicating via No, duplicated; Unique and valuable? leads to Keep in agent file via Unsure; and 10 more links.
    Q1{"Unique and<br/>valuable?"}
    Q1 -->|No, duplicated| L["Link instead of<br/>duplicating"]
    Q1 -->|Unsure| K["Keep in<br/>agent file"]
    Q1 -->|Yes| Q2{"About how we<br/>write or format?"}
    Q2 -->|Yes| CV["repo-governance/<br/>conventions/"]
    Q2 -->|No| Q3{"About how we<br/>work or process?"}
    Q3 -->|Yes| DV["repo-governance/<br/>development/"]
    CV --> Q4{"Target doc<br/>exists?"}
    DV --> Q4
    Q4 -->|Yes| B["B: merge into<br/>existing doc"]
    Q4 -->|No| Q5{"Pattern shared<br/>across files?"}
    Q5 -->|Yes| C["C: extract to<br/>shared doc"]
    Q5 -->|No| AD["A or D: create<br/>doc in folder"]
```

Option A creates a new document, and Option D adds the content to the appropriate folder (`conventions/` or
`development/`). Duplicated content links to the existing convention or development document, and unsure,
agent-specific implementation stays in the agent file.
