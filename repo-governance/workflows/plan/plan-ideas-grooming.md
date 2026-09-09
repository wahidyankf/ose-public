---
description: Sweeps plans/ideas/ across repos, deduplicating, classifying into Eisenhower quadrants, and correcting cross-repo residency.
when_to_use: Use when a repo's plans/ideas/ exceeds 60 files or 90 days have passed since the last grooming run.
---

# plan-ideas-grooming Workflow

Sweeps one or more repos' `plans/ideas/` and converges them into a deduplicated,
Eisenhower-quadrant-organized, correctly-resident set of two-pagers — backlog grooming for ideas.

## Agent References

When grooming promotes a ready idea into a full plan, hand authoring to
[plan-maker](../../../.claude/agents/plan/plan-maker.md).

## Goal and Termination

**Goal**: Sweep one or more OSE repos' plans/ideas/ folders and converge each into a deduplicated, Eisenhower-quadrant-organized, strictly-formatted set of two-pagers with truthful filenames, with cross-repo residency corrected per the generalizable / secrets-bearing / single-repo-only placement rules

**Termination**: Every processed repo's plans/ideas/ contains no unresolved duplicate, every remaining idea sits in its correct q1-q4 quadrant folder in its correct repo with a filename matching its content, every relocated/renamed idea's provenance and inbound/outbound links are intact, and the run is recorded in every touched repo's grooming log

## Inputs

- **`repos`** (string, required) — Comma-separated paths to the target repos to sweep in this run. No default — supplied explicitly at invocation, since this document itself names no repo-specific path. A path may be absolute or relative to wherever the invoker is working; the workflow imposes no fixed layout.
- **`dry-run`** (boolean, optional, default `false`) — When true, compute and log every classification / merge / rename / relocation decision without writing, moving, renaming, or deleting any file
- **`delivery-mode`** (enum: worktree-to-pr, optional, default `worktree-to-pr`) — This workflow's own git delivery behaviour for the changes it makes to plans/ideas/**. Fixed at worktree-to-pr — unconditional, no override. This workflow's write scope is strictly plans/ideas/** (see the Scope Boundary below), which by construction is never an infrastructure-as-code change, so the ose-private infrastructure-as-code carve-out (Plans Organization Convention's Per-Repository Delivery Mode Restrictions) can never apply to an invocation of this workflow, and main-to-origin-main is therefore not offered as a selectable value here.

## Outputs

- **`grooming-log-entries`** (file-list) — Per-repo grooming log entries (appended to that repo's own plans/ideas/README.md, in that repo's own tree) recording every merge, split, rename, quadrant reclassification, and cross-repo relocation performed this run
- **`final-status`** (enum: pass, partial, fail)

## Contents

- [Purpose and When to Use](./plan-ideas-grooming/purpose-and-when-to-use.md) — what it does; the recurrence trigger.
- [Scope Boundary and Execution Mode](./plan-ideas-grooming/scope-boundary-and-execution-mode.md) — plans/ideas/\*\*-only; orchestration.
- [Steps 1-3](./plan-ideas-grooming/steps-1-3-inventory-dedup-and-cross-repo-dedup.md) — inventory, within-repo dedup, cross-repo dedup.
- [Steps 4-5](./plan-ideas-grooming/004-residency-decision-and-relocation.md) — residency rules, relocation sequence.
- [Steps 6-8](./plan-ideas-grooming/steps-6-8-reshape-provenance-and-classification.md) — template reshape, provenance, classification.
- [Steps 9-10](./plan-ideas-grooming/steps-9-10-link-rewrite-and-recurrence-trigger.md) — link rewrite; the re-run condition.
- [Related Workflows and Documentation](./plan-ideas-grooming/related-workflows-and-documentation.md) — cross-references.
