---
description: |-
  Validates internal and external documentation links. Always uses docs/metadata/external-links-status.yaml as its sole cache, prunes it, and updates lastFullScan on every invocation. Use for dead links, URL reachability, internal references, or link-health audits.
effort: xhigh
model: haiku
name: docs-link-checker
skills:
  - docs-applying-content-quality
  - docs-validating-links
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Edit, Bash, WebSearch, WebFetch
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-link-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
