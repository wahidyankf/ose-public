# Plan: Scout-First Tiering, Cycle-Number Visibility, and a Type-Soundness Discipline for the PR Review Cycle

## Context

The PR Review Quality Gate pipeline is not `ose-public`-only governance: it is duplicated,
byte-for-byte-independent, in all **four** OSE repos —
[`ose-public`](https://github.com/wahidyankf/ose-public),
[`ose-primer`](https://github.com/wahidyankf/ose-primer),
the private sibling (private, not linked), and
[`beaver-nest`](https://github.com/wahidyankf/beaver-nest) — each carrying its own
`repo-governance/workflows/pr/pr-review-quality-gate.md`,
`repo-governance/development/quality/pr-review-disciplines.md`, and 10
`.claude/agents/pr-review-*.md` files. Live-verified 2026-08-05 (see
[brd.md's Current-State Baseline](./brd.md#current-state-baseline-mechanically-verified-2026-08-05)
for the exact per-repo counts): each repo runs a nine-agent pipeline (eight sonnet-tier discipline
specialists plus the opus-tier `pr-review-synthesis-maker` coordinator) across a fixed 3-cycle loop,
feeding the unchanged `pr-review-fixer`. The maintainer identified three concrete gaps, present
identically in all four repos' live pipelines:

1. **No cycle number in the posted review.** The Consolidated Review Header already records risk
   tier, specialist set, diff coverage, and human-dismissal count — but not which of the 3 cycles
   produced it. A reviewer scanning a PR's review history cannot tell cycle 1's findings from cycle
   3's without cross-referencing timestamps, which blocks tracking whether later cycles find fewer
   issues (the "healthy trend" the workflow's own Success Metrics section already wants to observe).
2. **Risk-tier classification is a buried sub-duty, not a first-class step.** `pr-review-synthesis-maker`
   already classifies each PR into `trivial`/`lite`/`full` and selects the specialist set (D12) —
   but it does this as one of several pre-fan-out duties squeezed into the same opus-tier agent that
   then ALSO does the highest-risk post-fan-out job (owning the architecture-vs-correctness
   re-categorization boundary). Nothing separates "decide what this PR needs" from "consolidate what
   the specialists found."
3. **No discipline owns type-system soundness.** The eight-discipline table
   ([pr-review-disciplines.md §The Nine Reviewer Disciplines](../../../repo-governance/development/quality/pr-review-disciplines.md#the-nine-reviewer-disciplines) —
   eight before this plan, now nine)
   covers architecture, correctness, governance, security, CI-gaming, performance, docs, and
   instruction-decay — none of which owns whether a change's **types** are sound. A compiler already
   blocks a change that does not type-check; nothing in the pipeline flags a change that type-checks
   but is unsound (an unjustified `any`, a non-exhaustive match, a panic-prone `unwrap()` on a
   fallible path) across the four production languages these repos ship (TypeScript, Rust, F#, C#).

All three gaps are structural to the pipeline's design, not an `ose-public`-specific accident — so
this plan closes them identically in all four repos rather than leaving three repos on the
now-superseded eight-agent shape.

> Requested 2026-08-05. Grilled via `AskUserQuestion` before authoring — see
> [Resolved Design Decisions](#resolved-design-decisions-from-grilling) below.

## Scope

**Repo scope**: all four OSE repos — `ose-public`, `ose-primer`, the private sibling, `beaver-nest` — each
carrying its own independent copy of the PR Review Quality Gate pipeline. This is a fifth kind of
cross-repo boundary, distinct from the two already named in
[Related Repositories](../../../docs/reference/related-repositories.md) (content-parity is
`ose-public` ↔ `ose-primer` only; `apps/rhino-cli` byte-identity spans three of the four with zero
carve-outs) — the PR Review Cycle boundary spans **all four**, since every repo runs its own
independent instance of this governance tooling rather than sharing or mirroring a canonical copy.

**In scope, applied identically in each of the four repos** (repo-specific wording divergences
called out explicitly in [brd.md's baseline](./brd.md#current-state-baseline-mechanically-verified-2026-08-05)
and [tech-docs.md's File-Impact Analysis](./tech-docs.md#file-impact-analysis) — this is NOT a blind
four-way broadcast of one diff):

- Add a `**Cycle**: N of {total}` field to the Consolidated Review Header
  (`pr-review-synthesis-maker.md`'s header block and `pr-review-quality-gate.md`'s documentation of
  it).
- A new `pr-review-scout-maker` agent that becomes pipeline stage 0 each cycle: it owns risk-tier
  classification (D12), specialist-set selection, shared-context-brief assembly (D13), and the
  prior-cycle human-dismissal read — duties `pr-review-synthesis-maker` currently performs itself.
  `pr-review-synthesis-maker` is trimmed to its post-fan-out job only: dedup, re-categorize,
  reasonableness-filter, tool-verify, post.
- A new ninth discipline, **type-soundness**, owned by a new `pr-review-types-maker` specialist,
  scoped across TypeScript, Rust, F#, and C# — the four production languages this repo family ships.
- Every doc/agent file this ripples into, per repo: `pr-review-disciplines.md`,
  `pr-review-quality-gate.md`, `pr-review-synthesis-maker.md`, the two new agent files,
  `.claude/agents/README.md`, `AGENTS.md`'s PR Review Cycle summary (wording differs per repo — see
  the baseline), and the `.opencode/`/`.cursor/`/`.amazonq/` mirrors regenerated from them.
- Dogfooding: each repo's own delivering PR runs **that repo's own newly-updated** pipeline shape
  against itself — four independent first-runs, not one (see
  [Worktree and Delivery Mode](#worktree-and-delivery-mode) below).

**Out of scope (for now)**:

- A persistent, queryable metrics log across cycles/PRs (e.g. a `generated-reports/` running file).
  The maintainer chose header-fields-only for this plan — see
  [Resolved Design Decisions](#resolved-design-decisions-from-grilling). Deferred to a future idea if
  the header proves insufficient for tracking efficiency trends over time.
- Provisioning a dedicated bot/GitHub App identity to unblock `REQUEST_CHANGES` — tracked separately
  by [`plans/ideas/pr-review-bot-identity.md`](../../ideas/q2-not-urgent-important/pr-review-bot-identity.md), unaffected by
  this plan.
- A merge queue for precondition (c) — tracked separately by
  [`plans/ideas/merge-queue-adoption.md`](../../ideas/q2-not-urgent-important/merge-queue-adoption.md), unaffected by this
  plan.
- Promoting the type-soundness discipline into the four-specialist `lite` tier. It launches
  `full`-tier-only, per the same "new disciplines start conservative, earn their tier via
  post-cutover acceptance-rate data" posture the convention already applies to `performance` and
  `docs` (its own two most-recently-added disciplines), in every repo. Revisit once
  [Post-Cutover Monitoring](../../../repo-governance/development/quality/pr-review-disciplines.md#post-cutover-monitoring-plan)
  has data on it.
- Reconciling the four repos' pipelines into one shared/mirrored source. Each repo keeps its own
  independent copy after this plan, exactly as before it — this plan lands the same enhancement four
  times, it does not introduce a new sharing mechanism (that would be a much larger, separately-scoped
  change, and is not what was asked for).

## Approach Summary

Three independent-but-related enhancements, landed together because they touch the same small set of
files and the same nine-(soon-eleven)-agent pipeline — applied once per repo, as four independent
delivery units (see [Parallelization Model](./delivery.md#parallelization-model)):

```mermaid
%% Color palette: Blue #0173B2 (scout, new), Teal #029E73 (specialists, incl. new types),
%% Purple #CC78BC (coordinator, trimmed), Orange #DE8F05 (fixer, unchanged)
flowchart LR
  SC["pr-review-scout-maker<br/>(NEW stage 0)"]:::blue --> FAN["up to 9 tier-selected<br/>specialists (DD-10 may skip 2)"]:::teal
  FAN --> SY["pr-review-synthesis-maker<br/>(trimmed)"]:::purple
  SY --> FX["pr-review-fixer"]:::orange

  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
  classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF
  classDef purple fill:#CC78BC,stroke:#000000,color:#000000
  classDef orange fill:#DE8F05,stroke:#000000,color:#000000
```

Full design rationale, the updated Loop Algorithm, and both new agents' complete charters live in
[tech-docs.md](./tech-docs.md).

## Resolved Design Decisions (from grilling)

Four decisions were grilled with the maintainer via `AskUserQuestion` before any file was touched;
all four selected the recommended option:

1. **Execution Delivery Mode**: `worktree-to-pr` (the repo default), run independently **once per
   repo** — each of the four repos' own delivering PR runs that repo's own PR Review Quality Gate
   workflow against itself, dogfooding the new scout+types pipeline shape in that repo before it
   becomes the standing shape for every future `*-to-pr` PR there. Four repos, four worktrees, four
   PRs — strict 1-PR-↔-1-worktree per [AGENTS.md §Delivery
   Mode](../../../AGENTS.md#delivery-mode), since the four repo tracks are fully independent of each
   other (none blocks or depends on another).
2. **Scout placement**: `pr-review-scout-maker` **replaces** `pr-review-synthesis-maker`'s D12/D13
   pre-fan-out duties outright (not an advisory-only first opinion `pr-review-synthesis-maker` can
   override) — a clean stage split, not a second opinion layered on the same duties.
3. **Type-soundness scope**: cross-language from day one — TypeScript, Rust, F#, and C# — mirroring
   how `governance`/`security`/`logic` are already cross-language generalists rather than
   per-language specialists.
4. **Metrics tracking**: header-fields-only for now (`**Cycle**: N of {total}` plus the tier/rationale
   fields scout already produces) — no new persistent log artifact. The existing
   [Post-Cutover Monitoring Plan](../../../repo-governance/development/quality/pr-review-disciplines.md#post-cutover-monitoring-plan)
   stays the periodic, manually-run measurement process it already is.

Two additional decisions were **not** grilled (judged low-stakes enough to decide directly, recorded
here for auditability rather than re-litigated):

- **`pr-review-scout-maker`'s model tier is `opus`, matching `pr-review-synthesis-maker`, not
  `sonnet`.** `pr-review-synthesis-maker.md`'s own existing justification for its opus tier names
  the D12/D13 pre-fan-out duties explicitly as one of the reasons opus is required ("errors here are
  not correctable downstream the way a single specialist's miss is... nobody catches a bad risk-tier
  or context-assembly call except this agent"). Moving those duties to a new agent does not change
  their risk profile — the same justification now applies to `pr-review-scout-maker` directly. See
  [tech-docs.md Design Decision DD-1](./tech-docs.md#design-decisions) for the full cost/rationale
  tradeoff this introduces (a second opus-tier call per cycle instead of one).
- **Repo scope is all four repos, decided directly by the maintainer's explicit instruction** ("make
  sure its scope is all 4 ose repos"), not re-grilled with `AskUserQuestion` — the three underlying
  design questions (scout placement, type-soundness language scope, metrics tracking) were already
  grilled once and apply identically regardless of repo count, so re-grilling would have re-litigated
  settled decisions rather than surfaced a new one. What changed is delivery footprint, not design.

Live verification (2026-08-05) confirmed all four repos run byte-for-byte-independent but
structurally identical pipelines (10 `pr-review-*.md` agents each, same discipline/workflow doc
shape) — see [brd.md's baseline](./brd.md#current-state-baseline-mechanically-verified-2026-08-05)
for the exact per-repo counts and the specific wording divergences (the private sibling's `AGENTS.md`
names disciplines explicitly rather than saying "eight"; `ose-primer`'s `AGENTS.md` sits far closer
to its byte ceiling than the other three) that make this **not** a safe blind four-way broadcast of
one diff.

## Worktree and Delivery Mode

**Delivery Mode**: `worktree-to-pr` (see
[Plans Organization Convention §Delivery Mode](../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)),
run as **four independent tracks, one per repo**. Each track executes in its own dedicated worktree
inside that repo (`worktrees/pr-review-cycle-scout-and-typesafety/` in each of `ose-public`,
`ose-primer`, the private sibling, `beaver-nest`), opens its own PR against that repo's own `main`, and runs
that repo's own (pre-this-plan, unmodified) PR Review Quality Gate workflow for 3 cycles before an
`[AI]` merge under the five hardened preconditions — four PRs total, none blocking any other. See
[delivery.md's Parallelization Model](./delivery.md#parallelization-model) for the full DAG and the
chosen fan-out width.

**This plan-authoring itself** (the five documents in this folder) is written directly on local `main`
in `ose-public`'s primary checkout, per the established plan-docs-on-main practice — the plan folder
lives only in `ose-public` (the other three repos have no `plans/` entry for this work); only the
plan's own _execution_ phases (Phase 1 onward per track, see [delivery.md](./delivery.md)) happen in
each repo's worktree. Because the plan folder lives in `ose-public` only, the
[Archival-in-PR HARD RULE](../../../AGENTS.md#delivery-mode) applies to `ose-public`'s own delivering
PR (archival lands inside that PR before merge); the other three repos' PRs carry no `plans/` content
at all and so have no archival step of their own — this is the ordinary cross-repo carve-out from that
same rule, not a special case invented for this plan.

## Related Documentation

- [brd.md](./brd.md) — business rationale, current-state baseline, success metrics
- [prd.md](./prd.md) — product scope, personas, Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — architecture, design decisions, full new-agent charters
- [delivery.md](./delivery.md) — phased execution checklist
- [PR Review Quality Gate workflow](../../../repo-governance/workflows/pr/pr-review-quality-gate.md)
- [PR Reviewer-Discipline Convention](../../../repo-governance/development/quality/pr-review-disciplines.md)
- [pr-review-synthesis-maker.md](../../../.claude/agents/pr-review/pr-review-synthesis-maker.md)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
