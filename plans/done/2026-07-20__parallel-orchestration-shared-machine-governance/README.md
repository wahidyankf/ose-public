# Parallel-Orchestration & Shared-Machine Governance

> Navigation hub for the multi-file plan. Read the documents in order:
> [brd.md](./brd.md) → [prd.md](./prd.md) → [tech-docs.md](./tech-docs.md) → [delivery.md](./delivery.md).

## Context

The repositories are worked on **very actively**: multiple AI agents, software engineers, and
background processes run **simultaneously on the same physical machine**, sharing the disk, the git
object store, worktrees, and self-hosted CI runners. The current governance surface does not make
this assumption explicit, and two rules are now out of step with how work actually happens:

1. The concurrency cap is stated as a fixed asymmetric pair — "parallel-by-default cap 3 concurrent;
   background agents cap at 2 (never more), 3 total including main." [Repo-grounded]
   ([`AGENTS.md`](../../../AGENTS.md) §Agent Workflow Orchestration lines 264-266).
2. There is a `git-push-safety.md` convention for **remote** destructive operations (force-push,
   `--no-verify`) [Repo-grounded]
   ([`repo-governance/development/workflow/git-push-safety.md`](../../../repo-governance/development/workflow/git-push-safety.md)),
   but **no** governance forbidding **local** destructive git operations that can wipe out a
   concurrent agent's or engineer's uncommitted work on the shared machine, and **no** disk-hygiene
   rule requiring a plan to clean up the worktrees and build artifacts it created.

This plan is a **governance/docs change**. It edits `repo-governance/`, `docs/`, `AGENTS.md`,
`CLAUDE.md`, and related markdown, then propagates the same rule text across all three OSE
repositories. It ships **no** application or library code.

## Scope

**In scope**

- Replace the fixed concurrency cap with an **N+1 parallel-orchestration model** (1 main thread +
  N background agents; default N=3 → 4 total, chosen to bound token/compute-budget burn; N adjustable
  per-plan and along the way).
- Add **DAG-first orchestration**: task lists and delivery checklists declare an explicit dependency
  DAG; independent nodes fan out up to N, dependent nodes serialize; cleanup is the terminal node.
- Add **per-phase PR delivery + feature flags** with a strict **1-PR ↔ 1-worktree** mapping: each
  applicable phase / independent DAG node lands as its own PR, **opened and merged as that phase
  completes** (never batched to plan end); feature-flag partial work merged-but-dark on `main` for
  safer + faster continuous integration; inseparable dependent phases stay one PR (DAG governs —
  never force-split).
- **Invert the merge default**: `[AI]` merges a PR once its preconditions hold (CI green, clean
  3-cycle review, 0 CRITICAL + 0 HIGH, branch up-to-date, tester gates satisfied); a `[HUMAN]` gate
  applies only where a plan says so explicitly. The preconditions are unchanged — only the actor is.
- Bind the **`worktree-to-pr` default at every plan path**, in two distinct ways: **creating/updating**
  a plan binds it as a **design obligation** (phases authored to be independently PR-able), while
  **executing** binds it as the actual delivery route. Introduce a general **plan-docs-only** carve-out
  (changes touching `plans/**`, no `apps/`/`libs/` code, may push directly to `main`) on its own
  footing. Feature-flagging becomes a **default** with a named escape (no user-reachable behaviour
  change) and a mandatory flag-removal step in the plan's final phase.
- Add **background-slot preference** (fill background slots, keep the main thread vacant/responsive,
  bounded by the DAG) and a **3-5 minute bounded status-update cadence**.
- Reinforce **`worktree-to-pr`** as the default; sharpen the **PR** (not just the worktree) as the
  independent merge point, plus **hardened merge preconditions** (3 review cycles + branch up-to-date
  with latest `origin/main` + all gates green + the surface-conditional tester gates below).
