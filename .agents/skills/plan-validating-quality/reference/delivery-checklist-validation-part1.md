# Delivery Checklist Validation, Part 1 (Scope 4)

## 4. Delivery Checklist Validation

Outcome sections and granular action checklists executable, ordered, cohesive; validation/acceptance criteria specific and testable; git
workflow specified. Named HARD RULEs (each validated in full detail by a later numbered rule/step
noted below — this section is the summary layer):

`delivery.md` is the primary execution surface for a junior engineer fresh from bootcamp with no
professional work experience and no repository or stack context. If that reader must infer order,
prerequisites, paths, commands, observations, recovery, or proof, flag the relevant action **HIGH**.

- **TDD-shaped steps**: any code-shipping item needs a test-first step (Red→Green→Refactor). Missing
  failing-test step before implementation: **HIGH**. See
  [Test-Driven Development Convention](../../../../repo-governance/development/workflow/test-driven-development.md).
- **TDD evidence (HARD RULE)**: each code outcome section contains separate, detailed RED, GREEN,
  and REFACTOR checkboxes with exact paths/symbols, commands, expected observations, evidence, and
  final regression proof. Combined/missing cycle actions or vague detail are **HIGH**. See
  [TDD Shape for Delivery Checklists](../../../../repo-governance/development/workflow/test-driven-development/tdd-shape-for-delivery-checklists.md#tdd-shape-for-delivery-checklists).
- **Focused TDD proof:** validate selections, executed identities/counts, and separate full
  phase/pre-PR regression evidence against [Focused Runs and Regression Gates](../../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md#focused-runs-and-regression-gates). Violations are **HIGH**.
- **Non-code action format**: non-code outcome sections (docs, config, governance) use AC reference,
  Input/Outcome/Proof, and one detailed checkbox per independently verifiable action, not
  RED/GREEN/REFACTOR. Misapplied TDD shape:
  **MEDIUM**.
- **Execution-grade clarity (HARD RULE)**: every section/checkbox is executable by a bootcamp
  graduate with no professional or repository experience, with prerequisites, explicit
  paths/symbols, copyable commands, expected observations, failure handling, and evidence—or has a valid same-document controlled
  runbook-reference binding for a finite cross-repository lifecycle procedure. Bare "implement
  X"/"set up Y" is **HIGH**.
  Full detail in `reference/12-rule11-execution-grade-clarity-validation.md` (Step 5e). See
  [Plans Organization Convention §Execution-Grade Clarity](../../../../repo-governance/conventions/structure/plans/execution-grade-clarity.md#execution-grade-clarity-hard-rule).
- **Executor tagging (HARD RULE)**: every checkbox declares `[AI]`/`[HUMAN]`/`[AI+HUMAN]` (unmarked
  = `[AI]`) with a legend at the checklist top; untagged or mis-tagged human-only step: **HIGH**.
  Full detail in `reference/15-rule14-executor-tag-validation.md` (Step 5h).
- **Phase gate and natural pause (HARD RULE)**: every phase ends with `### Phase N Gate`
  (must-pass checklist plus Pause Safety note) at a safe-to-stop state; missing gate: **HIGH**; a
  merge-worthy non-pause phase: **MEDIUM**. Full detail in
  `reference/16-rule15-phase-gate-and-natural-pause-validation.md` (Step 5i).
- **Phase 0 opens no PR (HARD RULE)**: Phase 0 (Environment Setup and Baseline) carries no
  PR-creation, branch-push, optional semantic-review, merge, `gh pr ready`, or post-push CI step
  under any Delivery Mode — earliest PR-opening phase is Phase 1. Flag violations, and any unscoped
  Per-Phase Integration Protocol block, **HIGH**. Full detail below (PR Step Authorization Check) and
  `reference/20-rule19-delivery-mode-validation-part1.md` rule 19 item 7. See
  [Plans Organization Convention §Phase 0 Opens No PR](../../../../repo-governance/conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).
- **Integration occurs at delivery boundaries, not every phase (HARD RULE)**: each
  **delivery boundary** ends one natural cohesive, production-deployable increment. Under a
  `*-to-pr` mode, the contiguous phases ending there map to one branch and one PR; under a permitted
  direct mode, they map to one direct-push checkpoint. Worktree modes reuse at most one worktree per
  repo per plan, while main modes use the primary checkout and provision none. See
  [Worktree Cap](../../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
  Flag **HIGH** an integration step in a non-boundary phase, a change-producing phase absent from
  `### Delivery Boundaries`, or a non-boundary final change-producing phase; flag **MEDIUM** a
  missing `### Delivery Boundaries` table on a non-trivial plan, or a single end-of-plan boundary
  against a `## Parallelization Model` declaring independent parallel nodes. Full detail below and
  `reference/21-rule19-delivery-mode-validation-part2.md` rule 19 item 8. See
  [Plans Organization Convention §PRs Open at Delivery Boundaries](../../../../repo-governance/conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).
  Reject numeric boundaries; require atomic artifacts and the canonical incomplete-feature flag
  lifecycle.
- **Cross-repository resource schedule (HARD RULE)**: when a plan spans repositories, its
  `## Parallelization Model` classifies each compute-bearing node under the resource-aware boundary
  and names every dependency, shared-output, byte-identity, transactional, or correctness edge that
  forces serialization. Missing guards/classes or unexplained serial edges: **HIGH**. A `Depends-on`
  naming a plan that does not exist, or one already archived where a live plan was meant: **HIGH**.
  A missing declaration where the plan-order graph shows dependencies: **MEDIUM**. Live HIPPO
  admission and capacity are execution facts; this check validates only the repository-visible
  declaration. See
  [Delivery Checklists Express a DAG](../../../../repo-governance/conventions/structure/plans/delivery-checklists-express-a-dag.md#delivery-checklists-express-a-dag-hard-rule).
- **Specs and Gherkin delivery (Two Paths)**: a plan changing observable behaviour in `apps/`,
  `libs/`, or `specs/` needs delivery steps adding/updating companion `specs/` `.feature` files and
  running `test:coverage:behaviour`. Full detail in `reference/17-rules16-specs-gherkin-and-regression-test.md`
  rule 16
  (Step 5j). See
  [Feature Change Completeness Convention §Two Paths](../../../../repo-governance/development/quality/feature-change-completeness.md).
