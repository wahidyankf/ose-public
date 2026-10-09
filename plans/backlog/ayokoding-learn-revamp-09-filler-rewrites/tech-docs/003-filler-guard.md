# 003 — The Filler Guard

This page designs the permanent, deterministic check that tells a templated filler course from a
written one. It says where the check lives and why, what it measures, how its thresholds were set, how
false positives are handled, how the list of known filler courses can only shrink, and how plan 14
calls it. The check is a new module in the app's tested TypeScript, bound by a Gherkin feature, and it
runs in `ayokoding-www:test:quick`.

## Why a Guard

On 2026-10-09 the eight filler courses passed every automatic check the repository has. Each has 78
or 80 example headings, 11 or 12 pages, and between 2,700 and 12,300 words. They are not outlines, so
plan 02's outline rules ignore them; the word guard of plan 03 does not read examples; and the quality
gates run only on request. A reader of six of them opens `learning/beginner.md` and finds this under
every example heading (the two security courses have real titles over the same kind of repeated body):

```text
## Example 1: git-internals-01

_ex-01_

This original isolated Python artifact demonstrates one object-store or porcelain decision. The
capstone provides the integrated deterministic blob and ref implementation.
```

Example 2 to 78 differ only in the number. The code beside them is equally templated: 79 Python files
that hash the same header with the same bug. Series decision 40 says the end state has "zero outline,
skeleton, or filler courses". Without a test, nothing would stop a later edit, or a later plan, from
producing or keeping a filler course, and plan 14 would have no way to prove the claim. This guard is
that test.

