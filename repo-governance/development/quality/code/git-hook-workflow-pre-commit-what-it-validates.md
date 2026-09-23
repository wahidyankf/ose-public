---
description: "What the pre-commit hook validates."
when_to_use: "Use when debugging a pre-commit check failure."
---

# Git Hook Workflow: Pre-commit Hook (What It Validates)

**What It Validates**: whatever gates [`repo-config.yml`](../../../../repo-config.yml) declares on
the `pre-commit` surface. List the live set with `./rhino gate list`. The kinds of check it carries:

**Public safety**: the public-safety tree screen runs first and blocks outbound-unsafe staged
content before any formatter touches it.

**Formatting**: the `format-staged` mutation formats staged files and applies the result to the
index — see [Staged Formatting Gate](./staged-formatting-gate.md).

**Configuration**: `repo-config.yml` and the declared environment policy are validated.

**Markdown**: markdownlint, Mermaid diagrams in staged `.md` files (label length and colour contrast),
heading hierarchy, file naming, and front matter.

**File-type linters**: `shellcheck`, `hadolint`, and `actionlint` over the staged paths they own.

Pre-commit does **not** validate internal links; `./rhino md internal-link validate` is a
repository-wide command with no declared gate. It does not generate or validate harness adapters;
run `./rhino harness adapters generate` and `./rhino harness adapters validate` explicitly when a
canonical `.agents/` source changes.

**What Happens on Failure**:

- Commit is blocked
- The dispatcher names the failing gate; run that gate's command on the reported paths to read
  the tool's findings
- Fix the issue and try again
