---
description: |-
  Audits a repository's rules as a whole for contradictions across levels, inaccurate references, inconsistent terms and strengths, missing traceability, and duplicated bodies, and returns rated findings without editing.
effort: high
model: opus
name: rules-checker
skills:
  - rules-validating-governance
  - repo-understanding-repository-architecture
  - repo-assessing-criticality-confidence
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/rules-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
