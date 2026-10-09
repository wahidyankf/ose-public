# 003 — Prerequisites, Readiness, and Ordering

A capstone joins ideas from other courses, so this plan has to answer four questions about those
courses before it writes a word. This page answers them, re-runs the prerequisite rubric for the eight
capstones, defines the readiness check each course must pass before its maker starts, and fixes the
order the courses are written in.

## Short Answers

| Question                                                                                                          | Answer                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does a capstone need its prerequisites' final content?                                                            | No. It needs each prerequisite to exist, to be filled (not an outline, not a skeleton), and to teach the named concepts at definition level. It does not need any prerequisite's examples, figures, headings, or code.                                                                                                      |
| Plans execute strictly in order 01 to 14 (decision 42). What if a prerequisite is rewritten later by plans 09–13? | The capstone is written and tested against the prerequisite **as it exists when this plan starts**, and it is built so that a later rewrite cannot make it wrong: the course-level coupling rule below. A rewrite by a later plan re-checks the capstone's `relies-on` table; plan 14's end-state gate re-checks all eight. |
| What order is safe?                                                                                               | Three waves, with the in-plan dependency first: the concurrency capstone before the lead capstone, and the three security-flavoured courses last. See [Waves](#waves).                                                                                                                                                      |
| Is there a "capstone depends on filled prerequisites" gate?                                                       | Yes: **Gate R**, run for each course before its maker starts. See [Gate R](#gate-r-prerequisite-readiness).                                                                                                                                                                                                                 |

## Starting State of the Prerequisites

Measured on 2026-10-09 at `origin/main` `bb7f90137`; Phase 0 repeats it on the merged head.

- The 62 outline courses today are 24 accounting, 30 ERP, and these 8 capstones. No capstone lists an
  accounting or ERP course as a prerequisite, so plans 06 and 07 do not change any capstone's
  readiness. After plan 07 merges, the eight capstones are the only outline courses left.
- Every prerequisite of the eight capstones is an existing, filled course, with one in-plan exception:
  `capstone-lead-at-altitude` requires `capstone-concurrency-and-systems`, which this plan writes.
- Two prerequisites are **templated filler** courses: `defensive-security` (12 pages, about 11,800
  words) and `vulnerability-management-and-assessment` (12 pages, about 11,300 words). They are not
  outlines, so they pass the readiness check, but the series lists them for a from-scratch rewrite in
  plan 09, which runs after this plan.
- `capstone-solid-core` is a filled capstone with a different layout (code at the course root) and is
  owned by the audit plans 11–13.
- Plans 09–13 may also rewrite, audit, or fix any other prerequisite, and may change their
  `prerequisites` edges.

## Prerequisite Rubric Re-Run

Plan 02 revised every prerequisite list with a rubric and, for outline courses, kept their edges
(reason `K-OUTLINE`) "until the course rewrite plans (06, 07, 08) re-run this rubric". This section is
that re-run for the eight capstones. The rubric, from plan 02:

| Test | Name               | Rule                                                                                                                                                                                                         |
| ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1   | Necessity          | A uses a concept, skill, or artifact that B teaches and A does not re-teach.                                                                                                                                 |
| T2   | Not optional       | A's own prose does not mark B as "helps", "not required", "companion", "supporting", "recommended", or "broader context".                                                                                    |
| T3   | Not tooling-only   | Editor edges are dropped unless A's content uses that tool.                                                                                                                                                  |
| T4   | Not a journey edge | The only reason for the edge is adjacency in an old manifest. Adjacency is never evidence.                                                                                                                   |
| L1   | Language medium    | A language primer is a prerequisite when that language is A's primary code medium (every required exercise uses it).                                                                                         |
| C1   | Capstones          | A capstone requires the courses whose artifacts it integrates, as named in its overview. It depends on an earlier capstone only when it extends that capstone's codebase, or integrates its named artifacts. |

There is no transitive reduction. The evidence is now **the written course**: what each of its worked
examples, its capstone unit, and its drilling actually uses, read from the course brief in
[../syllabus/courses/](../syllabus/courses/README.md). Reason codes follow plan 02's, with these
additions:

| Code      | Meaning                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| K-WRITTEN | Kept: the written course uses the prerequisite (replaces plan 02's `K-OUTLINE`).                                  |
| A-L1      | Added under L1: the course's primary code medium is that language.                                                |
| A-PROSE   | Added under T1: the written course uses a concept that the prerequisite teaches and the course does not re-teach. |
| R-UNUSED  | Removed: the written course has no step that uses the prerequisite (T1 fails).                                    |

### Result per course

| Course                                   | Kept (K-WRITTEN)                                                                                                                                                                                                                                                                                                                                                                    | Added                                                                                                                                                             | Removed                                                                                                             | Resulting list |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------- |
| `capstone-build-your-own-coding-agent`   | `the-agent-loop` (theme A), `agent-tools-and-mcp` (B), `agent-permissions-and-sandboxing` (C), `agent-context-and-memory` (D), `agent-orchestration-subagents-and-observability` (E), `async-python-and-fastapi-services` (async in A and B), `software-engineering-practices` (test-first fix in E)                                                                                | `just-enough-python` (A-L1)                                                                                                                                       | none                                                                                                                | 8              |
| `capstone-data-pipeline`                 | `sql-essentials` (A–D), `advanced-sql-and-query-performance` (query plans and indexes, D), `data-engineering` (layers, A–C), `backend-at-scale` (idempotent loads, serving), `creating-ai-powered-apps` (grounded answers, E)                                                                                                                                                       | `just-enough-python` (A-L1)                                                                                                                                       | none                                                                                                                | 6              |
| `capstone-concurrency-and-systems`       | `csp-style-concurrency` (pools and cancellation, A–B), `containers-and-orchestration` (readiness, D), `site-reliability-engineering` (SLOs and burn rates, E)                                                                                                                                                                                                                       | `just-enough-go` (A-L1)                                                                                                                                           | none                                                                                                                | 4              |
| `capstone-concurrency-showdown`          | `csp-style-concurrency` (Go half), `actor-model-concurrency` (Elixir half)                                                                                                                                                                                                                                                                                                          | `just-enough-go`, `just-enough-elixir` (A-L1: every exercise is written in one of the two)                                                                        | none                                                                                                                | 4              |
| `capstone-lead-at-altitude`              | `capstone-concurrency-and-systems` (C1: it integrates Relay's named SLO and burn-rate artifacts; not a codebase extension, so the figures are restated and checked), `site-reliability-engineering` (SLO and on-call reading), `engineering-management` (leadership practices)                                                                                                      | none (no code, so no language primer)                                                                                                                             | none                                                                                                                | 3              |
| `capstone-secure-service`                | `security-essentials`, `backend-at-scale`, `it-and-application-security`, `offensive-security` (abuse cases), `defensive-security` (detections)                                                                                                                                                                                                                                     | `just-enough-python` (A-L1)                                                                                                                                       | none                                                                                                                | 6              |
| `capstone-build-your-own-pentest-engine` | `agentic-ai`, `the-agent-loop`, `agent-tools-and-mcp`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-orchestration-subagents-and-observability`, `security-essentials`, `offensive-security`, `defensive-security`, `detection-engineering-and-siem-operations`, `vulnerability-management-and-assessment`, `just-enough-typescript` (L1, already present) | none                                                                                                                                                              | `browser-automation-with-cdp` (R-UNUSED: the safety boundary forbids a browser step; nothing in the course uses it) | 12             |
| `capstone-real-world-delivery`           | `capstone-solid-core` (C1: the service shape comes from it), `backend-at-scale`, `software-architecture`, `domain-driven-design`, `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering`, `it-and-application-security`, `offensive-security`, `defensive-security`                                                                                        | `just-enough-python` (A-L1), `event-driven-architecture` (A-PROSE: theme B teaches the outbox, the idempotent consumer, and a projection, which that course owns) | none                                                                                                                | 12             |

Totals: 9 edge changes: 7 added language primers (L1), 1 added course (T1), 1 removed course (T1). No
edge between capstones changes.

### How the maker applies and confirms the table

1. At the start of CP-2 (see [007](./007-execution-model.md#the-per-course-pipeline)), the maker re-reads the course's `prerequisites` list
   and the brief's table above, and checks each kept edge against the examples it writes. An edge no
   example uses is a candidate for removal; an unlisted course whose concept an example uses is a
   candidate for addition. Each change is recorded in the ledger with its code and the example number
   that proves it.
2. The brief file in the corpus is edited in the same commit when the maker changes a list (this plan is
   the custodian).
3. The edit to `_index.md` `prerequisites` goes into the course's own commit. Right after each such
   commit the executor runs plan 02's integrity unit tests (`path-model-integrity.unit.test.ts`,
   `manifest-membership.unit.test.ts`) and the plan 03 metadata tests through `ayokoding-www:test:unit`
   and reads the result; a failure is fixed before the next course starts.

### Effect on the four career paths

The added and removed edges were checked against plan 02's complete revised graph (its kept **and**
added edges) and all four career manifests:

- The three software-engineer paths place every capstone in an extension phase. Adding
  `just-enough-python`, `just-enough-go`, `just-enough-elixir`, or `event-driven-architecture` as a
  prerequisite needs each already to appear earlier in the path (rule R10) or to sit outside it. The
  check found no ordering violation and no closure violation in any of the three paths.
- Removing `browser-automation-with-cdp` from the pentest engine only removes a link on the course page
  and an ordering constraint.
- The AI path changes through its goal ([005](./005-ai-path-goal-and-closure.md)).

Phase 0 repeats the check against the merged manifests: for each of the four career manifests, every
in-path prerequisite of every course is earlier in the flattened order or in `assumes`, with this
plan's nine edge changes applied.

## Course-Level Coupling

Plans 09–13 run after this plan and may rewrite any prerequisite. A capstone must stay correct when that
happens. Four rules make that true. They are binding on every capstone and checked in the Content Quality
Gate (D9 in [002](./002-capstone-course-contract-and-modes.md)).

| Rule | Statement                                                                                                                                                                                                                                                        | Why                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| CL1  | **Link at course level.** A capstone links to a prerequisite only by its course URL (`/en/learn/courses/<slug>`), never to one of its lessons, headings, or code. It links only to courses in its own `prerequisites` list.                                      | A rewrite changes headings and page names; a course URL survives.                                       |
| CL2  | **Restate what you use.** Where a capstone first uses a prerequisite's concept, it states the concept in one or two sentences (a definition, not a lesson). The capstone is readable and correct if the prerequisite changes its wording or examples.            | The capstone cannot lean on text that may change.                                                       |
| CL3  | **No imports.** A capstone's code, katas, and expected files import nothing from a prerequisite's code folders and copy no file from them without carrying their own copy (for example, `capstone-real-world-delivery` ships its own copy of the service shape). | A later rewrite or layout change in the prerequisite cannot break the capstone's harness run.           |
| CL4  | **Keep a `relies-on` table.** `learning/overview.md` has `## What this course relies on`: for every prerequisite, the concept names the course uses (names only) and where it first uses each. The "Assumed knowledge" bullet in the brief seeds it.             | It is the single place a later plan looks to see what a rewrite must keep, and where a re-check starts. |

### Checked by a test

The content-shape test ([006](./006-e2e-rebinding-and-testing-strategy.md)) checks CL1 and CL4 for all
eight capstones with no model in the loop:

- every course `prerequisites` entry has a row in the `relies-on` table, and every row names a course
  in the list;
- every Markdown link from a capstone page to `/en/learn/courses/<slug>/…` has a path of exactly
  `/en/learn/courses/<slug>` and a slug in the course's own `prerequisites` list;
- the table links resolve to existing courses, so renaming or deleting a prerequisite fails the test in
  the plan that does it.

CL2 and CL3 are judged by the Content Quality Gate and the harness (CL3 fails the double run if a path
is missing).

### What later plans must do (handoff)

| Who                                                                                   | Duty                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan 09 (rewrites `defensive-security` and `vulnerability-management-and-assessment`) | Before merge, search `apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md` for the course slug; for each hit, read the `relies-on` row and confirm the new course still teaches the named concepts. If not, edit the row and the capstone paragraph that restates it, in the same PR.                           |
| Plans 10–13 (migration and audits)                                                    | The same duty for any course they rewrite or whose `prerequisites` they change. The AI path's closure test (rule R6) fails if a change alters the AI core; the plan that changes the edge updates the AI manifest in the same PR.                                                                                                       |
| Plan 14 (end-state gate)                                                              | Runs the whole unit suite (the capstone content-shape test is part of it) and, for each capstone, re-reads the `relies-on` table against the prerequisite courses that changed since this plan merged (`rtk git diff --stat <this plan's merge>..HEAD -- <prerequisite folders>`). A concept that disappeared is a finding on the gate. |

This is a cross-plan assumption recorded in [README.md](./README.md#cross-plan-assumptions); this plan
cannot edit plans 09–14, and the rule works even if they do not know about it, because the content-shape
test fails first on a renamed or removed prerequisite.

## Gate R: Prerequisite Readiness

The user's rule: a capstone depends on filled prerequisites. **Gate R** applies it, per course, before
the maker is started (checklist step CP-0). All parts must pass:

| Check | Pass condition                                                                                                                                         | If it fails                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| R-1   | Every course in the capstone's `prerequisites` exists under `content/en/learn/courses/`                                                                | Stop; fix the list (plan 02's resolve test should have caught it)                                                                      |
| R-2   | None of them has `status: outline`, except an in-plan prerequisite that is DONE in the ledger (committed, harness green)                               | The capstone is **BLOCKED** with cause "prerequisite not ready"; the plan moves on and reports                                         |
| R-3   | Each has more than 1,000 words (not a skeleton) and its `learning/overview.md` or `overview.md` names the concepts in the capstone's `relies-on` table | If a concept is missing from a filler course, the capstone restates it (CL2) and the maker records it in the ledger; it is not a block |
| R-4   | The `relies-on` table lists only concept names the maker has confirmed in the prerequisite's current text                                              | The maker removes the name or teaches it inside the capstone                                                                           |

Gate R is a **check, not a wait**. Because the series executes strictly in order, no later plan can fill
a prerequisite first, so a failing course is reported rather than paused. Expected result: every check
passes for every course, because plans 06 and 07 touch no capstone prerequisite and the only in-plan
prerequisite is handled by [wave order](#waves).

### The two filler prerequisites

`defensive-security` and `vulnerability-management-and-assessment` pass R-1 and R-2 and R-3 (they are
about 11k words each) and are templated. The three courses that depend on them are written like this:

- The maker reads the two courses as they are, and builds the `relies-on` rows only from concepts that
  appear there at the definition level (for example: a detection rule, a log source, a severity rating,
  a finding).
- Everything else those courses might teach is restated by the capstone (CL2). The capstone's labelled
  logs, detections, and findings are its own.
- After plan 09 rewrites them, the handoff table above applies.

## Waves

Waves are priority tiers. They exist for three reasons: an in-plan dependency, risk, and reuse of a
pattern the first courses establish. Within a wave, courses run up to three at a time.

| Wave | Courses                                                                                                                               | Why in this wave                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `capstone-build-your-own-coding-agent`, `capstone-data-pipeline`, `capstone-concurrency-and-systems`, `capstone-concurrency-showdown` | Independent of every other capstone. The coding agent is the AI path's goal, so it is first and unblocks the path phase. The concurrency capstone must be done before wave 2 (cross-course figures). They use the toolchains least likely to expose a harness gap (`python`, `postgres`, `go`, `elixir`) |
| 2    | `capstone-lead-at-altitude`                                                                                                           | Uses Relay's figures from `capstone-concurrency-and-systems`, so it starts only after that course is done (DONE in the ledger). No code, so it adds no harness load                                                                                                                                      |
| 3    | `capstone-secure-service`, `capstone-build-your-own-pentest-engine`, `capstone-real-world-delivery`                                   | The highest safety-review load, the heaviest toolchains (`typescript`, `kubeconform`, `opentofu`), and the largest CI time. They run last so that the stage-run capstone pattern is proven on the first batch                                                                                            |

**Invariant.** A course starts only when (a) every course of a lower wave is in the same or an earlier batch, and (b) every prerequisite of it that this plan writes is finished. Batches of up to three agents are cut from this
order (see [007](./007-execution-model.md#batches)):

| Batch | Courses                                                |
| ----- | ------------------------------------------------------ |
| B1    | coding agent, data pipeline, concurrency and systems   |
| B2    | concurrency showdown, lead at altitude, secure service |
| B3    | pentest engine, real-world delivery                    |

Lead at altitude starts in B2 only after B1 has finished, so the concurrency capstone is done. The AI
path phase can run as soon as the coding agent is done and passes its checks; it does not wait for B3
(see [005](./005-ai-path-goal-and-closure.md)), but the PR contains everything.
