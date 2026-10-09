# 010 — Rule and Docs Impact

This plan is lightly rule-affecting. It adds four small rules for AyoKoding content (AI examples run offline on a
scripted model, changeable AI facts are dated and sourced, security-flavoured examples stay in process behind a stated
boundary, and the reserved-address rule reaches six more courses), applies rules that plans 05, 08, 09, 11, and 12
created (HC1 to HC8, CC1 to CC7, CL1 to CL4, FILL1, FILL2, SEC1, TC1, TC2, AU1 to AU3) without changing them, and keeps
the definition-of-done floors plan-local. The rules-propagation phase of [../delivery.md](../delivery.md) runs the
repository's [Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over the
inventory below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected: `ose-public`. The
private sibling and the upstream tools (RHINO, HIPPO) are independent and are not consulted or notified.

## Rule Inventory

Each rule is one obligation, stated so a reviewer can tell when it is followed and when it is broken.

| Id  | Rule (one obligation each)                                                                                                                                                                                                                                                                                         | Scope                                                                                                                                                                                                                          | Disposition                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AF1 | A code unit of an AI engineering course runs offline on a scripted model: it imports no hosted-model SDK, calls no model-download function, reads no credential variable, and opens no network module                                                                                                              | The code roots (`learning/code`, `drilling/code`, `learning/capstone/code`) of the 13 AI courses with code                                                                                                                     | **Gated**: scenario "AI course code calls no hosted model and reads no credential" in `course-content-safety.feature`. That the model is scripted and is called so in the lesson is judged by the Content Quality Gate through TC1                      |
| AF2 | A changeable fact in an AI engineering course (a product, a model, a protocol revision, a price, a limit, a law) carries an "as of" date (for example "as of October 2026") and a Reference with an access date within 30 days of the commit that adds it, or it is rewritten as a pattern with no changeable fact | The lessons and drilling pages of the 14 AI engineering courses                                                                                                                                                                | **Unenforced by decision**: telling a changeable fact from a stable one, and fetching its source, needs a reader with network access; judged by the Content Quality Gate and `docs-validating-factual-accuracy`, which the adapter points at the module |
| SF1 | A course whose examples attack, probe, detect, or sandbox keeps them in process on synthetic data behind a `## Safety boundary` section, and its code opens no socket, resolves no name, and runs no shell                                                                                                         | The six safety-scanned courses: `security-essentials`, `it-and-application-security`, `offensive-security`, `detection-engineering-and-siem-operations`, `agent-permissions-and-sandboxing`, `capstone-first-working-software` | **Gated** for the section and the banned-API scan: scenarios 1 and 2 of `course-content-safety.feature`. Operational detail in prose is **Unenforced by decision** and is a CRITICAL finding of the Content Quality Gate, as plan 08 decided for CC5    |
| SF2 | Plan 09's reserved-address rule (SEC1) applies to every safety-scanned course, pages and code and expected files: IPv4 only in the private, loopback, and RFC 5737 ranges, IPv6 only in `2001:db8::/32` or `::1`                                                                                                   | The same six courses                                                                                                                                                                                                           | **Gated**: scenario "Safety-scanned course pages and code use only reserved addresses". Plan 09's own scenario keeps its two courses                                                                                                                    |

Obligations in this plan that are **not** rules:

- **The floors themselves** (28,000, 22,000, 18,000, and 23,000 words; 75, 45, and 20 examples; the diagram band; 5,000
  words of drilling) are plan-local targets, as plans 06, 07, 08, 11, and 12 chose. They bind the registered courses
  through TC2 (plan 11) and nothing else. Whether they become a rule for every course is plan 14's decision.
- **The illustration budgets** are per-course numbers in the briefs, judged by the Content Quality Gate; they change when
  the first audit shows a number is wrong.
- **The fixture conventions** (a `FakeModel` kit per course, a counter clock, fixed seeds, stored responses; policy AI2
  to AI6) are practices of this plan, written for makers in [011](./011-ai-fixtures-and-sourcing-policy.md). AF1 turns
  the part a program can check into a rule; the rest ends with the plan unless a later plan promotes it.
- **The safe-lab rules S1 to S7** (plan 09) and **SL1 to SL4** (this plan) are content requirements judged by the Content
  Quality Gate, as plan 09 decided. SF1 and SF2 are the parts a test can check.
- **The toolchain budget rule, the CI ladder, the size-class rule, the wave order, and rule AI-1** are procedures of this
  plan ([004](./004-toolchain-additions-and-ci-cost.md), [005](./005-prerequisites-ai-path-and-capstone-integrity.md),
  [006](./006-execution-model.md)) and end with it.
- **The cap of 2 cycles** is a plan-level setting, not a durable rule: the gates already accept `max-cycles` 1 to 3. No
  rule file changes for it.

### Supersessions and Conflicts

- **Name clash: `S1` to `S7`.** Plan 09 uses `S1` to `S7` for its safe-lab rules; plan 05 and plan 12 use `S1` to `S9` for
  the simulation convention. This plan always says "plan 09's safe-lab rules S1 to S7" and never writes a bare `S1`
  without the plan, and it adds nothing under either name.
