# 010 — Rule and Docs Impact

This plan is rule-affecting: it creates two rules that every AyoKoding course author must follow (no filler;
the filler list only shrinks) and applies one existing rule (reserved addresses) to two courses for the first
time. The rules-propagation phase of [../delivery.md](../delivery.md) runs the repository's
[Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over the
inventory below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected: `ose-public`.

## Rule Inventory

| Id    | Rule (one obligation each)                                                                                                                                                                                                                                                        | Scope                                                                              | Disposition                                                                                                                                                                                                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FILL1 | A course that is not an outline must not be templated filler: it passes the guard's six rules (FG1 to FG6) with the thresholds in `core/course-filler.ts`                                                                                                                         | `apps/ayokoding-www/content/en/learn/courses/**`                                   | **Gated**: `course-filler-guard.feature`, ratchet scenarios ("every non-outline course that fires a rule is in the baseline" and "every rewritten course passes"). After plan 14 empties the baseline, every non-outline course must pass with no list                                                       |
| FILL2 | The list of known filler courses only shrinks: a new entry is forbidden, the cap is lowered in the commit that removes an entry, and a listed course that no longer fires must leave the list                                                                                     | Same                                                                               | **Gated**: the same feature, scenarios "the baseline never exceeds its cap", "every baseline course still fires", "no slug is in both lists"                                                                                                                                                                 |
| SEC1  | Security course examples use only fictional addresses: private ranges, loopback, and the RFC 5737 and RFC 3849 documentation ranges. This is the existing rule of the security by-example convention, written out with the remaining RFC 1918, loopback, and documentation ranges | The two courses `defensive-security` and `vulnerability-management-and-assessment` | **Gated** for these two courses: `filler-course-completion.feature`, scenario "Security courses use only reserved addresses". The convention itself is unchanged; it governed the legacy tracks by name and nothing enforced it for the course library. Other security courses are plans 11 to 13's to audit |

Other obligations in this plan are not promoted to rules:

- **The definition of done (C1 to C11), word floors, and drilling floors** are plan-local targets. They bind
  the eight courses through the completion test, which also guards them after merge, but they are not promoted
  to a rule for every course, because the audit plans 11 to 13 have not measured what the other courses need.
  Plan 06 made the same choice for its 24 courses.
- **The safe-lab rules S1 to S4, S6, and S7 and the accuracy rules A1 to A7** ([005](./005-security-content-and-accuracy.md))
  are **unenforced by decision**: whether a lesson is synthetic, safe, dated, and sourced needs reading. They
  are judged by the Content Quality Gate, which the adapter points at the reference module. S4 (one banner per
  level page) is also caught indirectly by FG6 when a banner repeats in ten or more example bodies.

### How the Gated Rules Are Checked

The scenarios are written out in [../prd.md](../prd.md) and bound to Unit step files
([007](./007-testing-strategy.md)).

- **FILL1:** `scanCourseFiller` reads the real course tree, builds one `CourseSample` per course, and
  `evaluateCourse` returns which rules fired. A course skipped as an outline is not judged. The step compares
  the set of firing non-outline courses with the baseline and with the rewritten list.
- **FILL2:** the step reads `FILLER_BASELINE`, `FILLER_BASELINE_CAP`, and `REWRITTEN_FILLER_COURSES` and asserts
  the checks in [003](./003-filler-guard.md#the-baseline-ratchet). A pull request that adds an entry must raise
  the cap, which reviewers see as a number change.
- **SEC1:** the completion step collects every `.md` page and every code or fixture file of the two courses,
  applies the pattern of [005](./005-security-content-and-accuracy.md#sec1-in-detail), and fails on any dotted
  quad or IPv6 literal outside the allowed ranges.

## Placement

| Rule               | Canonical home                                                                                       | Reach                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FILL1, FILL2, SEC1 | New module `.agents/skills/apps-ayokoding-www-developing-content/reference/course-quality-guards.md` | Every AyoKoding content maker and fixer loads the skill; plans 11 to 13 cite it when they remove baseline entries                 |
| FILL1, FILL2, SEC1 | One pointer sentence in `repo-governance/development/quality/gate-adapters/ayokoding-www.md`         | The content and tutorial gates read the adapter, so the judged rules (safe lab, accuracy) and the gated rules both reach checkers |

The module links to nothing under `plans/`, because plans are archived and the rule must outlive them. It does
not copy the calibration tables; it points at `core/course-filler.ts`, whose constants carry their margins, and
at the security by-example convention for SEC1's origin. The module is written in the rule form the skill
already uses: statement, reason, violating and conforming example, enforcement line.

### Module Outline

1. **Why this exists** (three sentences: filler passed every earlier check; the guard counts repetition, not
   quality; the quality gates and the harness judge the rest).
2. **FILL1** — statement; the six measures in one table (name, meaning, threshold constant); a violating example
   (an example body that differs from the next only by a number) and a conforming one; enforcement line
   (`course-filler-guard.feature`).
3. **FILL2** — statement; how a fix removes an entry and lowers the cap in one commit; what to do when a rule
   seems wrong (change the rule with a fixture and a new calibration table, never an exemption); enforcement line.
4. **SEC1** — statement; the allowed ranges; the four-part-version trap; enforcement line.
5. **Judged obligations** — the safe-lab rules S1, S2, S3, S4, S6, and S7 and the accuracy rules A1 to A7, one
   line each, with "judged by the Content Quality Gate".

## Enforcement Proof (Both Ways)

"1, then 0" means the command exits 1 with the break in place and 0 after it is undone. Each break is made in the
working tree, run, then undone with `rtk git checkout -- <file>`, and the outputs are saved as evidence.

| Rule  | Break                                                                          | Command                                                           | Expected  |
| ----- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------- |
| FILL1 | Replace twelve example bodies of a rewritten course with the same paragraph    | `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts`            | 1, then 0 |
| FILL1 | Add an unlisted slug's templated fixture course to a temp tree (scan scenario) | Same                                                              | 1, then 0 |
| FILL2 | Remove one baseline entry whose course still fires                             | Same                                                              | 1, then 0 |
| FILL2 | Add an entry beyond the cap without raising it                                 | Same                                                              | 1, then 0 |
| FILL2 | Fix a baseline course (in a temp copy) without deleting its entry              | Same                                                              | 1, then 0 |
| SEC1  | Add a line containing `8.8.8.8` to a fixture of a security course              | `UNIT-NODE tests/unit/be-steps/filler-course-completion.steps.ts` | 1, then 0 |

## C4

No change. See [009](./009-file-impact.md#architecture-documents).

## Harness Routes and Gate

- Run `./rhino harness adapters generate` after the skill edit and `./rhino harness adapters validate` before
  commit, with the pinned Rhino adapter commands the repository documents; never edit a generated route by hand.
- Run the Rules Quality Gate on the changed rule files with `max-cycles` 2 and `mode: normal`; the verdict must be
  `PASS` or `PASS_WITH_FINDINGS`. A word-budget finding on the skill file is fixed by moving text into the
  reference module, not by deleting a rule.

## Docs Propagation

| File                                                            | Change                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md` | Lists `course-filler-guard.feature` and `filler-course-completion.feature`                                    |
| `apps/ayokoding-cli/README.md` (plan 05's)                      | The `clojure` toolchain and the `java` install recipe, if the README lists catalog entries                    |
| `docs/` and `apps/ayokoding-www/README.md`                      | Searched for "filler", "templated", "outline", and the eight slugs; each stale normative statement is fixed   |
| `repo-governance/conventions/tutorials/security-by-example/`    | Not edited. The convention's "Applies To" names the legacy tracks; the new reference module cites it for SEC1 |
