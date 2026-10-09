# 002 — Definition of Done and Audit Method

This page says what "done" means for each of the 34 courses, which targets apply to which mode, what the
defect classes are, how a course is sized, and how an audit is carried out. The numbers for each course
are in its brief under [../syllabus/courses/](../syllabus/courses/README.md); this page holds the rules
those numbers come from.

## Series Decisions Behind It

Decisions 26, 27, 28, and 29 of the series (resolved by the user on 2026-10-09) fix the shape:

- Every course ends complete, pedagogically sound, and with solid code (26). The user's words: "make sure
  nanti semua coursenya harus lengkap ya. dan siap dipake".
- A course is done when it meets the tutorial convention for its mode plus drilling, passes its mode
  quality gate and the Content Quality Gate with no blocking finding, and every code example is green in
  the harness (27).
- This plan audits existing courses (28: "audit the other 111"). It does not rewrite them from scratch,
  and it does not rename, merge, split, or move a course (decision D1).
- Per course: fix, mode gate (at most 2 cycles), Content Quality Gate (at most 2 cycles), harness green.
  A course still blocked at the cap is BLOCKED, reported, and the work moves on (29). The cap is 2 for
  every loop and gate; the user's words are "semua jadi 2 aja".
- The end state (40) is that every course meets the definition of done; this plan carries 34 courses to
  it and records the harness coverage.

## Where the Plan Is More Than an Audit

The plan's name says "audit", and 20 of the 34 courses are close to done in words and examples. But 14 courses
are far from it: each needs 3,000 words or more, and together they need 270,187 words. Six of
those 14 are the filler-baseline courses of plan 09, whose code is templated and is rewritten from scratch.
The README and the business requirements say this plainly, and the size classes below make it visible.

| Course                      | Words today | Words to write | Units to author | Size | In plan 09's baseline |
| --------------------------- | ----------- | -------------- | --------------- | ---- | --------------------- |
| `modern-system-programming` | 2,211       | 25,789         | 8               | XL   |                       |
| `build-your-own-raft`       | 2,578       | 25,422         | 87              | XL   | yes                   |
| `build-your-own-database`   | 2,755       | 25,245         | 87              | XL   | yes                   |
| `system-programming`        | 3,564       | 24,436         | 87              | XL   | yes                   |
| `domain-driven-design`      | 4,477       | 23,523         | 8               | L    |                       |
| `capstone-solid-core`       | 15,009      | 19,800         | 51              | L    |                       |
| `linux-os`                  | 8,319       | 19,681         | 87              | XL   | yes                   |
| `actor-model-concurrency`   | 9,315       | 18,685         | 3               | L    |                       |
| `windows-os`                | 10,406      | 17,594         | 87              | XL   | yes                   |
| `distributed-systems`       | 10,450      | 17,550         | 9               | L    |                       |
| `event-driven-architecture` | 11,289      | 16,711         | 88              | XL   |                       |
| `system-design`             | 6,175       | 15,825         | 10              | L    |                       |
| `software-architecture`     | 6,989       | 15,011         | 16              | L    |                       |
| `csp-style-concurrency`     | 24,319      | 4,915          | 3               | M    | yes                   |

Two more courses, `advanced-networking` and `computer-architecture`, need no new words but need heavy unit
rewrites (their examples record real hosts or real clocks); they are L courses by a documented override.

## The Definition of Done

A course is **done** when all eleven criteria hold. C1 to C11 are the checklist every brief and the
delivery checklist point at.

