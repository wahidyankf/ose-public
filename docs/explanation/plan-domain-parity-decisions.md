---
title: Plan Domain Parity — Design Decisions (2026-06-06)
description: >-
  Explanation of every decision made in the 2026-06-06 plan-domain-parity
  effort: what was decided across all 26 deviation-matrix rows, why each
  resolution was chosen, and what alternatives were rejected.
category: explanation
tags:
  - plan-domain-parity
  - multi-repo
  - governance
  - harness-bindings
  - opencode
  - codex
  - decision-log
created: 2026-06-06
---

# Plan Domain Parity — Design Decisions (2026-06-06)

This document records every decision made during the `plan-domain-parity` effort
(2026-06-06). The effort aligned the planning-system files across the sibling
repositories — ose-public and the private sibling — covering fourteen governance
markdown files, four AI agent definitions, three AI skills, and the
multi-harness binding surface. All 26 deviation-matrix rows were resolved in a
grilled session with the invoker on 2026-06-06 before any implementation began.

The full resolved matrix lives in
[`plans/done/2026-06-06__plan-domain-parity/tech-docs.md`](../../plans/done/2026-06-06__plan-domain-parity/tech-docs.md)
and the source matrix in `local-tmp/plan-domain-parity-matrix.md`.

## Background

The sibling repositories share a governance layer that was originally
authored in ose-public and propagated outward. Over time each repo accumulated
independent improvements — infra added mandatory grilling gates to a skill and
ose-public renamed a convention file. The gaps compounded until a structured
comparison revealed 26 distinct deviations. This document
explains the thinking behind every resolution.

## Survey Findings That Informed Decisions

The survey (empirical, 2026-06-06) established these facts before any decisions:

- `plan-quality-gate.md` is byte-identical in both repos — no action needed.
- `plan-multi-repo-parity-planning.md` exists only in ose-public.
- The grilling convention exists as `grilling-with-options.md` in ose-public and
  `grilling.md` (different name, broader wording) in the private sibling.
- The OpenCode emitter in rhino-cli still emits the deprecated boolean `tools`
  flags format (e.g., `tools: { read: true }`).
- The `.codex/agents/` directory is not an official OpenAI Codex CLI convention —
  the official path is `config.toml` `agents.<name>` sub-tables.
- Infra CI runs on self-hosted runners `[self-hosted, linux, ose-self-hosted]`;
  it cannot use `ubuntu-latest`.

Research findings from web-researcher (2026-06-06) are cited per decision
where relevant.

## Decisions by Matrix Row

Row numbers follow the plan's full deviation matrix. Rows that no longer bind the current parity
pair are omitted, so the sequence below skips.

### Row 1 — Parity Workflow Propagation

**Decision**: propagate `plan-multi-repo-parity-planning.md` from ose-public to
infra.

**Rationale**: the workflow must be invocable from any anchor repo. Keeping it
ose-public-only would force contributors in infra to switch repos to invoke a
cross-repo parity sweep.

### Row 2 — Parity Workflow Grill Structure

**Decision**: amend all copies of `plan-multi-repo-parity-planning.md` to add a
two-grill + web-research step: Survey → Matrix → First Grill (hard gate) →
web-researcher (conditional) → Second Grill (post-research) → Author → Gate →
Deliver.

**Rationale**: the invoker required this pattern (2026-06-06) to mirror the
structure already established in `plan-planning.md`. Decisions that
depend on external tool-convention research must not be locked in before the
research runs.

### Row 3 — plan-planning Merge; Worktree Default; target-stage

**Decision**: perform a best-of merge across both repos. The merged version
also adds a **new default behaviour**: plans are authored inside a
dedicated worktree (`worktrees/<identifier>/`), provisioned if absent via
`git worktree add -b <identifier> worktrees/<identifier> main` followed by
the repository-standard guarded install and transactional Doctor convergence:
`rtk ./hippo run --class ephemeral --disk-path . -- npm install`, then
`rtk npm run doctor -- --fix`. After delivery the worktree is
removed with `git worktree remove`.

**Rationale**: the invoker directed both the worktree default and the push
mechanics (HEAD pushed to the confirmed push target, defaulting to
`origin main`). The `target-stage` field is retained because ose-public and
the private sibling already use it; dropping it would be a regression. The
[Worktree Toolchain Initialization](../../repo-governance/development/workflow/worktree-setup.md)
convention covers the initialization sequence.

### Row 4 — plan-execution.md Drift

**Decision**: best-of merge; each repo's agent-selection lists are preserved
verbatim because they reference repo-specific agents.

**Rationale**: the merge captures improvements from all repos while keeping
repo-specific content that would be wrong if overwritten.

### Row 5 — workflows/plan/README.md Index

**Decision**: align the index post-propagation so both repos list the same
four workflows.

**Rationale**: follows from row 1 (the workflow now exists in both repos so it
must appear in both indexes).

### Row 6 — execution-modes.md Drift

