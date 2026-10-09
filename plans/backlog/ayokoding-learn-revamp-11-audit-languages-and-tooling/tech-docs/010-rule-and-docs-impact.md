# 010 — Rule and Docs Impact

This plan is lightly rule-affecting. It adds two small rules for AyoKoding content (honest labelling of
modelled and statically checked examples, and the completion registry), applies rules that plans 05 and 09
created (HC1 to HC8, FILL1, FILL2) without changing them, and keeps the definition-of-done floors
plan-local. The rules-propagation phase of [../delivery.md](../delivery.md) runs the repository's
[Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over the
inventory below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected:
`ose-public`. The private sibling and the upstream tools (RHINO, HIPPO) are independent and are not
consulted or notified.

## Rule Inventory

Each rule is one obligation, stated so a reviewer can tell when it is followed and when it is broken.

| Id  | Rule (one obligation each)                                                                                                                                                                                                                                                                                                                      | Scope                                                               | Disposition                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC1 | A lesson example whose unit models a tool, or checks configuration statically, says so in one plain sentence beside its fence; it never describes the model as the real tool                                                                                                                                                                    | `apps/ayokoding-www/content/en/learn/courses/**` with harness units | **Unenforced by decision**: telling a model from a real run needs reading the unit and the sentence; judged by the Content Quality Gate, which the adapter points at the module |
| TC2 | A course that has been audited to the definition of done is listed in the audited-course registry, and a listed course keeps its mode's floors: not an outline, its declared `format`, the word floor, the example count and numbering, the diagram rule, the "Why It Matters" band, the full drilling page, and units with a run specification | The courses in the registry (32 after this plan)                    | **Gated**: `audited-course-completion.feature`, eight scenarios. A course not in the registry is not bound; plans 12 and 13 add theirs                                          |

Obligations in this plan that are **not** rules:

- **The floors themselves** (28,000, 22,000, 18,000, and 23,000 words; 75, 45, and 20 examples; the diagram
  band; 5,000 words of drilling) are plan-local targets, exactly as plans 06, 07, and 08 chose. They bind the
  registered courses through TC2 and nothing else. Whether they become a rule for every course is plan 14's
  decision, after plans 12 and 13 have measured the rest.
- **The illustration budgets** are per-course numbers in the briefs. They are judged by the Content Quality
  Gate and change when the first audit shows a number is wrong; they are not a rule.
- **Rule AI-1** ([005](./005-prerequisites-ai-core-and-integrity.md#the-ai-engineer-path-core)) is a procedure
  of this plan and ends with it.

### Supersessions and Conflicts

- **Plan 05's HC4** already limits `<!-- harness: illustration -->` to code that is not meant to run as shown.
  TC1 does not touch it; it adds a duty for the opposite case (a unit that runs but models a tool).
- **Plan 05's HC1 to HC8** (run contract, layout, sync, determinism, simulation, static mode, completeness)
  apply to every course and are not restated. Nothing here loosens one.
- **Plan 09's FILL1 and FILL2** bind this plan's CP-6 for five courses (the baseline ratchet in
  [007](./007-testing-strategy.md#the-filler-baseline-ratchet)). TC2 adds to them and does not replace them.
- **Plan 06's decision D4, plan 07's DT1, and plan 08's decision on floors** kept their floors plan-local
  until plans 11 to 13 measure the other courses. TC2 respects that by binding only registered courses.
- **`AGENTS.md`, `CLAUDE.md`, and every instruction surface:** no change. These rules bind only AyoKoding
  content work, so the narrowest surfaces are the skill modules and the gate adapter.
- **The cap of 2 cycles** is a plan-level setting, not a durable rule: the gates already accept `max-cycles`
  1 to 3. No rule file changes for it.

### How the Gated Rule Is Checked

TC2 is checked by the eight scenarios of `audited-course-completion.feature`, written out in
[../prd.md](../prd.md#new-backendcontentaudited-course-completionfeature) and bound to the Unit step file
([007](./007-testing-strategy.md)). The step file reads committed files only: `_index.md` frontmatter with
gray-matter, the Markdown pages outside `code/` folders, the folder tree under `learning/code`,
`drilling/code`, and `learning/capstone/code`, and the registry. A registered course whose `format` has no
row in the floors table fails with the course and the unknown format named.

## Placement

| Rule     | Canonical home                                                                                                                                                                                  | Reach                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| TC1      | `.agents/skills/apps-ayokoding-www-developing-content/reference/code-example-harness.md` (plan 05's module), one section beside the illustration rule                                           | Every AyoKoding content maker and fixer loads the skill; plans 12 and 13 cite it                               |
| TC2      | `.agents/skills/apps-ayokoding-www-developing-content/reference/course-quality-guards.md` (plan 09's module), one section beside FILL1 and FILL2                                                | Same                                                                                                           |
| TC1, TC2 | The existing pointer sentences in `repo-governance/development/quality/gate-adapters/ayokoding-www.md` (plan 05's "Example Harness" section and plan 09's pointer), each extended by one clause | The content and tutorial gates read the adapter, so the judged rule and the gated rule both reach the checkers |

If Phase 0 finds that either module is absent under that name (plan 05 or 09 named it differently), the rule
goes into the module's merged name; if no module exists, a new module `audited-courses.md` holds both rules,
linked from `SKILL.md` and `reference/README.md`. The modules link to nothing under `plans/`, because plans
are archived and a rule must outlive them. They use the rule form the skill already has: statement, reason, a
violating and a conforming example, and an enforcement line.

## Exact Text Changes

### Rule TC1 (in `code-example-harness.md`)

> **Name the model.** When a unit models a tool the harness cannot host (a hypervisor, a profiler, a cloud
> API, a cluster) or checks a configuration without applying it (`mode: static`), the lesson says so in one
> plain sentence beside the fence, for example "This models what the hypervisor reports; it does not start a
> virtual machine." or "This configuration is validated, not applied." Never present a model as the real
> tool. The launch line of the real tool is a `<!-- harness: illustration -->` fence. Enforcement: judged by
> the Content Quality Gate.

### Rule TC2 (in `course-quality-guards.md`)

> **Audited courses stay audited.** A course audited to the definition of done is listed in
> `tests/unit/be-steps/audited-courses.ts` with its `format`. Listed courses keep their mode's word floor,
> example count and numbering, diagram rule, "Why It Matters" band, five-section drilling page, and
> `run.yaml` in every code unit. A change that would break one of them either keeps the floor or removes the
> course from the list with a reason in the commit. Enforcement:
> `audited-course-completion.feature` (Unit).

### Gate Adapter: Extend Two Pointers

In the adapter's "Example Harness" section and in plan 09's pointer sentence, add one clause each:

> … and name every model or static check in a plain sentence beside its fence (rule TC1).
>
> … and keep every audited course in the audited-course registry at its mode's floors (rule TC2).

### Skill Files

- `SKILL.md` and `reference/README.md`: no change if both modules already have entries; otherwise one index
  entry each.
- If another plan already added any of these sentences, the rule is recorded as `Not triggered` with the
  commit, and only a contradiction (if any) is fixed.

## Generated Harness Routes

The skill edits change reference files, not a skill's `name` or `description`, so the generated routes
(`.claude/skills/<skill>/SKILL.md` and the other declared harness directories) are expected not to change.
The delivery still runs, from the worktree root:

```bash
rtk ./hippo run --class transactional --resource-tier light --disk-path . -- ./rhino harness adapters generate
rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate
```

and records whether any generated file changed. Nobody edits a generated route by hand.

## Enforcement Proof (Both Ways)

"1, then 0" means the command exits 1 with the break in place and 0 after it is undone. Each break is made in
the working tree on a course already in the registry, run, then undone with `rtk git checkout -- <file>`, and
the outputs are saved as evidence. A break that does not turn the command red is a defect in the step, fixed
before the plan goes on.

| Rule | Break                                                                             | Command                                                            | Expected  |
| ---- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| TC2  | Rename `## Code katas` to `## Katas` in one registered course's drilling page     | `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` | 1, then 0 |
| TC2  | Change `### Example 12:` to `### Example 13:` in one registered By Example course | Same                                                               | 1, then 0 |
| TC2  | Delete one `run.yaml` of a registered code course                                 | Same                                                               | 1, then 0 |
| TC2  | Shorten one "Why It Matters" block to 20 words                                    | Same                                                               | 1, then 0 |
| TC2  | Remove one row from `audited-courses.ts` (the registry-complete scenario)         | Same                                                               | 1, then 0 |

TC1 is judged: its proof is a negative run of the Content Quality Gate on one modelled example whose sentence
was removed, which must report a finding, recorded as evidence.

## C4

No change. See [009](./009-file-impact.md#architecture-documents).

## Docs Propagation

| File                                                            | Change                                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md` | List `audited-course-completion.feature`                                                                                                           |
| `apps/ayokoding-cli/README.md` (plan 05's)                      | The shard-count rule and the `since` timeout, only if rung 2b, 2c, or 3 of the CI ladder changes them                                              |
| `docs/` and `apps/ayokoding-www/README.md`                      | Searched for statements about the number of audited courses, the harness coverage, and the CI shard count; each stale normative statement is fixed |
