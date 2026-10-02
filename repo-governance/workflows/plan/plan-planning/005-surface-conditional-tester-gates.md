---
description: Routes a plan's surface (UI, API/backend, CLI/library, or no reachable behaviour) to the quality gates its delivery checklist must run, and explains why the three UI checks are complementary.
when_to_use: Use when deciding at plan-authoring time which quality gates a plan's delivery checklist must carry for the surfaces it changes.
---

# Surface-Conditional Tester Gates

Which quality gates a plan must run depends on **what surface it ships**. Decide this at authoring
time and write the result into the delivery checklist — it binds again at execution, and again as a
merge precondition.

The rule is: **a plan that changes behaviour a user or caller can reach must exercise that behaviour
before it merges.** The list below routes the common surfaces to their gates. It is a routing table,
never the boundary of the rule — a surface absent from it does not become exempt by omission.

- **UI-bearing plan** → run **both** running-UI checks: [`quality/ui-web-quality-gate.md`](../../quality/ui-web-quality-gate.md)
  (the running interface against its specification) **and**
  [`quality/ux-review-fix-planning.md`](../../quality/ux-review-fix-planning.md) (the EWT/UWT/DWT triad).
- **API- or backend-bearing plan** → run [`quality/api-http-quality-gate.md`](../../quality/api-http-quality-gate.md).
- **Several of these** → run each set.
- **A reachable surface with no gate listed above** — a CLI, a library
  under `libs/`, a git hook, a CI workflow — is **not exempt**. The plan states in its chosen technical form
  how the changed behaviour will be exercised through its own interface (for a CLI: which subcommands
  get invoked and what output is recorded; for a library: which consuming caller exercises it, not
  only its unit tests), and the delivery checklist carries that as a step.
- **Genuinely no reachable behaviour** — docs, comments, or a pure refactor with no behavioural delta —
  → the plan **MUST state the exemption explicitly in its chosen technical form**, with the justification.
  An unstated exemption is indistinguishable from an oversight, which is exactly what this rule
  exists to prevent.

This wording is congruent with merge precondition (e) in
[the PR Merge Protocol](../../../development/workflow/pr-merge-protocol/the-rule.md); the two
must be edited together. An earlier revision let this authoring-time list stay in the
enumerate-then-exempt shape after the merge-time clause was fixed, so a plan could be authored exempt
and only discover at merge that it was not.

## The Three UI Checks Are Complementary, Never Substitutes

They act at different lifecycle stages or angles, and passing one says nothing about the others:

- **`plan-checker` Step 5k** gates the UI **design funnel** in `prd.md` — **pre-build**, before any
  component exists.
- **`quality/ui-web-quality-gate.md`** judges the **running UI** against its design, accessibility, and
  behaviour specifications via `ui-web-checker` / `ui-web-fixer`.
- **`quality/ux-review-fix-planning.md`** explores the **running UI** via the EWT/UWT/DWT triad — a
  real browser against a real deployment — and plans the fixes.

`swe-ui-checker` remains available for a static audit of component source on request; it is not a gate.
A component can satisfy Step 5k's design funnel, match its specification, and still fail a first-time
user in the browser. Treating any one of the three as covering another is the failure
this distinction guards against.
