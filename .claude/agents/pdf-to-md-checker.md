---
description: Compares a converted Markdown file with its source PDF across seven fidelity dimensions and returns rated findings without editing either file.
effort: xhigh
model: sonnet
name: pdf-to-md-checker
skills:
  - docs-converting-pdf-to-markdown
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pdf-to-md-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
