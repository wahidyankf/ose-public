---
description: "Rule 16's surface-conditional gate mapping, plus the progressive-disclosure density caution."
when_to_use: "Use when mapping a plan's surface to its required tester gate, or evaluating a density fix."
---

# The Sixteen Rules (16, part 2, and progressive-disclosure caution)

    **This is the same surface-conditional rule the plan workflows and the merge gate apply**, seen
    from the delivery-hardening side. Rule 15's web triad is run by
    [`workflows/quality/ux-review-fix-planning.md`](../../../workflows/quality/ux-review-fix-planning.md)
    and Rule 16's API round by
    [`workflows/quality/api-http-quality-gate.md`](../../../workflows/quality/api-http-quality-gate.md); a UI-bearing plan
    additionally runs the running-UI [`workflows/quality/ui-web-quality-gate.md`](../../../workflows/quality/ui-web-quality-gate.md).
    Each quality gate follows the
    [Quality Gate Contract](../../workflow/quality-gate-contract.md): at most three cycles and one
    advisory verdict; nothing reruns it automatically.
    The surface-to-gate mapping is stated once in
    [plan-planning §Surface-Conditional Tester Gates](../../../workflows/plan/plan-planning/005-surface-conditional-tester-gates.md#surface-conditional-tester-gates),
    re-applied at execution, and enforced by the
    [PR Merge Protocol](../../workflow/pr-merge-protocol.md). A plan bearing neither
    of those two surfaces is **not thereby exempt** — if it still changes behaviour a user or caller
    can reach (a CLI, a library, a hook, a CI workflow) it exercises that behaviour through its own
    interface and records what was run; only a plan with no reachable behavioural delta at all is
    exempt, and it states that exemption explicitly in the plan's chosen technical form. These surfaces are meant to
    agree — if this rule and the workflow mapping ever diverge, the workflow mapping is the one to
    fix.

**Progressive-disclosure density caution**: a fix for a "too dense" or "cramped" complaint that
resorts to progressive disclosure (e.g., collapsing a region behind `<details>`) changes only the
region's **collapsed** length, not its density. Before accepting such a fix, ask **"and what does
the revealed content look like?"** — a collapse relocates the density problem to whoever expands it,
and if the expanded state's typography, per-field line count, grouping, and absent-figure handling
were never specified, the original complaint resurfaces unchanged the moment a reader opens the
disclosure.
