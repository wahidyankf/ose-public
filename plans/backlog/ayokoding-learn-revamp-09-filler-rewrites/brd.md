# Business Requirements — Filler Course Rewrites

## Problem

AyoKoding (`apps/ayokoding-www`) lists eight courses that look finished and are not. Each has 11 or 12 pages,
78 or 80 example headings, a code folder, and a drilling page, so every automatic check passes them. A reader who
opens one finds the same two sentences under every example heading:

- **The six templated courses** (`build-your-own-git`, `compilers-parsers-and-transpilers`, `type-systems`,
  `just-enough-fsharp`, `lisp`, `enterprise-java-and-the-jvm`) hold 2,700 to 3,962 words in total, with a
  unique-body ratio of 0.01: 78 example bodies, one distinct. The code folders hold 78 files of one shape.
- **The two security courses** (`defensive-security`, `vulnerability-management-and-assessment`) hold 11,561 to
  12,255 words, but most of it is one paragraph repeated 78 or 80 times (unique-body ratios 0.04 and 0.06). The
  defensive course runs ten subcommands of one script; **all 80 vulnerability examples run
  `vuln_triage_lab.py example N`, which prints the same report for every N.**
- **The Git course teaches a wrong answer.** 79 of its files hash the header with a backslash and a zero
  (`b"\\0"`) where Git uses the NUL byte, so every object id they print is wrong, and nothing ever compared an id
  with real Git.
- **Nothing in the repository would notice another one.** Plan 02's outline rules skip non-outline courses, plan
  03's word guard does not read examples, the quality gates run only on request, and the code harness has run on
  none of the eight (they have no `run.yaml`). A new templated course could be added tomorrow and pass every check.
- **Drilling is a fixed template in all eight**, with a handful of questions each, and no kata.

## Who This Is For

- **Readers:** software engineers following the three software-engineer career paths, where all eight courses sit
  in extension phases. They expect a course to teach: to show a result, explain why, and let them run it.
- **Maintainers and later plans:** plan 14 ends the series with a gate that says no course is filler. It needs a
  deterministic test to call. Plans 11 to 13 own 17 more flagged courses and need a baseline that shrinks as they
  fix them. Plan 10 reads the two security courses' legacy relation. Plan 08's capstones rely on four concepts these
  security courses teach.

## User-Stated Requirements (verbatim intent)

- "make sure nanti semua coursenya harus lengkap ya. dan siap dipake" (every course complete and ready to use).
- "bikin sekalian. semua yang kerangka harus diisi" (do it all at once; every outline must be filled).
- "semua jadi 2 aja" (2026-10-09): every quality gate and every maker-checker loop stops after 2 cycles.
- "Delivery checklists: detailed, split by phase, with an explicit completion gate per phase or section."
- "jangan kerjain/implement plan ini sebelum gw kasih perintah buat eksekusi ya" (do not implement this plan until
  the user gives the command to execute).
- "semua plan tadi bakal kita lakuin sekuensial ya" (2026-10-09): all the series plans run one after another.
- The plan quality gate was deliberately not run while this plan was written, to keep token use even (user
  decision, 2026-10-09). It runs as the first step of execution.

## Resolved Series Decisions This Plan Relies On

The user resolved these decisions on 2026-10-09. They are copied here so this plan stands alone. Numbering follows
the series decision list. Series decisions not listed here do not bind this plan; decisions 16 to 19 and 39 concern
the skills paths (plans 06 and 07).

