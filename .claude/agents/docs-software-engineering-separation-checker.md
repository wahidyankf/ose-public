---
description: |-
  Audits the separation between the platform style guides under docs/explanation/software-engineering/ and AyoKoding educational content, for each relationship the Software Design Reference lists, and returns criticality-rated findings without modifying anything.
effort: xhigh
model: sonnet
name: docs-software-engineering-separation-checker
skills:
  - docs-validating-software-engineering-separation
  - docs-applying-diataxis-framework
  - repo-assessing-criticality-confidence
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-software-engineering-separation-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
