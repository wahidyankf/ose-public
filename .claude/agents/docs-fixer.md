---
description: |-
  Applies documentation checker findings after re-validating each against the current text and its recorded evidence, edits only high-confidence fixes, and records false positives and findings left for a person.
effort: xhigh
model: sonnet
name: docs-fixer
skills:
  - repo-applying-maker-checker-fixer
  - repo-assessing-criticality-confidence
  - docs-validating-factual-accuracy
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
