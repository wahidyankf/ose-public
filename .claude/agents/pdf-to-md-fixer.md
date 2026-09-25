---
description: |-
  Applies validated fixes from pdf-to-md-checker audit reports. Re-validates each finding before applying. Fixes missing sections (re-extracts from PDF), incorrect text, wrong table data, invalid Mermaid syntax, and missing figure placeholders. Use after reviewing pdf-to-md-checker output.
effort: xhigh
model: sonnet
name: pdf-to-md-fixer
skills:
  - docs-converting-pdf-to-markdown
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pdf-to-md-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
