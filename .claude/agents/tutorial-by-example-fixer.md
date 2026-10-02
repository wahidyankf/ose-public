---
description: |-
  Executes Tutorial By Example Propagation on a frozen tutorial-by-example ledger, repairing only what each example itself settles, with every threshold read from the adopting repository's adapter, and leaving authoring and pedagogy to the author.
effort: xhigh
model: sonnet
name: tutorial-by-example-fixer
skills:
  - docs-creating-by-example-tutorials
  - repo-applying-maker-checker-fixer
  - repo-assessing-criticality-confidence
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/tutorial-by-example-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
