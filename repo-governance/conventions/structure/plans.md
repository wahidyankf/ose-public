---
description: Standards for organizing plans/ documents
when_to_use: Use when placing, structuring, naming, or moving a plan.
---

# Plans Organization Convention

<!--
  MAINTENANCE NOTE: Master reference for plans organization
  This convention is referenced by:
  1. plans/README.md (brief landing page with link to this convention)
  2. AGENTS.md (summary with link to this convention)
  3. .claude/agents/plan/plan-maker.md (reference to this convention)
  When updating, ensure all references remain accurate.
-->

Standards for organizing planning documents in `plans/` — temporary, distinct from `docs/`.

## Foundations

- [Purpose, Scope, and Overview](./plans/purpose-scope-and-overview.md) — why this exists.
- [Folder Structure](./plans/folder-structure.md) — the four subfolders.

## Ideas Folder (Two-Pagers)

- [Ideas Folder](./plans/ideas-folder-overview-rationale-and-file-layout.md) — rationale, layout.
- [Two-Pager Template](./plans/two-pager-template.md) — the eight sections.
- [Two-Page Discipline vs backlog/](./plans/two-page-discipline-and-difference-from-backlog.md) — length rules.
- [Promoting Ideas and Worked Examples](./plans/promoting-ideas-and-worked-examples.md) — promotion.

## Plan Folder Naming

- [Plan Folder Naming](./plans/plan-folder-naming.md) — stage-aware naming.

## Plan Contents

- [Plan Artifact Authorization and Transition](./plans/plan-artifact-authorization-and-transition.md) — Defines literal authorization for plans/ artifacts and the prospective applicability of the mature-plan contract. Use before creating a plans/ artifact or deciding whether an existing plan must adopt the current contract.
- [Structure Decision](./plans/structure-decision.md) — fixed core and reader-led technical shape.
- [Retired Single-File Structure](./plans/single-file-structure.md) — grandfathered plans only.
- [Mature Formal-Plan Structure](./plans/multi-file-structure-layout-and-core-files.md) — required core files.
- [Additional File Purposes](./plans/multi-file-structure-additional-file-purposes.md) — technical shape, delivery, learnings, and evidence.
- [Comprehensive Decision Records](./plans/comprehensive-decision-records.md) — substantive solution choices, alternatives, and prior art without editorial iteration history.
- [Schema and Migration Contracts](./plans/schema-and-migration-contracts.md) — required contracts for persisted-data changes.
- [API Contract Delta](./plans/api-contract-delta.md) — the numbered operation contract required for API changes and API-adjacent evidenced no-delta decisions.
- [Delivery Reconciliation and Conditional Recovery](./plans/delivery-reconciliation-and-recovery.md) — Places governance and architecture reconciliation with the change and gives conditional recovery work explicit terminal states. Use when delivery may change repository rules, documented C4 elements, or invoke rollback/recovery work.
- [File-Impact Analysis Format](./plans/file-impact-analysis-format.md) — annotated file tree.
- [The Knowledge Capture Phase](./plans/the-knowledge-capture-phase.md) — final phase.
- [Content-Placement Rules](./plans/content-placement-rules.md) — brd vs prd.
- [Granular Checklist Actions](./plans/granular-checklist-items.md) — detailed action checkboxes grouped by cohesive outcome.
- [Execution-Grade Clarity](./plans/execution-grade-clarity.md) — checkbox rules.
- [Executor Tagging — Tags and Bias](./plans/executor-tagging-tags-and-bias.md) — [AI]/[HUMAN] tags.
- [Tagging — Git-Mechanical Steps](./plans/executor-tagging-git-mechanical-steps.md) — worktree/push.
- [Tagging — Placement and Legend](./plans/executor-tagging-placement-legend-and-execution-semantics.md) — legend.
- [Phases as Natural Pauses](./plans/phases-as-natural-pauses.md) — gates.
- [Checklists Express a DAG](./plans/delivery-checklists-express-a-dag.md) — parallelization.
- [Delivery Units and Granularity](./plans/delivery-units-and-planning-granularity.md) — units.
- [Phase 0 Opens No PR](./plans/phase-0-opens-no-pr.md) — no PR at setup.
- [Phase 0 — Rationale and Enforcement](./plans/phase-0-opens-no-pr-rationale-and-enforcement.md) — evidence.
- [PRs Open — Rules 1-4](./plans/prs-open-at-delivery-boundaries-rules.md) — boundary rules.
- [PRs Open — Rules 5-7](./plans/prs-open-at-delivery-boundaries-rules-5-to-7.md) — remaining rules.
- [PRs Open — Boundary Test](./plans/prs-open-at-delivery-boundaries-boundary-test.md) — qualification.
- [PRs Open — Natural Seams and Deployable State](./plans/prs-open-at-delivery-boundaries-natural-seams.md) — cohesive boundaries, atomic consistency, immediate production deployability, and prompt trunk integration.
- [PRs Open — PR Body](./plans/prs-open-at-delivery-boundaries-pr-body.md) — why, entry, skip.
- [PR-Size Redirect](./plans/prs-open-at-delivery-boundaries-pr-size.md) — Legacy redirect. Follow old links.
- [Addition-Limit Redirect](./plans/prs-open-at-delivery-boundaries-pr-size-addition-limits.md) — Legacy redirect. Follow old links.
- [Document-Exception Redirect](./plans/prs-open-at-delivery-boundaries-pr-size-single-source-other-document-exception.md) — Legacy redirect. Follow old links.
- [Atomicity-Rule Redirect](./plans/prs-open-at-delivery-boundaries-pr-size-atomicity.md) — Legacy redirect. Follow old links.
- [Delivery Boundaries](./plans/delivery-boundaries-and-applicability.md) — table.
- [Worktree Specification](./plans/worktree-specification.md) — declaring worktree.
- [Worktree Specification — Lifecycle](./plans/worktree-specification-executor-lifecycle.md) — cleanup.
- [Worktree Cap](./plans/worktree-cap.md) — one per repo.
- [Delivery Mode — The Four Modes](./plans/delivery-mode-the-four-modes.md) — mode table.
- [Delivery Mode — Content Restriction](./plans/delivery-mode-content-restriction.md) — validity.
- [Merge Authority](./plans/delivery-mode-merge-authority-and-precedence.md) — resolution.
- [Per-Repo Delivery Mode Restrictions](./plans/per-repository-delivery-mode-restrictions.md) — per-repo.
- [Per-Repo — Enforcement](./plans/per-repository-restrictions-enforcement-and-file-naming.md) — enforces.

## Working with Plans

- [Key Differences and Creating Plans](./plans/key-differences-and-creating-plans.md) — plans/ vs. docs/.
- [Starting and Completing Work](./plans/starting-and-completing-work.md) — lifecycle moves.
- [Promotion Recovery](./plans/starting-work-promotion-recovery.md) — remote resume.
- [Infra-Apply Gate and Indexes](./plans/infra-apply-gate-and-plan-index-files.md) — infra hold.

## Diagrams, Links, and Reference

- [Diagrams in Plans](./plans/diagrams-required.md) — Mermaid requirement.
- [Diagrams — Skipping and Accessibility](./plans/diagrams-skip-accessibility-and-example.md) — escape hatch.
- [Relative Link Paths in Plan Files](./plans/relative-link-paths.md) — depth rule.
- [Related Documentation](./plans/related-documentation.md) — cross-references.
- [Best Practices](./plans/best-practices.md) — minimal-sufficiency habits.
- [Examples](./plans/examples.md) — worked examples.
