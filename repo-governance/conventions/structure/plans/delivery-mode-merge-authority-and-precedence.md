---
description: Explains the default [AI]-merges-by-default policy, when a plan should add an explicit [HUMAN] merge gate, and the three-tier precedence algorithm for resolving the active delivery mode.
when_to_use: Use when determining which delivery mode actually applies to a plan, or when deciding whether a merge step needs an explicit [HUMAN] gate.
---

# Delivery Mode — Merge Authority and Resolution Precedence

Continues [Delivery Mode — main-to-origin-main Content Restriction](./delivery-mode-content-restriction.md).

**[AI] merges by default.** Every PR uses one convergent default route: the `Quality gate` check
from `.github/workflows/pr-quality-gate.yml` must be green for the exact current head and base, and
one authenticated `ose-pr-leak-review:v1` record must pass for that head.
Semantic review is not inferred from executable content, `plans/**`, risk, or delivery mode. A plan
may include [`pr-review`](../../../workflows/pr/pr-review.md) or
[`pr-review-cycle`](../../../workflows/pr/pr-review-cycle.md) only because the user explicitly
requested it, and only at a PR delivery boundary. The shared hardened preconditions also require a
current conflict-free branch, resolved conversations, and passing applicable finite surface gates;
see the [PR Merge Protocol](../../../development/workflow/pr-merge-protocol.md).

Where a plan **does** want human judgment at the merge point — an irreversible migration, a
production cutover, a change whose blast radius the gates cannot express — it says so explicitly in
the step itself, and that `[HUMAN]` gate then governs. Being explicit is the point: a merge gate that
exists because someone chose it is meaningful, while one that exists because it was the default is
indistinguishable from inertia.

**Three-tier precedence** — the active mode resolves deterministically:

```text
resolve_delivery_mode(invocation_arg, plan_field):
    if invocation_arg is a valid mode:      # tier 1: given at invocation time
        return invocation_arg
    if plan_field is a valid mode:          # tier 2: declared in the plan's own docs
        return plan_field
    return "worktree-to-pr"                 # tier 3: default
```

```mermaid
flowchart LR
    accTitle: Delivery Mode — Merge Authority and Resolution Precedence
    accDescr: Invocation argument given? leads to Use invocation argument via Yes, valid mode; Invocation argument given? leads to Plan field declares a mode? via No; and 2 more links.
    A["Invocation argument<br/>given?"] -->|Yes, valid mode| Z["Use invocation<br/>argument"]
    A -->|No| B["Plan field declares<br/>a mode?"]
    B -->|Yes, valid mode| Y["Use plan field"]
    B -->|No| X["Default:<br/>worktree-to-pr"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    class A,B blue
    class Z,Y teal
    class X brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

An invalid non-empty value at either tier (a string that is not one of the four modes) is a
`plan-checker` finding — it is never silently coerced to the default.

**Declaring the mode in a plan**: state it explicitly alongside the `## Worktree` /
`## Worktree Specification` declaration, e.g. `## Delivery Mode: worktree-to-pr`. An unmarked plan
resolves to the tier-3 default per the algorithm above.

See the [plan-execution workflow](../../../workflows/plan/plan-execution.md) for how each mode changes
Step 0 (worktree entry), the per-phase push target, and Step 8 (finalization and merge hand-off).
