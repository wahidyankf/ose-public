# 011 — Rule and Docs Impact

This plan is rule-bearing by **retirement and consumption**: it retires one closed exception (the
pending-restructure marker), narrows one rule's wording, and applies rules that plans 05 and 06 created. It
creates no new durable rule. The rules-and-docs phase of [the delivery](../delivery.md#phase-6-rule-impact-and-docs-propagation)
runs the repository's [Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) and
[Docs Propagation](../../../../repo-governance/workflows/quality/docs-propagation.md) workflows over the inventory
below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected: `ose-public`.

## Rule Inventory

| Id         | Item                                                                                                                                                                                                        | Kind        | What happens in this plan                                                                                                                                                                                                                                                                                                    | Enforcement disposition                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RT1        | The pending-restructure marker (plan 02: a skills path may carry `restructurePendingIn` only if its id is on the closed allowlist)                                                                          | Retirement  | The field, the allowlist module, rule R9, the marker scenarios, and every flat-render branch are deleted in Phase 3 ([006](./006-path-restructure-and-pending-removal.md#removal-inventory)). Plan 02 classified it as not a durable rule, so no rule module holds it.                                                       | **Retired.** Proof: end-state rows G6 to G9 of [008](./008-testing-and-verification.md#end-state-gate) and the retired-marker scenario, which rejects a manifest that still carries the key |
| PM1        | A course under 1,000 words carries `status: outline`; a course that reaches the definition of done drops it (plan 02, module `course-status-and-path-model.md`)                                             | Applied     | All 30 ERP courses drop the marker course by course. No text change.                                                                                                                                                                                                                                                         | **Gated** (unchanged) by `course-frontmatter.unit.test.ts`; the real-corpus guard also checks it                                                                                            |
| PM2        | A manifest's core lists every prerequisite of each core course earlier or in `assumes`, and `assumes` lists nothing else (plan 02). Its text ends "(every manifest without the skills restructure marker)". | Narrow edit | Delete that parenthetical. The rule now covers every manifest because no marker exists. The statement, reason, examples, and enforcement line otherwise stay as they are.                                                                                                                                                    | **Gated** (unchanged) by `path-model-integrity.unit.test.ts`, which now also runs over the two ERP manifests                                                                                |
| PM3        | A course's `prerequisites` lists only true conceptual dependencies, judged by plan 02's rubric                                                                                                              | Applied     | Each ERP course re-derives its prerequisites by the rubric as it is finished (slice S6). No text change.                                                                                                                                                                                                                     | **Unenforced by decision** (unchanged): closure and ordering tests catch only the effects                                                                                                   |
| SC1 to SC8 | The Sharia content rules (plan 06, module `sharia-content.md`)                                                                                                                                              | Applied     | The three Sharia ERP courses follow them ([005](./005-sharia-policy-and-source-register.md#the-rules)). No text change. If Phase 0 finds that the module's scope line names only the accounting courses, a one-line edit widens it to "AyoKoding content that teaches Islamic finance", which is the scope plan 06 recorded. | SC4 to SC7 **gated** for the ERP courses by `erp-course-completion.feature` (seven scenarios); SC1 to SC3 and SC8 judged by the Content Quality Gate, as plan 06 recorded                   |
| HC1 to HC8 | The example-harness rules (plan 05)                                                                                                                                                                         | Applied     | All 30 courses opt in and pass `examples check`. No text change.                                                                                                                                                                                                                                                             | **Gated** by `ayokoding-www:examples:check` in the PR gate (all four shards in this PR) and the monthly full run                                                                            |
| DT1        | Drilling sections and word floors                                                                                                                                                                           | Plan-local  | They bind these 30 courses through `erp-course-completion.feature` and keep guarding them after merge. They are **not** promoted to a rule for every course, exactly as plan 06's decision D4 says, because plans 11 to 13 have not measured what the other courses need.                                                    | **Gated** for the 30 ERP courses only (scenarios "full drilling page" and "word floor")                                                                                                     |

Plan 02 reached the same conclusion for RT1: a closed, code-owned exception that two plans remove does not get a
rule module, and removing it needs no new rule. The only normative text that mentions the marker is the PM2
parenthetical and, if Phase 0 finds any, the docs listed under [Docs Propagation](#docs-propagation).

### Why No New Rule

Every obligation this plan puts on a maker already has a home: the tutorial gates carry the mode conventions, the
harness skill module carries the code contract (plan 05), the Sharia module carries SC1 to SC8 (plan 06), and plan
03's module carries the metadata fields. What is new is the **content**, and content is not a rule. The
plan-local targets of [003](./003-definition-of-done-and-targets.md#targets) are estimates for these 30 courses
([D14](./009-decision-records.md#d14--targets-are-plan-defined-estimates)); promoting them would bind courses that
nobody has measured.

If Phase 0 finds that plan 06 did **not** land the Sharia module or the drilling convention, the executor stops at
the `[HUMAN]` checkpoint described in [005](./005-sharia-policy-and-source-register.md); this plan does not write a
second copy of those rules.

## Placement

| Item | Canonical home                                                                                                      | Reach                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| PM2  | `.agents/skills/apps-ayokoding-www-developing-content/reference/course-status-and-path-model.md` (plan 02's module) | Every AyoKoding content maker and fixer loads the skill; the generated routes carry the edited text |
| RT1  | None. The retirement leaves no text behind except the deletion itself                                               | The code and test deletions, the docs listed below                                                  |

The skill stays within its word budget because the edit removes words.

## Exact Text Change for PM2

Before:

> A path manifest's core lists every prerequisite of each core course earlier in the path or in `assumes`, and
> `assumes` lists nothing else (every manifest without the skills restructure marker).

After:

> A path manifest's core lists every prerequisite of each core course earlier in the path or in `assumes`, and
> `assumes` lists nothing else.

If Phase 0 finds the module's wording different on `origin/main` (plan 02 may have reworded it before merging),
the executor makes the same deletion on the merged wording and records both texts in the evidence file. If the
module no longer mentions the marker, PM2 is recorded as `Not triggered` with the commit that removed it.

## Enforcement Proof (Both Ways)

Each break is made in the working tree, run, then undone with `rtk git checkout -- <file>`; the outputs are saved
as evidence. "1, then 0" means the command exits 1 with the break in place and 0 after it is undone.

| Item | Break                                                                            | Command                                                                                                           | Expected  |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| PM1  | Add `status: outline` back to one finished ERP course                            | `CORPUS-GUARD`, then the course-frontmatter and integrity tests over the real content                             | 1, then 0 |
| PM2  | Remove one slug from `assumes` in `skills/conventional-erp.json`                 | `UNIT-FE tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts` (use the merged file name) | 1, then 0 |
| RT1  | Add `"restructurePendingIn": "plan-07"` to `skills/sharia-erp.json`              | `UNIT-FE tests/unit/features/course-paths/core/schemas.test.ts` and the retired-marker scenario in `core-closure` | 1, then 0 |
| SC4  | Change one callout's type to `info` in a Sharia ERP course                       | `UNIT-NODE tests/unit/be-steps/erp-course-completion.steps.ts`                                                    | 1, then 0 |
| SC5  | Remove the disclaimer sentence from one Sharia ERP `overview.md`                 | Same                                                                                                              | 1, then 0 |
| SC6  | Add "FAS 9 governs zakah reporting." as its own paragraph in a Sharia ERP course | Same                                                                                                              | 1, then 0 |
| SC7  | Add a link to an `aaoifi.com` page that is not in the checked-links list         | Same                                                                                                              | 1, then 0 |
| DT1  | Delete one section from one ERP course's drilling overview                       | Same                                                                                                              | 1, then 0 |

## Generated Routes

The PM2 edit changes the text of a file under `.agents/skills/`. Run `HARNESS-GENERATE`, then `HARNESS-VALIDATE`
([Command Reference](../delivery.md#command-reference)). Both must exit 0. Record every path that
`rtk git status --short` shows afterwards; the expected set is the mirrored copy of the edited reference file, or
nothing if the routes only link to it. Never edit a generated route by hand.

## C4

No change expected. This plan adds no container, component responsibility, relationship, or boundary
([010](./010-file-impact.md#architecture-documents)). The delivery still reads the as-built
`specs/apps/ayokoding/www/architecture.md`, records "no change" with that reason, and edits the file only if it
describes the marker mechanism.

## Docs Propagation

| File                                                                                             | Change                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/src/features/course-paths/manifests/README.md`                               | The marker section is removed (plan 06 narrowed it to the two ERP paths); every skills path has phases and outcomes                                                         |
| `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md`                                         | No wording about a pending marker or a flat fixture                                                                                                                         |
| `apps/ayokoding-www/README.md`                                                                   | Any sentence about the marker or flat skills paths is removed; the ERP paths are described as phase-structured                                                              |
| `specs/apps/ayokoding/www/behaviours/frontend/course-paths/README.md`                            | The new `skills-erp-path-structure.feature` is listed; the deleted marker and flat scenarios are no longer described; the widened `path-copy` scope is stated               |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md`                                  | The new `erp-course-completion.feature` is listed beside `accounting-course-completion.feature`                                                                             |
| `.agents/skills/apps-ayokoding-www-developing-content/reference/course-status-and-path-model.md` | The PM2 edit above                                                                                                                                                          |
| `docs/` and `repo-governance/`                                                                   | Searched for `restructurePendingIn`, "pending restructure", "skills restructure", "flat roadmap", "ramp", and "Dangerous"; each stale normative statement is fixed in place |
| `specs/apps/ayokoding/www/architecture.md`                                                       | Only if it describes the marker (see C4)                                                                                                                                    |

`plans/backlog/README.md`, `plans/in-progress/README.md`, and `plans/done/README.md` change only for the promotion
and the archival steps in the delivery, never for authoring.
