# OrganicLever — rhino-cli DDD Enforcement + Skill Extension

**Status**: In Progress
**Owner**: Wahidyan Kresna Fridayoka
**Started**: 2026-05-02
**Scope**: `ose-public` only — `apps/rhino-cli/`, `specs/apps/organiclever/bounded-contexts.yaml`, `.claude/skills/apps-organiclever-web-developing-content/`
**Subrepo worktree**: REQUIRED — Scope A per the parent repo's Subrepo Worktree Workflow Convention. Run all delivery items inside `.claude/worktrees/organiclever-rhino-cli-ddd-enforcement/` after `cd ose-public && claude --worktree organiclever-rhino-cli-ddd-enforcement`; initialize the worktree per [Worktree Toolchain Initialization](../../../governance/development/workflow/worktree-setup.md). Publish path: **direct-to-main** (Trunk Based Development default for `ose-public`).

## Goal

Add two new `rhino-cli` subcommands and one skill extension that together form the **mechanical drift gate** and the **dev-time knowledge layer** for OrganicLever's DDD adoption:

1. `rhino-cli bc validate <app>` — validates structural parity between the bounded-context registry, code folders, glossary files, and Gherkin folders.
2. `rhino-cli ul validate <app>` — validates ubiquitous-language glossary structural parity (frontmatter, table schema, code-identifier existence, cross-context term collisions).
3. Extend `.claude/skills/apps-organiclever-web-developing-content/SKILL.md` with a Domain-Driven Design section so any agent working on `organiclever-web` auto-loads the BC list, layer rules, xstate placement rule, cross-context call rules, and glossary authoring rules.

The two subcommands run in `nx run organiclever-web:test:quick` and therefore in the pre-push hook. The skill auto-loads into developer agents during authoring.

## Why now

The sibling [`2026-05-02__organiclever-adopt-ddd`](../../done/2026-05-02__organiclever-adopt-ddd/README.md) plan migrates `organiclever-web` to a bounded-context layout. Once the migration lands, the plan's correctness lives in **eight artefacts that must stay in lockstep**: code folder, layer subfolders, ESLint boundaries config, Gherkin folder, glossary file, registry, ADR, and skill. Without mechanical enforcement, drift between these eight is inevitable — humans add terms in code without updating the glossary, agents place new files in the wrong layer, glossaries accumulate stale `Code identifier(s)` entries.

ESLint boundaries (provided by the DDD adoption plan) covers code-import boundaries inside TypeScript. It does **not** cover the registry ↔ glossary ↔ Gherkin parity, ubiquitous-language drift, or the eventual polyglot case when `organiclever-be` joins DDD. `rhino-cli` is the right tool because it already runs in the pre-push hook for spec-coverage and link validation; the same discipline can catch DDD drift.

The skill extension is cheap insurance: the existing `apps-organiclever-web-developing-content` skill already auto-loads when agents work on `organiclever-web`. Adding a Domain-Driven Design section costs one append; the payoff is every dev session starts with the right mental model already in context.

## Dependencies

**Hard dependency — strict serial**: [`2026-05-02__organiclever-adopt-ddd`](../../done/2026-05-02__organiclever-adopt-ddd/README.md) MUST be **fully complete and archived** to `plans/done/` before any phase of this plan begins. Reasons:

- The registry YAML lists every BC `code` path; those folders are fully populated only after the DDD adoption plan completes its phased migration.
- The glossary files (consumed by `ul validate`) are authored during the DDD plan's ubiquitous-language scaffolding phase and only stabilise at the end of its spec-reorganization phase.
- The skill DDD section points to the BC layout, layer rules, xstate placement rule, and bounded-context-map ADR — all of which are authored and stabilised by DDD adoption.
- Running this plan against a half-migrated codebase would either (a) ship subcommands that pass against a temporarily-wrong state, or (b) flag transient violations during migration commits that aren't real drift.

The `Pre-flight` phase of this plan's `delivery.md` therefore opens with an explicit gate: confirm the DDD adoption plan is in `plans/done/` and its final SHA is on `origin/main` before proceeding.

This plan ships as a **single wave** (not two) — both subcommands land at **error severity** from the start, because by the time this plan begins the DDD migration is complete and stable, so warnings would just defer real findings.

## What changes