| Id  | Criterion                                                                                                                                                                                                                                                                                                 | Who or what proves it                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| C1  | The course is in one tutorial mode, named in the brief with a reason; the `format` frontmatter equals that mode and the registry row; the layout is the mode's (`learning/` with an overview and the worked-example pages, `learning/capstone/` with an overview and code, `drilling/` with an overview). | The mode checker; the completion test (`format` equals the registry)          |
| C2  | The mode's targets hold: words, example count, heading form and numbering, diagrams, "Why It Matters" band, annotation density, drilling, katas ([Targets by Mode](#targets-by-mode)).                                                                                                                    | The completion test (counts); the mode checker (usefulness and density)       |
| C3  | The mode quality gate ends `PASS` or `PASS_WITH_FINDINGS` within 2 cycles, with no open `needs-decision` row.                                                                                                                                                                                             | The gate report, recorded in the ledger                                       |
| C4  | The Content Quality Gate ends `PASS` or `PASS_WITH_FINDINGS` within 2 cycles, with no open `needs-decision` row.                                                                                                                                                                                          | The gate report, recorded in the ledger                                       |
| C5  | Every example, kata, and capstone with code is a unit with a `run.yaml`; every lesson fence is anchored to its file or marked as an illustration within the brief's budget; every `Output` block is anchored; `ayokoding-cli examples check --course <slug>` exits 0.                                     | `EX-CHECK`; `EX-SYNC`; the completion test (every code unit has a `run.yaml`) |
| C6  | The frontmatter has no `status: outline`; `format`, `category`, and `description` are set (plan 03); `estimatedHours` equals the drift test's value after the last edit; `prerequisites` follow plan 02's rubric and closure checks.                                                                      | Plan 03's drift test; plan 02's integrity tests; the completion test          |
| C7  | Facts the lessons teach have a source and a date in References; no accuracy-note file or verification tag is left over.                                                                                                                                                                                   | The Content Quality Gate with `docs-validating-factual-accuracy`              |
| C8  | The filler guard fires no rule for the course. For the six courses that plan 09 baselined, the baseline entry is removed in the same commit.                                                                                                                                                              | `FILLER` (plan 09's guard, in `test:quick`)                                   |
| C9  | The generated `_index.md` files are current for both locales, and nothing under `content/id/**` changed.                                                                                                                                                                                                  | `VALIDATE-INDEXES`; `rtk git status --short -- apps/ayokoding-www/content/id` |
| C10 | The course renders on the dev server (port 3101): landing, one learning page, the drilling page, and diagrams. Checked for a sample of courses in the end-state phase, not for every course.                                                                                                              | Playwright and the testers in the manual-verification phase                   |
| C11 | The course's own obligation from its brief holds (for example "no expected file contains an internal graph id").                                                                                                                                                                                          | The brief's checklist line, read by the coordinator at CP-6                   |

**What "done" does not require.** It does not require new topics, a new mode, a new slug, or a new position
in any path (decision D1). It does not require a lesson to claim anything the harness cannot check: a
service the sandbox cannot host is modelled or shown as an illustration, and the lesson says which (rule
TC1 of plan 11, applied here).

## Targets by Mode

The floors come from the AyoKoding adapter (`repo-governance/development/quality/gate-adapters/ayokoding-www.md`
and `tutorial-kinds.md`), from the Annotated Concept skill, and from plan 06's accounting convention that
plans 08 and 11 reuse. This plan adopts the same values, so all audited courses meet one bar. The completion
test that plan 11 created and this plan extends holds these numbers in one table; Phase 0 reads that table
and, if a floor differs from the one below, the merged test wins and the briefs are corrected.

| Measure                            | By Example                                         | Annotated Concept                                                        | Capstone (standard mode)                         |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Courses in this plan               | 28                                                 | 5                                                                        | 1                                                |
| Word floor                         | 28,000                                             | 22,000                                                                   | 23,000                                           |
| Examples                           | 75 to 85 (fewer than 75 is a finding; more is not) | 45 to 60                                                                 | 45 in five themes                                |
| Heading form                       | `### Example N: Title`, numbered 1 to N, no gap    | `### Worked Example N: Title`, numbered 1 to N, no gap                   | `### Worked Example N: Title`                    |
| Diagrams                           | 30 to 50                                           | at least 10 (plan 11's value, which the shared test enforces)            | at least 10                                      |
| Code-bearing examples              | all                                                | at least 27 of the first 45 as example units (plan 06's 60 percent rule) | 45 units                                         |
| "Why It Matters"                   | 50 to 100 words, one per example                   | same                                                                     | same                                             |
| Annotation density                 | 1.0 to 2.25 comment lines per code line            | same, on code-bearing examples                                           | same                                             |
| Drilling                           | 5,000 words and the five exact `##` sections       | same                                                                     | same                                             |
| Katas (`before` and `after` units) | at least 8                                         | at least 5                                                               | at least 5                                       |
| Overview                           | `learning/overview.md` with `## Examples by Level` | `learning/overview.md`                                                   | `learning/overview.md` with the mode declaration |
| Capstone unit                      | 1                                                  | 1                                                                        | 1, with the six sections of plan 08's contract   |

The five exact `##` sections of the drilling page are, in this order: `Recall Q&A`, `Applied problems`,
`Code katas`, `Self-check checklist`, and `Elaborative interrogation & self-explanation` (the title has an
ampersand, not "and"). The By Example checker treats a missing `## Examples by Level` section in
`learning/overview.md` as CRITICAL; eight of the 28 By Example courses lack it
(`actor-model-concurrency`, `csp-style-concurrency`, `linux-os`, `modern-system-programming`, `system-programming`, `windows-os`, `build-your-own-database`, `build-your-own-raft`).

**Counting rules** (the rules behind every number in the briefs, and the ones plan 11's test uses). Words are
whitespace-separated tokens across every `.md` file of the course outside `code/` folders and without
`_index.md`, frontmatter removed, fenced code included. Examples are the headings of the mode's form, read in
page order. Diagrams are ` ```mermaid ` fences. A "Why It Matters" block is the text that follows the
`**Why It Matters**` label or the `### Why It Matters` heading and runs to the next heading or bold label.
Annotation density is comment lines per code line over the unit's code files. The briefs' "Why It Matters"
and density counts are heuristics from a read-only scan; the mode checker's reading is authoritative.

**Two course-specific notes.**

- `sql-essentials` is the By Example exemplar that plans 06 and 07 cite. It already meets every floor
  except the mechanical rows. The exemplar guard in its brief says that no edit may lower any count that
  passes today.
- `capstone-solid-core` is an Annotated Concept course in standard mode with the capstone contract of plan 08
  (decision D9): a mode declaration in `learning/overview.md`, six required `##` sections in
  `learning/capstone/overview.md` (Project brief, Milestones, Acceptance criteria, Rubric, Evidence to keep,
  Extensions), the rules CL1 to CL4, a `relies-on` table, and no top-level `code/` folder.

## Defect Classes

Seventeen classes cover everything the baseline scan found: 15 variable classes and 2 universal ones (DC2
and DC15 apply to all 34). Each brief lists the classes it expects, with the measured fact for that course;
the first checker run (CP-1) confirms or corrects them. A class is a labelled kind of finding, not a
severity: severity comes from the checker.

| Code | Class                      | What it means                                                                                                                            | Who fixes it                                                                        | Courses expected |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| DC1  | Layout                     | Example files are flat, katas sit outside `drilling/code/`, a capstone overview is missing, or the code lives only inside lesson fences. | swe-developer and the maker, in the packet that converts the layout                 | 8                |
| DC2  | Not opted in               | No `run.yaml` anywhere in the course (universal: all 34).                                                                                | swe-developer: `run.yaml` and expected files for every unit                         | 34               |
| DC3  | Unanchored fences          | A code fence or an `**Output**` block has no anchor to a file.                                                                           | swe-developer and the maker: anchor or file the code; `EX-SYNC-WRITE` after reading | 29               |
| DC4  | Anchor drift               | An anchor points at a file whose text differs, or at no file.                                                                            | The packet owner, after reading both sides; never a quiet narrowing                 | 11               |
| DC5  | Headings and structure     | Wrong heading form, missing `## Examples by Level`, H1 inside a lesson body, or a missing mode declaration.                              | The maker or the mode fixer                                                         | 12               |
| DC6  | Parts and diagrams         | Missing or out-of-band "Why It Matters" blocks (50 to 100 words), missing key takeaways, or too few diagrams.                            | The maker                                                                           | 28               |
| DC7  | Annotation density         | Code units outside 1.0 to 2.25 comment lines per code line.                                                                              | The maker or `swe-developer`, by reading each unit                                  | 24               |
| DC8  | Example count              | Fewer examples than the mode's floor (75 or 45).                                                                                         | The maker                                                                           | 3                |
| DC9  | Words                      | Total words below the mode's floor.                                                                                                      | The maker                                                                           | 14               |
| DC10 | Drilling shape             | The five exact `##` sections are not all present, or fewer than 5,000 words.                                                             | The maker                                                                           | 20               |
| DC11 | Katas                      | Fewer kata units than the floor (8 or 5).                                                                                                | swe-developer, test first                                                           | 24               |
| DC12 | Nondeterminism             | Clock reads, sleeps, unseeded random numbers, thread order, hash order, or CPU-count dependence reach output.                            | swe-developer                                                                       | 31               |
| DC13 | Environment                | A unit needs the network, a database, an OS the sandbox lacks, or the host.                                                              | swe-developer: loopback, fixture, model, service, or static mode                    | 25               |
| DC14 | Accuracy notes and tags    | A leftover accuracy-note file or verification tag.                                                                                       | The mode fixer: convert the facts into References                                   | 13               |
| DC15 | Prerequisites and metadata | `prerequisites`, `estimatedHours`, and closure checks re-derived (universal: all 34).                                                    | The coordinator in CP-6                                                             | 34               |
| DC16 | Filler baseline            | The course is in plan 09's `FILLER_BASELINE`.                                                                                            | swe-developer and the maker; the coordinator removes the entry                      | 6                |
| DC17 | Capstone contract          | The course is a capstone that does not meet plan 08's contract.                                                                          | The maker and swe-developer                                                         | 1                |

The classes with the most courses are DC3 (unanchored fences and outputs), DC12 (nondeterminism), DC6
(parts, "Why It Matters" band, and diagrams), and DC13 (environment). DC13 is where the harness meets the
courses that teach networks, databases, operating systems, and hardware, and it is the subject of
[003](./003-harness-modes-simulation-and-determinism.md).

## Size Class Rule

Each course has a size class, S, M, L, or XL, which decides how many agent packets it gets. The class is the largest of three dimensions, because a course can be small in words and
still large in reading edits (the 24 courses whose units sit outside the density band, for example).

| Dimension      | S    | M     | L     | XL     | Counts                                                                                           |
| -------------- | ---- | ----- | ----- | ------ | ------------------------------------------------------------------------------------------------ |
| Words to write | < 3K | < 10K | < 25K | >= 25K | The larger of the word gap and the drilling shortfall                                            |
| Units authored | < 10 | < 40  | < 60  | >= 60  | Units that do not exist as folders today (the six baseline courses count every unit as fresh)    |
| Reading edits  | < 40 | < 120 | < 250 | >= 250 | Units outside the density band, anchor differences, and "Why It Matters" blocks outside the band |

Documented overrides raise a course when its cost is mechanical but heavy and the three dimensions miss it.
A reason is written for each; no override lowers a class.

| Course                                | Raised to | Reason                                                                              |
| ------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| `networking-essentials`               | L         | about 86 environment-bound units are rewritten as loopback, fixture, or model units |
| `advanced-networking`                 | L         | 39 environment-bound units are rewritten and about 23 units are added               |
| `nosql-databases`                     | L         | about 60 units are converted to services or labelled models                         |
| `graph-databases`                     | M         | 79 units run against a Neo4j service and 7 need the Gremlin image                   |
| `data-access-orms-and-query-builders` | M         | 78 units run against a PostgreSQL service                                           |
| `computer-architecture`               | L         | about 60 timing examples become model or count units                                |
| `concurrency-and-parallelism`         | L         | about 60 thread, sleep, and clock units are rewritten                               |

Result of the rule on the measured baseline:

| Class | Courses | Members                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S     | 1       | `data-engineering`                                                                                                                                                                                                                                                                                                                                                                                                           |
| M     | 10      | `computer-science-foundations`, `csp-style-concurrency`, `data-structures-and-algorithms-essentials`, `object-oriented-design-and-patterns`, `object-oriented-programming-essentials`, `advanced-sql-and-query-performance`, `build-your-own-orm-and-query-builder`, `data-access-orms-and-query-builders`, `graph-databases`, `sql-essentials`                                                                              |
| L     | 16      | `actor-model-concurrency`, `advanced-algorithms`, `concurrency-and-parallelism`, `functional-programming`, `programming-paradigms`, `advanced-networking`, `computer-architecture`, `networking-essentials`, `database-internals-and-storage-engines`, `nosql-databases`, `search-and-information-retrieval`, `capstone-solid-core`, `distributed-systems`, `domain-driven-design`, `software-architecture`, `system-design` |
| XL    | 7       | `linux-os`, `modern-system-programming`, `system-programming`, `windows-os`, `build-your-own-database`, `build-your-own-raft`, `event-driven-architecture`                                                                                                                                                                                                                                                                   |

**What a class means for the work.** The class decides how a course is split into agent packets. It is not an
estimate of how long the course will take, and the plan makes none.

| Class | Agent packets                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------- |
| S     | One packet for the whole course                                                                                 |
| M     | One packet per defect group (anchors and sync, annotation and density, drilling and katas)                      |
| L     | Authoring split by learning page, then one packet per remaining defect group                                    |
| XL    | Authoring split by learning page and by blocks of at most 15 examples; units by `swe-developer` in blocks of 10 |

The ledger may record the measured time per course as history, labelled as such, and the checkpoint pushes use the
measured CI minutes, not a guess, to re-plan.

## The Audit (CP-1)

The audit is read-only and is the first step of every course. It does not count as a gate cycle.

1. **Harness findings.** `EX-VALIDATE <slug>` and `EX-SYNC <slug>` (plan 05's step M1) run on the course, which
   works before the course opts in because `--course` names it. The counts go in the ledger and are compared
   with the brief.
2. **Mode checker, report-only.** `tutorial-by-example-checker` or `tutorial-annotated-concept-checker` reads the
   course folder and reports. Its findings are the baseline for the fix; the checker edits nothing.
3. **Completion test, RED.** `COMPLETION-PROBE <slug> <format>` adds the course to the registry for one run. The
   scenarios the course fails are the content gap, and they go in the ledger. This is the proof that the test can
   fail for this course before the audit; no red row is ever committed.
4. **Filler guard.** `FILLER` prints the metrics table for every course; the packet owner reads the course's row.
   A course that fires a rule is fixed (FILL1), never added to the baseline (FILL2).
5. **Prerequisite re-check.** The overview's "Prerequisites" section and the first ten examples are compared with
   the frontmatter list under plan 02's tests T1, T2, L1, and C1 ([006](./006-prerequisites-metadata-and-closure.md)).
6. **Brief correction.** Where the findings differ materially from the brief's expected classes, the brief is
   edited in the branch (the plan is the record) and the change is noted in the ledger.

**Fixing** follows the pipeline in [005](./005-execution-model-waves-and-ledger.md#the-per-course-pipeline).
Three rules apply to every fix and are repeated in the packet template:

- **Read before you record.** A unit's expected files are recorded with `EX-RECORD` only after the unit's code was
  read, and every recorded file is read afterwards. A recorded wrong answer is the worst defect a harness can
  hold, because it then passes forever.
- **No quiet narrowing.** When a lesson fence and its file differ, both are read and the right one is chosen.
  A fact is never repaired in prose only; a target is never lowered and recorded as done; an example is never
  marked as an illustration to pass `EX-SYNC` (plan 05's M11).
- **Fixers repair mechanical rows only.** `tutorial-*-fixer` and `content-fixer` repair findings the checker marks
  mechanical. A finding that needs a decision (an example count under its floor, a mode that does not fit) becomes
  a `needs-decision` row and, after the cap, BLOCKED. The coordinator never picks for the user.
