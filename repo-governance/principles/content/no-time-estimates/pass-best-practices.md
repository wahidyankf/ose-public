---
description: Practices for scheduling plans by dependency, order, and resource, and for labelling estimates elsewhere.
when_to_use: Use as a checklist when writing a plan.
---

# PASS: Best Practices

## 1. Schedule by Dependency

**State what blocks what**:

```markdown
PASS: Phase 3 is blocked by Phase 2; Phase 4 runs alongside Phase 3.

FAIL: Phase 3 starts in week 2.
```

## 2. End Each Phase with a Gate, Not a Deadline

**Describe how the executor knows the phase is done**:

```markdown
PASS: Phase 1 Gate: `npm run test:quick` passes and the migration rolls back cleanly.

FAIL: Phase 1 should be finished by Wednesday.
```

## 3. Name the Resource, Not the Duration

**Say who or what runs the work and under which limit**:

```markdown
PASS: [AI] Run the three build nodes concurrently under the plan's N=3.

FAIL: The build steps take about an hour.
```

## 4. Size Work by Scope

**Describe how large the change is in terms a reader can check**:

```markdown
PASS: Touches 14 files across two projects; one delivery unit.

FAIL: Roughly two days of work.
```

## 5. Label Estimates Outside Plans

**Keep estimates where they help, and mark them**:

```markdown
PASS (status update): Estimate: two more CI cycles before the PR can merge.

PASS (learnings.md): Phase 3 took three review iterations; the plan assumed one.
```
