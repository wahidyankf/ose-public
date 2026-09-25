---
description: |-
  Creates new AI agent files in .claude/agents/ following AI Agents Convention. Canonical agents in .agents/agents/ are then routed to every harness via ./rhino harness adapters generate. Ensures proper structure, skills integration, and documentation.
effort: xhigh
model: sonnet
name: agent-maker
skills:
  - docs-applying-content-quality
  - repo-maintaining-task-lists
  - agent-developing-agents
tools: |-
  Read, Glob, Grep, Write, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/agent-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
