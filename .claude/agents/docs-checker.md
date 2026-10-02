---
description: |-
  Audits documentation for factual accuracy against authoritative sources and the repository, for contradictions within and across documents, and for references to things that no longer exist, returning rated findings; as a combined validator it also checks structure and links.
effort: xhigh
model: sonnet
name: docs-checker
skills:
  - docs-validating-factual-accuracy
  - docs-authoring-standards
  - repo-assessing-criticality-confidence
  - docs-validating-links
tools: |-
  Read, Glob, Grep, Bash, WebSearch, WebFetch
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