The check must be deterministic (series decision 37: checks run in tested code, never in a model's
judgement). It detects structure, not quality: a course can pass it and still be poor. The quality
gates and the code harness judge what a counter cannot (see [Limits](#limits)).

## Where It Lives, and Why

Decision D1 in [008](./008-decision-records.md#d1--the-filler-guard-is-a-typescript-unit-test): the guard is
a unit test of the app's content code, not an `ayokoding-cli` subcommand.

| Reason                                                                                                    | Detail                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Series decision 37 says app checks stay in the app's tested TypeScript, and the CLI holds harness tooling | The guard reads course Markdown and code files and applies counting rules. It runs no container and reads no `run.yaml`. Plan 03's `course-corpus-check` and plan 06's completion test follow the same pattern |
| One implementation                                                                                        | A CLI subcommand would be Go, and the app's content parsing (frontmatter, outline status) is TypeScript. The guard would need both or a second parser                                                          |
| It runs in every pull request                                                                             | `test:quick` includes the unit project. The CLI needs Docker only for runs, so a CLI check would be a new CI step                                                                                              |
| Plan 14 can call it with no new wiring                                                                    | Plan 14 already runs the whole unit suite; it imports the scan function and the baseline                                                                                                                       |

Revisit trigger: a consumer outside the app, such as a pre-commit hook for authors or a job that runs
without Node, needs the report faster than a Vitest run. Then add a thin `ayokoding-cli` command that
runs the same compiled module; do not reimplement the rules.

## What Counts as a Sample

Everything below is measured on the English tree only: `apps/ayokoding-www/content/en/learn/courses/<slug>/`.

| Term         | Definition                                                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course       | A directory under `courses/`. A course whose `_index.md` frontmatter has `status: outline` is **skipped** and reported as `skipped: outline`                                                                                                                                        |
| Page         | A `.md` file in the course whose path has no `code` segment. Frontmatter is removed                                                                                                                                                                                                 |
| Total words  | Whitespace-separated tokens over all pages, fenced code included                                                                                                                                                                                                                    |
| Example body | The text from one example heading to the next example heading or the end of the page. A heading matches `^#{2,4}\s+(Example\|Scenario\|Guide\|Worked Example)\s*\d+` (H2 to H4, because the filler courses use `## Example N:` and the By Example convention uses `### Example N:`) |
| Unit         | A folder named `ex-NN-*` or `kata-NN-*` directly inside a folder named `code`; a flat `ex-NN-*.<ext>` file directly inside `code` counts as one unit                                                                                                                                |

## Normalization

Both sides are normalized so that a number, a string, or a comment change does not hide a template.

| Input      | Steps (in order)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prose body | Remove fenced code (three or more backticks or tildes at the start of a line); lowercase; replace each digit run with `n`; replace each run of non-letters with one space; split on spaces into tokens. The **body key** is the tokens joined by one space                                                                                                                                                                                                                                                                                                                 |
| Paragraph  | Split the body, fenced code removed, at blank lines; normalize each paragraph as above; keep paragraphs of at least 8 tokens                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Unit code  | For each file, sorted by relative path: skip `expected/`, `obj/`, `bin/`, `node_modules/`, `target/`, `__pycache__/`, dotfiles, `run.yaml`, lock files, project and manifest files (`pom.xml`, `*.fsproj`, `*.csproj`, `go.mod`, `Cargo.toml`, `package.json`, `requirements.*`, and similar), and `README.md`. Remove comments by file extension (line and block); replace each string literal with `"S"` (or `'S'`); replace each digit run with `N`. Join the files with a line feed. The **unit code** is the result; its comparison key has whitespace runs collapsed |

Comment markers by extension: `#` for Python, shell, YAML, and similar; `//` and `/* */` for C-family, JVM,
.NET, Rust, and TypeScript; `--` for Lua, SQL, and Haskell; `;` for Racket, Clojure, and Lisp; `(* *)` for
OCaml and F#. An unknown extension keeps its text and gets only the string, digit, and whitespace steps.

## The Six Rules

A rule fires on a course only when the course has enough samples; a small sample is never judged.

| Rule | Measure                                                                                                                                                                                                                                     | Fails when    | Needs at least | What it catches                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------- | -------------------------------------------------------------------------- |
| FG1  | Unique-body ratio: distinct body keys divided by example bodies                                                                                                                                                                             | below 0.5     | 10 bodies      | Example text that is the same sentence with a different number             |
| FG2  | Unique-code ratio: distinct unit-code keys divided by units                                                                                                                                                                                 | below 0.5     | 10 units       | Code that is the same program with different literals                      |
| FG3  | Near-duplicate share: the share of bodies that sit in a cluster of two or more near-duplicates. Two bodies are near-duplicates when the Jaccard similarity of their 4-token shingles is at least 0.8; clusters are the connected components | at least 0.5  | 10 bodies      | Bodies that differ by a few words, so FG1 does not see them                |
| FG4  | Stub share: units with fewer than 4 non-blank lines after comments are removed, divided by units                                                                                                                                            | at least 0.8  | 10 units       | One-line placeholder programs                                              |
| FG5  | Total words                                                                                                                                                                                                                                 | below 1,000   | none           | A skeleton that was not marked as an outline                               |
| FG6  | Boilerplate share: a paragraph counts as boilerplate when it appears in at least 10 distinct example bodies. The share is boilerplate paragraph words divided by all paragraph words                                                        | at least 0.25 | 20 bodies      | Courses whose bodies open differently but repeat the same "why it matters" |

Each rule has one meaning, one threshold, and one place in `core/course-filler.ts`. The thresholds are
exported constants with the calibration margin in a comment beside each one.

Rejected: **FG7**, a unique ratio over the fenced code inside example bodies. It flags courses whose real
code sits in distinct unit files and whose fences are short placeholders (`cicd-and-release-engineering`,
`self-managed-kubernetes-and-gitops`, `bare-metal-virtualization`, `detection-engineering-and-siem-operations`
all fail it with good courses behind them). Plan 05's sync check already judges whether lesson fences match
their files (M6). Revisit if a course appears with templated inline code and no code units.

## Calibration

A throwaway prototype read all 181 courses at `origin/main` `bb7f90137` on 2026-10-09 and set the
thresholds. The prototype is an input to this plan only; it is not delivered and nothing links to it. Phase 1
re-derives every number below with the TypeScript implementation (see [Phase 1 Acceptance](#phase-1-acceptance)).

Of 181 courses, 87 fire at least one rule: 62 skeleton outlines that fire FG5 only (they are skipped once
plan 02's outline marker exists) and 25 non-outline courses. The other 94 fire none.

| Rule | Worst flagged value      | Threshold | Healthy extreme           | Reading                                                                                |
| ---- | ------------------------ | --------- | ------------------------- | -------------------------------------------------------------------------------------- |
| FG1  | 0.0625 (flagged max)     | 0.5       | 1.00 (healthy min)        | Flagged courses are at least 8 times below the line; healthy courses are 2 times above |
| FG2  | 0.3375 (flagged max)     | 0.5       | 0.885 (healthy min)       | Flagged courses are 1.5 times below the line; healthy courses are 1.8 times above      |
| FG3  | 0.65 (flagged min)       | 0.5       | 0.00 (healthy max)        | No healthy course has a near-duplicate pair                                            |
| FG4  | 0.95 (flagged min)       | 0.8       | 0.5625 (healthy max)      | Some healthy courses ship short units, but never most of them                          |
| FG5  | 419 words (skeleton max) | 1,000     | 1,284 words (healthy min) | The smallest healthy course is `the-agent-loop`                                        |
| FG6  | 0.29 (flagged min)       | 0.25      | 0.094 (healthy max)       | The exemplar `sql-essentials` is 0.024                                                 |

FG6 was added because FG1 to FG5 let six courses through whose example bodies open with different sentences
but repeat the same closing paragraph (`building-production-cli-tools`, `cicd-and-release-engineering`,
`csp-style-concurrency`, `information-architecture-and-seo`, `just-enough-go`, and `linux-app-development`).
It also fires on the two security courses of this plan (boilerplate share 0.96), which FG1 and FG3 already
caught.

### The 25 Non-Outline Courses That Fire

Values are the rules fired and the measures, from the same run. "Plan" is who owns the course in the
baseline (see [The Baseline Ratchet](#the-baseline-ratchet)).

| Course                                    | Rules fired             | Bodies | Unique body | Near-dup | Units | Unique code | Stub | Boiler | Words  | Plan |
| ----------------------------------------- | ----------------------- | ------ | ----------- | -------- | ----- | ----------- | ---- | ------ | ------ | ---- |
| `build-your-own-git`                      | FG1, FG2, FG3, FG6      | 78     | 0.01        | 1.00     | 78    | 0.01        | 0.00 | 1.00   | 2,710  | 09   |
| `compilers-parsers-and-transpilers`       | FG1, FG2, FG3, FG4, FG6 | 78     | 0.01        | 1.00     | 78    | 0.01        | 1.00 | 1.00   | 2,700  | 09   |
| `type-systems`                            | FG1, FG2, FG3, FG4, FG6 | 78     | 0.01        | 1.00     | 78    | 0.01        | 1.00 | 1.00   | 2,781  | 09   |
| `just-enough-fsharp`                      | FG1, FG2, FG3, FG4, FG6 | 78     | 0.01        | 1.00     | 78    | 0.03        | 1.00 | 1.00   | 2,952  | 09   |
| `lisp`                                    | FG1, FG2, FG3, FG4, FG6 | 78     | 0.01        | 1.00     | 78    | 0.04        | 1.00 | 1.00   | 3,962  | 09   |
| `enterprise-java-and-the-jvm`             | FG1, FG2, FG3, FG6      | 78     | 0.01        | 1.00     | 78    | 0.01        | 0.00 | 1.00   | 3,509  | 09   |
| `defensive-security`                      | FG1, FG3, FG6           | 78     | 0.04        | 1.00     | 0     | —           | —    | 0.96   | 12,255 | 09   |
| `vulnerability-management-and-assessment` | FG1, FG3, FG6           | 80     | 0.06        | 0.99     | 0     | —           | —    | 0.96   | 11,561 | 09   |
| `agent-permissions-and-sandboxing`        | FG2, FG6                | 52     | 1.00        | 0.00     | 52    | 0.06        | 0.00 | 0.29   | 2,901  | 13   |
| `android-app-development`                 | FG3, FG6                | 78     | 1.00        | 0.90     | 84    | 1.00        | 0.06 | 0.52   | 18,959 | 13   |
| `build-your-own-database`                 | FG2                     | 78     | 1.00        | 0.10     | 78    | 0.04        | 0.00 | 0.00   | 2,755  | 12   |
| `build-your-own-raft`                     | FG2, FG4                | 78     | 1.00        | 0.00     | 78    | 0.01        | 1.00 | 0.00   | 2,578  | 12   |
| `build-your-own-reactive-ui`              | FG2, FG3, FG6           | 80     | 1.00        | 0.65     | 80    | 0.06        | 0.00 | 0.48   | 19,285 | 13   |
| `building-production-cli-tools`           | FG6                     | 78     | 1.00        | 0.18     | 78    | 0.83        | 0.12 | 0.49   | 10,818 | 11   |
| `cicd-and-release-engineering`            | FG6                     | 83     | 1.00        | 0.00     | 83    | 0.99        | 0.00 | 0.42   | 20,454 | 11   |
| `csp-style-concurrency`                   | FG6                     | 78     | 1.00        | 0.17     | 83    | 0.99        | 0.04 | 0.49   | 24,319 | 12   |
| `information-architecture-and-seo`        | FG6                     | 53     | 1.00        | 0.00     | 53    | 1.00        | 0.66 | 0.34   | 6,992  | 13   |
| `just-enough-cpp`                         | FG3, FG6                | 75     | 1.00        | 0.95     | 75    | 0.97        | 0.00 | 0.67   | 24,805 | 11   |
| `just-enough-go`                          | FG6                     | 78     | 1.00        | 0.37     | 83    | 0.98        | 0.12 | 0.55   | 19,249 | 11   |
| `just-enough-java`                        | FG2, FG3, FG4           | 80     | 1.00        | 1.00     | 80    | 0.34        | 0.95 | 0.00   | 6,365  | 11   |
| `linux-app-development`                   | FG6                     | 78     | 1.00        | 0.00     | 78    | 0.99        | 0.10 | 0.32   | 5,111  | 13   |
| `linux-os`                                | FG2                     | 78     | 1.00        | 0.00     | 78    | 0.12        | 0.00 | 0.19   | 8,319  | 12   |
| `system-programming`                      | FG2                     | 0      | —           | —        | 78    | 0.01        | 0.00 | —      | 3,564  | 12   |
| `windows-app-development`                 | FG3                     | 78     | 1.00        | 0.79     | 83    | 0.65        | 0.00 | 0.19   | 27,617 | 13   |
| `windows-os`                              | FG2, FG3, FG6           | 78     | 1.00        | 0.73     | 78    | 0.18        | 0.00 | 0.68   | 10,406 | 12   |

The 17 courses below the first eight are outside this plan's scope (plans 11 to 13 audit them). The guard
does not fix them; it records them in the baseline so the repository knows about them and cannot grow the
list. `system-programming` has no example headings the guard recognizes (0 bodies); FG2 flags it by its
code alone.

The eight columns are the measures the rules use. A dash means the sample was too small or empty for
the rule to run.

## False Positives and False Negatives

| Case                                                                                  | Handling                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A course with fewer than 10 bodies or units                                           | FG1 to FG4 do not run; FG6 needs 20 bodies. FG5 still runs. A tiny course is judged by the content gates                                                                                                                                                                 |
| An outline course                                                                     | Skipped. Plan 02's marker is the only way out, and plan 02's rules already forbid outlines in a core phase                                                                                                                                                               |
| A legitimately short or repetitive course                                             | There is **no per-course exemption**. A real course fails only by being far from healthy (see the margins), so it should be fixed. If a reviewer believes a rule is wrong, the fix is a change to the rule with a new fixture and a new calibration table in the same PR |
| A safety banner or disclaimer repeated in every example                               | FG6 measures the share of words. A 30-word banner in a 200-word body is about 0.15, under the 0.25 threshold and above the healthy maximum of 0.094. The content gate separately discourages it                                                                          |
| An example heading shape the pattern does not know (a course that uses `## Stage N:`) | Zero bodies means FG1, FG3, and FG6 do not run; FG2 and FG4 still run on the code units. Add the heading word to the pattern with a fixture when a real course needs it                                                                                                  |
| Code in an extension the comment rules do not know                                    | Only the string, digit, and whitespace steps apply. That makes two files compare as equal slightly more often, never less often                                                                                                                                          |
| A genuinely varied course that is flagged                                             | It must not happen on the calibration set (zero healthy courses fire). If it happens on a new course, the guard report names the rule and the value, and the author changes the course or opens the rule-change PR above                                                 |
| A filler course that passes                                                           | Possible: the guard counts repetition, not meaning. Unique but empty text passes. The mode quality gate, the Content Quality Gate, and the code harness are the layers that judge that                                                                                   |

### Limits

The guard cannot tell correct from incorrect, useful from useless, or runnable from broken. It proves
that the examples differ from one another and are not stubs. This plan's definition of done keeps all
the other layers: the mode gate and the Content Quality Gate (judgement), the code harness (execution),
and the completion test (floors and layout).

## The Baseline Ratchet

The repository holds 25 non-outline courses that fail today. They cannot all be fixed here, so the guard
runs against a closed list that can only get shorter. This is the same pattern as plan 02's closed
allowlist of marked manifests.

The module `src/features/content/core/course-filler-baseline.ts` exports:

```ts
export type FillerOwner = "plan-09" | "plan-11" | "plan-12" | "plan-13";

export interface FillerBaselineEntry {
  readonly slug: string;
  readonly owner: FillerOwner; // the plan that fixes the course and deletes this entry
  readonly reason: string; // for example "FG1, FG2, FG3, FG6 (2026-10-09)"
}

export const FILLER_BASELINE: readonly FillerBaselineEntry[] = [
  /* 25 entries at Phase 1, sorted by slug */
];
export const FILLER_BASELINE_CAP = 25; // lowered in the same commit as every removal
export const REWRITTEN_FILLER_COURSES: readonly string[] = []; // slugs this plan has rewritten
```

The unit tests assert, on the real corpus:

| Check                                                               | Failure means                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Every non-outline course that fires a rule is in the baseline       | A new filler course appeared, or a baseline course got worse into a new rule  |
| **Every baseline course still fires** at least one rule             | A course was fixed and its entry must be deleted in the same commit (ratchet) |
| Every baseline slug is an existing course                           | A course was renamed or deleted without updating the list                     |
| `FILLER_BASELINE.length` is at most `FILLER_BASELINE_CAP`           | An entry was added; raising the cap is visible in review                      |
| Every entry has an owner from the closed set and a non-empty reason | An entry has no one who will fix it                                           |
| No slug is in both `FILLER_BASELINE` and `REWRITTEN_FILLER_COURSES` | A course was counted twice                                                    |
| Every course in `REWRITTEN_FILLER_COURSES` passes all six rules     | A rewritten course regressed                                                  |

A course that passes the guard must leave the baseline in the same commit. That forces a rewrite to land
atomically: course files, `estimatedHours`, the baseline entry, and its cap move together, so no commit is
red.

### Owners

The eight courses of this plan are `plan-09`. The 17 others get the owner whose scope in the series list
holds the course's category (plan 03's categories); plan 11 owns languages and tooling, plan 12 owns
computer science, systems, distributed systems, and data, and plan 13 owns the rest. These tags are
documentation: the test does not care which plan removes an entry, and any plan may take another's entry by
changing the tag in the same PR. Phase 0 reads the merged scope lines of plans 11 to 13 and adjusts a tag
where a plan states otherwise; the proposed assignment is:

| Owner     | Courses                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan-11` | `just-enough-cpp`, `just-enough-go`, `just-enough-java`, `building-production-cli-tools`, `cicd-and-release-engineering`                                                            |
| `plan-12` | `build-your-own-database`, `build-your-own-raft`, `linux-os`, `system-programming`, `windows-os`, `csp-style-concurrency`                                                           |
| `plan-13` | `agent-permissions-and-sandboxing`, `android-app-development`, `build-your-own-reactive-ui`, `windows-app-development`, `linux-app-development`, `information-architecture-and-seo` |

If the baseline computed at Phase 1 contains a course not in the table above, Phase 1 stops and applies the
rule in [tech-docs/006](./006-execution-model.md#unexpected-guard-findings): a course rewritten by plans 06
to 08 that fires a rule is a regression in recent work and goes to the user; any other unexplained course is
also reported before it is baselined.

## Files and Interfaces

Root-relative to `apps/ayokoding-www/`. The full tree with markers is in [009](./009-file-impact.md).

| File                                                                | Role                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/content/core/course-filler.ts`                        | Pure: thresholds, normalizers, the body splitter, shingles, near-duplicate clusters, boilerplate share, `evaluateCourse(sample)`; no file access |
| `src/features/content/core/course-filler-baseline.ts`               | Pure data: the closed baseline, its cap, and `REWRITTEN_FILLER_COURSES`                                                                          |
| `src/features/content/shell/course-filler-scan.ts`                  | Reads the course tree and builds samples; `scanCourseFiller(coursesDir)`; `formatFillerReport(reports)` renders the metrics table                |
| `tests/unit/be-steps/course-filler.steps.ts`                        | Binds `course-filler-guard.feature`                                                                                                              |
| `tests/unit/be-steps/filler-course-completion.steps.ts`             | Binds `filler-course-completion.feature` (floors, layout, security rules; see [007](./007-testing-strategy.md))                                  |
| `tests/unit/features/content/core/course-filler.test.ts`            | Rule edge cases on synthetic samples: thresholds at the boundary, empty and tiny samples, shingle edge cases, normalization                      |
| `tests/unit/features/content/core/course-filler-baseline.test.ts`   | Closed-set and ordering checks on the data                                                                                                       |
| `tests/unit/features/content/shell/course-filler-scan.unit.test.ts` | Temp folders: a templated course, a varied course, an outline course, a flat-file unit, a comment-heavy unit, an unknown extension               |

```ts
// core/course-filler.ts (pure)
export const FILLER_RULES = ["FG1", "FG2", "FG3", "FG4", "FG5", "FG6"] as const;
export type FillerRule = (typeof FILLER_RULES)[number];
export interface CourseSample {
  slug: string;
  outline: boolean;
  totalWords: number;
  bodies: string[]; // body keys
  paragraphs: string[][]; // per body, normalized paragraphs of at least 8 tokens
  unitCode: string[]; // normalized unit code
}
export interface RuleResult {
  rule: FillerRule;
  value: number;
  limit: number;
  fired: boolean;
  evaluated: boolean;
}
export interface CourseFillerReport {
  slug: string;
  skipped: "outline" | null;
  results: RuleResult[];
  fired: FillerRule[];
}
export function evaluateCourse(sample: CourseSample): CourseFillerReport;

// shell/course-filler-scan.ts
export async function scanCourseFiller(coursesDir: string): Promise<CourseFillerReport[]>;
export function formatFillerReport(reports: CourseFillerReport[]): string;
```

The real-corpus scenario logs `formatFillerReport(...)` with `console.info`, so a run with the verbose
reporter prints the metrics table for all courses. That table is the evidence file for each phase gate.

The scan reads about 2,000 Markdown files and several thousand unit files. Phase 1 records the elapsed
time; the budget is 30 seconds under HIPPO's `standard` tier. If it is exceeded, the scanner reads files
with bounded concurrency; it does not skip files.

## How Plan 14 Calls It

Plan 14 owns the series terminal gate. It needs no new code from this plan beyond what ships here:

1. Import `scanCourseFiller` and `FILLER_BASELINE` in plan 14's end-state step (or run the existing
   `course-filler` step file, which already exercises both).
2. Add the scenario "The filler baseline is empty" to `course-filler-guard.feature`: it asserts
   `FILLER_BASELINE` is empty and the real-corpus scan reports no fired rule for any non-outline course.
3. Delete the baseline module's data and the cap constant if it chooses; the real-corpus scenario then needs
   no list at all.

The cap and the owner tags give plan 14 a quick view of who has not finished: at plan 14's start, a
non-empty baseline names the plans whose work is incomplete.

## Phase 1 Acceptance

Phase 1 of [../delivery.md](../delivery.md) proves the TypeScript port against these tables:

1. Run the real-corpus scenario with the verbose reporter on the merged head. The set of courses that fire
   a rule must equal the 25 above, minus none and plus none, or each difference must be explained (a
   plan 06 to 08 course, a course edited by plans 01 to 05, or an owner re-tag). An unexplained difference
   stops Phase 1.
2. For each rule, the flagged-extreme and healthy-extreme values must match the calibration table within
   0.01 (words within 1), or each difference must be explained.
3. Boundary fixtures show each rule fires exactly at its threshold and not one step before.
4. The elapsed time is recorded.
