---
description: |-
  Re-validates harness compatibility findings against current files and their cited sources, repairs mechanical drift at the canonical source, regenerates adapters, and hands every decision to a person.
effort: xhigh
model: sonnet
name: harness-fixer
skills:
  - harness-compatibility-protocol
  - repo-applying-maker-checker-fixer
  - repo-assessing-criticality-confidence
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/harness-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
