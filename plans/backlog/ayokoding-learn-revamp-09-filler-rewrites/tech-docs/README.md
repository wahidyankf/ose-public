# Technical Design — Filler Course Rewrites

This directory is the plan's single technical form. Read the companions in order; each one is self-contained
enough for a junior engineer to carry out its part.

| File                                                                                       | What it covers                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [001-current-state.md](./001-current-state.md)                                             | The eight courses today (measured 2026-10-09), what a reader finds, who uses them, prerequisite changes, and the prior art                     |
| [002-course-modes-and-definition-of-done.md](./002-course-modes-and-definition-of-done.md) | Mode selection, the eleven-check definition of done, word, example, diagram, and drilling targets, metadata, layout, and course obligations    |
| [003-filler-guard.md](./003-filler-guard.md)                                               | The deterministic guard: where it lives, the six rules and their calibration, false positives, the shrink-only baseline, and plan 14's call    |
| [004-code-harness-and-determinism.md](./004-code-harness-and-determinism.md)               | Toolchain per course, `run.yaml` patterns, the `clojure` and `java` toolchain changes, the Git oracle, determinism rules, and Phase 2 probes   |
| [005-security-content-and-accuracy.md](./005-security-content-and-accuracy.md)             | Safe-lab rules, SEC1, accuracy rules for all eight courses, the capstone handoff to plan 08, and the source register                           |
| [006-execution-model.md](./006-execution-model.md)                                         | Waves in prerequisite order, the per-course pipeline with its 2-cycle caps, checkpoints, BLOCKED handling, unexpected findings, and the ledger |
| [007-testing-strategy.md](./007-testing-strategy.md)                                       | Gherkin features, the test pyramid for this plan, the scenario-to-test map, coverage, and manual checks                                        |
| [008-decision-records.md](./008-decision-records.md)                                       | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers                                                |
| [009-file-impact.md](./009-file-impact.md)                                                 | Root-relative file-impact tree with `[E]`/`[N]`/`[D]`/`[G]` markers                                                                            |
| [010-rule-and-docs-impact.md](./010-rule-and-docs-impact.md)                               | Rules this plan creates or touches, their homes and enforcement, and the docs to update                                                        |

## Summary

1. **Courses.** Eight templated filler courses are rewritten from scratch: seven in By Example mode
   (`build-your-own-git`, `compilers-parsers-and-transpilers`, `type-systems`, `lisp`,
   `enterprise-java-and-the-jvm`, `defensive-security`, `vulnerability-management-and-assessment`) and one in
   Primer mode (`just-enough-fsharp`). Each meets its mode convention, has a drilling section, passes its mode
   quality gate and the Content Quality Gate with no blocking finding, passes the filler guard, and is green in
   plan 05's code harness. The syllabus in [../syllabus/](../syllabus/README.md) is each course's brief.
2. **Guard.** A deterministic TypeScript unit test (six rules, FG1 to FG6) tells a templated course from a
   written one. It runs in `test:quick`, fails on any new filler course, and keeps a closed baseline that can
   only shrink: 25 courses at the start, 17 after this plan, none at plan 14. Every course, not only these eight,
   must pass it, so plan 14's end-state gate can call it.
3. **Code.** Every example, kata, and capstone is a harness unit with a `run.yaml`. Languages come from plan 05's
   catalog: Python, F# on .NET, TypeScript, OCaml, Rust, Racket, Java, and the shell. This plan adds one toolchain
   entry (`clojure`) and one install recipe (`java`, hash-locked jars) through plan 05's "Adding a Toolchain"
   procedure.
4. **The Git course.** All 79 code files hash the wrong header (a backslash and a zero instead of the NUL byte).
   The rewrite proves every object id against real Git with a shell unit and a shared vectors file, and a static
   scan forbids the literal bug.
5. **The security courses.** The two courses keep their safe-lab promise and gain a test (SEC1: reserved
   addresses only). They keep teaching a detection rule, a log source, a severity rating, and a finding, which
   three of plan 08's capstones rely on; the plan re-reads those `relies-on` rows before merge.
6. **End state.** The eight courses have no filler, no `status: outline`, more than 28,000 words each, and
   green code. No path or catalog datum depends on them, and no manifest changes.

## Cross-Plan Assumptions

The series runs strictly in order (series decision 42), so plans 01 to 08 are merged, deployed, verified, and
cleaned up when this plan starts, and plans 10 to 14 have not started. Each assumption below is checked in
Phase 0; a failed check stops the plan with a report to the user.