- **Plan 05's HC1 to HC8** (run contract, layout, sync, determinism, simulation, static mode, completeness) apply to
  every course and are not restated. Nothing here loosens one.
- **Plan 05's determinism rules** (no clock reads, explicit seeds, no network except declared services, no thread order,
  no hash-map order, no timing in compared streams) are not changed; AF1 adds the credential and download cases for AI
  units, and the fixture practices of 011 apply them to a scripted model.
- **Plan 08's CC5** (a security-flavoured capstone states its boundary and uses no network or shell API) is the model for
  SF1. SF1 reaches courses CC5 does not name; it does not edit CC5. Plan 08's three checks (author, search, gate) are
  reused as written ([012](./012-safe-lab-and-content-safety-rules.md#the-three-checks)).
- **Plan 08's CC1 to CC7 and CL1 to CL4** bind the three capstones of this plan, which are added to plan 08's content-shape
  scenarios ([007](./007-testing-strategy.md#the-three-capstones-and-plan-08s-constant)). CC6 gains one pair (the
  full-stack contract). Nothing is loosened.
- **Plan 09's SEC1** binds two courses in its own scenario; SF2 extends the rule's reach by a scenario of this plan's
  feature and does not edit plan 09's scenario or its course list. Plan 09's FILL1 and FILL2 bind this plan's CP-6 for
  six courses (the baseline ratchet in [007](./007-testing-strategy.md#the-filler-baseline-ratchet)). Nothing here
  replaces them.
- **Plan 09's accuracy rules A1 to A7** are restated in [011](./011-ai-fixtures-and-sourcing-policy.md#ai1-to-ai7) as the
  base of AF2 and applied to the AI courses; they are not edited.
- **Plan 11's TC1 and TC2** are applied, not changed. TC1 (a model or static check says so beside its fence) is
  load-bearing for the layout models, the static mobile and desktop courses, and the scripted models. TC2 (an audited
  course stays in the registry at its floors) gains 45 courses. If the merged TC2 text states a count of registered
  courses, Phase 8 replaces the count with the words "the courses in the registry", because the count changes with
  every plan.
- **Plan 12's AU1 to AU3** apply to this plan's units. AU1 (no value derived from the processor count) matters for the
  numeric courses, whose environment sets `OMP_NUM_THREADS=1`. AU3 (an example never talks to a real host) agrees with SF2
  and is stricter on one point: SF2 forbids public addresses everywhere in the six courses, not only in expected files.
- **`AGENTS.md`, `CLAUDE.md`, and every instruction surface:** no change. The four rules bind only AyoKoding content, so
  the narrowest surfaces are the skill modules and the gate adapter.

### How the Gated Rules Are Checked

AF1, SF1, and SF2 are checked by the four scenarios of `course-content-safety.feature`, written out in
[../prd.md](../prd.md#new-backendcontentcourse-content-safetyfeature) and bound to the Unit step file
([007](./007-testing-strategy.md#new-feature-course-content-safety)). The step file reads committed files only: the
Markdown pages, the code roots, and the expected files of the courses in scope. TC2 gains its tenth scenario
([../prd.md](../prd.md#audited-course-completion-the-tenth-scenario)).

## Placement

| Rule               | Canonical home                                                                                                                                                                                  | Reach                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| AF1, AF2           | `.agents/skills/apps-ayokoding-www-developing-content/reference/code-example-harness.md` (plan 05's module), one section beside TC1                                                             | Every AyoKoding content maker and fixer loads the skill                                                          |
| SF1, SF2           | `.agents/skills/apps-ayokoding-www-developing-content/reference/course-quality-guards.md` (plan 09's module), one section beside FILL1, FILL2, SEC1, and TC2                                    | Same                                                                                                             |
| AF1, AF2, SF1, SF2 | The existing pointer sentences in `repo-governance/development/quality/gate-adapters/ayokoding-www.md` (plan 05's "Example Harness" section and plan 09's pointer), each extended by one clause | The content and tutorial gates read the adapter, so the judged rules and the gated rules both reach the checkers |

If Phase 0 finds that either module is absent under that name (plan 05 or 09 named it differently), the rule goes into
the module's merged name; if no module exists, a new module `audited-courses.md` holds all four rules, linked from
`SKILL.md` and `reference/README.md`. The modules link to nothing under `plans/`, because plans are archived and a rule
must outlive them. They use the rule form the skill already has: statement, reason, a violating and a conforming
example, and an enforcement line.

## Exact Text Changes

### Rule AF1 (in `code-example-harness.md`)

> **Offline AI examples.** A code unit in an AI engineering course runs on a scripted model and stored responses, never
> on a hosted model. It imports no hosted-model SDK, calls no model-download function, reads no credential variable such
> as an API key or token, and opens no network module. A call to a hosted model appears only as a
> `<!-- harness: illustration -->` fence with a dated Reference. Enforcement: the scenario "AI course code calls no
> hosted model and reads no credential" (Unit).

### Rule AF2 (in `code-example-harness.md`)

> **Date what changes.** A claim in an AI course about a product, a model, a protocol revision, a price, a limit, or a
> law is written with an "as of" date (for example "as of October 2026") and has a Reference with an access date within 30 days of the commit that adds
> it. A claim that cannot be sourced on the day it is written is rewritten as a pattern with no changeable fact. A model
> is named by its role ("a small open-weight model") unless a dated Reference names a product. Enforcement: judged by
> the Content Quality Gate and `docs-validating-factual-accuracy`.

### Rule SF1 (in `course-quality-guards.md`)

> **Safe labs stay in process.** A course whose examples attack, probe, detect, or sandbox keeps them on synthetic data,
> in process, against a model or an application object that the course provides. The course states a `## Safety boundary`
> section, its code opens no socket, resolves no name, and runs no shell, and no unit takes a real target. Operational
> detail (a working exploit, a payload, a credential list) is never shown. Enforcement: scenarios 1 and 2 of
> `course-content-safety.feature` (Unit) for the section and the banned APIs; the Content Quality Gate for detail.

### Rule SF2 (in `course-quality-guards.md`)

> **Reserved addresses in every safety course.** The rule SEC1 applies to every course in the safety scope, not only to
> the courses a test names today: in pages, code, and expected files, IPv4 literals are in `10.0.0.0/8`,
> `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, or an RFC 5737 documentation range, and IPv6 literals are in
> `2001:db8::/32` or are `::1`. Enforcement: the scenario "Safety-scanned course pages and code use only reserved
> addresses" (Unit).

### Gate Adapter: Extend Two Pointers

In the adapter's "Example Harness" section and in plan 09's pointer sentence, add one clause each:

> … and keep AI examples offline on a scripted model with changeable facts dated and sourced (rules AF1 and AF2).
>
> … and keep security examples in process behind a stated boundary and inside the reserved addresses (rules SF1 and SF2).

### Skill Files

- `SKILL.md` and `reference/README.md`: no change if both modules already have entries; otherwise one index entry each.
- If another plan already added any of these sentences, the rule is recorded as `Not triggered` with the commit, and only
  a contradiction (if any) is fixed.

## Generated Harness Routes

The skill edits change reference files, not a skill's `name` or `description`, so the generated routes
(`.claude/skills/<skill>/SKILL.md` and the other declared harness directories) are expected not to change. The delivery
still runs, from the worktree root:

```bash
rtk ./hippo run --class transactional --resource-tier light --disk-path . -- ./rhino harness adapters generate
rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate
```

and records whether any generated file changed. Nobody edits a generated route by hand.

## Enforcement Proof (Both Ways)

"1, then 0" means the command exits 1 with the break in place and 0 after it is undone. Each break is made in the working
tree on a course already in the registry, run, then undone with `rtk git checkout -- <file>`, and the outputs are saved as
evidence. A break that does not turn the command red is a defect in the step, fixed before the plan goes on.

| Rule    | Break                                                                                             | Command                                                            | Expected  |
| ------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| AF1     | Add `import openai` to one unit of a registered AI course                                         | `UNIT-NODE tests/unit/be-steps/course-content-safety.steps.ts`     | 1, then 0 |
| AF1     | Add a read of an `API_KEY` environment variable to one unit                                       | Same                                                               | 1, then 0 |
| SF1     | Remove `## Safety boundary` from the `learning/overview.md` of a registered safety-scanned course | Same                                                               | 1, then 0 |
| SF1     | Add `import socket` to one unit of a registered security course                                   | Same                                                               | 1, then 0 |
| SF2     | Add a line with `8.8.8.8` to one expected file of a registered security course                    | Same                                                               | 1, then 0 |
| Scanner | Add an exception with an empty reason, then one for a file that does not exist                    | `UNIT-NODE tests/unit/be-steps/course-safety-scan.unit.test.ts`    | 1, then 0 |
| TC2     | Remove one row from `audited-courses.ts` (the "registry lists every course of plan 13" scenario)  | `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` | 1, then 0 |
| FILL2   | Put the entry of a finished baseline course back into `FILLER_BASELINE`                           | `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts`             | 1, then 0 |

AF2 is judged: its proof is a negative run of the Content Quality Gate on one lesson of an AI course whose Reference line
was removed, which must report a finding, recorded as evidence.

## C4

No change. See [009](./009-file-impact.md#architecture-documents).

## Docs Propagation

| File                                                              | Change                                                                                                                                                                       |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md`   | List `course-content-safety.feature`; the completion feature's entry is unchanged                                                                                            |
| `apps/ayokoding-cli/README.md` (plan 05's)                        | The shard-count rule, the selection rule, and the `since` timeout, only if a rung of the CI ladder changes them                                                              |
| `docs/` and `apps/ayokoding-www/README.md`                        | Searched for statements about the number of audited courses, the harness coverage, the number of toolchains, and the CI shard count; each stale normative statement is fixed |
| `docs/reference/` pages that describe the AyoKoding content rules | Searched for the words "AI examples", "safe lab", and "reserved addresses"; a stale statement is fixed, a new page is not added                                              |
