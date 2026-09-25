---
description: |-
  Validates that a Markdown file is a verbatim, complete representation of its source PDF. Checks for missing sections, incorrect text, table integrity, OCR quality, Mermaid validity, and figure coverage. Use when verifying PDF-to-Markdown conversion fidelity before cross-referencing.
effort: xhigh
model: sonnet
name: pdf-to-md-checker
skills:
  - docs-converting-pdf-to-markdown
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pdf-to-md-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
