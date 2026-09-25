# Repository Architecture — The Six Layers Overview

## The Six Layers

```
Layer 0: Vision       WHY WE EXIST       (foundational purpose)
Layer 1: Principles   WHY - Values       (governs L2, L3)
Layer 2: Conventions  WHAT - Doc Rules   (governs L3, L4)
Layer 3: Development  HOW - Practices    (governs L4)
Layer 4: AI Agents    WHO - Executors    (atomic tasks)
Layer 5: Workflows    WHEN - Orchestrate (multi-step processes)
```

**Key relationships:**

- Vision inspires Principles
- Principles govern Conventions and Development
- Conventions govern Development and Agents
- Development governs Agents
- Workflows orchestrate Agents

## Quick Layer Reference

| Layer | Location                     | Purpose                       | Changes?        | Answers?                  |
| ----- | ---------------------------- | ----------------------------- | --------------- | ------------------------- |
| **0** | repo-governance/vision/      | WHY we exist                  | Extremely rare  | Why does project exist?   |
| **1** | repo-governance/principles/  | WHY we value approaches       | Rarely          | Why value this approach?  |
| **2** | repo-governance/conventions/ | WHAT documentation rules      | Occasionally    | What documentation rules? |
| **3** | repo-governance/development/ | HOW we develop software       | More frequently | How develop software?     |
| **4** | .agents/agents/              | WHO enforces rules            | Often           | Who enforces rules?       |
| **5** | repo-governance/workflows/   | WHEN run agents in what order | As needed       | When run which agents?    |
