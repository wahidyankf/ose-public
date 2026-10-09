# 010 — Rule and Docs Impact

This plan is rule-affecting: it creates rules that content authors (here and in plan 07) must follow,
and it corrects one stale rule that every new course would contradict. The rules-propagation phase of
[../delivery.md](../delivery.md) runs the repository's
[Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over
the inventory below, then the Rules Quality Gate (at most 2 cycles). Only one repository is affected:
`ose-public`.

## Rule Inventory

| Id  | Rule (one obligation each)                                                                                                                                                                                              | Scope                                          | Disposition                                                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC1 | Every Sharia position names its body or scholar, the document, and its date, with a source and access date                                                                                                              | AyoKoding content that teaches Islamic finance | **Unenforced by decision**: whether a sentence states a position needs reading; judged by the Content Quality Gate, which the adapter points at the module                                                                                                                                                        |
| SC2 | Where recognised bodies, schools, or jurisdictions differ, each position is presented, attributed; none is the only valid view                                                                                          | Same                                           | **Unenforced by decision**: whether sources differ needs domain judgement; judged by the Content Quality Gate                                                                                                                                                                                                     |
| SC3 | Course text gives no Sharia verdict of its own; verdict words appear only attributed to a named source                                                                                                                  | Same                                           | **Unenforced by decision**: attribution of a verdict word depends on sentence meaning; judged by the Content Quality Gate                                                                                                                                                                                         |
| SC4 | Each point that needs a Sharia board decision uses the warning callout starting "Sharia board decision needed."; a Sharia course has at least four                                                                      | Same                                           | **Gated**: `accounting-course-completion.feature`, scenario "Every Sharia accounting course states its limit and flags board decisions in one form" (form and count, for the five courses)                                                                                                                        |
| SC5 | Each Sharia course's `overview.md` contains the fixed disclaimer sentence                                                                                                                                               | Same                                           | **Gated**: the same scenario                                                                                                                                                                                                                                                                                      |
| SC6 | Teach the standard in force on the access date; name a superseded standard only as history, in a paragraph that says it was replaced or superseded; teach an issued, not-yet-effective standard with its effective date | Same                                           | **Gated** for the superseded-standard part: scenario "Sharia accounting courses name superseded AAOIFI standards only as history". The in-force and effective-date parts are **Unenforced by decision**: whether a date is right needs the source; judged by the Content Quality Gate against the Source Register |
| SC7 | An `aaoifi.com` link is used only after a person opened it in a browser and confirmed it is AAOIFI's page                                                                                                               | Same                                           | **Gated**: scenario "Every AAOIFI link in an accounting course was checked by a person" compares links with a verified list kept in the step file; adding a URL to the list needs the check                                                                                                                       |
| SC8 | Jurisdiction values (zakah rate, nisab, calendar, method, thresholds) are configuration with a source and date, never constants in code                                                                                 | Same                                           | **Unenforced by decision**: telling a jurisdiction value from an ordinary constant needs reading; judged by the Content Quality Gate                                                                                                                                                                              |
| TS1 | (edited) New courses follow `content/en/learn/courses/<slug>/` with `_index.md`, `overview.md`, `learning/`, and `drilling/`; the `<domain>/<area>/<topic>/` track shape applies to the legacy tree only                | `apps/ayokoding-www/content/en/learn/**`       | Unchanged from today: **Unenforced by decision** for the page layout (judged by the content gate); its code-unit half is gated by plan 05's `examples validate` (`ayokoding.layout.*`)                                                                                                                            |

Course drilling and word floors stay plan-local targets (decision D4): they bind this plan's 24
courses through the content-shape test, which also keeps guarding them after merge, but they are not
promoted to a rule for every course, because the audit plans 11–13 have not measured what the other
courses need.

### How the Gated Rules Are Checked

The scenarios are part of `accounting-course-completion.feature`, written out in
[007](./007-testing-strategy.md#new-feature-accounting-course-completion), and bound to the same Unit
step file.

- **SC4 and SC5:** the step file finds every `{{< callout … >}}` block whose body starts with
  `**Sharia board decision needed.**`, checks that its type is `warning`, counts at least four per
  Sharia course, and finds the disclaimer sentence in `overview.md`.
- **SC6:** the step file holds the list of AAOIFI standards superseded on 2026-10-09, taken from the
  [Source Register](./004-sharia-content-policy-and-sources.md#source-register): FAS 2, 8, 9, 11, 16,
  18, 20, 22, 25, and 27. It splits each Markdown page of the five Sharia courses into blocks at blank
  lines, outside code fences. A block that names a listed standard (matched so that `FAS 2` does not
  match `FAS 28`) must also contain a word starting with `replac` or `supersed`. FAS 3, 4, 7, and 10
  stay in force until 31 December 2026, so they are not on the list; when the list changes, the step
  file changes with a source and a date.
- **SC7:** the step file holds `VERIFIED_AAOIFI_URLS`, the links a person has checked. It collects
  every link whose host is `aaoifi.com` or one of its subdomains from all 24 courses, and fails on any
  link not in the list. For these 24 courses the check is stricter than SC7, because the series
  requires a human check of every AAOIFI URL (including `cis.aaoifi.com`) before merge. The list is
  filled only from ticked rows of the AAOIFI URL register, at the human stop after the batches (see
  [../delivery.md](../delivery.md)). A later edit that adds an AAOIFI link fails `test:quick` until a
  person checks it.

## Placement

| Rule    | Canonical home                                                                                                                                                                                  | Reach                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| SC1–SC8 | New module `.agents/skills/apps-ayokoding-www-developing-content/reference/sharia-content.md`                                                                                                   | Every AyoKoding content maker and fixer loads the skill; plan 07's Sharia ERP courses cite it |
| SC1–SC8 | One pointer sentence in `repo-governance/development/quality/gate-adapters/ayokoding-www.md`                                                                                                    | The content and tutorial gates read the adapter, so the judged rules reach checkers           |
| TS1     | `repo-governance/development/quality/gate-adapters/ayokoding-www.md` ("Tree shape" bullet) and `.agents/skills/apps-ayokoding-www-developing-content/reference/canonical-content-tree-shape.md` | Both existing homes of the stale rule are corrected in the same edit                          |

The module links to nothing under `plans/`, because plans are archived and the rule must outlive them.
The module is written in the rule form the skill already uses (statement, reason, violating and
conforming example, enforcement line).

## Exact Text Changes for TS1

Gate adapter "Tree shape" bullet, today:

> **Tree shape.** New learning content follows `content/en/learn/<domain>/<area>/<topic>/`, holding
> `_index.md`, `overview.md`, and track folders. Only three track names exist: `by-concept`,
> `by-example`, and `in-the-field`. `tools/` is legal as an area name, never as a track.

After:

> **Tree shape.** A new course lives at `content/en/learn/courses/<slug>/`, holding `_index.md`,
> `overview.md`, `learning/`, and `drilling/`; its code units follow the example harness layout. The
> legacy tree under `content/en/learn/legacy/` keeps the `<domain>/<area>/<topic>/` shape with only
> three track names (`by-concept`, `by-example`, `in-the-field`); `tools/` is legal there as an area
> name, never as a track.

`canonical-content-tree-shape.md` gets the same two statements, with its tree diagram replaced by the
course layout from [002](./002-course-modes-and-definition-of-done.md#file-layout-per-course) and the
old diagram kept under a "Legacy tree" heading. If Phase 0 finds that another plan already corrected
the rule on `origin/main`, TS1 is recorded as `Not triggered` with the commit, and only a
contradiction (if any) is fixed.

## Enforcement Proof (Both Ways)

| Rule | Break                                                               | Command                                                               | Expected  |
| ---- | ------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- |
| SC4  | Change one callout's type to `info` in a Sharia course              | `UNIT-NODE tests/unit/be-steps/accounting-course-completion.steps.ts` | 1, then 0 |
| SC5  | Remove the disclaimer sentence from one Sharia `overview.md`        | Same                                                                  | 1, then 0 |
| SC6  | Add "FAS 9 governs zakah reporting." as its own paragraph           | Same                                                                  | 1, then 0 |
| SC7  | Add a link to an `aaoifi.com` page that is not in the verified list | Same                                                                  | 1, then 0 |

"1, then 0" means the command exits 1 with the break in place and 0 after it is undone.

Each break is made in the working tree, run, then undone with `rtk git checkout -- <file>`, and the
outputs are saved as evidence.

## C4

No change. See [009](./009-file-impact.md#architecture-documents).

## Docs Propagation

| File                                                                  | Change                                                                                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www/src/features/course-paths/manifests/README.md`    | The accounting paths now have phases and outcomes; the marker remains only on the two ERP paths (plan 07)                   |
| `specs/apps/ayokoding/www/behaviours/frontend/course-paths/README.md` | The reworded statement feature, the new composition scenario, and the path-copy scenario; "ramp" wording removed            |
| `specs/apps/ayokoding/www/behaviours/backend/content/README.md`       | The new `accounting-course-completion.feature`                                                                              |
| `apps/ayokoding-cli/README.md` (plan 05's)                            | The `psql` toolchain, if the README lists catalog entries                                                                   |
| `docs/` and `apps/ayokoding-www/README.md`                            | Searched for "ramp", "Dangerous", "RampMilestoneStrip", and "restructurePendingIn"; each stale normative statement is fixed |
