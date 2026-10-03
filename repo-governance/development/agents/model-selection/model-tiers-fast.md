---
description: "Defines the fast tier: agents that declare `tier: fast` for simple, high-volume, low-reasoning work."
when_to_use: Use when deciding whether a new agent should declare the fast (`fast`) model tier.
---

# Model Tiers — Fast

**When to use**: Purely mechanical tasks with no reasoning required -- simple automation, URL validation, deployment scripts, and straightforward command execution.

**Cognitive profile**: Fast execution of simple, well-defined operations. No analytical reasoning needed. Input-output mapping is deterministic or near-deterministic.

**Task characteristics**:

- Running predefined shell commands in sequence
- Validating URLs against HTTP status codes
- Executing deployment scripts with known parameters
- Simple file existence or format checks
- Tasks where the entire procedure is a fixed script with no branching logic

**Agent examples**:

- **Link checkers** (docs-link-checker, apps-ayokoding-www-link-checker) -- validate URLs by checking HTTP status codes and managing cache files
- **apps-ayokoding-www-link-fixer** -- applies checker-identified broken links via deterministic URL replacement; no independent analysis required
- **docs-file-manager** -- performs deterministic file operations (move, rename, delete) with `git mv`, kebab-case pattern matching, and mechanical link updates; no judgment calls required

**Frontmatter**: Declare `tier: fast` in the canonical agent. The Tier Registry maps it to
`model: haiku` with `effort: xhigh` in `.claude/agents/`, and to the newest `gpt-*-luna` model with
`model_reasoning_effort = "xhigh"` on Codex.

```yaml
---
name: docs-link-checker
description: Validates external and internal links...
tier: fast
capabilities:
  - repository-read
  - repository-write
  - shell
  - network
---
```