| From                | What this plan assumes                                                                                                                                                                                                                                                                                                                            | Phase 0 check                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Plans 01, 04        | Display and reading features that may add a convention for course pages (for example stable example anchors). This plan assumes none beyond plan 03's metadata; the course URL shape `/en/learn/courses/<slug>` is unchanged                                                                                                                      | Read the merged outcomes of both plans; apply any new page convention to the eight courses and record it                         |
| Plan 02             | `status: outline` in course frontmatter, the path integrity rules (R1 to R10) over the career manifests, and the three software-engineer manifests that hold the eight courses in extension phases                                                                                                                                                | Search each name on `origin/main`; open the three manifests and record the phase of each of the eight                            |
| Plan 03             | Course metadata keys `category`, `description`, `format`, `estimatedHours` for all 181 courses, the drift test that prints "Expected estimatedHours for every non-outline course", a word guard, and the description text restated in each brief                                                                                                  | Search the schema keys and the scenario title; compare the eight `_index.md` files with each brief's metadata block              |
| Plan 05             | `apps/ayokoding-cli` with `examples validate`, `sync`, `run --record`, `check --course`, `coverage`; the Nx target `ayokoding-www:examples:check`; the `run.yaml` contract `ayokoding.run/v1`; the catalog entries `python`, `shell`, `dotnet`, `typescript`, `ocaml`, `rust`, `racket`, `java`; the `install` recipe field; "Adding a Toolchain" | Build the CLI; run `toolchains list`; run `examples validate --course build-your-own-git`; record each catalog version and image |
| Plan 06             | The accounting completion test and its pattern (`be-steps/accounting-course-completion.steps.ts`); the 24 accounting courses are rewritten and must not fire the guard                                                                                                                                                                            | Search for the file; Phase 1's real-corpus run shows no accounting course among the firing courses                               |
| Plan 07             | The ERP courses are rewritten (or still outlines) and must not fire the guard                                                                                                                                                                                                                                                                     | Same real-corpus run                                                                                                             |
| Plan 08             | Eight capstones, three of which list `defensive-security` or `vulnerability-management-and-assessment` in a `relies-on` table (rules CL1 to CL4); the handoff duty for plan 09                                                                                                                                                                    | Search `capstone-*/learning/overview.md` for the two slugs; read each row                                                        |
| Plans 10, 11–13, 14 | Not started. Plan 10 reads the `## Legacy relation` sections of the two security overviews (kept unchanged here). Plans 11 to 13 own the 17 baseline courses and delete entries as they fix them. Plan 14 requires an empty baseline and calls the scan                                                                                           | None at start; this plan's final report names the open baseline entries                                                          |

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP tools
  available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the `prod-ayokoding-www` branch.
  After merge, the workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled, or
  dispatched) moves `main` to that branch; the plan dispatches it and checks the live site with Playwright. No
  step needs billing, usage, firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the server is
  present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (eight course specifications and a short paths index) moves to
`plans/done/` with this plan. The durable products are the course pages under
`apps/ayokoding-www/content/en/learn/courses/`, the guard and baseline modules under
`apps/ayokoding-www/src/features/content/`, and the features under
`specs/apps/ayokoding/www/behaviours/backend/content/`; no checker, Nx target, build step, or shipped content
reads the syllabus files. The course makers read them during execution only, as a plan input.

## Corpus Custody

- This plan is the custodian of its own corpus (`**Custodian**` line in
  [../syllabus/README.md](../syllabus/README.md)).
- It consumes one other corpus read-only: the drafted software-engineer career manifests in plan 02's
  `syllabus/paths/` (`manifest-careers-fundamentally-strong-software-engineer.md`,
  `manifest-careers-immediately-effective-software-engineer.md`, and
  `manifest-careers-interview-ready-software-engineer.md`).
  `custodied-by:ayokoding-learn-revamp-02-path-model`. Plan 02 is archived under `plans/done/` before this plan
  runs, so this plan names those files instead of linking them, and records every observed difference in
  [../syllabus/paths/README.md](../syllabus/paths/README.md).
- Plan 10 and plans 11 to 13 may read this corpus for course scope; they link to the shipped course pages, not
  into this corpus. If a live plan links into this corpus when this plan archives, the archival step rewrites
  that link (branch (a) of the custody rule).
- The archived corpora of the 2026-07-19 and 2026-08-15 course-authoring plans are cited as history only.

## Out of Scope

- The 17 other courses the guard flags (plans 11 to 13 fix them; they sit in the baseline until then).
- Any path or manifest change, and the numeric prefixes in 73 course titles (a series matter).
- Indonesian course content: `content/id/**` stays untouched (series decision 35).
- Any change to plan 05's harness beyond adding the `clojure` entry, extending the `java` entry, and fixing a
  harness defect that blocks this plan (plan 05's migration step M11).
- Migrating unique content from the legacy security tracks (plan 10). This plan keeps the two security overviews'
  `## Legacy relation` sections unchanged so plan 10 can read them.
