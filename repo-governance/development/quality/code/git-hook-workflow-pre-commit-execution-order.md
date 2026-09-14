---
description: "The pre-commit hook's location and gate steps."
when_to_use: "Use to trace what runs on git commit."
---

# Git Hook Workflow: Pre-commit Hook (Execution Order)

## Pre-commit Hook

**Location**: `.husky/pre-commit`

**Execution Order**:

1. You run `git commit`
2. Pre-commit hook triggers (`.husky/pre-commit` — a shim line invoking
   `./rhino gate run --surface pre-commit`, which runs the public-safety screen and then
   `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-commit`)
3. `gate run --surface=pre-commit` orchestrates all registry-declared `pre-commit`-surface gates in
   declaration order, failing fast:

| Step | Trigger                                | Action                                                                       | On failure |
| ---- | -------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| 1    | `.claude/` or `.opencode/` staged      | Validate → Sync → Validate-sync                                              | exit 1     |
| 2    | `docker-compose.ya?ml` staged          | `docker compose -f <file> config` per file                                   | exit 1     |
| 3    | always                                 | `nx affected -t run-pre-commit --skip-nx-cache`                              | warn only  |
| 4    | always                                 | `git add apps/ayokoding-www/content/`                                        | ignored    |
| 5    | always                                 | `npx lint-staged`                                                            | exit 1     |
| 5b   | `apps/<app>/package.json` staged       | Regenerate + stage `apps/<app>/package-lock.json`                            | exit 1     |
| 6    | `docs/` staged                         | Validate + auto-fix naming, then `git add docs/ repo-governance/ .claude/`   | exit 1     |
| 6m   | staged `.md` files (skip 3 exclusions) | `mermaid:validation` — diagram width, label length, syntax (staged-only)     | exit 1     |
| 6h   | staged `.md` in prose allowlist        | `headings:hierarchy-validation` — single H1, no skipped levels (staged-only) | exit 1     |
| 7    | always                                 | Validate markdown links + `#fragment` anchors (staged only)                  | exit 1     |
| 8    | always                                 | `npm run lint:md`                                                            | exit 1     |

1. Commit proceeds if no errors

**Implementation**: `apps/rhino-cli/src/` — all steps call internal Rust functions directly (no subprocess round-trips for rhino-cli-owned logic); external tools are shelled out via `std::process::Command`.