| No. | Decision                                                                                                                                                                                                                                                                                                                                      | How this plan applies it                                                                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Skeleton (`status: outline`) courses are never in a core.                                                                                                                                                                                                                                                                                     | None of the eight carries `status: outline`, and all sit in extension phases. The end state keeps it so; a finished course gets plan 03's metadata.                                                                                                  |
| 26  | Every course ends complete, pedagogically sound, and with solid code.                                                                                                                                                                                                                                                                         | Two quality gates per course and the harness.                                                                                                                                                                                                        |
| 27  | Course definition of done: the course meets the tutorial convention for its mode plus drilling; it passes its mode quality gate and the Content Quality Gate with no blocking finding; and every code example is green in the harness.                                                                                                        | Eleven checks C1 to C11 per course, in [tech-docs/002](./tech-docs/002-course-modes-and-definition-of-done.md); a mode and a reason for each course.                                                                                                 |
| 29  | Per course: maker → mode quality gate (at most 2 cycles) → Content Quality Gate (at most 2 cycles) → harness green. A course still blocked at the cap is marked BLOCKED in the execution ledger, reported, and the batch moves on. Parallelism: N=3 background agents. The user set every cap to 2 cycles on 2026-10-09 ("semua jadi 2 aja"). | The pipeline in [tech-docs/006](./tech-docs/006-execution-model.md); the ledger `local-tmp/ayokoding-learn/execution-ledger.md` records agents and cycle counts.                                                                                     |
| 30  | Code contract: each example lives in `learning/code/ex-NN-<slug>/` with its code and a `run.yaml`; the harness also checks that Markdown code blocks match their files.                                                                                                                                                                       | One unit per example, kata, and capstone; about 700 `run.yaml` files across the eight courses ([tech-docs/009](./tech-docs/009-file-impact.md)).                                                                                                     |
| 31  | Determinism: every `run.yaml` is deterministic (fixed seeds, no wall clock, no real network, no uncontrolled thread order).                                                                                                                                                                                                                   | Rules in [tech-docs/004](./tech-docs/004-code-harness-and-determinism.md), including a rule that output never depends on the CPU count (the JVM and .NET runs).                                                                                      |
| 32  | Runtime: anything that runs in a container runs for real.                                                                                                                                                                                                                                                                                     | Real Git in the oracle unit, real compilers, a real JVM with real Spring Boot.                                                                                                                                                                       |
| 33  | CI runs affected courses on each PR; a full run happens monthly and on any toolchain or dependency version bump; never daily.                                                                                                                                                                                                                 | This plan changes the toolchain catalog (a new `clojure` entry and a Java install recipe), so its PR triggers the full run.                                                                                                                          |
| 34  | Legacy unique content is migrated into courses by plan 10; `learn/legacy` is removed by plan 14.                                                                                                                                                                                                                                              | The two security courses keep their `## Legacy relation` section unchanged, and nothing under `learn/legacy` is touched.                                                                                                                             |
| 35  | Courses are English only; `content/id/**` stays untouched.                                                                                                                                                                                                                                                                                    | Every run of index generation is followed by a check that `content/id` did not change.                                                                                                                                                               |
| 37  | Deterministic tooling lives in `apps/ayokoding-cli`; app checks stay in the app's tested TypeScript; never ad-hoc scripts.                                                                                                                                                                                                                    | The filler guard is a TypeScript unit test in `apps/ayokoding-www`; the harness is the CLI.                                                                                                                                                          |
| 40  | Series end state: zero outline, skeleton, or filler courses; every path filled; no "Outline" badge; harness coverage at 100%. Plan 14 carries the terminal gate; each content plan measures its share.                                                                                                                                        | This plan's share is the eight courses plus the guard that plan 14 calls. 25 courses fire the guard at the start; 17 remain after this plan for plans 11 to 13. No path or catalog datum depends on these eight, which this plan confirms by search. |
| 41  | The plan quality gate is deferred out of authoring: each plan's Phase 0 starts by running the `plan-quality-gate` workflow with `max-cycles` 2.                                                                                                                                                                                               | Phase 0 item 1 of [delivery.md](./delivery.md). No verdict exists yet.                                                                                                                                                                               |
| 42  | The 14 plans run strictly one after another, 01 to 14, one plan, one worktree, and one PR at a time; the next plan starts only after the previous one is merged, deployed, verified, and cleaned up. Parallel agents inside a plan stay (N=3).                                                                                                | Plans 01 to 08 are merged when this plan starts, and plans 10 to 14 have not started; Phase 0 confirms both. No rebase between plans is planned.                                                                                                     |

## Evidence (measured 2026-10-09 at `origin/main` `bb7f90137`)

