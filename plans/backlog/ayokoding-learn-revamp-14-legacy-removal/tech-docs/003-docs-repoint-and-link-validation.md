# 003 — Docs Repoint and Link Validation

94 files under `docs/` link into `apps/ayokoding-www/content/en/learn/legacy/`. Once the tree is deleted
every one of those links is broken, and the repository's link validator fails the pull request. This
page says how each link is repointed to the course that replaces its topic, how the sentence around the
link keeps its meaning, how the software-engineering (SE) separation convention stays satisfied, and how
the result is proven. Terms follow [001](./001-current-state-and-evidence.md).

Measured 2026-10-09 to 2026-10-10 at `origin/main` `bb7f90137`, with `rtk git grep` over `docs/` and a
longest-prefix lookup of every link against plan 10's mapping rows.

## What changes and what does not

- **Changes**: the link target of every link into `learn/legacy/`, the visible link text when it names a
  page that no longer exists, and the one sentence or list item that carries the link.
- **Does not change**: any other line of the 94 files, any docs file that has no legacy link, the
  relative prefix in front of `apps/ayokoding-www/content/en/learn/` (the part that depends on the file's
  depth, which already satisfies the
  [internal AyoKoding references convention](../../../../repo-governance/conventions/linking/internal-ayokoding-references.md)),
  and the `/en/` language directory.

## Measurements

| Measure                                                                                      | Value                                                                                                                                                                                                        | Command (from the repository root)                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Files with a legacy link                                                                     | 94                                                                                                                                                                                                           | `rtk git grep -l "learn/legacy" -- docs`                                                         |
| Lines with a legacy link                                                                     | 158                                                                                                                                                                                                          | `rtk git grep -c "learn/legacy" -- docs` (sum of the per-file counts)                            |
| Markdown links (some lines hold two or more)                                                 | 170                                                                                                                                                                                                          | counted by the longest-prefix lookup                                                             |
| Links that are not Markdown links (bare text, code spans)                                    | 0                                                                                                                                                                                                            | same lookup                                                                                      |
| Links with a `#fragment`                                                                     | 11, all on 5 lines in two Rust files (`concurrency-standards.md`, `memory-management-standards.md`), each citing a numbered by-example lesson                                                                | `rtk git grep -n -E "learn/legacy[^)]*#" -- docs`                                                |
| Links whose visible text names a sub-page type ("By Example", "In the Field") or a file name | 29                                                                                                                                                                                                           | by reading the lookup output                                                                     |
| Files that hold two or more links with the same destination                                  | 25                                                                                                                                                                                                           | by reading the lookup output                                                                     |
| Distinct destination courses                                                                 | 12                                                                                                                                                                                                           | by the lookup                                                                                    |
| Existing links from `docs/` into `learn/courses/` or `learn/paths/`                          | 0                                                                                                                                                                                                            | `rtk git grep -n -E "content/en/learn/(courses\|paths)" -- docs`                                 |
| Markdown links into the legacy tree from outside `docs/` and the tree itself                 | 2 files: `content/en/learn/_index.md` (regenerated), `repo-governance/conventions/writing/fp-variant-multi-language/references.md` (see [005](./005-rules-and-docs-impact.md)); no plan folder links into it | `rtk git grep -l -E "\]\([^)]*learn/legacy" -- . ':!apps/ayokoding-www/content/en/learn/legacy'` |

Every legacy link target is a directory (`.../rust/`) or a Markdown file (`.../by-example/beginner.md`).
The link validator accepts a directory target when the directory exists, as it does today.

## The sixteen groups

Plan 10's repoint table has 16 groups. The table below restates them, adds the measured counts, and
names the **outlier** links: links whose own mapping row differs from the group's stated destination.
The group table is a summary; the per-link row is the authority (rule 1 below). Eleven links in six
groups are outliers.

