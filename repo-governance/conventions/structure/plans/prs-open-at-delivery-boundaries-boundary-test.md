---
description: Gives the boundary test for a cohesive, green, production-deployable, reviewable increment and explains why phases group into delivery units.
when_to_use: Use when testing whether a specific phase qualifies as a delivery boundary.
---

# PRs Open at Delivery Boundaries — Boundary Test and Rationale

Continues [PRs Open at Delivery Boundaries — Rules 5-7 and \*-to-pr Scope](./prs-open-at-delivery-boundaries-rules-5-to-7.md).

**The boundary test** — a phase is a delivery boundary when all four hold:

- **(a) Coherent** — the accumulated increment is a complete unit of meaning (a capability, a
  migration step, a governance rule), not half a refactor.
- **(b) Green standalone** — every quality gate passes on the increment alone.
- **(c) Production-deployable on `main`** — the exact resulting state is safe to deploy to
  production immediately. Complete user-reachable behaviour may be active. Incomplete behaviour is
  complete-and-inert behind a temporary feature flag disabled in production by default, with both
  paths tested and rollout, rollback, and flag removal recorded.
- **(d) Reviewable whole** — a reviewer can judge it without reading phases that do not exist yet.

A phase that fails any of these is an **intermediate phase**, not a boundary. Typical intermediate
phases: scaffolding a schema nothing reads yet, extracting a helper the next phase consumes, writing
a fixture the next phase asserts on.

**Why this is a hard rule**: a PR per phase spends a full discipline-specialist fan-out, a synthesis
pass, a fixer pass, and up to five CI-gated cycles reviewing scaffolding that the very next phase
rewrites — and the review cannot judge the work's intent, because the intent only becomes visible two
phases later. Grouping to the natural boundary makes each review see one complete thought with
every artifact required to build, verify, operate, roll back, and remain internally consistent.

The counterweight is rule 6 in [PRs Open at Delivery Boundaries — Rules 5-7](./prs-open-at-delivery-boundaries-rules-5-to-7.md): the same instinct, over-applied, produces one end-of-plan mega-PR
that no reviewer can hold in their head and that diverges from `main` for the plan's whole lifetime.
Delivery boundaries are the calibration point between those two failure modes. Numeric LOC and
file counts never create, erase, or force the boundary.

See [Delivery Boundaries Declaration and Applicability](./delivery-boundaries-and-applicability.md) for the required declaration format and enforcement.
