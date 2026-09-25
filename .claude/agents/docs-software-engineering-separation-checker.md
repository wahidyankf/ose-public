---
description: |-
  Validates software engineering documentation separation between OSE Platform style guides (docs/explanation/) and AyoKoding educational content (apps/ayokoding-www/). Ensures NO DUPLICATION between platforms, proper prerequisite statements, and style guide focus on repository-specific conventions only (not language tutorials).
effort: xhigh
model: sonnet
name: docs-software-engineering-separation-checker
skills:
  - docs-validating-software-engineering-separation
  - docs-applying-content-quality
  - docs-applying-diataxis-framework
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-software-engineering-separation-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