| Id  | `docs/` location                                                 | Files  | Lines   | Links   | Plan 10 destination (first-listed slug is the link target)                               | Outlier links (own destination)                                        |
| --- | ---------------------------------------------------------------- | ------ | ------- | ------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| G01 | `explanation/software-engineering/programming-languages/rust/`   | 13     | 19      | 25      | `rust-in-depth`                                                                          | none                                                                   |
| G02 | `.../programming-languages/f-sharp/`                             | 13     | 15      | 15      | `fsharp-in-depth`                                                                        | none                                                                   |
| G03 | `.../programming-languages/c-sharp/`                             | 13     | 14      | 14      | `csharp-in-depth`                                                                        | none                                                                   |
| G04 | `.../programming-languages/java/` (README and 3 standards files) | 4      | 6       | 6       | `java-in-depth`                                                                          | none                                                                   |
| G05 | `.../programming-languages/typescript/README.md`                 | 1      | 5       | 5       | `typescript-in-depth`                                                                    | none                                                                   |
| G06 | `.../automation-testing/tools/playwright/`                       | 10     | 13      | 13      | `playwright-end-to-end-testing`                                                          | none                                                                   |
| G07 | `.../development/behaviour-driven-development-bdd/`              | 6      | 8       | 9       | `software-testing`                                                                       | 1 to `object-oriented-design-and-patterns`                             |
| G08 | `.../development/test-driven-development-tdd/`                   | 5      | 7       | 8       | `software-testing`                                                                       | 1 to `object-oriented-design-and-patterns`                             |
| G09 | `.../development/README.md`                                      | 1      | 4       | 6       | `software-testing`                                                                       | none                                                                   |
| G10 | `.../architecture/domain-driven-design-ddd/`                     | 6      | 8       | 8       | `domain-driven-design`                                                                   | 4 to `object-oriented-design-and-patterns`                             |
| G11 | `.../architecture/c4-architecture-model/`                        | 6      | 9       | 9       | `technical-communication`                                                                | 1 to `domain-driven-design`                                            |
| G12 | `.../architecture/hexagonal-architecture/`                       | 5      | 14      | 14      | `software-architecture` (then `object-oriented-design-and-patterns`)                     | none                                                                   |
| G13 | `.../architecture/finite-state-machine-fsm/`                     | 4      | 6       | 7       | `object-oriented-design-and-patterns`                                                    | 1 to `domain-driven-design`                                            |
| G14 | `.../architecture/ddd-hexagonal-in-practice/`                    | 5      | 23      | 24      | `domain-driven-design`, `software-architecture`                                          | none (1 link to `domain-driven-design`, 23 to `software-architecture`) |
| G15 | `explanation/software-engineering/software-design-reference.md`  | 1      | 6       | 6       | `technical-communication`, `domain-driven-design`, `object-oriented-design-and-patterns` | 2 to `software-testing` (TDD, BDD), 1 to `rust-in-depth`               |
| G16 | `how-to/add-programming-language.md`                             | 1      | 1       | 1       | `golang-in-depth`                                                                        | none                                                                   |
|     | **Total**                                                        | **94** | **158** | **170** |                                                                                          | **11**                                                                 |

