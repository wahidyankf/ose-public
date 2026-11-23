---
description: "What the pre-commit hook validates."
when_to_use: "Use when debugging a pre-commit check failure."
---

# Git Hook Workflow: Pre-commit Hook (What It Validates)

**What It Validates**: whatever gates [`repo-config.yml`](../../../../repo-config.yml) declares on the `pre-commit`
surface. List the live set with `./rhino gate list`. Today that is one gate, the staged formatter.

**Formatting**: the `format-staged` mutation formats staged files and applies the result to the index. See
[Staged Formatting Gate](./staged-formatting-gate.md).

The hook runs no check. Markdown lint, Mermaid, heading, naming, and front-matter checks, file-type linters,
configuration and environment validation, harness adapters, the public-safety tree scan, and the whole-tree README,
link, and word-budget checks all run in the pull-request gate. That keeps the hook fast, and the full set runs once per
pull request.

Harness adapters are checked by the `harness-adapters` gate at pull-request; run `./rhino harness adapters generate`
explicitly when a canonical `.agents/` source changes.

**What Happens on Failure**:

- Commit is blocked
- The dispatcher names the failing gate; run that gate's command on the reported paths to read the tool's findings
- Fix the issue and try again
