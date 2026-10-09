# 005 — Rules and Docs Impact

This page lists every normative text and every document that describes the legacy bucket, says exactly
how each one changes, and gives the granular rules-propagation steps that land the changes. The plan
creates no new rule. It retires text that describes a tree that no longer exists, and it keeps one
convention (the software-engineering separation gate) working when the tree it checks for is gone. Terms
follow [001](./001-current-state-and-evidence.md).

Measured 2026-10-09 to 2026-10-10 at `origin/main` `bb7f90137`. Plans 05 and 06 edit some of the same
surfaces before this plan runs, so Phase 0 of [../delivery.md](../delivery.md) re-reads each surface and
records its as-merged text before any change below is applied.

## Summary

| Id  | Surface                                                                                                                                                                                                                        | Change                                                                                                                     | Disposition                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| RC1 | `repo-governance/conventions/writing/fp-variant-multi-language/scope-and-tabbed-format.md`                                                                                                                                     | Rescope from the four deleted folders to "any FP-variant by-example page under `learn/`"                                   | Unenforced by decision (scope statement, unchanged)  |
| RC2 | `.../fp-variant-multi-language/references.md`, its index line, and two index annotations                                                                                                                                       | Remove the "In-FP-by-example overview pages" section (four links) and the words that announce it                           | Covered (link validator fails on a dead target)      |
| RC3 | `repo-governance/development/quality/gate-adapters/ayokoding-www.md` ("Tree shape" bullet, after plan 06)                                                                                                                      | Remove the sentence that keeps the legacy tree's shape                                                                     | Unenforced by decision (judged by the content gate)  |
| RC4 | `.agents/skills/apps-ayokoding-www-developing-content/reference/canonical-content-tree-shape.md` (after 06)                                                                                                                    | Remove the "Legacy tree" diagram, its three-track rules, and the "Current top-level domains" list                          | Unenforced by decision (judged by the content gate)  |
| RC5 | `repo-governance/conventions/structure/learning-plan-syllabus/copy-paste-course-template.md` (line 98)                                                                                                                         | Reword one example so it does not cite `legacy/<path>`                                                                     | Unenforced by decision (template example)            |
| RC6 | `repo-governance/workflows/quality/docs-software-engineering-separation-quality-gate.md` (question 4) and `.agents/skills/docs-validating-software-engineering-separation/reference/what-to-validate-and-workflow.md` (item 4) | Replace "learning path with `by-example/` and `in-the-field/` tracks" by "a complete course in the as-merged course shape" | Unenforced by decision (judged), table paths Covered |

