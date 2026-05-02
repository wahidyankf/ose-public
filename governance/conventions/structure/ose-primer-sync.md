---
title: "ose-primer Sync Convention"
description: Directional classification, transforms, and safety invariants for syncing content between ose-public (upstream) and ose-primer (downstream template)
category: explanation
subcategory: conventions
tags:
  - conventions
  - structure
  - ose-primer
  - sync
  - cross-repo
created: 2026-04-18
---

# ose-primer Sync Convention

Authoritative directional classification governing the flow of content between `ose-public` (upstream, MIT throughout) and [`ose-primer`](https://github.com/wahidyankf/ose-primer) (downstream, MIT template). Owned by `repo-rules-checker`, consumed by `repo-ose-primer-adoption-maker` and `repo-ose-primer-propagation-maker` via the shared `repo-syncing-with-ose-primer` skill.

## Purpose

Every path in `ose-public` MUST resolve to exactly one sync direction. Without an exhaustive classifier, two failure modes emerge:

- **Leaks**: product content (product apps, product roadmaps, product plans) accidentally propagates to the primer template.
- **Drift**: scaffolding improvements land in one repo and never reach the other.

This convention defines the directional vocabulary, the available content transforms, the authoritative classifier table, the orphan-path default, and the audit rule that `repo-rules-checker` runs to guarantee coverage.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Every path is explicitly classified; orphan paths default to `neither` but the convention encourages authors to add new top-level paths explicitly rather than relying on the default.
- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Four directions, two transforms, one table. No conditional logic based on commit history or release tags.
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: The classifier is machine-readable (table parsing documented in the shared skill); agents consume it programmatically; the audit rule runs automatically under `repo-rules-checker`.

## Scope

This convention governs content syncing between exactly two repositories: `ose-public` (this repository) and `ose-primer` ([`github.com/wahidyankf/ose-primer`](https://github.com/wahidyankf/ose-primer)). It does not govern syncing to any other downstream fork or mirror.

This convention does NOT:

- Define release cadence (syncs happen on demand, not on a schedule).
- Control how `ose-primer` itself is cloned, built, or deployed.
- Authorise any direct commit to `ose-primer`; every mutation is gated through a pull request (see Safety Invariants).

## The two repositories

| Repository   | GitHub URL                                                                   | License           | Role                         |
| ------------ | ---------------------------------------------------------------------------- | ----------------- | ---------------------------- |
| `ose-public` | [github.com/wahidyankf/ose-public](https://github.com/wahidyankf/ose-public) | MIT (entire repo) | Upstream source of truth     |
| `ose-primer` | [github.com/wahidyankf/ose-primer](https://github.com/wahidyankf/ose-primer) | MIT (entire repo) | Downstream template (public) |

## Sync directions

Every classified path carries exactly one of four directions:

| Direction       | Meaning                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `propagate`     | Content authored in `ose-public`; flows outward to `ose-primer`. Adoption-maker does NOT surface changes to these paths from the primer.                 |
| `adopt`         | Content authored or owned in `ose-primer`; flows inward to `ose-public`. Propagation-maker does NOT surface changes to these paths from `ose-public`.    |
| `bidirectional` | Content maintained in both repos; changes in either direction are candidates. A transform may apply when the content mixes generic and product concerns. |
| `neither`       | Product-specific, ephemeral, or otherwise excluded. Neither agent emits findings for these paths, even when they change.                                 |

### Orphan-path rule

Paths not matched by any classifier row default to `neither`. Authors SHOULD add a row for every new top-level path they introduce; relying on the default is a last resort. The classifier audit rule (below) enforces no stale rows but does not force explicit coverage of every new path — the orphan-default is the escape hatch.

## Transforms

When a path is `propagate` or `bidirectional`, the sync agent applies exactly one transform:

- **`identity`** — No transform; copy bytes as-is.
- **`strip-product-sections`** — Remove H2/H3 sections whose heading or body references a product app (`OrganicLever`, `AyoKoding`, `OSE Platform`, or paths `apps/(organiclever|ayokoding|oseplatform)-*/`). For tables, remove rows naming product apps. For lists, remove bullets naming product apps. Preserve paragraph-level generic content untouched.

If a file needs a transform the skill does not implement, the sync agent reports the file as a **transform-gap** and abstains from proposing changes to that file. The maintainer hand-syncs or the convention is amended to add the needed transform.

## Classifier table

The table below is the authoritative classifier. When plan documents or other references disagree, this table wins.

| Path pattern                                                                                                      | Direction                   | Transform                | Rationale                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/a-demo-*` (excluding `*-e2e`)                                                                               | `neither` (post-extraction) | —                        | Pre-extraction tag was `propagate`; extracted 2026-04-18; `ose-primer` is authoritative. Retained as zero-match row to tag any accidental re-introduction. |
| `apps/a-demo-*-e2e`                                                                                               | `neither` (post-extraction) | —                        | Same rationale.                                                                                                                                            |
| `specs/apps/a-demo/**`                                                                                            | `neither` (post-extraction) | —                        | Demo contract specs extracted alongside the demo apps.                                                                                                     |
| `apps/organiclever-web`                                                                                           | `neither`                   | —                        | Product-specific app; not in primer scope.                                                                                                                 |
| `apps/organiclever-be`                                                                                            | `neither`                   | —                        | Product-specific app; not in primer scope.                                                                                                                 |
| `apps/organiclever-*-e2e`                                                                                         | `neither`                   | —                        | Product-specific E2E suite; not in primer scope.                                                                                                           |
| `apps/ayokoding-*`                                                                                                | `neither`                   | —                        | Product-specific app (including E2E and CLI); not in primer scope.                                                                                         |
| `apps/oseplatform-*`                                                                                              | `neither`                   | —                        | Product-specific app; not in primer scope.                                                                                                                 |
| `apps/rhino-cli`                                                                                                  | `propagate`                 | `identity`               | Generic repository-management CLI; MIT-licensable and useful in template.                                                                                  |
| `apps/oseplatform-cli`                                                                                            | `neither`                   | —                        | Product-specific site maintenance CLI.                                                                                                                     |
| `apps/ayokoding-cli`                                                                                              | `neither`                   | —                        | Product-specific content validation CLI.                                                                                                                   |
| `apps-labs/`                                                                                                      | `neither`                   | —                        | Experimental; not stable enough for template.                                                                                                              |
| `libs/golang-commons`                                                                                             | `propagate`                 | `identity`               | Generic Go utilities.                                                                                                                                      |
| `libs/clojure-openapi-codegen`                                                                                    | `neither` (post-extraction) | —                        | Only consumer was `a-demo-be-clojure-pedestal`; removed Phase 8 Commit I.                                                                                  |
| `libs/elixir-cabbage`                                                                                             | `neither` (post-extraction) | —                        | Only consumer was `a-demo-be-elixir-phoenix`; removed Phase 8 Commit I.                                                                                    |
| `libs/elixir-gherkin`                                                                                             | `neither` (post-extraction) | —                        | Only consumer was `a-demo-be-elixir-phoenix`; removed Phase 8 Commit I.                                                                                    |
| `libs/elixir-openapi-codegen`                                                                                     | `neither` (post-extraction) | —                        | Only consumer was `a-demo-be-elixir-phoenix`; removed Phase 8 Commit I.                                                                                    |
| `libs/ts-ui`                                                                                                      | `neither`                   | —                        | Consumed only by `organiclever-web` (product-specific app); propagating UI tokens would leak product theming.                                              |
| `libs/ts-ui-tokens`                                                                                               | `neither`                   | —                        | Same rationale as `libs/ts-ui`.                                                                                                                            |
| `libs/hugo-commons`                                                                                               | `neither`                   | —                        | Consumed by product sites only.                                                                                                                            |
| `libs/*` (other)                                                                                                  | `propagate`                 | `identity`               | Default for generic libs; overridden per-lib if product-specific.                                                                                          |
| `specs/apps/organiclever/**`                                                                                      | `neither`                   | —                        | Product specs.                                                                                                                                             |
| `specs/apps/ayokoding/**`                                                                                         | `neither`                   | —                        | Product specs.                                                                                                                                             |
| `specs/apps/oseplatform/**`                                                                                       | `neither`                   | —                        | Product specs.                                                                                                                                             |
| `specs/apps/rhino/**`                                                                                             | `propagate`                 | `identity`               | Generic CLI specs.                                                                                                                                         |
| `governance/principles/**`                                                                                        | `bidirectional`             | `identity`               | Universal values; improvements from either side surface.                                                                                                   |
| `governance/vision/**`                                                                                            | `neither`                   | —                        | Product vision is `ose-public`-specific.                                                                                                                   |
| `governance/conventions/**`                                                                                       | `bidirectional`             | `identity`               | Conventions are generic by design; mixed cases flagged per-file below.                                                                                     |
| `governance/conventions/structure/licensing.md`                                                                   | `neither`                   | —                        | Licensing convention is `ose-public`-specific; covers the per-directory MIT approach for this repo only.                                                   |
| `governance/conventions/structure/ose-primer-sync.md`                                                             | `neither`                   | —                        | This very convention is `ose-public`-specific; the primer does not need a sync-with-itself convention.                                                     |
| `governance/development/**`                                                                                       | `bidirectional`             | `identity`               | Development practices are generic.                                                                                                                         |
| `governance/workflows/**`                                                                                         | `bidirectional`             | `identity`               | Workflows are generic unless they name a product app.                                                                                                      |
| `governance/workflows/repo/repo-ose-primer-*.md`                                                                  | `neither`                   | —                        | Sync-orchestration workflows live in `ose-public` only.                                                                                                    |
| `governance/workflows/plan/**`                                                                                    | `bidirectional`             | `identity`               | Plan lifecycle is generic.                                                                                                                                 |
| `docs/tutorials/**`                                                                                               | `bidirectional`             | `strip-product-sections` | Generic tutorials; product-specific sections stripped.                                                                                                     |
| `docs/how-to/**`                                                                                                  | `bidirectional`             | `strip-product-sections` | Same rationale.                                                                                                                                            |
| `docs/reference/**`                                                                                               | `bidirectional`             | `strip-product-sections` | Same rationale; monorepo-structure and similar diagrams need product-node removal.                                                                         |
| `docs/reference/related-repositories.md`                                                                          | `neither`                   | —                        | Describes the primer from `ose-public`'s perspective; not relevant in primer itself.                                                                       |
| `docs/reference/demo-apps-ci-coverage.md`                                                                         | `neither` (post-extraction) | —                        | File deleted in Phase 8 Commit D; path no longer exists in `ose-public`.                                                                                   |
| `docs/explanation/**`                                                                                             | `bidirectional`             | `strip-product-sections` | Explanation docs mostly generic.                                                                                                                           |
| `docs/metadata/**`                                                                                                | `neither`                   | —                        | Product content metadata.                                                                                                                                  |
| `.claude/agents/repo-*.md`                                                                                        | `bidirectional`             | `identity`               | Generic governance agents.                                                                                                                                 |
| `.claude/agents/plan-*.md`                                                                                        | `bidirectional`             | `identity`               | Generic plan-lifecycle agents.                                                                                                                             |
| `.claude/agents/docs-*.md`                                                                                        | `bidirectional`             | `identity`               | Generic docs agents.                                                                                                                                       |
| `.claude/agents/specs-*.md`                                                                                       | `bidirectional`             | `identity`               | Generic specs agents.                                                                                                                                      |
| `.claude/agents/readme-*.md`                                                                                      | `bidirectional`             | `identity`               | Generic readme agents.                                                                                                                                     |
| `.claude/agents/ci-*.md`                                                                                          | `bidirectional`             | `identity`               | Generic CI agents.                                                                                                                                         |
| `.claude/agents/agent-*.md`                                                                                       | `bidirectional`             | `identity`               | Meta-agents.                                                                                                                                               |
| `.claude/agents/swe-*.md`                                                                                         | `bidirectional`             | `identity`               | Language-dev agents; generic.                                                                                                                              |
| `.claude/agents/web-*.md`                                                                                         | `bidirectional`             | `identity`               | Web-research agent.                                                                                                                                        |
| `.claude/agents/social-*.md`                                                                                      | `neither`                   | —                        | Product-marketing-adjacent; template users author their own.                                                                                               |
| `.claude/agents/apps-*.md`                                                                                        | `neither`                   | —                        | Product-app agents.                                                                                                                                        |
| `.claude/agents/repo-ose-primer-*.md`                                                                             | `neither`                   | —                        | Sync agents live in `ose-public` only; the primer does not sync itself.                                                                                    |
| `.claude/skills/apps-*/`                                                                                          | `neither`                   | —                        | Product-app skills.                                                                                                                                        |
| `.claude/skills/repo-syncing-with-ose-primer/`                                                                    | `neither`                   | —                        | Sync skill lives in `ose-public` only.                                                                                                                     |
| `.claude/skills/*` (other)                                                                                        | `bidirectional`             | `identity`               | Default generic unless product-app-specific.                                                                                                               |
| `.opencode/**`                                                                                                    | — (mirror)                  | —                        | Mirror of `.claude/**`; generated by sync pipeline; classifier applies to the source tree.                                                                 |
| `README.md` (root)                                                                                                | `bidirectional`             | `strip-product-sections` | Product-facing sections stripped on propagate.                                                                                                             |
| `CLAUDE.md` (root)                                                                                                | `bidirectional`             | `strip-product-sections` | Same.                                                                                                                                                      |
| `AGENTS.md` (root)                                                                                                | `bidirectional`             | `strip-product-sections` | Same.                                                                                                                                                      |
| `ROADMAP.md`                                                                                                      | `neither`                   | —                        | Product roadmap.                                                                                                                                           |
| `LICENSE`, `LICENSING-NOTICE.md`                                                                                  | `neither`                   | —                        | License difference is intentional.                                                                                                                         |
| `CONTRIBUTING.md`, `SECURITY.md`                                                                                  | `bidirectional`             | `strip-product-sections` | Generic; product-specific references stripped.                                                                                                             |
| `nx.json`, `tsconfig.base.json`, `package.json`, `go.work`                                                        | `bidirectional`             | `strip-product-sections` | Config; product-app entries stripped on propagate.                                                                                                         |
| `open-sharia-enterprise.sln`                                                                                      | `neither`                   | —                        | `.sln` file is named after the product; the primer has its own solution file.                                                                              |
| `Brewfile`                                                                                                        | `bidirectional`             | `identity`               | Generic toolchain list.                                                                                                                                    |
| `.husky/**`                                                                                                       | `bidirectional`             | `identity`               | Generic hook scripts.                                                                                                                                      |
| `.github/workflows/**`                                                                                            | `bidirectional`             | `strip-product-sections` | Generic CI; product-app jobs stripped on propagate.                                                                                                        |
| `.github/actions/**`                                                                                              | `bidirectional`             | `strip-product-sections` | Generic composite actions; demo-only setup actions removed in Phase 8 Commit A.                                                                            |
| `scripts/**`                                                                                                      | `bidirectional`             | `strip-product-sections` | Generic repo scripts (doctor, sync pipeline); product-name mentions stripped.                                                                              |
| `infra/**`                                                                                                        | `neither`                   | —                        | Product infrastructure.                                                                                                                                    |
| `plans/**`                                                                                                        | `neither`                   | —                        | Product plans are product-specific.                                                                                                                        |
| `generated-reports/**`, `local-temp/**`                                                                           | `neither`                   | —                        | Ephemeral.                                                                                                                                                 |
| `generated-socials/**`                                                                                            | `neither`                   | —                        | Product marketing content.                                                                                                                                 |
| `archived/**`                                                                                                     | `neither`                   | —                        | Archived product apps (Hugo predecessors); frozen, product-specific history.                                                                               |
| `bin/**`                                                                                                          | `neither`                   | —                        | Build artifact directory (created transiently by `dotnet` tooling).                                                                                        |
| `graph.html`                                                                                                      | `neither`                   | —                        | Generated artifact from `nx graph --file`.                                                                                                                 |
| `commitlint.config.js`                                                                                            | `bidirectional`             | `identity`               | Generic Conventional Commits config.                                                                                                                       |
| `openapitools.json`                                                                                               | `bidirectional`             | `identity`               | Generic OpenAPI generator config.                                                                                                                          |
| `opencode.json`                                                                                                   | `bidirectional`             | `identity`               | Generic secondary platform binding config; permission-equivalent to `.claude/settings.json`.                                                               |
| `go.work.sum`                                                                                                     | `bidirectional`             | `strip-product-sections` | Lockfile paired with `go.work`; regenerated by `go work sync`.                                                                                             |
| `.gitignore`, `.dockerignore`, `.markdownlintignore`, `.prettierignore`, `.nxignore`                              | `bidirectional`             | `identity`               | Generic ignore lists.                                                                                                                                      |
| `.golangci.yml`, `.markdownlint-cli2.jsonc`, `.prettierrc.json`, `.tool-versions`                                 | `bidirectional`             | `identity`               | Generic linting and toolchain-pin configs.                                                                                                                 |
| `.clj-kondo/**`, `.codex/**`, `.playwright-mcp/**`, `.pytest_cache/**`, `.ruff_cache/**`, `.lsp/**`, `.vscode/**` | `neither`                   | —                        | Tooling caches and editor-local state; not intended for primer propagation.                                                                                |
| `node_modules/**`, `obj/**`, `.nx/**`, `.venv/**`, etc.                                                           | `neither`                   | —                        | Build artifacts.                                                                                                                                           |

## Audit rule

`repo-rules-checker` runs a `classifier-coverage` audit that:

1. Enumerates every top-level file and directory under `ose-public/`.
2. Enumerates every immediate subdirectory of `apps/`, `libs/`, `specs/apps/`, `governance/*/`, `docs/*/`, `.claude/agents/` (as files), `.claude/skills/`.
3. For each enumerated path, attempts to match at least one classifier row (literal or glob).
4. Reports every unmatched path that is not covered by the orphan-path default as a finding (`classifier-orphan-path`).
5. Reports every classifier row whose pattern matches zero actual paths as a finding (`classifier-stale-row`) **UNLESS** the row appears in the Intentional Zero-Match Whitelist below.

### Intentional zero-match whitelist

After Phase 8 extraction, these rows intentionally match zero paths in `ose-public`. They MUST NOT be removed — they exist to tag accidental re-introduction as `neither`:

- `apps/a-demo-*` (excluding `*-e2e`)
- `apps/a-demo-*-e2e`
- `specs/apps/a-demo/**`
- `libs/clojure-openapi-codegen`
- `libs/elixir-cabbage`
- `libs/elixir-gherkin`
- `libs/elixir-openapi-codegen`
- `docs/reference/demo-apps-ci-coverage.md`

## Agents that consume this convention

| Agent                               | Role                                        | Consumes                                                      |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `repo-ose-primer-adoption-maker`    | Finds candidates to adopt from the primer   | Classifier rows with direction `adopt` or `bidirectional`     |
| `repo-ose-primer-propagation-maker` | Finds candidates to propagate to the primer | Classifier rows with direction `propagate` or `bidirectional` |
| `repo-rules-checker`                | Enforces the audit rule                     | Full table + orphan-path default + zero-match whitelist       |

Both sync agents share a single Skill, `repo-syncing-with-ose-primer` (located at `.claude/skills/repo-syncing-with-ose-primer/`), which handles classifier parsing, clone management, transform implementations, and report-writing.

## Clone management

Sync agents access `ose-primer` through a local git clone identified by the `OSE_PRIMER_CLONE` environment variable. The convention default is `~/ose-projects/ose-primer`; operators can override to any location.

All pre-flight steps (env-var check, `.git` presence, origin remote URL check, `fetch --prune`, clean-tree check, main-branch check) are implemented in the shared skill. Apply-mode changes run inside a git worktree at `$OSE_PRIMER_CLONE/.claude/worktrees/sync-<utc-timestamp>-<short-uuid>/` to preserve parallel safety. The exact procedure is documented in the shared skill's `reference/clone-management.md` module.

## Safety invariants

These rules are absolute; no agent or operator may bypass them:

1. **No `neither` propagation**: An agent operating in `propagate` or `apply` mode MUST skip every path classified `neither`. Emitting a change proposal for a `neither` path is a defect, not a judgement call.
2. **Dry-run default**: Both sync agents default to dry-run mode; apply mode requires explicit operator invocation.
3. **Clean-tree precondition**: Pre-flight aborts if either `ose-public`'s working tree or the primer clone's main working tree is dirty.
4. **Transform-gap abstention**: When a `bidirectional` file needs a transform the skill does not implement, the agent reports the file and abstains — it does not guess.
5. **`ose-public` → direct-to-main**: Sync-related commits in `ose-public` land directly on `main` per Trunk-Based Development. No feature branch, no PR.
6. **`ose-primer` → PR-only**: Every mutation reaching `ose-primer` MUST flow through a worktree + branch + draft pull request. Direct commits to the primer's `main` are prohibited in every mode. This invariant has no escape hatch.

## Relationship to other conventions

- [Per-Directory Licensing](./licensing.md) — Documents the per-directory MIT licensing approach for `ose-public`.
- [File Naming Convention](./file-naming.md) — Applies uniformly to both repositories; no sync transform is required for filenames.
- [Agent Naming Convention](./agent-naming.md) — Sync agents conform (`repo-ose-primer-adoption-maker`, `repo-ose-primer-propagation-maker`).
- [Workflow Naming Convention](./workflow-naming.md) — Sync orchestration workflows conform (`repo-ose-primer-sync-execution`, `repo-ose-primer-extraction-execution`).
- [Plans Organization](./plans.md) — Plan lifecycle paths (`plans/**`) are `neither` because product plans are product-specific.
