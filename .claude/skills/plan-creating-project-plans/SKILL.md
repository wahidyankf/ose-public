---
name: plan-creating-project-plans
description: Project planning standards for authorized plans/ artifacts, including lifecycle naming, fixed mature core, bootcamp-graduate readability, alternatives and prior art, Gherkin criteria, granular delivery checklists, and evidence-first grilling.
when_to_use: >-
  Use when writing a formal plan, after its pre-write decision gate has resolved the material branches.
---

# Creating Project Plans

## Purpose

This Skill provides guidance for creating **structured project plans** in the plans/ directory. Plans follow standardized organization, naming conventions, and acceptance criteria patterns for executable, traceable project work.

**When to use this Skill:**

- Creating new project plans
- Organizing backlog items
- Converting ideas to structured plans
- Writing Gherkin acceptance criteria
- Structuring multi-phase projects
- Moving plans through workflow stages

**Authorization gate**: creating a tracked plan requires a literal user plan request or explicit
plan-authoring invocation. Plan Mode, internal task planning, discovery, and omitted tester output
mode do not authorize `plans/` writes.

**Start here — mandatory grilling**: before writing, resolve material design decisions that cannot
be answered from repository evidence. After writing, run a separate validation/stress-test grill
against the completed artifacts before signaling done. See
[mandatory-grilling.md](reference/mandatory-grilling.md).

## Minimal Sufficiency in Plans

Treat the requested outcome, explicit non-goals and out-of-scope items, acceptance criteria, and
required quality gates as the plan's boundary and stop condition. When a plan introduces code, a
dependency, abstraction, validator, automation, infrastructure, or another lasting mechanism,
the chosen technical form must name its concrete need and explain
why existing mechanisms are insufficient. Choose the smallest responsible design that satisfies
every applicable rule; mandatory safeguards remain part of sufficiency. See
[Plans Best Practices](../../../repo-governance/conventions/structure/plans/best-practices.md#apply-minimal-sufficiency).

## Automatic Rule-Impact Coverage

During authoring, classify both proposed behaviour and the file-impact tree against the full repo
rules surface. If any scoped repository may add, change, supersede, or delete a rule or enforcement,
`delivery.md` automatically includes the complete repository-local
[`rules-propagation`](../../../repo-governance/workflows/rules/rules-propagation.md) outcome in that
delivery unit. Split inventory, conflict/precedence, placement/eviction, canonical and enforcement
edits, enforcement dispositions, binding generation, verification plus `rules-quality-gate`,
manifest/final status, and sibling obligation into granular bootcamp-executable checkboxes. Repeat
per affected repository; a link, generic invocation, or reusable checkbox template is insufficient
because every concrete repository/action pair must map to its own execution task.

## Primary Junior-Readable Surfaces

Write the selected technical form and `delivery.md` for a junior engineer fresh from bootcamp with
no professional work experience and no repository or stack context. The technical form teaches the
current state, relevant concepts, alternatives, contracts, architecture, migration/rollback, and
verification design. `delivery.md` turns that design into ordered granular actions with the exact
inputs, paths/discovery, commands, expected observations, failure handling, and evidence needed for
independent execution.

Delivery units follow the canonical natural-seam, immediately deployable-state, and temporary-flag
lifecycle rules; numeric counts never set their boundaries.

## Reference Modules

- [mandatory-grilling.md](reference/mandatory-grilling.md) — evidence-first pre-write and post-write grilling
- [plan-lifecycle-and-git-workflow.md](reference/plan-lifecycle-and-git-workflow.md) — 4-stage lifecycle + git workflow
- [plan-folder-and-naming.md](reference/plan-folder-and-naming.md) — `plans/` folder layout,
  stage-aware naming, and runtime-only completion dates
- [plan-structure-multi-and-single-file.md](reference/plan-structure-multi-and-single-file.md) — fixed mature-plan core and reader-led technical shape
- [mermaid-diagrams.md](reference/mermaid-diagrams.md) — Mermaid diagram requirements
- [ui-design-funnel.md](reference/ui-design-funnel.md) — UI-design-funnel HARD RULE (diverge→narrow→select→justify)
- [ui-design-funnel-grilling-and-learning-plans.md](reference/ui-design-funnel-grilling-and-learning-plans.md) — funnel grilling questions + Learning-Bearing syllabus record
- [worktree-specification.md](reference/worktree-specification.md) — mandatory `## Worktree` declaration
- [delivery-mode.md](reference/delivery-mode.md) — the four Delivery Modes + per-repo restriction
- [execution-grade-clarity.md](reference/execution-grade-clarity.md) — Execution-Grade Clarity HARD RULE
- [executor-tagging.md](reference/executor-tagging.md) — `[AI]`/`[HUMAN]` tagging HARD RULE
- [phases-as-natural-pauses.md](reference/phases-as-natural-pauses.md) — Phase-Gate + Pause-Safety template
- [verification-recipes.md](reference/verification-recipes.md) — pre-write verification recipes + confidence labels
- [refuse-uncertainty-and-anti-patterns.md](reference/refuse-uncertainty-and-anti-patterns.md) — refuse-on-uncertainty + AP-1..AP-10 catalog
- [specialized-executor-annotation.md](reference/specialized-executor-annotation.md) — suggested-executor annotation
- [gherkin-acceptance-criteria.md](reference/gherkin-acceptance-criteria.md) — Gherkin format and journey coherence
- [delivery-plan-tdd-structure.md](reference/delivery-plan-tdd-structure.md) — outcome-section and granular RED/GREEN/REFACTOR evidence shape
- [operational-readiness.md](reference/operational-readiness.md) — Local Quality Gates, Post-Push, Env Setup, Commits
- [manual-ui-and-api-verification.md](reference/manual-ui-and-api-verification.md) — real-browser and API wire verification
- [manual-verification-retest-rules.md](reference/manual-verification-retest-rules.md) — rule-15/rule-16 pre-archival retests
- [knowledge-capture-scaffold-and-entries.md](reference/knowledge-capture-scaffold-and-entries.md) — `learnings.md` scaffold + entry shape
- [knowledge-capture-phase-template.md](reference/knowledge-capture-phase-template.md) — Knowledge Capture phase template
- [plan-archival.md](reference/plan-archival.md) — Plan Archival section template
- [common-mistakes.md](reference/common-mistakes.md) — 5 common authoring mistakes

## References

**Primary Convention**: [Plans Organization Convention](../../../repo-governance/conventions/structure/plans.md)

**Related Skills**: `grill-me`, `plan-writing-gherkin-criteria`, `repo-practicing-trunk-based-development`, `docs-applying-content-quality`.
