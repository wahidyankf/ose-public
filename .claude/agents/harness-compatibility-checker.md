---
description: |-
  Validates cross-vendor parity invariants (Phase 0, deterministic) and detects external drift between each supported coding-agent harness's current upstream configuration conventions and the platform-binding catalog (Phase 1, web-research-backed). Emits a combined dual-labelled audit report to local-tmp/harness-compat/.
effort: high
model: opus
name: harness-compatibility-checker
skills:
  - harness-compatibility-protocol
  - docs-applying-content-quality
  - repo-understanding-repository-architecture
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
tools: |-
  Read, Glob, Grep, Write, Bash, WebSearch, WebFetch, Agent
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/harness-compatibility-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
