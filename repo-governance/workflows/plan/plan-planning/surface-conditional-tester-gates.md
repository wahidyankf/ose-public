---
description: Routes a plan's surface (UI, API/backend, CLI/library, or no reachable behaviour) to the quality gates its delivery checklist must run, and explains why the three UI gates are complementary.
when_to_use: Use when deciding at plan-authoring time which quality gates a plan's delivery checklist must carry for the surfaces it changes.
---

# Surface-Conditional Tester Gates

Which quality gates a plan must run depends on **what surface it ships**. Decide this at authoring
time and write the result into the delivery checklist — it binds again at execution, and again as a
merge precondition.

The rule is: **a plan that changes behaviour a user or caller can reach must exercise that behaviour
before it merges.** The list below routes the common surfaces to their gates. It is a routing table,
never the boundary of the rule — a surface absent from it does not become exempt by omission.

- **UI-bearing plan** → run **both** UI gates: [`ui/ui-quality-gate.md`](../../ui/ui-quality-gate.md)
  (static, over component source) **and**
  [`web/web-ux-test-fixing-planning.md`](../../web/web-ux-test-fixing-planning.md) (the running-UI
  EWT/UWT/DWT triad).
- **API- or backend-bearing plan** → run [`api/api-quality-gate.md`](../../api/api-quality-gate.md).
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

## The Three UI Gates Are Complementary, Never Substitutes

They act at three different lifecycle stages, and passing one says nothing about the others:

- **`plan-checker` Step 5k** gates the UI **design funnel** in `prd.md` — **pre-build**, before any
  component exists.
- **`ui/ui-quality-gate.md`** gates the **built components** via `swe-ui-checker` / `swe-ui-fixer` —
  static analysis of source, no browser involved.
- **`web/web-ux-test-fixing-planning.md`** gates the **running UI** via the EWT/UWT/DWT triad — a
  real browser against a real deployment.

A component can satisfy Step 5k's design funnel, pass static token and accessibility checks, and
still be broken in the browser. Treating any one of the three as covering another is the failure
this distinction guards against.