**Decision**: best-of merge.

**Rationale**: the file had substantive divergence (40–102 changed lines) with no
repo-specific content that needed preservation.

### Row 7 — plan-maker Agent Drift

**Decision**: best-of merge; repo-specific cross-references preserved.

**Rationale**: same as row 4 — merge the improvements, keep the repo-specific
links.

### Row 8 — plan-checker Agent Drift

**Decision**: best-of merge.

**Rationale**: no repo-specific content; straightforward merge.

### Row 9 — Fixer Agent Drift

**Decision**: best-of merge.

**Rationale**: same as row 8.

**Superseded**: the fixer agent was later retired. `plan-quality-gate` became a governance gate that
repairs its own frozen ledger, so no separate fixer agent exists in either repository. This row is
kept as the historical record of the decision taken at the time.

### Row 10 — plan-execution-checker Agent Drift

**Decision**: best-of merge.

**Rationale**: same as row 8.

### Row 12 — plan-creating-project-plans Skill Drift; Infra Grilling Gates

**Decision**: best-of merge **including infra's mandatory grilling gates**.
The infra improvement — requiring grilling to be documented and verified before
plan authoring proceeds — is adopted across both repos.

**Rationale**: infra independently developed a stronger enforcement mechanism. The
[Documentation First](../../repo-governance/principles/content/documentation-first.md)
principle supports adopting the more rigorous approach. Importing an improvement
from a downstream repo is consistent with the bidirectional content-flow model.

### Row 13 — plan-writing-gherkin-criteria Skill Drift

**Decision**: merge (trivial — only 2–10 changed lines).

**Rationale**: the divergence was minor and non-structural.

### Row 14 — grill-me Skill Drift

**Decision**: best-of merge.

**Rationale**: 25–52 changed lines; no repo-specific content.

### Row 15 — Grilling Convention Naming

**Decision**: the merged content lands as `grilling-with-options.md` in both
repos. Infra renames its existing `grilling.md` to `grilling-with-options.md` and
runs a full link sweep.

**Rationale**: ose-public already named the file `grilling-with-options.md` and
all ose-public workflows and `AGENTS.md` cite that exact name. Renaming the
canonical file to match infra's shorter name would require a sweep of ose-public
instead — the sweep cost is lower when confined to infra's link graph, which is
smaller.

**Rejected alternative**: use infra's name `grilling.md` everywhere. Rejected
because it would force a larger sweep across ose-public.

### Row 16 — conventions/structure/plans.md Drift

**Decision**: best-of merge (107–125 changed lines).

**Rationale**: no repo-specific content; the merged version captures accumulated
improvements.

### Row 17 — Harness Binding Coverage Audit

**Decision**: perform a full repo-wide binding audit in each repo — all agents
checked against `.opencode/`, `.amazonq/`, and `.codex/`; `validate:harness-bindings`
(or equivalent) must pass with zero findings.

**Rationale**: the invoker chose maximal scope. A partial audit would leave gaps
that the triple-harness compatibility goal requires to be closed.

### Row 18 — OpenCode Emitter Format

**Decision**: modernize the rhino-cli OpenCode emitter in ose-public from the
deprecated boolean `tools` flags format to the `permission` object format
(`allow`/`ask`/`deny` per tool). After the code change, regenerate all 70
`.opencode/agents/*.md` mirrors.

**Rationale**: the OpenCode official documentation (accessed 2026-06-05 via
web-researcher) deprecates the boolean flags form in favor of the `permission`
object. Source:
<https://opencode.ai/docs/agents/> (accessed 2026-06-05).

**Implementation note** (design decision D3 in tech-docs.md): tools not listed in
the Claude frontmatter are **omitted** from the `permission` block rather than
emitted as `deny`. Emitting blanket `deny` entries would require enumerating
OpenCode's tool universe, which is a moving target. Omission is the minimal
faithful translation — OpenCode's own defaults apply for unlisted tools.

### Row 19 — .codex/agents/ Directory Removal

**Decision**: migrate per-agent Codex configuration from `.codex/agents/<name>.toml`
files into `config.toml` `agents.<name>` sub-tables; stop treating
`.codex/agents/` as an official directory.

**Rationale**: the OpenAI Codex CLI official documentation documents only two
sub-table keys — `config_file` and `description`. The `.codex/agents/` per-agent
directory pattern is not an officially recognized Codex convention.
Source: <https://developers.openai.com/codex/config-reference> (accessed
2026-06-05 via web-researcher).

#### ose-public Nuance (Design Decision D5)

ose-public's `rhino-cli` **never emitted** `.codex/agents/`. The
`emit_bindings` function in `bindings.rs` writes exactly two Amazon Q files;
no code path references a Codex emission directory. The matrix row's
"stop emitting `.codex/agents/`" therefore translates in ose-public to two
distinct actions:

