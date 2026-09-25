---
description: |-
  Validates repository-wide consistency including file naming, linking, emoji usage, convention compliance, agent-to-agent duplication, agent-Skill duplication, Skill-to-Skill consolidation opportunities, and rules governance (contradictions, inaccuracies, inconsistencies). Outputs to local-tmp/repo-rules/ with progressive streaming.
effort: high
model: opus
name: rules-checker
skills:
  - docs-applying-content-quality
  - repo-understanding-repository-architecture
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - rules-validating-governance
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
tools: |-
  Read, Glob, Grep, Write, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/rules-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
