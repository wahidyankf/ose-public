---
description: The status summary an agent presents before merging, and the fix-then-re-evaluate procedure to follow when a quality gate fails.
when_to_use: Use when writing the merge status summary, or when a quality gate has failed and the merge is on hold.
---

# Precondition Summary and When Gates Fail

## The Precondition Summary

When all preconditions hold, the agent presents a clear summary, then merges:

```
PR #42: feat(auth): add email validation

Quality gates:
  Quality gate:  PASSED (current head/base)
  leak-review:   PASSED (current-head status)
  surface gates: PASSED / explicitly exempt

Preconditions:
  (a) PR CI:             exact current head/base green
  (b) leak review:       pushes reviewed; current-head pass
  (c) branch vs main:    up to date (non-destructive update)
  (d) conversations:     resolved
  (e) surface gates:     passed / explicitly exempt

Merging PR #42.
```

## When Gates Fail

If any quality gate fails, the agent must:

1. Report which gate failed and the error details.
2. Investigate the root cause.
3. Fix the issue (not bypass the gate).
4. Re-run the gates.
5. Only then re-evaluate the merge preconditions.

```
PR #42: feat(auth): add email validation

Quality gates:
  Quality gate:  FAILED (lint errors in auth-validator.ts)
  surface gates: PENDING

I will investigate and fix the lint errors before merging.
```