| Area                                                                         | Change                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/apps/organiclever/bounded-contexts.yaml`                              | New registry file. Single source of truth for the BC map: name, summary, layers, code path, glossary path, gherkin path, relationships.                                                                                                                                                                                                                                             |
| `apps/rhino-cli/`                                                            | Two new Cobra subcommands (`bc validate`, `ul validate`) implemented in Go, following existing rhino-cli patterns (golang-commons, Cobra, godog at unit + integration levels per the [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)). New godog Gherkin scenarios under `specs/apps/rhino-cli/`. ≥90% coverage maintained. |
| `apps/organiclever-web/project.json`                                         | `test:quick` target extended to call `rhino-cli bc validate organiclever` and `rhino-cli ul validate organiclever`, both gated by a `--severity=warn\|error` flag controlled by an env var to support the warning→error flip.                                                                                                                                                       |
| `.claude/skills/apps-organiclever-web-developing-content/SKILL.md`           | New "Domain-Driven Design" section appended. Pointers to canonical sources (`tech-docs.md` of DDD plan, BC registry, glossary folder). Concise — does NOT duplicate authoritative content.                                                                                                                                                                                          |
| `apps/rhino-cli/README.md`                                                   | New "DDD enforcement" subsection documenting the two subcommands.                                                                                                                                                                                                                                                                                                                   |
| `governance/development/quality/three-level-testing-standard.md` (no change) | Validates compatibility of the new subcommands' three-level test layout.                                                                                                                                                                                                                                                                                                            |
| `specs/apps/rhino-cli/`                                                      | New Gherkin scenarios for `bc validate` and `ul validate` (consumed by both unit and integration godog suites per existing rhino-cli pattern).                                                                                                                                                                                                                                      |

## What does **not** change

- DDD adoption itself — that's the sibling plan. This plan does not touch `apps/organiclever-web/src/contexts/` layout, the ESLint boundaries config, the layer rules, or the bounded-context map ADR.
- ubiquitous-language glossary content — schema is enforced, content authored in DDD plan.
- F#/Giraffe `organiclever-be` is **out of scope** — although the registry schema is intentionally polyglot-ready, BE adoption of DDD is a separate future plan.
- Other apps (`ayokoding-web`, `oseplatform-web`, `wahidyankf-web`) — neither uses bounded contexts today; they are out of scope for this enforcement.

## Plan documents

| Document                       | Purpose                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [README.md](./README.md)       | Overview + navigation (this file).                                                                                                            |
| [brd.md](./brd.md)             | Business rationale, success measures, risks.                                                                                                  |
| [prd.md](./prd.md)             | Product requirements with Gherkin acceptance criteria.                                                                                        |
| [tech-docs.md](./tech-docs.md) | Subcommand architecture, registry YAML schema, glossary parser design, skill content sketch, three-level testing layout, decisions, rollback. |
| [delivery.md](./delivery.md)   | TDD-shaped step-by-step checklist across 7 phases (0–6).                                                                                      |

## Out of scope

- Polyglot import-graph subcommand (`rhino-cli bc deps`) — explicitly deferred to a future plan; ESLint boundaries already covers TS in the DDD adoption plan, F#/Giraffe BE doesn't yet adopt DDD.
- Domain-event taxonomy enforcement — DDD doesn't require events.
- C4 model parity — solo project, low payoff.
- ADR-coverage check — repo-rules-quality-gate already covers governance docs.
- Aggregate-root marker file — too much human judgment, marker is brittle.
- Layer-purity rules per language (e.g. "no React in `domain/`") — language-specific; ESLint covers TS, future BE plan can add equivalent for F#.

## Acceptance summary

This plan is done when **all** of the following are true:

1. `specs/apps/organiclever/bounded-contexts.yaml` exists and lists every bounded context in the DDD plan's BC map.
2. `rhino-cli bc validate organiclever` exits zero against the current state and exits non-zero when any structural-parity rule is violated.
3. `rhino-cli ul validate organiclever` exits zero against the current state and exits non-zero when any glossary-parity rule is violated.
4. Both subcommands run in `nx run organiclever-web:test:quick` at **error severity** (this plan ships single-wave at error severity from the start; see "Dependencies").
5. `apps/rhino-cli/` maintains ≥90% line coverage per the existing Go-CLI threshold.
6. `.claude/skills/apps-organiclever-web-developing-content/SKILL.md` includes a Domain-Driven Design section that points to canonical sources without duplicating authoritative content.
7. `apps/rhino-cli/README.md` documents both subcommands with usage examples.
8. The plan-execution-checker validates every Gherkin acceptance criterion in `prd.md` against the final state.

## Related

- [OrganicLever DDD Adoption Plan (sibling, hard dependency)](../../done/2026-05-02__organiclever-adopt-ddd/README.md)
- [Domain-Driven Design (DDD) — Authoritative Standards](../../../docs/explanation/software-engineering/architecture/domain-driven-design-ddd/README.md)
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)
- [Trunk Based Development Convention](../../../governance/development/workflow/trunk-based-development.md)
- [rhino-cli README](../../../apps/rhino-cli/README.md)
- [apps-organiclever-web-developing-content skill](../../../.claude/skills/apps-organiclever-web-developing-content/SKILL.md)
