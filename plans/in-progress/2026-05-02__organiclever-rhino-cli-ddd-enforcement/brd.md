# BRD — OrganicLever rhino-cli DDD Enforcement + Skill Extension

## Business problem

The sibling [`2026-05-02__organiclever-adopt-ddd`](../2026-05-02__organiclever-adopt-ddd/README.md) plan migrates `apps/organiclever-web` to a bounded-context layout with explicit ubiquitous language. Once that lands, the plan's correctness depends on **eight artefacts staying in lockstep**: code folder, layer subfolders, ESLint boundaries config, Gherkin folder, glossary file, registry, ADR, and skill content.

Without mechanical enforcement, drift is inevitable:

1. **Glossary rot** — code identifiers get renamed during refactors but the glossary `Code identifier(s)` column doesn't follow. Within months the glossary lies, and the ubiquitous-language payoff dies.
2. **Folder–registry drift** — a developer creates `src/contexts/phantom/domain/` for a quick spike, never adds it to the registry, and it accumulates code.
3. **Term collision** — two glossaries independently define `Bump` to mean different things; Gherkin steps use both meanings; reading the specs becomes ambiguous.
4. **Layer slip** — a new xstate machine that calls `fromPromise` against PGlite lands in `presentation/` because the developer didn't know the IO-trigger rule.

ESLint boundaries (delivered by the DDD plan) catches case 4 for TypeScript code-import paths but does **not** catch cases 1–3, and won't catch case 4 for the F# BE when `organiclever-be` adopts DDD. Manual code review is the only thing standing between today's clean migration and tomorrow's drifted mess. That's not a defensible position for a solo maintainer.

## Proposed solution

Add two `rhino-cli` subcommands as the **mechanical drift gate**, plus a skill extension as the **dev-time knowledge layer**. Both layers complement each other:

- **Layer 1 — `rhino-cli bc validate`**: structural parity between registry, code folders, glossary files, Gherkin folders. Catches drift cases 2–3 instantly.
- **Layer 2 — `rhino-cli ul validate`**: glossary frontmatter, table schema, code-identifier existence, cross-context term collision. Catches drift case 1.
- **Layer 3 — Skill DDD section**: BC list, layer rules, xstate placement, cross-context call rule, glossary authoring rule. Prevents drift case 4 at authoring time by giving every agent the right mental model on session start.

Both subcommands run in `nx run organiclever-web:test:quick` and therefore in pre-push. Drift fails the commit, not the next archaeology session.

## Why rhino-cli specifically

Three primitives are available in the repo: rhino-cli (deterministic Go CLI), skills (knowledge injection), agents (LLM judgement). Each enforcement type has a natural primitive:

| Enforcement type                                                             | Right primitive | Why                                                                  |
| ---------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| Registry ↔ folder ↔ glossary ↔ Gherkin parity (boolean checks, every commit) | rhino-cli       | Deterministic, sub-second, runs in pre-push. Agent overkill.         |
| Glossary frontmatter, table schema, code-identifier existence (parse + grep) | rhino-cli       | Pure parse and grep. Agent non-deterministic and slow.               |
| BC list + layer rules + xstate placement (knowledge for dev agents)          | skill           | Auto-loads into ANY agent on organiclever. No new agent name to add. |
| Semantic UL drift (jargon detection, BC right-sizing, term-meaning slip)     | _agent (later)_ | Requires LLM judgement. Out of scope for this plan; YAGNI for now.   |

A new product-scoped agent (e.g. `swe-organiclever-dev`) would mix axes — existing `swe-*-dev` agents are language-scoped; adding a product-scoped one opens per-app sprawl. The skill is the right place for organiclever-specific DDD knowledge because it's consumed by `swe-typescript-dev`, `plan-executor`, future `swe-fsharp-dev` (when BE joins DDD), and any other agent that auto-loads it.

A new dedicated checker agent (e.g. `apps-organiclever-ddd-checker`) is **deliberately deferred**. Its only role would be semantic UL drift detection, which the existing `plan-checker` and `specs-checker` already partially cover when invoked. Adding a new checker = description + tools + model + governance + maker/checker/fixer triplet temptation; the cost-benefit doesn't justify it until rhino-cli is in production and observed drift it can't catch.

## Success criteria

