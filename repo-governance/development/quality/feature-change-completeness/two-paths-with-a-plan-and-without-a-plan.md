---
description: "How this rule binds a direct code change versus a change made through a plan document."
when_to_use: "Use when a feature change has a plan doc and you need to know how completeness is tracked."
---

# Two Paths: With a Plan and Without a Plan

This convention binds **both** ways a behaviour change reaches `apps/`, `libs/`, or `specs/` -- whether or not a planning document mediates it:

1. **Direct change (no plan doc)** -- When application or library code is edited directly, without a plan, the companion `specs/` Gherkin (and the contracts, tests, and documentation named below) MUST be added or updated **in the same commit or PR**. The `test:coverage:behaviour` Nx target and the `swe-code-checker` agent enforce this path.

2. **Planned change (plan doc)** -- When the work is mediated by a plan under `plans/`, the plan files are not themselves implementation artifacts, but any plan whose **scope creates, modifies, or deletes observable behaviour in `apps/`, `libs/`, or `specs/`** MUST carry explicit delivery-checklist steps that create or update the corresponding `specs/` Gherkin `.feature` files and run `test:coverage:behaviour`. The `plan-maker` agent emits these steps; the `plan-checker` agent flags their absence. The specs/Gherkin work is then executed -- and verified by path 1 -- when the plan runs.

   Additionally, every behaviour-implementing outcome section references its canonical Gherkin
   scenarios by stable ID or exact title, preserves RED→GREEN→REFACTOR evidence, and does not copy
   the full scenario into `delivery.md`. Multiple scenarios share a packet only when one cohesive
   outcome and proof boundary binds them. See
   [Gherkin-Tagged Delivery Steps](../../workflow/test-driven-development/gherkin-tagged-delivery-steps.md#gherkin-tagged-delivery-steps).

   The plan's BDD spec-delta map records each plan requirement, `ADD`/`UPDATE`/`DELETE`/`RETAIN`
   action, exact owner-relative feature path, exact durable scenario title, and Unit/Integration/E2E
   disposition outside the copy-ready Gherkin fence. The packet itself follows the owning app/lib's
   durable language and contains no plan identity or lifecycle metadata.

   This external traceability map is **unenforced by decision**. The plan checker reviews it
   semantically; a deterministic check cannot prove that domain-specific paths, titles, and adapter
   dispositions are complete and correctly mapped.

The end state is identical on both paths: code under `apps/`/`libs/` never lands without its companion `specs/` Gherkin. The plan path simply moves the obligation earlier, into planning, so missing specs are never discovered late.