| Fact                                                                                                                                                                                            | How it was measured                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The eight courses have 2,700 to 12,255 words, 11 or 12 pages, 78 or 80 example headings, and no `status` key                                                                                    | Counted whitespace-separated words in every `.md` file of each course; read each `_index.md`                                   |
| Unique-body ratio (distinct example bodies over example bodies) is 0.01 for the six templated courses, 0.04 for defensive, 0.06 for vulnerability; the other 173 courses have a minimum of 1.00 | Read-only prototype scan of all 181 courses (an input to the guard's design, not linked)                                       |
| 79 files in `build-your-own-git` contain the three characters `\\0` where Git's header needs a NUL byte                                                                                         | Searched the course's `.py` files                                                                                              |
| The vulnerability course's 80 examples all run `vuln_triage_lab.py example N` and print one report                                                                                              | Read the script and the example blocks                                                                                         |
| The guard's rules, run over the 181 courses, fire on 87: 62 outlines (on the word-count rule only) and 25 non-outline courses; the other 94 fire nothing                                        | Calibration run recorded in [tech-docs/003](./tech-docs/003-filler-guard.md#the-25-non-outline-courses-that-fire)              |
| All eight sit only in extension phases of the three software-engineer career manifests; `lisp` is in one of them                                                                                | Read plan 02's drafted manifests and the current `src/features/course-paths/manifests/**/*.json`                               |
| `detection-engineering-and-siem-operations` and `it-governance-grc` require `defensive-security`; three plan 08 capstones rely on the two security courses                                      | Searched course `_index.md` frontmatter and capstone `relies-on` tables                                                        |
| Spring Boot 4.1.1, ATT&CK v19.2 (15 enterprise tactics), Clojure 1.12.6, CVSS 4.0, and NVD's 15 April 2026 triage policy are current                                                            | Read each project's own page on 2026-10-09 ([tech-docs/005](./tech-docs/005-security-content-and-accuracy.md#source-register)) |

## Business Goals and Success Measures

| Goal                                   | Measure at merge                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every one of the eight courses is real | 8 of 8 have no `status: outline`, declare `format`, reach 28,000 words, have the full drilling page, and pass the filler-guard rules; the `filler-course-completion` scenarios pass                     |
| Every course's code works              | `ayokoding-www:examples:check` exits 0; `ayokoding-cli examples coverage` shows `covered: true` for all 8; every printed result is checked against an expected file on both executions                  |
| Every course passed its quality gates  | The execution summary shows `PASS` or `PASS_WITH_FINDINGS` from both gates for each course, each within 2 cycles, and no BLOCKED course left unresolved (or the user said in words to merge without it) |
| The Git course is correct              | Every object id the course prints equals the id real Git computes (the oracle unit passes), and a static scan finds no `\\0` terminator in any `.py` file                                               |
| Filler can never return unnoticed      | The guard runs in `test:quick`, fails on any new templated course, and keeps a baseline that can only shrink: 25 entries before this plan, 17 after; plan 14 can call it                                |
| The security courses stay safe         | SEC1 reports zero addresses outside the reserved ranges; no unit takes a host or has network; the capstone `relies-on` rows were re-read and still match                                                |
| Readers see honest catalog data        | Each of the eight cards shows a format and an estimated time (plan 03's drift test), and no Outline badge                                                                                               |

## Business Risks

| Risk                                                                                 | Mitigation                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A course cannot pass a gate within 2 cycles                                          | It is marked BLOCKED, its partial work is saved as a patch, the branch changes nothing for it, and it stays in the baseline. The batch moves on; the plan does not merge with a BLOCKED course unless the user says so in words |
| Spring Boot cannot run offline from a hash-locked jar set (the riskiest item)        | Probe P9 runs in Phase 2, before any course starts. If it fails and cannot be fixed, `enterprise-java-and-the-jvm` is BLOCKED and Phase 6 is a human stop where the user chooses                                                |
| The guard flags a good course, or lets filler through                                | Six rules calibrated on the real corpus with a gap on both sides of each threshold; a unit test per rule and per false-positive case; the baseline lets a flagged course in with a named owner                                  |
| A security course teaches attack technique, or touches a real address                | Safe-lab rules S1 to S7; SEC1 as a test; the Content Quality Gate; the harness gives a unit no network                                                                                                                          |
| The capstones that rely on the two security courses lose a concept                   | Four concepts and their example numbers are fixed in the briefs; checkpoint CP-7 re-reads each `relies-on` row against the finished course and edits it in the same PR if needed                                                |
| Facts change before execution (ATT&CK, Spring Boot, CVSS, EPSS, Clojure, NVD policy) | Rule A3: every fact in a brief is a probe the maker re-verifies and dates; rule A6 forbids "latest"                                                                                                                             |
| Plans 02, 03, 05, or 08 merge with different names than this plan expects            | Phase 0 checks every name on `origin/main` and records the merged names before any change                                                                                                                                       |
| A new toolchain entry or recipe breaks other courses                                 | The change follows plan 05's "Adding a Toolchain", has a fixture and a smoke row, and the PR's CI runs every course (decision 33)                                                                                               |
| The PR is very large (eight courses, about 700 units)                                | One commit per course, per-course gate reports, and a committed execution summary let a reviewer check each course on its own                                                                                                   |
| Running many Docker-based examples overloads the machine                             | Every command runs through HIPPO, which admits harness runs one resource budget at a time; at most 3 background agents                                                                                                          |

## Cost and Benefit of the New Code

- **Cost:** one pure TypeScript module with six rules, a scanner, a baseline module, and tests; one `clojure`
  toolchain entry (a `Dockerfile`, a fixture, a smoke row); one Java install recipe (about sixty lines of
  `JarFetch.java`); and roughly 700 harness units that run on each affected PR and in the monthly full run. The
  eight courses are content, not product code.
- **Benefit:** eight courses that teach, a proof that one of them gives the right answer (the Git ids), a test that
  keeps filler out for good, and a path for plans 11 to 14 to finish the series. Without the guard, the next
  generated course would pass every check again.
