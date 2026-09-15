---
description: Lists the fourteen structural checks the orchestrator runs against the created plan files before the quality gate.
when_to_use: Use when verifying structural completeness of a freshly created plan before invoking plan-quality-gate.
---

# Step 5. Plan Review (Sequential)

Read the created plan files and verify structural completeness before the quality gate.

**Orchestrator action**:

1. Read all plan files in the resolved `<plan-dir>`
2. Verify the fixed mature core exists and exactly one technical form is present; verify
   `## Worktree` exists in `delivery.md`
3. Verify delivery checklist has at least one `- [ ]` checkbox
4. Verify canonical Gherkin acceptance criteria are present in `prd.md` and delivery references them
   by durable title. Verify copy-ready packets destined for `specs/` contain no plan slug, number,
   phase, delivery-unit name, or plan acceptance-criterion identifier, and the external BDD delta map
   records requirement, action, exact feature path, exact durable title, and adapter disposition.
5. Verify the worktree path in the plan matches `<identifier>` confirmed in Step 1, and that the
   plan folder lives under the correct stage (`backlog/` and `in-progress/` both use a bare
   `<identifier>/` with no date prefix; only `done/` carries the `<YYYY-MM-DD>__` prefix) per the
   confirmed `target-stage`
6. Verify delivery checklist starts with **Phase 0: Environment Setup and Baseline**, and that
   Phase 0 contains **no** PR-creation, PR CI/review, push, or merge step — the earliest phase
   that may open a PR is Phase 1
   ([§Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule))
7. Verify the `## Parallelization Model` carries a `### Delivery Boundaries` table mapping **every**
   change-producing phase to a delivery unit, that the last change-producing phase is a boundary,
   and that PR-creation, CI/leak-review, any explicitly requested semantic-review, and merge steps appear **only** in boundary phases — a PR per
   phase is a defect
   ([§PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule))
   Verify each unit names a natural cohesive seam, keeps every artifact needed for build,
   verification, operation, rollback, and internal consistency together, and leaves an immediately
   production-deployable `main` state. Incomplete behaviour requires a temporary
   production-disabled flag, both path tests, and rollout/rollback/removal. Reject LOC- or
   file-count-derived boundaries.
8. Verify `delivery.md` opens with the `[AI]`/`[HUMAN]` executor legend and that every step only a human can perform is tagged `[HUMAN]`
9. Verify every phase ends with a `### Phase N Gate` (must-pass verification) followed by a `> **Pause Safety**:` note
10. Verify the chosen technical form has a `## File-Impact Analysis` whose primary view is one root-relative,
    annotated file tree with `[E]`/`[N]`/`[D]`/`[G]` markers. If `### More Detail` exists, verify it
    immediately follows the tree and provides context rather than a second prose scope list.
11. When any HTTP, BFF, RPC, event, or standard protocol contract changes—or an API-adjacent plan
    claims no change—verify `tech-docs/README.md` maps one separately numbered API contract delta
    document satisfying the operation index plus complete per-operation contract packets, or an
    evidenced no-delta contract. Each operation contains full Gherkin scenarios or an exact anchor to
    its one-to-one detailed set in the same API document or the plan's dedicated numbered
    BDD/spec-delta companion in the same `tech-docs/` folder. The packet names exact scenario
    IDs/titles, canonical `specs/**` destination, and Unit/Integration/E2E disposition; the set covers
    success, validation, authorization/context, errors, replay/concurrency, and privacy. Reject
    summary-only tables, generic BDD-map links, prose pointers, and other external pointers, and reject
    any structured serialized example compressed into inline code instead of its own language-labelled
    fenced block.
12. Verify junior-readable decision-to-delivery traceability, material alternatives/prior art,
    granular outcome-section checklist fields, and applicable schema/rule/C4/recovery contracts. For
    every changed HTTP-accessible API operation, verify `delivery.md` contains literal `rtk curl` success and
    representative failure commands with exact wire assertions, synthetic fixtures, independently
    attributable evidence, cleanup, and failure routing. Reject a prose-only, generated-client-only,
    or non-independent multi-case recipe. For every changed non-HTTP RPC/event operation, require the
    equivalent fully written protocol-native client success/failure recipes and proof standard.
13. Independently classify rule impact from scope and the file-impact tree. For every affected
    repository, verify `delivery.md` automatically includes the complete repository-local
    rules-propagation outcome: inventory, conflict/precedence, placement/eviction,
    canonical/config/enforcement/index changes, enforcement dispositions, binding generation,
    verification plus `rules-quality-gate`, manifest/final status, and sibling obligation. Reject a
    bare workflow link or generic “run propagation” checkbox.
14. If structural gaps found: provide a focused prompt to `plan-maker` or fix trivially via `Edit`.
    Any reinvoked `plan-maker` response follows the same decision-envelope loop from Step 4; do not
    treat its envelope as the one-retry failure.

**Output**: Plan structurally complete. Ready for quality gate.

**On failure after one retry**: Terminate with status `fail`.