- Add a **surface-conditional UI / API tester gate rule** — UI-bearing plans run both UI gates
  (`ui/ui-quality-gate.md` static components + `web/web-ux-test-fixing-planning.md` running triad),
  API/BE-bearing plans run the API gate, both → both, neither → an **explicitly stated** exemption;
  binding both during plan creation/update/execution and as a pre-merge precondition. **Creates the
  missing half**: `repo-governance/workflows/api/api-quality-gate.md` + `api/README.md` (the dir does
  not exist today, even though the `api-exploratory-tester` agent does). Documents the three-way
  distinction between `plan-checker` Step 5k (design funnel), `ui-quality-gate` (built components),
  and the tester triad (running UI) so nobody conflates them.
- Make the **same-machine, concurrent-actors assumption** explicit across the orchestration surface.
- Add a **no-destructive-git-operations** convention (local/shared-machine destructiveness), carrying
  two further parallel-safety rules: **whole-tree staging is forbidden as a shape** (`git add -A`,
  `--all`, `git add .`, whole-tree `-u`, `git commit -a`, or any stage-everything wrapper — name paths
  explicitly instead) and **no corner-cutting** (a failing gate is root-caused, never bypassed,
  weakened, or deferred).
- Add a **worktree-and-artifact cleanup** convention (safe, self-scoped disk hygiene at plan end)
  covering three artifact classes: worktrees, merged branches (local + remote), and build output.
- Move **`main-ci.yml` to a pure 4×/day schedule** (drop the push-to-main trigger) in all three repos.
- Fold in the **Amazon Q Developer → Kiro CLI** platform-binding catalog succession.
- Write the orchestration governance **vendor-neutrally and capability-gated** (background-capable
  harnesses fan out to N per-worktree; others walk the same DAG serially; safety rules apply identically).
- Sweep and align all related `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, and
  `repo-governance/workflows/**` surfaces; wire into `AGENTS.md`, `CLAUDE.md`, the indexes; regenerate
  the `.opencode/` + `.amazonq/` bindings.
- Propagate the identical rule text across `ose-public` (source of truth) → `ose-primer` → `ose-infra`.

**Why dropping the per-push main-CI trigger is safe** (condensed — full reasoning in
[tech-docs.md §Delta 9](./tech-docs.md)): `main-ci.yml` runs essentially the **same checks** as the PR
quality gate and the pre-commit/pre-push hooks — only the **scope** differs (`--all` vs `affected`).
Every merge already cleared those checks at affected scope via (1) the auto-installed local pre-push
hooks (`"prepare": "husky"` runs on every `npm install`, which worktree-setup mandates) and (2) PR CI
at affected scope. main-ci is the periodic **whole-repo `--all` sweep** for cross-project drift; three
overlapping layers mean no per-push trigger is needed, and up-to-~6h detection lag on `main` is an
accepted, understood tradeoff (direct-push modes are used only for known-safe docs-only edits).

**Out of scope**

- Any change to `apps/`, `libs/`, or application/library behavior.
- Any change to `apps/rhino-cli/**` or the rhino gherkin behavior tree (byte-identity boundary — see
  the guardrail in [delivery.md](./delivery.md)).
- Changing the CI-monitoring cadence, the dependency-bump policy, or unrelated conventions.
- Building tooling to enforce the new rules automatically (governance text only; enforcement stays
  with `repo-rules-checker` review and human judgment).

## Approach summary

`ose-public` is authored first as the source of truth. The concurrency model is updated everywhere it
is stated, two new conventions are added, and the assumption is threaded through the orchestration
surface. After the `ose-public` PR passes its review cycle and merges, the identical rule text is
propagated to `ose-primer` and `ose-infra` in parallel worktrees — **dogfooding the very N+1 model
this plan introduces**. Every phase is a natural pause with a green gate; the plan obeys its own new
rules (non-destructive git, explicit-path staging, self-scoped cleanup at the end).

## Documents

- [brd.md](./brd.md) — WHY: business rationale, impact, affected roles, risks.
- [prd.md](./prd.md) — WHAT: personas, user stories, Gherkin acceptance criteria, product scope.
- [tech-docs.md](./tech-docs.md) — HOW: rule deltas, surface inventory, diagrams, design decisions.
- [delivery.md](./delivery.md) — DO: phased checklist, worktree, parallelization model, delivery mode.
- [learnings.md](./learnings.md) — Knowledge Capture running log (triaged before archival).

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
