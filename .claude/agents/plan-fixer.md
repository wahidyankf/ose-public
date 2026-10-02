---
description: |-
  Executes Plan Propagation on a frozen plan quality ledger, re-validating each row against the current plan, repairing only what the plan's own decisions settle, and leaving every policy choice to the plan's owner.
effort: xhigh
model: sonnet
name: plan-fixer
skills:
  - plan-creating-project-plans
  - plan-writing-gherkin-criteria
  - repo-applying-maker-checker-fixer
  - repo-assessing-criticality-confidence
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