Surfaces searched and found to need **no change**: `AGENTS.md`, `CLAUDE.md`, every `README.md` under
`repo-governance/` other than the index annotations named in RC2, `docs/reference/`, `docs/how-to/` other
than the one link in the 94-file repoint, `specs/apps/ayokoding/www/architecture.md` (see
[C4 reconciliation](#c4-reconciliation)), and `apps/ayokoding-www/README.md`.

## Rule changes

Each change below is a text edit to a rule that already exists. Exact before and after text is given so
the executor reviews the edit, not a description of it. Lines wrap at 120 columns, as the surrounding
files do.

### RC1: the FP-variant convention stops naming the deleted folders

**Why.** The convention's scope is "all FP-variant by-example tutorial files" under four folders of the
legacy tree. Those folders are deleted by this plan. A scope that names paths which do not exist governs
nothing and misleads a maker who reads it. Measured 2026-10-10: no page outside the legacy tree uses the
`F#,Clojure` tab pair (`rtk git grep -l "F#,Clojure" -- apps/ayokoding-www/content/en/learn/courses`
prints nothing), so after the deletion the convention has no existing page to govern. It still states how
the first such page must look, so it is rescoped rather than deleted. Whether to keep the convention at
all is a user choice, flagged in [../README.md](../README.md#flags-for-the-user).

Line 12 today:

> - All FP-variant by-example tutorial files in
>   `apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/*/in-fp-by-example/` —
>   specifically `beginner.md`, `intermediate.md`, and `advanced.md` level pages.

Line 12 after:

> - Every FP-variant by-example tutorial page under `apps/ayokoding-www/content/en/learn/`: a page whose examples
>   show each concept in an F# tab followed by a Clojure tab. Its level pages (`beginner.md`, `intermediate.md`,
>   `advanced.md`) are the usual case. No such page exists on `main` after the legacy tree is removed, so this
>   convention binds the first one that is written.

Line 13 today: `- Overview pages (`overview.md`) under those paths, for any code snippets they contain.`
Line 13 after: `- The`overview.md`of a section that holds such pages, for any code snippets it contains.`

Line 14 ("Both English and Indonesian variants of those files when they exist") stays: it says "when they
exist" and stays true.

**Falsifiability.** Violating: a page under `content/en/learn/courses/` whose example blocks show only F#,
or show Clojure first. Conforming: the same page with `{{< tabs items="F#,Clojure" >}}` and F# first. The
rule's strength (MUST, in S1) is unchanged; only its reach is restated.

### RC2: the FP-variant references page loses four dead links

**Why.** `references.md` lists four overview pages inside the deleted tree (lines 22 to 27). After the
deletion the link validator fails on all four. They cannot be repointed: the mapping sends their folders to
`software-architecture` and `domain-driven-design`, and neither course has an FP-variant overview page.

Edits, all removals:

1. In `references.md`: delete the heading `**In-FP-by-example overview pages:**`, its four bullets, and the
   blank line after them.
2. In `references.md` front matter: `description` loses ", in-FP-by-example overview pages,"; `when_to_use`
   becomes "Use when looking up related conventions or the agents implementing this convention."
3. In `fp-variant-multi-language/README.md` (line 17) the index annotation is a copy of that front matter:
   apply the same two cuts.
4. In `fp-variant-multi-language.md` (line 21): "related conventions, agents, overview pages, and
   architecture documents." becomes "related conventions, agents, and architecture documents."

The README completeness convention requires every direct child to keep an annotated index entry, so item 3
and item 4 are part of the change, not extras.

**Falsifiability.** Violating: any link in this convention whose target is under `learn/legacy/`. Covered by
the link validator, which fails on the dead target. The two-way proof (re-add one link, see the validator
fail, restore it, see it pass) can only run **after** the deletion, because before it the legacy target
still exists and the validator cannot fail; it is recorded in
[../delivery.md](../delivery.md#phase-5-the-deletion).

### RC3: the gate adapter stops describing the legacy tree

**Why.** Plan 06 corrects the "Tree shape" bullet so that a new course lives at `courses/<slug>/` and adds
a sentence that "the legacy tree under `content/en/learn/legacy/` keeps the `<domain>/<area>/<topic>/`
shape". That sentence is true only while the tree exists.

Sentence removed (as plan 06 writes it):

> The legacy tree under `content/en/learn/legacy/` keeps the `<domain>/<area>/<topic>/` shape with only
> three track names (`by-concept`, `by-example`, `in-the-field`); `tools/` is legal there as an area name,
> never as a track.

What remains: "**Tree shape.** A new course lives at `content/en/learn/courses/<slug>/`, holding
`_index.md`, `overview.md`, `learning/`, and `drilling/`; its code units follow the example harness
layout." If Phase 0 finds that plan 06 did not add the sentence, or that another plan reworded the bullet,
RC3 is recorded as `Not triggered` with the as-merged text, and a grep for `legacy` in the adapter is the
only check.

### RC4: the content skill stops teaching the old tree

**Why.** `canonical-content-tree-shape.md` today teaches the four-layer `learn/<domain>/<area>/<topic>/`
hierarchy as the rule for all new content. Plan 06 replaces the diagram with the course layout and keeps the
old diagram under a "Legacy tree" heading. This plan removes what plan 06 kept.

Removed, from the as-merged file:

- the "Legacy tree" heading and its diagram;
- the rules that exist only for that shape: the three track names (`by-concept`, `by-example`,
  `in-the-field`), `tools/` as an area name, "every new topic directory must have at least `overview.md`",
  and the sentence about a track folder that holds only subdirectories;
- the "Current top-level domains (as of 2026-05-22)" list with its six domains and file counts.

Kept: the course layout and its rules, and the "Redirect map" sentence (any URL rename is added to
`apps/ayokoding-www/src/redirects/learn-reorg.ts`), which stays true.

Acceptance: `rtk git grep -n -i -E "legacy|<domain>|<area>|top-level domains" -- .agents/skills/apps-ayokoding-www-developing-content/reference/canonical-content-tree-shape.md`
prints nothing. If another plan already removed the content, record `Not triggered`.

### RC5: one template example stops citing `legacy/<path>`

**Why.** The syllabus template's lineage section gives, as an example of where a course's content was
mined from, "a prior narrative in `legacy/<path>`". The path will not exist.

Line 97 to 98 today: `- <where this course's content and structure were mined from, and what changed in the mining — for example a prior narrative in`legacy/<path>`or a predecessor plan's syllabus>.`

After: `- <where this course's content and structure were mined from, and what changed in the mining — for example an earlier narrative (cite its path and the commit that last held it) or a predecessor plan's syllabus>.`

A deleted tree stays readable in git history, so citing "path plus commit" keeps the lineage reproducible.

### RC6: the separation gate stops requiring the legacy shape

**Why.** This is the one change that is not a pure removal. The software-engineering separation gate
checks, for every row of the Specific Prerequisites table in `software-design-reference.md`, that "the
AyoKoding path holds the learning path the convention requires, its `by-example/` and `in-the-field/`
tracks included". The skill that carries the checklist says the same (item 4: `_index.md`,
`initial-setup.md`, `quick-start.md`, and the directories `by-example/` and `in-the-field/`). After the
repoint, the table row for Rust points at `learn/courses/rust-in-depth/`, a course that has the course
shape (`_index.md`, `overview.md`, `learning/`, `drilling/`) and none of the legacy files. Left alone, the
gate would report a defect on every row, forever, for a course that is correct.

The fix points the question at the **as-merged course shape**, in one place, instead of copying a file
list into the gate and the skill (a copy would drift the next time the shape changes). The single source is
`canonical-content-tree-shape.md`, which plan 06 rewrites and RC4 completes.

Gate workflow, question 4, today (lines 63 to 64):

> 1. the AyoKoding path holds the learning path the convention requires, its `by-example/` and `in-the-field/` tracks
>    included; and

After:

> 1. the AyoKoding path is a complete course in the shape that the content skill's canonical content tree shape
>    defines, and its `_index.md` does not carry `status: outline`; and

Skill item 4, today: heading "### 4. AyoKoding Learning Path Completeness" with the required files and
directories listed above.

After:

> ### 4. AyoKoding Course Completeness
>
> **For each AyoKoding path in the table**:
>
> - Check the path is a course directory under `apps/ayokoding-www/content/en/learn/courses/`
> - Check it holds the files and folders that `canonical-content-tree-shape.md` (skill
>   `apps-ayokoding-www-developing-content`) requires for a course
> - Check its `_index.md` does not carry `status: outline`

**Falsifiability.** Violating: a table row whose path is a course directory with no `overview.md`, or one
whose `_index.md` has `status: outline`. Conforming: `learn/courses/rust-in-depth/` with the as-merged
shape. The deterministic half (does the table path exist) is covered by the link validator after the
repoint; the shape judgement stays with the gate.

### Related edits that are not rule changes

These files describe the same relationship and change in the docs batches of
[003](./003-docs-repoint-and-link-validation.md), not here:
`docs/explanation/software-engineering/software-design-reference.md` (the "Relationship Pattern" bullet at
line 120, the "Content Types and Scope" list at lines 133 to 139, and the "learning paths are complete"
bullet at line 158, all of which describe by-example and in-the-field tracks) is edited in Batch C, and
`docs/how-to/add-programming-language.md` in Batch A.

## Rule candidates considered and not created

| Candidate                                                              | Why it is not created                                                                                                                                                                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "A removed public AyoKoding URL keeps a 308 to its equivalent forever" | It would bind every future removal and commit the site to a permanent redirect table, a policy choice for the user rather than a by-product of this deletion. This deletion's guarantee is enforced by its own permanent test |
| "`docs/` links to AyoKoding point at courses, never at a topic folder" | The link validator already fails on a missing target; the repoint is a one-time move, not a recurring mistake                                                                                                                 |
| A rule for course content (references, word floors, filler)            | Out of scope: plans 06 to 13 own the content rules, and this plan only measures them in the series-completion gate                                                                                                            |

If execution surfaces a candidate that holds beyond this deletion, it goes through Knowledge Capture
([../delivery.md](../delivery.md#phase-9-knowledge-capture)) and is reported to the user, not landed here.

## Rules-propagation steps

The repository's [Rules Propagation workflow](../../../../repo-governance/workflows/quality/rules-propagation.md)
is the required route for any edit to a rule-bearing path; it is named in a commit-time notice. These are
the nine steps, in order, each with the record it leaves and the acceptance that closes it. The record is
the placement record `local-tmp/ayokoding-learn/plan-14/rules-placement.md` plus the phase evidence
file; neither holds an absolute path.

| Step | Name                    | What the executor does                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Acceptance                                                                                     |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1    | Freeze the inputs       | Record RC1 to RC6 exactly as written above, the as-merged text of each surface at the current revision (`rtk git rev-parse HEAD`), and the uncommitted paths (`rtk git status --short`)                                                                                                                                                                                                                                                                                                         | The record holds six rows, each with its before text                                           |
| 2    | Falsifiability          | For each RC, record one violating and one conforming observation (given above) and the disposition                                                                                                                                                                                                                                                                                                                                                                                              | Six rows; every disposition is one of the three allowed words                                  |
| 3    | Existing-rule check     | Search `repo-governance/`, `.agents/`, and `AGENTS.md` by term (`legacy`, `learn/legacy`, `three-bucket`, `in-fp-by-example`, `by-example/`, `in-the-field/`, `initial-setup`, `quick-start`, `Tree shape`) and by surface (`content/en/learn/courses`). Include everything plans 05, 06, and 11 to 13 added: a rule they wrote may already restate or contradict an RC                                                                                                                         | The record lists each hit; every hit is an RC target, a report-only item (below), or explained |
| 4    | Conflict and precedence | Check each RC against the surfaces above it (principles, conventions) and beside it (the four tutorial conventions, the AyoKoding gate adapter, plan 05's `code-example-harness.md`). A contradiction is routed per the workflow's statement-and-conflict module, not softened                                                                                                                                                                                                                  | The record states "no contradiction" or the routing for each                                   |
| 5    | Placement               | Confirm each RC edits the surface that already binds the subject; no new file is created. Record any eviction a full word budget would force (none expected: every edit shortens text, except RC6 which stays within one line of its original length)                                                                                                                                                                                                                                           | One home per RC; no surface exceeds its budget                                                 |
| 6    | Canonical edits         | Apply RC1 to RC6 as written. Edit the canonical surface first (`.agents/`, `repo-governance/`), then regenerate the routes                                                                                                                                                                                                                                                                                                                                                                      | `rtk git diff --stat` lists only the surfaces of the summary table plus generated routes       |
| 7    | Enforcement disposition | Record `covered` for RC2 and for the table paths of RC6, `unenforced by decision` with the reason for RC1, RC3, RC4, RC5, and the judged half of RC6. Prove RC2 both ways after the deletion, in Phase 5 (the record says "pending Phase 5" until then): in a scratch edit re-add one legacy link to `references.md`, run the link validator (expected: exit 1 naming the file), then restore the line with `rtk git checkout -- <file>` and run it again (expected: exit 0). Save both outputs | Both outputs saved; the restored file is byte-identical to the edited one                      |
| 8    | Binding generation      | `HARNESS-GENERATE`, then `HARNESS-VALIDATE`. The skill edits (RC4, RC6) have generated routes under the declared harness directories                                                                                                                                                                                                                                                                                                                                                            | Both exit 0; the record lists the generated paths from `rtk git status --short`                |
| 9    | Verify and close        | `LINT-MD` exits 0; read the changed text once for closure; reconcile the placement record with `rtk git status --short` so every changed path is accounted for. Then run the Rules Quality Gate (below) and record the propagation `status`                                                                                                                                                                                                                                                     | Exit 0; no unexplained path; `status` is `landed`, or `not triggered` per RC3 or RC4           |

**Rules Quality Gate.** After step 9's checks, the executor requests the
[Rules Quality Gate](../../../../repo-governance/workflows/quality/rules-quality-gate.md) with `subject`
"RC1 to RC6 and their reasons" (kind `effective`), `mode` `normal`, and `max-cycles` 2. Its built-in limit
is higher than this plan's cap, so the input is always passed. Acceptance: a verdict of `PASS` or
`PASS_WITH_FINDINGS` with no open blocking row. A rule that still fails after cycle 2 is `BLOCKED`: it is
recorded, reported to the user, and the delivery unit does not merge until the user decides. A finding
about a surface this plan did not edit is recorded as pre-existing (proved with `rtk git show origin/main:<path>`)
and reported, not fixed here.

**Order against the deletion.** RC2 must land **before** the tree is deleted (it removes links that would
otherwise fail the validator in that commit), and RC6 must land **after** Batch C of the docs repoint (the
gate's table row must already point at the course). The phase order in
[../delivery.md](../delivery.md#phase-4-rules-and-docs-propagation) respects both; the commit that
deletes the tree comes after the docs batches and the rule edits that remove links.

## Docs propagation

The repository's [Docs Propagation workflow](../../../../repo-governance/workflows/quality/docs-propagation.md)
runs after the rule edits. Its inputs and outputs for this plan:

| Surface                                                                                      | Action                                                                                                                                                                          | Owner               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 94 files under `docs/` (158 lines)                                                           | Repointed in three batches ([003](./003-docs-repoint-and-link-validation.md#batches-and-commits)); the proof is the verify test, the destination census, and the link validator | `docs-fixer` agents |
| `docs/explanation/software-engineering/software-design-reference.md`                         | Reworded in Batch C (lines 120, 133 to 139, 158, and the Specific Prerequisites row) so no sentence promises `by-example` and `in-the-field` tracks                             | `docs-fixer`        |
| `specs/apps/ayokoding/www/behaviours/frontend/navigation/README.md` and `frontend/README.md` | Index entries: remove `architecture-cases-routes.feature`, add `learn-legacy-removal.feature`, fix scenario counts ([004](./004-code-spec-and-test-migration.md))               | `readme-fixer`      |
| `specs/apps/ayokoding/www/behaviours/backend/**` READMEs                                     | Re-read: the search feature keeps its name and its scenario count; the mapping-completeness feature (plan 10) leaves with its step file, so its index line goes too             | `readme-fixer`      |
| `apps/ayokoding-www/README.md` and the two e2e project READMEs                               | Re-read for a statement about redirects, the legacy bucket, or the renamed step files; edit only if one is found                                                                | `readme-fixer`      |

Acceptance for the whole propagation: `LINT-MD` exits 0, `./rhino md internal-link validate` exits 0, and
`rtk git grep -n -i -E "learn/legacy|legacy bucket|learn-three-bucket|isLegacySlug" -- . ':!plans' ':!local-tmp'`
prints nothing (the only remaining mentions of the legacy tree are in `plans/`, which archive with their
own history, and in the new redirect table and its permanent test).

## C4 reconciliation

The C4 architecture document `specs/apps/ayokoding/www/architecture.md` names the containers (the web
application, the content files) and the relationships between them. This plan changes none of them: the
redirect table is a module inside the existing web application, and the deleted pages are content files.
Measured: the document contains no mention of "redirect", "bucket", or "legacy". The executor reads it
against the as-built change and records `no change`.

## Report-only stale paths

Two groups of text have the same family of problem as the legacy addresses but did not start with them, so
this plan lists them and does not edit them (series decision: scope is the legacy bucket only).

1. **Older example paths in conventions and skills.** About 13 files and 60 lines under `repo-governance/`
   and `.agents/` show a pre-IA path such as
   `apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/...` as an example of
   a path shape. Command: `rtk git grep -n -E "ayokoding-www/content/en/learn/(software-engineering|information-security|artificial-intelligence)" -- repo-governance .agents`.
   They pre-date the legacy bucket. After this plan each such address answers with one 308 to a course
   root, so a reader who follows one still arrives somewhere useful.
2. **Absolute `ayokoding.com` examples.** The separation convention's templates
   (`programming-language-docs-separation/rule-3-prerequisite-knowledge-statements.md` and the Rule 5
   block) and the internal AyoKoding references convention give absolute
   `https://ayokoding.com/en/learn/...` links as examples. They also answer with a 308.

The final report lists both groups with counts re-measured in Phase 0, so the user can decide whether to
schedule a cleanup. They are not a gate input.

## Phase 0 rerun of the legacy-mention sweep

Phase 0 reruns the sweep that produced the lists in [001](./001-current-state-and-evidence.md) on the
as-merged tree and records any new hit, because plans 01 to 13 may have added a mention (a course
`## Lineage` line, a rule, a README):

```text
rtk git grep -n -i -E "learn/legacy|legacy bucket|legacy-bucket|legacy tree|three-bucket|isLegacySlug|homeLegacyPrompt" -- . ':!plans' ':!apps/ayokoding-www/content/en/learn/legacy' ':!local-tmp'
rtk git grep -n -E "legacy/" -- repo-governance .agents AGENTS.md docs/reference docs/how-to apps/ayokoding-www/content/en/learn/courses apps/ayokoding-www/content/en/learn/paths
```

A hit that is not in the lists above is classified before work starts: an edit this plan owns (added to the
file ledger and to the matching phase), or a content problem in a course (reported, not rewritten here,
per [004](./004-code-spec-and-test-migration.md#hidden-dependencies)).
