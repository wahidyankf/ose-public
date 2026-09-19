---
description: "Check a validator's real invocation; capped-query undercounts."
when_to_use: "Use before trusting a validator result or count."
---

# Absence and Completeness Claims (HARD): Check the Real Invocation and Capped-Query Undercounts

## Check the real invocation before calling a validator result evidence

A validator run in isolation may be missing the flags that make it meaningful. Running
`./rhino md mermaid validate` bare returns exit 1 on the validator's own deliberately-invalid
negative fixtures; CI invokes it with its declared exclusions. Treating the bare
run as a preexisting defect would have manufactured a three-repo parity plan for a non-problem.

Before citing any validator result — pass or fail — read how CI and the git hooks actually invoke
it. **Both failure directions are real**: a missing flag invents failures, and a no-op target
invents passes (this repo has `test:e2e` / `test:integration` targets that are `echo` stubs; read
`options.command` before citing a target as evidence).

## A capped query silently under-counts, and the undercount propagates

A measurement that feeds a plan's arithmetic MUST be taken via a query whose result is a genuine
count — `document.querySelectorAll(selector).length`, `git ls-files <pattern> | wc -l`, `jq
'length'` — never read off a list that was capped for display (`.slice(0, N)`, a paginated UI
listing, a truncated CLI output). A capped list produces a plausible number, not an obviously broken
one, so nothing downstream looks wrong; the undercount then propagates into every dependent
calculation, percentage, and rendered figure that treats it as ground truth.

More broadly, a completeness check should re-derive at least one of the plan's foundational
quantities from the actual source of truth at least once, rather than only checking that every
document agrees with every other document — universal internal agreement is exactly what a
propagated error looks like.

**Verification recipe**:

```bash
# Wrong -- reads a count off a capped/paginated list
browser_evaluate(() => document.querySelectorAll('.model-card').slice(0, 60).length)

# Right -- a genuine, uncapped count
browser_evaluate(() => document.querySelectorAll('.model-card').length)
```
