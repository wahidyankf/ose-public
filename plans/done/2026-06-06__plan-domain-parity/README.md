# Plan Domain Parity — ose-public (Upstream Reference)

**Status**: In Progress (authored 2026-06-06)
**Slug**: `plan-domain-parity`
**Repo**: `ose-public` — the upstream source of truth in the 3-repo parity set
**Mode**: worktree-to-main (commit in `worktrees/plan-domain-parity/`, push `HEAD` to `origin main`)
**Quality gate**: plan-quality-gate, strict double-zero (matrix row 25)

## Context

The plan domain — `repo-governance/workflows/plan/`, its four plan agents
(`plan-maker`, `plan-checker`, `plan-fixer`, `plan-execution-checker`), its three skills
(`plan-creating-project-plans`, `plan-writing-gherkin-criteria`, `grill-me`), the grilling
convention, and the plans-organization convention — exists in three sibling repositories:
`ose-public`, `ose-primer`, and `ose-infra`. Each copy has drifted independently
(per-file pairwise drift of 2–243 changed lines, surveyed 2026-06-06). Drift means a fix or
improvement landed in one repo silently fails to reach the others, and agents behave
differently depending on which repo they run in.

The invoking objective (verbatim): "same and similar quality and behavior of
`repo-governance/workflows/plan/` and its related agents, and skills in ose-infra,
ose-primer, and ose-public". This plan covers the **ose-public** side. Because ose-public is
the upstream reference, every drifted file gets a **3-way best-of merge here first**; the
sibling plans then adopt the merged canon.

All macro decisions were grilled and resolved with the invoker on 2026-06-06 and recorded in
the deviation matrix — embedded verbatim in [tech-docs.md](./tech-docs.md). Zero rows remain
undecided.

## Scope

### In Scope (ose-public)

1. **3-way best-of merges** (matrix rows 3–16) of fourteen plan-domain files: the
   plan-establishment-execution, plan-execution, and plan README workflow docs; the
   execution-modes meta workflow; the four plan agents; the three plan skills; the
   grilling-with-options convention; and the plans-organization convention. Sibling inputs
   live at `~/ose-projects/ose-primer/` and `~/ose-projects/ose-infra/`
   (same relative paths; infra's grilling convention is at
   `repo-governance/development/workflow/grilling.md`).
2. **New default worktree behavior** in the merged
   [plan-establishment-execution.md](../../../repo-governance/workflows/plan/plan-establishment-execution.md)
   (matrix row 3): plans are authored in `worktrees/<identifier>/`, provisioned if absent,
   committed in the worktree, pushed `HEAD` to the confirmed push target (default
   `origin main`), worktree removed after delivery.
3. **Parity workflow restructure** (matrix row 2):
   [plan-multi-repo-parity-planning.md](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
   steps become Survey → Matrix → First Grill (hard gate) → web-researcher (conditional)
   → Second Grill (post-research) → Author → Gate → Deliver.
4. **rhino-cli emitter work** in `apps/rhino-cli/` (Rust, TDD-shaped): OpenCode emitter
   migrates deprecated boolean `tools` flags to the `permission` object (row 18); Codex
   per-agent config migrates to `.codex/config.toml` `agents.<name>` sub-tables with
   `.codex/agents/` removed and guarded against reappearing (row 19).
5. **Full repo-wide binding audit** (row 17): all 70 agents × `.opencode`/`.amazonq`/`.codex`
   verified; `npm run validate:harness-bindings` and `npm run validate:sync` pass after
   regeneration.
6. **Rationale doc**: `docs/explanation/plan-domain-parity-decisions.md` (_New file_)
   explaining every matrix decision in plain language, especially deviations.
7. **Governance doc updates** touched by rows 18–20: `CLAUDE.md` and
   [ai-agents.md](../../../repo-governance/development/agents/ai-agents.md) ("boolean flags"
   wording now refers to the deprecated form),
   [platform-bindings.md](../../../docs/reference/platform-bindings.md),
   [multi-harness-binding.md](../../../repo-governance/conventions/structure/multi-harness-binding.md),
   and the workflow indexes.

### Out of Scope

- **Sibling repo execution** — ose-primer and ose-infra each have their own self-contained
  plan (see Sibling Plans below). This plan only reads sibling files as merge inputs; it
  writes nothing outside ose-public.
- **Automated cross-repo drift guard** — deliberately dropped (matrix row 26);
  upstream-first editing remains an implicit discipline.
- **`generate:bindings` script change** — ose-public already invokes
  `cargo run --manifest-path apps/rhino-cli/Cargo.toml` directly (row 20 target state)
  `[Repo-grounded]`; only a verification step is included.
- **primer dual-CLI Go port** (row 21) and **primer plan-overhaul absorption** (row 23) —
  primer-plan scope.
- **infra grilling.md rename + link sweep** (row 15 infra half) — infra-plan scope.

## Approach Summary

Eight delivery phases (see [delivery.md](./delivery.md)): Phase 0 environment baseline →
three docs-merge phases (workflows, agents, skills/conventions) → two TDD code phases on
`apps/rhino-cli` (OpenCode `permission` emitter; Codex migration + guard) → binding audit +
harness-doc updates → rationale doc, final gates, push, archival. Every phase ends with a
must-pass gate and a pause-safety note. All technical decisions, the full verbatim deviation
matrix, and the research citations live in [tech-docs.md](./tech-docs.md).

## Sibling Plans

The three plans were authored in parallel by the plan-multi-repo-parity-planning workflow.
Each is self-contained, with its own merge steps referencing the sibling clone paths.

| Repo       | Plan path (within that repo)                                 | Local clone root            |
| ---------- | ------------------------------------------------------------ | --------------------------- |
| ose-public | `plans/in-progress/plan-domain-parity/README.md` (this plan) | `~/ose-projects/ose-public` |
| ose-primer | `plans/in-progress/plan-domain-parity/README.md`             | `~/ose-projects/ose-primer` |
| ose-infra  | `plans/in-progress/plan-domain-parity/README.md`             | `~/ose-projects/ose-infra`  |

**Recommended execution order**: execute **this plan first** — the merged canon lands
upstream in ose-public — then the primer and infra plans adopt it. Sibling paths are given
as plain code spans (not markdown links) because they resolve in different repositories.

## Document Map

| Document                       | Contents                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [brd.md](./brd.md)             | WHY — business goal, impact, affected roles, success criteria, non-goals, business risks                                              |
| [prd.md](./prd.md)             | WHAT — personas, user stories, Gherkin acceptance criteria, product scope                                                             |
| [tech-docs.md](./tech-docs.md) | HOW — architecture, design decisions, file impact, **full verbatim deviation matrix**, research citations, testing strategy, rollback |
| [delivery.md](./delivery.md)   | DO — executor legend, worktree spec, Phase 0–7 checklists with gates and pause-safety notes                                           |

## Git Workflow

Trunk Based Development, worktree-to-main: all work happens in
`worktrees/plan-domain-parity/` (branch `plan-domain-parity` cut from `main`); commits are
thematic Conventional Commits; delivery pushes `git push origin HEAD:main` directly — **no
PR** (no explicit PR instruction exists; per the
[Git Push Default Convention](../../../repo-governance/development/workflow/git-push-default.md),
worktree execution does not change the direct-push default). The worktree is removed after
delivery. See the `## Worktree` section in [delivery.md](./delivery.md).

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
