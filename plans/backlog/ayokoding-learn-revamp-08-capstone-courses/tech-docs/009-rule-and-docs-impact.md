# 009 — Rule and Docs Impact

This plan is rule-affecting. It adds the first durable rules for capstone courses, closes a gap that plan
03's mode rule leaves for `format: capstone`, and adds one path-model rule. The rules-propagation phase of
[../delivery.md](../delivery.md) runs the repository's
[Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over the
inventory below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected:
`ose-public`. The private sibling and the upstream tools (RHINO, HIPPO) are independent and are not
consulted or notified.

## Rule Inventory

Each rule is one obligation, stated so a reviewer can tell when it is followed and when it is broken.

| Id  | Rule (one obligation each)                                                                                                                                                                                                                                                    | Scope                                                                                                               | Disposition                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CC1 | A course with `format: capstone` declares its tutorial mode (Annotated Concept, standard or no-code) in the first sentence of `## How this course is organized` in `learning/overview.md`, in one of the two exact forms; the tutorial gate reads the mode from that sentence | `apps/ayokoding-www/content/en/learn/courses/capstone-*`                                                            | **Gated** for the form: scenario "Every rewritten capstone states its project contract". Whether the declared mode fits the course is judged by the mode gate                                                                                                                |
| CC2 | A capstone page `learning/capstone/overview.md` has the six H2 headings in order; every acceptance criterion names a proof run; the rubric has at least six criteria                                                                                                          | Same                                                                                                                | **Gated** for headings, non-empty proof cells, and rubric size: the same scenario. Whether a named run really proves its criterion is **Unenforced by decision**: it needs reading the run; judged by the Content Quality Gate                                               |
| CC3 | A capstone links to a prerequisite only by its course URL, only for a course in its own `prerequisites` list, and keeps a `## What this course relies on` table with one row per prerequisite (CL1 and CL4)                                                                   | Same                                                                                                                | **Gated**: scenario "Capstone pages link prerequisites at course level only"                                                                                                                                                                                                 |
| CC4 | A capstone states in its own words each prerequisite concept it first uses (CL2) and imports nothing from a prerequisite's code folders (CL3)                                                                                                                                 | Same                                                                                                                | CL3: **Gated in part**, because a missing path fails the harness double run. CL2: **Unenforced by decision**: whether a concept is restated needs reading; judged by the Content Quality Gate                                                                                |
| CC5 | A security-flavoured capstone has a `## Safety boundary` section in its course `overview.md`; its code and expected files open no socket, resolve no name, run no shell, and use only documentation-range addresses                                                           | `capstone-secure-service`, `-build-your-own-pentest-engine`, `-real-world-delivery` and any later security capstone | **Gated** for the section and the banned-API and address scan: scenario "Security-flavoured capstones state their boundary and use no network or shell API". Operational detail in prose is **Unenforced by decision** and is a CRITICAL finding of the Content Quality Gate |
| CC6 | A capstone unit holds one toolchain; a file the capstone shares with a unit of another toolchain is an identical copy, compared byte for byte                                                                                                                                 | Same                                                                                                                | **Gated** for the two known pairs: scenario "Shared copies are byte-identical"; a new pair adds a row to the step file                                                                                                                                                       |
| CC7 | A figure that one course borrows from another is copied from the source course's expected-output file and appears in both                                                                                                                                                     | Same                                                                                                                | **Gated** for the one known pair: scenario "The lead capstone repeats the concurrency capstone's figures exactly"; a new pair adds a row                                                                                                                                     |
| CG1 | Every career path manifest declares at least one goal, so its core is a prerequisite closure and not a hand-curated list                                                                                                                                                      | `apps/ayokoding-www/src/features/course-paths/manifests/careers/**`                                                 | **Gated**: scenario "Every career path declares at least one goal" (`career-goals.unit.test.ts`)                                                                                                                                                                             |

### Supersessions and Conflicts

- **Plan 03's rule R3** (merged into `tutorial-kinds.md`, "Annotated Concept" → Mode) says a course's
  mode is read from its `format` field: `annotated-concept-no-code` selects the no-code sub-mode and
  `annotated-concept` selects standard mode. It has nothing to read for `format: capstone`. CC1 **extends**
  it for that one value and does not contradict it. All eight courses keep `format: capstone`, including
  the no-code course, so the catalog shows one label for every capstone (plan 03's backfill rule gives
  `capstone` to every slug that starts with `capstone-`). The extension sits in the same bullet, so the
  narrowest surface carries both.
- **The two `apps-ayokoding-www-authoring-annotated-concept` reference files** say to read the topic's
  format designation, stated "explicitly in the syllabus". Plan 03 already amends them to read the
  `format` field. CC1 adds "or, for `format: capstone`, the declaration sentence". The adapter is the
  higher layer; the skill is amended to agree (Phase 0 reads the merged wording first).
- **Plan 05's module** `code-example-harness.md` states HC1–HC8 (run contract, determinism, `mode:
static`, illustrations). CC5 to CC7 add capstone-specific limits on top and do not repeat them. Nothing
  here loosens an HC rule.
- **Plan 02's path-model module** states the rules for phases, `assumes`, and `status: outline`. CG1 is
  one more path-model rule. It goes into that module if it exists (Phase 0 finds its merged name; planned
  as `course-status-and-path-model.md`) and into `capstone-courses.md` only if it does not.
- **`AGENTS.md`, `CLAUDE.md`, and every instruction surface:** no change. These rules bind only AyoKoding
  content work, so the narrowest surfaces are the gate adapter and the skill.
- **The cap of 2 cycles** is a plan-level setting of this plan, not a durable rule: the gates already
  accept `max-cycles` 1 to 3. No rule file changes for it.

### How the Gated Rules Are Checked

The scenarios are the nine of `capstone-course-completion.feature` and the two of
`career-path-goals.feature`, written out in
[006](./006-e2e-rebinding-and-testing-strategy.md#new-feature-capstone-course-completion), and bound to
Unit step files that read committed files only.

- **CC1:** the step reads the first sentence after `## How this course is organized` and compares it with
  the two exact forms in [002](./002-capstone-course-contract-and-modes.md#required-headings-in-learningoverviewmd);
  the standard form is required for the seven code courses and the no-code form for the lead course.
- **CC2:** the step collects the H2 headings of `learning/capstone/overview.md` outside code fences and
  compares them with the six names in order. It counts rows of the `## Acceptance criteria` table, checks
  that the last cell of each row is not empty, and counts rows of the `## Rubric` table.
- **CC3:** the step reads each `prerequisites` list and the `relies-on` table, and checks every Markdown
  link to `/en/learn/courses/` as described in
  [003](./003-prerequisites-readiness-and-ordering.md#checked-by-a-test).
- **CC5:** the step checks for the `## Safety boundary` heading, then scans the code and expected files of
  the three courses with the list in [004](./004-code-harness-and-determinism-design.md#safety-checks-for-security-courses)
  (imports of network or process modules, `fetch`, shell calls) and checks each IPv4 address against the
  documentation ranges, `127.0.0.1`, and the private ranges used as data. The list lives in the step
  file with a comment saying where it comes from; a deliberate exception needs a named line in the file
  and a reason, and appears in the ledger.
- **CC6 and CC7:** byte comparison of the named files, and a fixed-string search for each figure in the
  source file and in the lead course.
- **CG1:** the helper in `career-goals.unit.test.ts` loads every career manifest and requires a
  non-empty `goals`.

## Placement

| Rule    | Canonical home                                                                                                                                    | Reach                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| CC1     | `repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md`, "Annotated Concept" → Mode bullet, one added sentence        | The Tutorial Annotated Concept Quality Gate reads the bullet for every course                       |
| CC1–CC7 | New module `.agents/skills/apps-ayokoding-www-developing-content/reference/capstone-courses.md`, linked from `SKILL.md` and `reference/README.md` | Every AyoKoding content maker and fixer loads the skill; plans 11–13 and any later capstone cite it |
| CC1–CC7 | One pointer bullet ("Capstone courses") in `repo-governance/development/quality/gate-adapters/ayokoding-www.md` under Content Rules               | The content and tutorial gates read the adapter, so the judged rules reach the checkers             |
| CG1     | Plan 02's path-model module (see above); otherwise `capstone-courses.md`                                                                          | Path-model work and every plan that changes a career manifest                                       |

The module links to nothing under `plans/`, because plans are archived and a rule must outlive them. It is
written in the rule form the skill already uses (statement, reason, a violating and a conforming example,
and an enforcement line). Its section order:

1. What a capstone course is (the catalog label versus the tutorial mode; CC1).
2. The project contract (the six headings; the acceptance and rubric tables; CC2).
3. Coupling to prerequisites (CL1 to CL4; CC3 and CC4), including the duty of a plan that rewrites a
   prerequisite: search the capstones for its slug and re-read the `relies-on` row.
4. Safety for security-flavoured capstones (CC5), with the author, search, and gate checks.
5. Units and shared files (CC6 and CC7).
6. Floors that stay plan-local, and where the content-shape test holds them.

## Exact Text Changes

### Tutorial Kinds: One Sentence

Add at the end of the "Annotated Concept" → Mode bullet in `tutorial-kinds.md` (whatever wording plan 03
left, which Phase 0 reads first):

> A course whose `format` is `capstone` declares its mode in the first sentence of `## How this course is
organized` in `learning/overview.md`: "This is an annotated-concept course (standard mode) with N worked
> examples in K themes." or "This is an annotated-concept course (no-code mode) with N worked scenarios in
> K themes."; the gate reads the mode from that sentence.

### Gate Adapter: One Pointer Bullet

Add under "Content Rules" in `ayokoding-www.md`:

> - **Capstone courses.** A course with `format: capstone` follows the capstone rules in the
>   `apps-ayokoding-www-developing-content` skill (`reference/capstone-courses.md`): the mode declaration, the
>   project contract, course-level coupling, the safety boundary, and unit limits. The content and tutorial
>   gates apply them to its pages.

### Skill Files

- `SKILL.md`: one line linking the new module, in the same place plan 05's harness module and plan 06's
  Sharia module are linked (Phase 0 finds the merged lines).
- `reference/README.md`: one index entry for `capstone-courses.md`.
- The two `apps-ayokoding-www-authoring-annotated-concept` reference files: add "or, for `format:
capstone`, the declaration sentence in `learning/overview.md`" to the sentence that names where the
  designation lives.

If Phase 0 finds that another plan already added any of these sentences, the rule is recorded as `Not
triggered` with the commit, and only a contradiction (if any) is fixed.

## Generated Harness Routes

The skill edits change reference files and, possibly, a `SKILL.md` body under `.agents/skills/`. The
generated route `.claude/skills/<skill>/SKILL.md` carries only each skill's `name` and `description`,
which do not change. The delivery still runs, from the worktree root:

```bash
rtk ./hippo run --class transactional --resource-tier light --disk-path . -- ./rhino harness adapters generate
rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate
```

and records whether any generated file changed (expected: none). Nobody edits a generated route by hand.

## Enforcement Proof (Both Ways)

| Rule | Break                                                                                                | Command                                                                                  | Expected  |
| ---- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| CC1  | Change the mode sentence in one standard course to "This course is annotated-concept."               | `UNIT-NODE tests/unit/be-steps/capstone-course-completion.steps.ts`                      | 1, then 0 |
| CC2  | Rename `## Rubric` to `## Grading` in one capstone page                                              | Same                                                                                     | 1, then 0 |
| CC3  | Add a link to `/en/learn/courses/the-agent-loop/learning/overview` in the coding-agent capstone page | Same                                                                                     | 1, then 0 |
| CC5  | Add `import socket` to one pentest-engine code file                                                  | Same                                                                                     | 1, then 0 |
| CC6  | Change one byte of `vectors.json` in `ex-46-capstone-elixir-batch`                                   | Same                                                                                     | 1, then 0 |
| CC7  | Change "43.2" to "43.0" in one place in the lead course                                              | Same                                                                                     | 1, then 0 |
| CG1  | Delete `goals` from the AI manifest                                                                  | `UNIT-NODE tests/unit/features/course-paths/manifests/careers/career-goals.unit.test.ts` | 1, then 0 |

"1, then 0" means the command exits 1 with the break in place and 0 after it is undone. Each break is
made in the working tree, run, then undone with `rtk git checkout -- <file>`, and the outputs are saved
as evidence. A break that does not turn the command red is a defect in the step, fixed before the plan
goes on.

## C4

No change. See [010](./010-file-impact.md#architecture-documents).

## Docs Propagation

| File                                                                  | Change                                                                                                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/src/features/course-paths/manifests/README.md`    | Every career path now declares a goal; the AI path's core is its closure                                                                  |
| `specs/apps/ayokoding/www/behaviours/frontend/course-paths/README.md` | List `career-path-goals.feature`; note the new exemption on "Start falls back to the first learning page" and on the outline anchors      |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md`       | List `capstone-course-completion.feature`                                                                                                 |
| `apps/ayokoding-cli/README.md` (plan 05's)                            | The shard-count rule, only if rung 2 of the CI ladder changes it                                                                          |
| `docs/` and `apps/ayokoding-www/README.md`                            | Searched for the AI path's old size and phases and for "outline" statements that name a capstone; each stale normative statement is fixed |