| #   | Measure                                                                                 | Target                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `bounded-contexts.yaml` registry exists at `specs/apps/organiclever/`.                  | Single YAML file listing every BC with name, summary, layers, code, glossary, gherkin, relationships fields. Loaded by both subcommands.                                                                    |
| 2   | `rhino-cli bc validate organiclever` runs and enforces structural parity.               | Subcommand exists at `apps/rhino-cli/`. Exits zero on clean state, non-zero on drift. Has unit + integration godog scenarios. Coverage ≥90%.                                                                |
| 3   | `rhino-cli ul validate organiclever` runs and enforces glossary parity.                 | Subcommand exists. Exits zero on clean state, non-zero on drift. Has unit + integration godog scenarios. Coverage ≥90%.                                                                                     |
| 4   | Both subcommands wired into `nx run organiclever-web:test:quick` at error severity.     | `test:quick` invokes both; exits non-zero on either subcommand's findings. Single-wave at error severity from the start (DDD plan completes before this plan begins, so warnings just defer real findings). |
| 5   | `apps-organiclever-web-developing-content` skill includes Domain-Driven Design section. | Section covers BC list pointer, layer rules, xstate placement, cross-context calls, glossary authoring rules, pre-commit checklist. Concise — points to canonical sources, no duplication.                  |
| 6   | `apps/rhino-cli/README.md` documents both subcommands.                                  | New "DDD enforcement" subsection with usage examples and `--severity` flag.                                                                                                                                 |
| 7   | Existing rhino-cli targets remain green.                                                | `nx run rhino-cli:test:quick` and `nx run rhino-cli:test:integration` pass; coverage ≥90%.                                                                                                                  |
| 8   | DDD adoption plan's pre-push hook still passes.                                         | Adding the new subcommands does not regress `organiclever-web:test:quick` runtime beyond an acceptable budget (target: <5s additional wall-clock).                                                          |

## Risks

| Risk                                                                                                         | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rhino-cli bc validate` or `ul validate` ships with too-strict heuristics, blocking legitimate commits.      | Medium     | Medium | Final `Pre-flight` and Phase 6 quality-gate require one full clean `test:quick` run before merging the wiring. `--severity=warn\|error` flag supports per-environment override (default `error`); env var `ORGANICLEVER_RHINO_DDD_SEVERITY=warn` allows quick local downgrade if a false positive surfaces post-merge. False-positive findings tracked in a known-false-positives list rather than silenced.         |
| Subcommands tightly couple to `organiclever-web`'s exact registry path/format, hard to reuse for other apps. | Medium     | Low    | Subcommand signature is `rhino-cli bc validate <app>` from day one; takes the app name and resolves paths under `specs/apps/<app>/` and `apps/<app>-web/` relative to repo root. Reusable for `ayokoding-web`, `oseplatform-web`, future `organiclever-be` once they adopt DDD.                                                                                                                                      |
| Strict serial dependency on DDD adoption plan delays this plan if DDD plan is paused.                        | Low        | Medium | This plan does not start until the DDD adoption plan is in `plans/done/` and its final SHA is on `origin/main`. If the DDD plan stalls, this plan stalls — accepted trade-off because validating against a half-migrated codebase produces unreliable results (transient violations during migration commits, or subcommands passing against a temporarily-wrong state). Rollback path documented in `tech-docs.md`. |
| Glossary parser fragile against markdown formatter edits (e.g. table column whitespace).                     | Low        | Medium | Parser is whitespace-tolerant per the existing rhino-cli docs-validate parser style; integration godog scenarios include "table re-formatted by Prettier" cases.                                                                                                                                                                                                                                                     |
| Skill DDD section drifts from `tech-docs.md` of DDD plan (skill says one thing, plan says another).          | Medium     | Low    | Skill section is intentionally concise — points to `tech-docs.md` and the BC registry as canonical sources for full detail. PRs that change layer rules in `tech-docs.md` MUST update the skill section in the same commit (enforced by repo-rules-quality-gate).                                                                                                                                                    |
| Coverage regression in rhino-cli below 90% threshold during subcommand authoring.                            | Low        | Medium | TDD discipline: write godog scenarios first, implement until green. Coverage gate runs in `test:quick` and pre-push. New subcommand code is small enough to fully cover.                                                                                                                                                                                                                                             |
| `bounded-contexts.yaml` registry duplicates information already in `tech-docs.md` of DDD plan.               | High       | Low    | The registry is the single source of truth (machine-readable); `tech-docs.md` describes design intent (human-readable). Each has a different purpose. Cross-link both ways in the DDD plan and the registry README.                                                                                                                                                                                                  |

## Out of scope

- Polyglot import-graph subcommand (`rhino-cli bc deps`) — future plan.
- DDD adoption itself (sibling plan).
- New `swe-organiclever-dev` agent — wrong primitive (see "Why rhino-cli specifically").
- New `apps-organiclever-ddd-checker` agent — premature (deferred until rhino-cli is in production and observed drift it can't catch).
- F#/Giraffe `organiclever-be` DDD adoption.
- Other apps (`ayokoding-web`, `oseplatform-web`, `wahidyankf-web`) — neither uses bounded contexts today.
- Domain-event taxonomy, C4 parity, ADR-coverage check, aggregate-root marker, layer-purity per language.

## Stakeholders

- **Product owner**: Wahidyan Kresna Fridayoka.
- **Engineering**: Same.
- **Reviewers**: plan-checker → plan-fixer → plan-execution-checker.
- **Consuming agents (skill side)**: `swe-typescript-dev`, `plan-executor`, future `swe-fsharp-dev`, any agent that auto-loads `apps-organiclever-web-developing-content`.

## Decision record

- **2026-05-02**: Plan opened. Scope locked to two rhino-cli subcommands plus skill extension. Direct-to-main per Trunk Based Development. Subrepo worktree REQUIRED. Polyglot import-graph and dedicated DDD checker agent both deferred to future plans.
