---
description: Real repository surfaces that schedule plans without durations.
when_to_use: Use when looking for worked examples of the principle applied here.
---

# Examples from This Repository

## Delivery Checklists Express a DAG

**Location**: `repo-governance/conventions/structure/plans/delivery-checklists-express-a-dag.md`

Every non-trivial `delivery.md` carries a `## Parallelization Model` naming which nodes are
concurrent and which are serial, and why. The schedule is a dependency graph, not a calendar.

## Phases as Natural Pauses

**Location**: `repo-governance/conventions/structure/plans/phases-as-natural-pauses.md`

Every phase ends with a `### Phase N Gate` of must-pass checks. A phase is finished when its gate
passes, not when a duration elapses.

## Multi-Plan Execution

**Location**: `repo-governance/workflows/plan/multi-plans-execution/`

The workflow schedules several plans by dependency and resource, not by duration.

## Plan Quality Validation

**Location**: `.agents/skills/plan-validating-quality/reference/structure-and-requirements-validation.md`

The plan checker flags a time estimate in a plan document, and a hardcoded or forecast archival
date, as HIGH findings.