Links per destination course (the first-listed slug of each link's own row): `software-architecture` 37,
`rust-in-depth` 26, `software-testing` 23, `fsharp-in-depth` 15, `csharp-in-depth` 14,
`object-oriented-design-and-patterns` 13, `playwright-end-to-end-testing` 13, `technical-communication` 9,
`domain-driven-design` 8, `java-in-depth` 6, `typescript-in-depth` 5, `golang-in-depth` 1.

## Rules

### 1. Link target: longest-prefix row, first-listed slug, course root

For each legacy link:

1. Remove everything up to and including `learn/legacy/`, then any `#fragment`, any trailing `/`, and a
   trailing `.md`. The result is the legacy path.
2. Find the mapping row with the longest path that equals the legacy path or is a segment-prefix of it. A
   single-file row matches only its own file. This is the same lookup the redirect inventory uses, so
   the destination of a docs link equals the destination the 308 would give for the same address (look
   the legacy URL up in `legacy-url-inventory.tsv`, [002](./002-redirect-mechanism-and-url-inventory.md#the-frozen-url-inventory)).
3. The new target is `<same relative prefix>apps/ayokoding-www/content/en/learn/courses/<first-listed-slug>/`.
   Only the part after `learn/` changes.
4. No fragment survives. The validator does not check anchors, so a leftover `#example-8-...` would pass
   and point nowhere.
5. A row with no course (`Obsolete`) has no repoint target. None of the 170 links hits one (measured), so
   the case is a stop condition: if the as-merged mapping gives a link an obsolete row, execution stops
   and the situation is reported instead of choosing a course.
6. One exception to the directory form: a link that cites a single file as a template. The only one is
   `docs/how-to/add-programming-language.md` line 212, which cites the Golang `overview.md`. It repoints
   to `.../courses/golang-in-depth/overview.md` if that file exists, otherwise to the course directory
   with the link text and sentence changed to match.

### 2. Link text and sentence: what is rewritten and how far

The mapping asks for one sentence to be rewritten "where the surrounding prose says learning path or
educational foundation". This plan fixes the reach:

1. **Link text** that names a legacy sub-page ("Rust By Example", "Java In the Field", "AyoKoding BDD By
   Example", "Golang overview.md") becomes the destination course's title, read from the `title` front
   matter of the course's `_index.md`, keeping an "AyoKoding" prefix if the original had one and the word
   "course" if the title does not already say it. Text that is itself a path
   (`software-design-reference.md` line 129) becomes the new path in the same shape.
2. **The carrying sentence or list item** is edited only as far as it would otherwise claim that a
   by-example or in-the-field track, a numbered example, or a "learning path" with sub-tracks exists.
3. **List items** (or bullets in one list) that now point to the same destination are merged into one
   item, keeping the first item's description. A claim folded in from the removed item must be true of the
   destination course.
4. **Facts about the course** that the new text states (for instance "its TDD and BDD lessons") are checked
   by `rtk git grep -n -i "<keyword>" -- apps/ayokoding-www/content/en/learn/courses/<slug>` against the
   as-merged course before they are written. If the course does not teach it, the claim is dropped and
   the destination course is still named.
5. Nothing else in the file is touched. Unlinked wording such as "learning path" elsewhere stays; it
   is not a broken reference.

Worked cases, taken from the real lines (before text shortened with `...` for the long relative path):

| Case                                                                                      | Before                                                                                                                                                                                                          | After                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two bullets, one destination (`rust/README.md` lines 91 to 92)                            | `- **[Rust Learning Path](.../learn/legacy/.../rust/)** - Complete language coverage` and `- **[Rust By Example](.../learn/legacy/.../rust/by-example/)** - Annotated code examples from basic to advanced`     | one bullet: `- **[Rust In Depth course](.../learn/courses/rust-in-depth/)** - Complete language coverage`, plus "annotated code examples" only if the course description says so                                |
| Two links, two courses in one sentence (`development/README.md` line 193)                 | `**Prerequisites**: Complete [AyoKoding TDD](...legacy/.../test-driven-development-tdd/) and [AyoKoding BDD](...legacy/.../behavior-driven-development-bdd/) learning paths first.`                             | `**Prerequisites**: Complete the [AyoKoding Software Testing course](.../learn/courses/software-testing/) first, including its TDD and BDD lessons.` (the last clause kept only if the keyword grep finds both) |
| Numbered example citation with a fragment (`rust/memory-management-standards.md` line 71) | `Ownership, move semantics, and cloning are taught in AyoKoding Rust By Example: [Example 8: Ownership Basics](...by-example/beginner.md#example-8-ownership-basics), [Example 9: ...], and [Example 10: ...].` | `Ownership, move semantics, and cloning are taught in the AyoKoding [Rust In Depth course](.../learn/courses/rust-in-depth/).`                                                                                  |
| Link text is a path (`software-design-reference.md` line 129)                             | `[learn/software-engineering/programming-languages/rust/](...legacy/.../rust/)`                                                                                                                                 | `[learn/courses/rust-in-depth/](.../learn/courses/rust-in-depth/)`                                                                                                                                              |
| Single prerequisite bullet (`software-design-reference.md` line 37)                       | `**Prerequisite**: [AyoKoding C4 Architecture Model](...legacy/.../c4-model/)`                                                                                                                                  | `**Prerequisite**: [AyoKoding Technical Communication course](.../learn/courses/technical-communication/)` (the C4 topic named in words only if the course teaches it)                                          |
| Template citation (`add-programming-language.md` line 212)                                | `- See [Golang overview.md](...legacy/.../golang/overview.md) as template`                                                                                                                                      | `- See [Golang In Depth overview.md](.../learn/courses/golang-in-depth/overview.md) as template` (file existence checked first)                                                                                 |

The `technical-communication` and `software-testing` rows show the main judgment: a topic folded into a
broader course. The readers need to know which course to open, so the course is named in the link text.
The topic word stays only when the destination course teaches it, which the keyword grep proves.

### 3. The SE separation convention stays satisfied

The [Programming Language Documentation Separation Convention](../../../../repo-governance/conventions/structure/programming-language-docs-separation.md)
requires each language style-guide `README.md` to carry a Prerequisite Knowledge statement that links to
the AyoKoding learning material. These facts hold after the repoint and are checked:

1. The five language READMEs (`rust`, `f-sharp`, `c-sharp`, `java`, `typescript`) keep their
   `## Prerequisite Knowledge` heading and the sentence that the style guide is not a tutorial. They
   gain a link to `learn/courses/<slug>/` where they had a link to the legacy topic.
2. The "Specific Prerequisites" table in `software-design-reference.md` keeps its row and its two paths
   exist as directories. This table is the scope of the separation gate.
3. The gate's fourth question, "the AyoKoding path holds the learning path the convention requires, its
   `by-example/` and `in-the-field/` tracks included", is written for the legacy shape and fails for
   every course. This plan updates that sentence in the gate workflow and in the skill that carries the
   checklist so it names the as-merged course shape instead of the old tracks
   ([005](./005-rules-and-docs-impact.md#rule-changes)). The same applies to the "Content Types and
   Scope" list and the "learning paths are complete" bullet inside `software-design-reference.md`
   (lines 120, 133 to 139, 158), edited in Batch C.
4. The convention's own template pages (`rule-3-prerequisite-knowledge-statements.md` and the Rule 5
   block) keep their absolute `https://ayokoding.com/en/learn/software-engineering/programming-languages/...`
   examples. Those addresses are pre-IA addresses, so they still answer: after this plan each takes one
   308 to the course ([002](./002-redirect-mechanism-and-url-inventory.md#hop-budget)). They are listed
   in the final report as stale examples, not edited.

## Batches and commits

The 94 files split into three file-disjoint batches, so three agents can edit at the same time without
touching the same file. Each batch is one commit and ends with the link validator and the batch's
destination census (below) clean.

| Batch | Groups                               | Files | Lines | Links | Commit subject                                                              |
| ----- | ------------------------------------ | ----- | ----- | ----- | --------------------------------------------------------------------------- |
| A     | G01 to G05, G16 (languages, how-to)  | 45    | 60    | 66    | `docs(software-engineering): repoint language prerequisites to courses`     |
| B     | G06 to G09 (testing)                 | 22    | 32    | 36    | `docs(software-engineering): repoint testing prerequisites to courses`      |
| C     | G10 to G15 (architecture, reference) | 27    | 66    | 68    | `docs(software-engineering): repoint architecture prerequisites to courses` |

All three commits come **before** the deletion commit, so every commit in the pull request is link-clean
on its own and the legacy tree is still present while its links are being moved.

## Proof

### Temporary scaffolding: the repoint map

Three small artifacts keep the work mechanical (they follow decision 37: deterministic tooling, no ad-hoc
script; the map and the verifier are removed in the deletion commit and the derive test is never committed,
[010](./010-pr-size-rollback-and-series-closure.md#what-the-last-commit-removes)):

1. **Derive and freeze the map.** A temporary node-project test reads the 94 files, extracts every
   legacy link, looks each up in the inventory fixture, and writes
   `apps/ayokoding-www/tests/unit/redirects/fixtures/docs-repoint-map.tsv` through `toMatchFileSnapshot`
   (run once with `-u`). One line per file: the file path and its sorted, comma-joined set of destination
   slugs. 94 lines. The deriving test is then deleted; the frozen file stays until cleanup. A person reads
   it once against the group table above and the per-slug file counts below.
2. **Verify test.** `docs-repoint.unit.test.ts` reads the frozen map and fails until every line holds:
   the file has no `learn/legacy`; the set of distinct `learn/courses/<slug>` slugs it links equals the
   map's set exactly; no link carries a fragment; every link target exists on disk. It is written first and
   is red before Batch A: with a constant `ACTIVE_GROUPS` set to all 16 groups, all 94 files fail.
3. **Per-batch turn to green.** The test checks only the groups listed in `ACTIVE_GROUPS`. The committed
   value starts as the empty list, so the commit that adds the test is green (a red commit would break the
   rule that every commit passes on its own). Each batch commit adds its groups to the list in the same
   commit as its file edits: Batch A adds G01 to G05 and G16, Batch B adds G06 to G09, Batch C adds G10 to
   G15. After Batch C the list holds all 16 groups and the test covers all 94 files.

### Destination census (grep, no test needed)

After all three batches each course slug is linked from the expected number of files. The expected
numbers come from the same lookup (distinct files per destination, merge-proof):

| Slug                                  | Files | Command                                                                        |
| ------------------------------------- | ----- | ------------------------------------------------------------------------------ |
| `rust-in-depth`                       | 14    | `rtk git grep -l "learn/courses/rust-in-depth/" -- docs`                       |
| `fsharp-in-depth`                     | 13    | `rtk git grep -l "learn/courses/fsharp-in-depth/" -- docs`                     |
| `csharp-in-depth`                     | 13    | `rtk git grep -l "learn/courses/csharp-in-depth/" -- docs`                     |
| `java-in-depth`                       | 4     | `rtk git grep -l "learn/courses/java-in-depth/" -- docs`                       |
| `typescript-in-depth`                 | 1     | `rtk git grep -l "learn/courses/typescript-in-depth/" -- docs`                 |
| `golang-in-depth`                     | 1     | `rtk git grep -l "learn/courses/golang-in-depth/" -- docs`                     |
| `playwright-end-to-end-testing`       | 10    | `rtk git grep -l "learn/courses/playwright-end-to-end-testing/" -- docs`       |
| `software-testing`                    | 13    | `rtk git grep -l "learn/courses/software-testing/" -- docs`                    |
| `domain-driven-design`                | 6     | `rtk git grep -l "learn/courses/domain-driven-design/" -- docs`                |
| `technical-communication`             | 7     | `rtk git grep -l "learn/courses/technical-communication/" -- docs`             |
| `software-architecture`               | 10    | `rtk git grep -l "learn/courses/software-architecture/" -- docs`               |
| `object-oriented-design-and-patterns` | 11    | `rtk git grep -l "learn/courses/object-oriented-design-and-patterns/" -- docs` |

The expected numbers add up to 103 file-and-course pairs for 94 files (nine files link two or three
courses). Phase 0 re-runs the lookup on the as-merged tree and the ledger records any difference with its
cause (plans 01 to 13 may have edited `docs/`); an unexplained difference stops execution.

### Link validator and its negative control

1. After each batch: `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- ./rhino md internal-link validate`
   exits 0 and reports no finding in any of the 94 files. (The validator treats `apps/ayokoding-www/content`
   as an excluded **source** but still checks **targets** that docs files link to.)
2. **Negative control**, run once after Batch C and before the deletion commit: in the working tree, change
   one repointed link to a nonexistent course slug (`courses/rust-in-depthh/`), run the validator, and see it
   report that exact file and line; then restore the line with `rtk git checkout -- <file>`. This proves
   the validator inspects the new links and is not passing vacuously.
3. After the deletion commit: `rtk git grep -n "learn/legacy" -- docs` prints nothing, and the validator
   exits 0 again (the second control: if any link had been missed, it would fail here).

### Docs quality gates

Both gates start only on an explicit request. Their built-in limit is higher than this plan's cap of 2
cycles, so every request passes the input `max-cycles` with the value 2. The docs-quality gate runs at the
end of the docs phase. The separation gate runs **later, in the rules phase, after rule change RC6**: its
fourth question is written for the legacy track shape, so it can only be evaluated against the as-merged
course shape once [RC6](./005-rules-and-docs-impact.md#rule-changes) has updated it (running it earlier
would flag every course for a requirement that this plan retires).

| Gate                                                                           | Request                                                                                                                         | Pass                                                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `docs-quality-gate` (`repo-governance/workflows/quality/docs-quality-gate.md`) | `subject` = the revision range of the three docs commits, `mode` `normal`, `max-cycles` 2                                       | verdict clean, or only findings recorded as pre-existing (see triage)                         |
| `docs-software-engineering-separation-quality-gate`                            | `subject` `all`, `mode` `normal`, `max-cycles` 2 (the gate itself limits scope to the rows of the Specific Prerequisites table) | verdict clean for the table's row; the fourth question evaluated with the wording RC6 updated |

**Triage.** The gates audit whole documents. `docs/how-to/add-programming-language.md` is openly stale (its
line 16 says it was written for the Hugo era) and other touched files may hold older defects. A finding
caused by this plan's edits (a wrong course name, a claim the course does not support, a broken link) is
fixed in the pull request. A finding that existed before this plan (measurable by `rtk git show
origin/main:<path>`) is recorded in the pull request body as a pre-existing follow-up and is not fixed
here. If the second cycle ends with a finding caused by this plan, the delivery unit is not ready to
merge, per the contract's termination rules.

### Manual sample

A `docs/` link is a file-system path, so a browser cannot follow it. The browser sample therefore opens the
**public page** each repointed link stands for. For each of the 12 destination courses, pick one repointed
link (the first line of the first file in the census command's output), open
`http://localhost:3101/en/learn/courses/<slug>` in the browser on port 3101, and confirm that the page
renders with a title that matches the link text written in the docs file, and that the one topic word the
rewritten sentence names (if any) appears in the course page or its lesson list. 12 links, one per
destination course, including the file-level Golang case and the two Rust files whose fragments were
dropped. The result goes into the evidence file with the 12 slugs and the observed title of each.

## Thin behaviour note

The repoint changes documentation, not product behaviour, so it has no Gherkin scenario of its own. Its
executable proof is the temporary verify test and the link validator; its human proof is the two quality
gates. The product-visible half of this plan (the 308s and the removed bucket) is specified in
[the feature files](../prd.md#gherkin-acceptance-criteria) and mapped in
[008](./008-testing-strategy.md).