1. **Migrate the one hand-maintained file**: `.codex/agents/ci-monitor-subagent.toml`
   held a `developer_instructions` string. Its config pointer
   (`config_file = "agents/ci-monitor-subagent.toml"` in `config.toml`) is
   updated. At execution time a single WebFetch against the authoritative
   config-reference URL determines whether `developer_instructions` can be
   inlined directly into the `[agents.ci-monitor-subagent]` sub-table (preferred)
   or must remain in a relocated file at `.codex/ci-monitor-subagent.toml`
   (fallback). Either branch satisfies the acceptance criterion: the sub-table
   carries the config and `.codex/agents/` no longer exists.
2. **Add a negative guard to `validate_bindings`**: a new unit-tested check fails
   when `.codex/agents/` is detected, preventing the unofficial directory from
   reappearing. This guard is the ose-public-specific code change for row 19 —
   sibling repos handle their own emitter realities in their own plans.

This distinction between "guard, not emitter change" is recorded so contributors
reading this doc do not expect a Codex emission-path removal in the rhino-cli
source that was never there.

### Row 20 — generate:bindings Invocation Alignment

**Decision**: align both repos to invoke the rhino-cli binary directly via
`cargo run --manifest-path <path-to-Cargo.toml>`.

**Rationale**: uniform invocation simplifies cross-repo maintenance. The accepted
trade-off is losing the Nx build-cache wrapper around the rhino-cli compilation
step for infra.

### Row 24 — Rationale Doc Location

**Decision**: the rationale document (`docs/explanation/plan-domain-parity-decisions.md`)
is placed in both repos at the same relative path.

**Rationale**: uniform placement makes cross-repo navigation predictable. The infra
repo already has a `docs/explanation/` tree. This document is the instantiation of
that decision.

### Row 25 — Slug, Stage, Gate

**Decision**: slug `plan-domain-parity`, stage `plans/in-progress/`, gate
`plan-quality-gate.md` strict double-zero.

**Rationale**: these are standard plan metadata fields. The strict double-zero gate
requires zero open checklist items and zero outstanding review comments before
delivery is accepted.

### Row 26 — Drift Guard Deliberately Dropped

**Decision**: no automated cross-repo drift checker is added. The upstream-first
editing discipline is left implicit — contributors edit in ose-public first and
propagate via the established sync agents.

**Rationale**: the invoker decided against adding tooling for this. The decision is
recorded explicitly so that future contributors understand the absence of a drift
guard is deliberate, not an oversight. Anyone reviewing this doc and finding
ose-public and infra drifting again should not assume a drift guard will
catch it — they should initiate a new parity effort.

**Rejected alternative**: add a `validate:cross-repo-drift` Nx target or CI step.
Rejected on complexity grounds — the invoker judged the maintenance burden of such
a checker (keeping file lists current, handling intentional deviations) higher than
the benefit given the low frequency of parity sweeps.

## Research Citations

All web research performed by web-researcher on 2026-06-05 to 2026-06-06:

- **OpenCode agents format** (boolean `tools` → `permission` object, rows 18 and
  17): <https://opencode.ai/docs/agents/> (accessed 2026-06-05)
- **OpenCode skills** (`.claude/skills/<name>/SKILL.md` natively, no mirror
  needed): <https://opencode.ai/docs/skills/> (accessed 2026-06-05)
- **Amazon Q Developer CLI** (`.amazonq/rules/` + `.amazonq/cli-agents/*.json`;
  does not read AGENTS.md natively; bridge mechanism correct): row 17 validation.
  <https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-custom-agents.html>
  (accessed 2026-06-05)
- **OpenAI Codex CLI** (reads AGENTS.md natively via directory-walk; `.codex/agents/`
  not official; official path is `config.toml` `agents.<name>` sub-tables with
  `config_file` and `description` keys; rows 19 and D4):
  <https://developers.openai.com/codex/guides/agents-md> (accessed 2026-06-05),
  <https://developers.openai.com/codex/config-reference> (accessed 2026-06-05)
- **Multi-repo sync prior art** (no OSS tool performs 3-way semantic merge of
  hand-edited governance docs; manual semantic 3-way merge is the justified
  approach): surveyed repo-file-sync-action, cruft, copier, and symlink approaches
  (accessed 2026-06-06)

## Relation to Other Documents

- [Technical Documentation (tech-docs.md)](../../plans/done/2026-06-06__plan-domain-parity/tech-docs.md) —
  full embedded matrix, design decisions D1–D7, file impact table, testing
  strategy, and rollback plan
- [Plan README](../../plans/done/2026-06-06__plan-domain-parity/README.md) — delivery
  checklist and phase structure
- [Worktree Toolchain Initialization](../../repo-governance/development/workflow/worktree-setup.md) —
  provisioning sequence referenced by row 3
- [Platform Bindings Reference](../reference/platform-bindings.md) — full catalog
  of binding directories affected by rows 17–20
- [Multi-Harness Binding Convention](../../repo-governance/conventions/structure/multi-harness-binding.md) —
  two-tier binding model governing rows 17–19
