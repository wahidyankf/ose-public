---
description: States the fixed mature-plan core and the reader-led decision rule for one technical-documentation shape.
when_to_use: Use when scaffolding a new formal plan and choosing its technical-documentation shape.
---

# Structure Decision

> **No secrets (HARD RULE)**: Plan documents are committed to git. NEVER place system secrets
> — SSH keys, passwords, sensitive usernames, API keys, tokens, or connection strings with real
> credentials — in any plan file. Reference secrets by variable name and location only (e.g.
> "set `DEPLOY_TOKEN` in `.env`"); real values belong in uncommitted files. See the
> [No Secrets in Git convention](../../security/no-secrets-in-committed-files.md).

Every newly authorized formal plan MUST contain this fixed mature-plan core. The one exception is a
[Bug-Fix Plan](./bug-fix-plan.md), whose single `README.md` carries the core roles as sections:

- `README.md`, `brd.md`, `prd.md`, `delivery.md`, and `learnings.md`
- exactly one technical form: `tech-docs.md`, or `tech-docs/README.md` with mapped companions

Choose the technical form by reader jobs, subject cohesion, navigation, and ownership. Use the
single file while one coherent technical narrative serves the readers; use the directory when
distinct concerns have different readers or owners and its README maps every companion. File or
line counts are review signals, never structure thresholds.

Do not collapse any other new formal plan to one `README.md`. Simple work belongs in the harness
task list; early work belongs in an explicitly requested idea brief. The retired single-file
contract remains valid only for plans covered by the prospective transition rule.
