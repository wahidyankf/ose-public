---
name: repo-ose-primer-extraction-execution
goal: One-time orchestration for extracting the `a-demo-*` polyglot showcase from `ose-public` after verifying the primer carries equal-or-newer state. Gates Phase 8 of the 2026-04-18 ose-primer-separation plan on the Phase 7 parity check.
termination: "All 10 extraction commits (A → J) land on `ose-public`'s `main` branch, each pushed to `origin/main`, and the post-extraction green run passes."
inputs:
  - name: extraction-scope
    type: file
    pattern: .claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md
    description: Frozen list of paths the parity check enumerates. Authoritative source of truth for what gets extracted.
    required: false
    default: .claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md
  - name: clone-path
    type: string
    description: Optional override for the primer clone path; falls back to `$OSE_PRIMER_CLONE` and then to the convention default.
    required: false
  - name: max-catch-up-iterations
    type: number
    description: Maximum number of catch-up sync cycles allowed when the primer lags. Default 3; beyond this, the workflow terminates with status `fail`.
    required: false
    default: 3
outputs:
  - name: parity-report
    type: file
    pattern: generated-reports/parity__*__report.md
    description: The final parity report (verdict = `parity verified`) that gated Phase 8.
  - name: extraction-commits
    type: array
    description: Ten `ose-public` commit SHAs, one per extraction commit A through J, in order.
  - name: final-status
    type: enum
    values: [pass, fail, blocked]
    description: `pass` if all ten commits landed and the post-extraction green run passed; `blocked` if parity never converged within `max-catch-up-iterations`; `fail` if any mid-extraction CI failure was not fixable before the next commit.
---

# `ose-primer` Extraction Execution Workflow

**Purpose**: One-time workflow orchestrating the extraction of the `a-demo-*` polyglot showcase out of `ose-public`. This is a **Phase 8 activity** of the 2026-04-18 ose-primer-separation plan, not a reusable pattern for arbitrary future extractions.

The workflow exists so that:

- The parity-check gate (Phase 7) is executed in a documented, repeatable way before any deletion.
- The ten extraction commits (A → J) are applied in strict order with per-commit push + CI verification.
- A failed parity check triggers a bounded catch-up loop rather than stalling indefinitely.

## Execution Mode

**Preferred Mode**: Agent Delegation — `repo-ose-primer-propagation-maker` is invoked in `parity-check` and `apply` modes; `repo-ose-primer-sync-execution` is invoked during catch-up.

**Fallback Mode**: Manual Orchestration — the operator runs the shared skill's procedures directly using Read/Write/Edit/Bash tools, following the plan's `delivery.md` Phase 8 checklist verbatim.

## When to use

- **Once**, during Phase 8 of the 2026-04-18 ose-primer-separation plan.
- **Never afterward** — if a future extraction is needed, a new plan adds a new scope document and a new workflow; this document is not edited.

## Phases

### 1. Pre-flight (Sequential)

- Invoke the pre-flight procedure from `.claude/skills/repo-syncing-with-ose-primer/reference/clone-management.md` against the primer clone.
- Confirm `ose-public` working tree is clean.
- Confirm `ose-public` is on `main` at `origin/main` (no in-flight changes).
- Confirm the baseline quality gate passes: `npx nx affected -t typecheck lint test:quick spec-coverage` returns zero failures.

**On failure**: Abort; record the failed precondition in a pre-flight-abort report; do not proceed.

### 2. Parity-check gate (Sequential) **[G]**

**Agent**: `repo-ose-primer-propagation-maker` in `parity-check` mode.

- **Inputs**: the extraction-scope reference module (frozen path list).
- **Output**: `generated-reports/parity__*__report.md` with verdict line.

**Verdict branching**:

- `parity verified: ose-public may safely remove` → proceed to Phase 3 (Catch-up loop skipped).
- `parity NOT verified: N blocker paths require primer catch-up` → proceed to Phase 3 (Catch-up loop executed).

### 3. Catch-up loop (Sequential, Conditional)

**Condition**: Verdict was `parity NOT verified`.

**Loop**:

1. Read blocker paths from the parity report.
2. Invoke `repo-ose-primer-sync-execution` with `direction=propagate`, `mode=apply`, `scope-filter=<blocker paths>`.
3. Review the resulting PR in the primer. Merge it (operator action).
4. Refresh the primer clone (`git -C $OSE_PRIMER_CLONE fetch --prune && git -C $OSE_PRIMER_CLONE pull origin main`).
5. Re-invoke the parity-check (Phase 2).
6. Loop until verdict = `parity verified` OR `max-catch-up-iterations` reached.

**Termination on exhaustion**: If iterations exceed `max-catch-up-iterations`, terminate with status `blocked`; do not proceed to Phase 4.

### 4. Execute Commits A → J (Sequential)

With parity verified, execute the ten extraction commits in order per the plan's `delivery.md` Phase 8 checklist. Each commit:

