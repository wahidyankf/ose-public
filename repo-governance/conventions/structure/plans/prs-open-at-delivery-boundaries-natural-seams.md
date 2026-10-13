---
description: Defines natural cohesive PR boundaries and requires every resulting main state to be immediately safe to deploy to production.
when_to_use: Use when deciding what belongs in one delivery unit and whether that unit is ready to merge.
---

# Natural Seams and Deployable State

[PRs Open at Delivery Boundaries](./prs-open-at-delivery-boundaries-rules.md) says **when** a PR
opens. This convention says **where** to draw the delivery-unit boundary and what the resulting
`main` state must guarantee.

## Split at Natural Cohesive Seams

Do not use numeric lines-of-code or file-count targets, ceilings, or exceptions to create, erase,
or force a PR boundary. Split delivery only at a natural cohesive seam: one independently useful
purpose that a reviewer can understand and that the repository can build, verify, operate, and
roll back without an unmerged sibling.

Keep every artifact required for that unit's internal consistency together. Source, tests, specs,
migrations, documentation, governance text, generated bindings, operational configuration, and
rollback support belong in the same unit when separating them would leave either side incomplete,
contradictory, or unsafe. A directory or surface boundary alone is not a delivery seam. Unrelated
purposes remain separate even when they happen to touch the same file or surface.

Independent units land in any order, up to the declared concurrency cap, serializing under host
or budget pressure. Split units share the delivery mode's resolved work location: reuse the plan's
one worktree for worktree modes, or use the primary checkout for main modes. Before landing, each
unit refreshes that location from fresh `origin/main` and re-runs its gates. Each PR unit is
reviewed against a base that already contains its dependencies rather than stacked on an unmerged
sibling. See
[Worktree Specification](./worktree-specification.md#worktree-specification) and
[Worktree Cap](./worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).

## Merge Only a Production-Deployable State

Merge a PR only when its exact resulting `main` state is safe to deploy to production immediately.
Complete user-reachable behaviour may be active. Incomplete behaviour must be complete-and-inert
behind a temporary feature flag that is disabled in production by default. The delivery unit must
test both the enabled and disabled paths and record the rollout, rollback, and flag-removal steps.

A flag does not excuse half-built behaviour, a broken enabled path, missing dependencies, or an
unsafe migration. It controls exposure of an otherwise internally complete increment. Work that
cannot satisfy the production-deployable-state test remains within its dependent delivery unit; it
does not merge as scaffolding that relies on a later PR to become safe.

## Preserve Trunk-Based Development

Keep branches short-lived and single-purpose. Integrate each independently deployable unit promptly
after its merge prerequisites pass; never hold a ready unit to batch it with later work. A large
natural seam is valid when all required artifacts belong together and the resulting state is safe,
while a small diff with two independent purposes must split.

The PR body names the natural seam, explains why the included artifacts must land together, states
the production-deployable state, and records applicable flag tests and lifecycle, proof, and
rollback. Reviewers judge those claims in context.

## Enforcement

**Enforcement disposition — unenforced by decision.** Numeric diff gates cannot determine whether
a seam is natural or a resulting state is safe to deploy. CI build, test, and lint results and plan
and review checks provide supporting evidence; authors and reviewers remain responsible for the
contextual judgment.

**See**: [What Every PR Body Must Carry](./prs-open-at-delivery-boundaries-pr-body.md).
