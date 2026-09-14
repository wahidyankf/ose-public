---
name: plan-verifying-execution
description: >-
  Post-execution verification methodology for plan-execution-checker: confirms a completed implementation did what the
  plan said, checking the rule domains of plan-validating-quality against the post-execution repository state.
when_to_use: >-
  When validating that a completed plan implementation meets its requirements, technical documentation, delivery
  checklist, and execution-time gates before archival to plans/done/.
---

# Verifying Plan Execution

Full post-execution validation methodology for `plan-execution-checker`: confirms a completed plan's
implementation matches what was promised, and that every execution-time gate actually held.

## Reference Modules

- `reference/01-validation-scope.md` — Validation Scope (Requirements Coverage, Technical
  Documentation Alignment, Delivery Checklist Completion, Code Quality, Integration Validation).
- `reference/02-workflow-overview.md` — Workflow Overview (Steps 0-7).
- `reference/03-operational-readiness-execution.md` — Step 5b (Operational Readiness Execution)
  verification.
- `reference/04-manual-assertions-ui-api-e2e-locale.md` and
  `reference/05-manual-assertions-evidence-and-retests.md` — Step 5c (Manual Behavioural Assertions)
  verification: UI/API/end-to-end/locale checks, evidence capture, and Rule-15/Rule-16 retests.
- `reference/06-plan-archival.md` — Step 5d (Plan Archival and README Updates) verification.
- `reference/07-worktree-verification-declaration-and-history.md` and
  `reference/08-worktree-verification-freshness-cleanup-and-cap.md` — Step 5e (Worktree Usage)
  verification.
- `reference/09-phase-gate-and-execution-marker.md` — Step 5f-gates (Phase Gate and Execution
  Marker) post-execution verification.
- `reference/10-anti-hallucination-verification.md` — Step 5f (Anti-Hallucination) post-execution
  verification.
- `reference/11-knowledge-capture-terminal-states.md` and
  `reference/12-knowledge-capture-audit-and-severity.md` — Step 5h (Knowledge Capture Routing,
  blocking gate) verification.
- `reference/delivery-mode-pr-ci.md` and `reference/delivery-mode-phase0-and-boundaries.md` — Step
  5i delivery-mode, exact-head PR-CI, optional-review, Phase 0, and boundary verification.

## Core Principles

**This is the final quality gate** — be thorough, independent, and uncompromising. **Every rule
states its own criticality** per finding, not a blanket file-level severity. **Post-execution
re-checks, not re-derives**: `plan-checker` validates the plan is well-formed at authoring time;
this skill validates execution actually did what the well-formed plan said, against the
post-execution repo state (git log, CI status, delivered files) — the finding types overlap in name
but the evidence source never does. **Blocking gates block archival unconditionally** — Knowledge
Capture (Step 5h) and any CRITICAL finding halt archival regardless of how many other checks passed.

Before pass, perform an end-to-end trace from scope and every canonical PRD acceptance criterion to
delivery units, as-built code/docs/C4/rules, automated and manual proof, applicable schema migration/
rollout/rollback evidence, recovery and deferred-item dispositions, and Knowledge Capture. Do not
trust checked boxes alone. Any missing or unsupported row reopens execution at the earliest affected
granular outcome-section checklist. Apply this contract prospectively; do not report migration findings against archived
plans or the existing Rhino plan.

Verify that delivery followed natural cohesive seams rather than LOC or file counts and that every
merged state was immediately safe to deploy to production. For incomplete behaviour, require the
temporary production-disabled flag, enabled and disabled path tests, and recorded rollout,
rollback, and removal.

## Related

`plan-validating-quality` (the authoring-time sibling methodology — Anti-Hallucination and
criticality-table shapes track it closely), `plan-quality-gate` (whose root-owned repair pass now
resolves what this skill's pre-execution counterpart raises, since `plan-applying-fixes` was
retired), `repo-generating-validation-reports` (report format),
`repo-assessing-criticality-confidence` (criticality/confidence framework).