1. Is scoped to a single concern (per the commit letter's description).
2. Has its commit message cite the parity-report SHA from Phase 2.
3. Pushes to `origin/main` immediately (per Trunk-Based Development).
4. Triggers GitHub Actions monitoring; any CI failure halts the workflow and must be fixed via a follow-up commit before the next lettered commit runs.

**Commit letters** (names for reference; exact steps live in the plan's `delivery.md`):

- **A** — Delete demo CI workflows + demo-only custom actions.
- **B** — Delete demo app directories.
- **C** — Delete demo spec area.
- **D** — Delete demo-specific reference doc.
- **E** — Prune root configs + `.github/` non-deletion edits.
- **F** — Prune root prose references.
- **G** — Prune governance / docs prose references.
- **H** — Flip classifier rows to `neither (post-extraction)`.
- **I** — Remove orphaned libraries.
- **J** — Trim `rhino-cli` demo-only commands.

**On commit-level CI failure**: fix-forward with a follow-up commit before the next lettered commit; never skip a CI failure.

### 5. Post-extraction verification (Sequential)

After Commit J:

- `ls apps/ | grep '^a-demo-'` returns empty.
- `ls .github/workflows/test-a-demo-*.yml` returns empty.
- `ls specs/apps/a-demo 2>/dev/null` returns empty.
- `nx graph` shows no `a-demo-*` project nodes.
- `npx nx affected -t typecheck lint test:quick spec-coverage` passes.
- Product E2E suites (`ayokoding-web-*-e2e`, `organiclever-*-e2e`, `oseplatform-web-*-e2e`) pass.

### 6. Close-out (Sequential)

- Record `parity-report` path, `extraction-commits` array, and `final-status`.
- Emit a summary line indicating downstream readiness (plan can proceed to Phase 9).

## Gherkin Success Criteria

```gherkin
Feature: ose-primer extraction execution

Scenario: Parity verified; extraction proceeds
  Given the primer clone passes pre-flight
  And the parity-check returns verdict "parity verified"
  When the workflow executes phase 4
  Then ten extraction commits follow on ose-public's main branch
  And each commit is pushed to origin/main
  And the post-extraction green run passes
  And final-status is "pass"

Scenario: Parity NOT verified; catch-up loop converges
  Given the primer clone passes pre-flight
  And the initial parity-check returns verdict "parity NOT verified" with N blocker paths
  And max-catch-up-iterations is 3
  When the workflow executes phase 3
  Then propagate-apply invocations are issued for the blocker paths
  And resulting PRs are merged into ose-primer
  And the parity-check is re-run after each merge
  And within 3 iterations the verdict becomes "parity verified"
  And the workflow proceeds to phase 4

Scenario: Catch-up exhausted
  Given the primer clone passes pre-flight
  And parity-check consistently returns "parity NOT verified"
  When the workflow reaches max-catch-up-iterations without convergence
  Then the workflow terminates with final-status "blocked"
  And phase 4 is never entered

Scenario: Mid-extraction CI failure triggers fix-forward
  Given commit C has been pushed and its CI run failed
  When the workflow monitoring detects the failure
  Then a follow-up commit must land before commit D runs
  And the workflow does not skip commit D when CI remains red

Scenario: Post-extraction verification fails
  Given all ten commits landed
  And the post-extraction green run fails
  When the workflow reaches phase 5
  Then final-status is "fail"
  And the operator investigates before archiving the plan
```

## Related Documents

- [Extraction scope](../../../.claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md) — authoritative frozen path list.
- Propagation agent `repo-ose-primer-propagation-maker` (at `.claude/agents/repo-ose-primer-propagation-maker.md`) — invoked in `parity-check` and `apply` modes.
- [Sync workflow](./repo-ose-primer-sync-execution.md) — re-entered during Phase 3 catch-up.
- [Plan: 2026-04-18 ose-primer-separation](../../../plans/done/2026-04-18__ose-primer-separation/README.md) — the plan orchestrating this workflow.
- [Sync convention](../../conventions/structure/ose-primer-sync.md) — classifier + safety invariants.

## Principles Implemented/Respected

- **Explicit Over Implicit**: Parity is a named, verified gate; extraction ordering is explicit; per-commit push + CI monitoring is explicit.
- **Simplicity Over Complexity**: The workflow is linear per iteration; the only loop is the bounded catch-up loop.
- **Automation Over Manual**: Parity-check, classifier consumption, and catch-up propagation are automated; only merges require operator action.
- **Deliberate Problem-Solving**: The parity gate prevents accidental demo loss; the catch-up loop converges or terminates — no indefinite stalls.
- **No Time Estimates**: Focus on outcomes, not duration.

## Conventions Implemented/Respected

- **[Workflow Naming Convention](../../conventions/structure/workflow-naming.md)**: Basename `repo-ose-primer-extraction-execution` parses as scope=`repo`, qualifier=`ose-primer-extraction`, type=`execution`.
- **[ose-primer Sync Convention](../../conventions/structure/ose-primer-sync.md)**: Safety Rules 5 and 6 (ose-public direct-to-main, ose-primer PR-only) are invariant across this workflow.
- **[Trunk-Based Development](../../development/workflow/trunk-based-development.md)**: Extraction commits land directly on `main`; no feature branch.
- **[Plans Organization Convention](../../conventions/structure/plans.md)**: This workflow is referenced from the plan's `delivery.md`.
