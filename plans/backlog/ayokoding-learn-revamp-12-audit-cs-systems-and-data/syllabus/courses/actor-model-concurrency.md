# Actor-Model Concurrency

**Course ID**: `actor-model-concurrency` · **Format**: By Example · **Category**: computer-science.

**Scope note**: Audits and fixes the existing `actor-model-concurrency` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `concurrency-and-parallelism` keeps threads; `csp-style-concurrency` keeps channels; `just-enough-elixir` (plan 11) keeps the language. This course keeps processes, mailboxes, links, monitors, `GenServer`, supervisors, and OTP patterns. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Build fault-tolerant concurrent programs with Elixir processes and supervisors.

## Why this exists · the big idea

- **The problem before the solution**: none of its 78 examples is run by any check (0 `run.yaml`); 9,315 words against a floor of 28,000; none of 78 examples has a "Why It Matters" block; 78 fences and output blocks without an anchor; a drilling page of 275 words.
- **Keep-this-if-you-forget-everything**: Isolated processes that only send messages cannot corrupt each other, and a supervisor restarts the ones that fail; each Elixir example shows one piece of that.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-elixir`, `concurrency-and-parallelism`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each idea is a process program a reader can run; 78 examples exist but use the `## Example` form, so the audit renames them.
- **Wave**: 9 (slot 1); **size class**: L (words to write 18,685, units authored 3); **expected defect classes**: 9 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 9,315                                                                                                                                                           | at least 28,000                                                                                                                                                                          | 18,685 to write                                          |
| Examples                                                                     | 78 as `## Example N`                                                                                                                                            | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | rename 78 headings to `### Example N: Title`             |
| Mermaid diagrams                                                             | 0                                                                                                                                                               | 30 to 50                                                                                                                                                                                 | 30 to add                                                |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 0 and 0 (for 78 examples)                                                                                                                                       | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | write 78 "Why It Matters" blocks; write 78 key takeaways |
| Annotation density (comment lines per code line, measured on the code files) | median 1.0; 37 below 1.0; 0 above 2.25 (of 78 units)                                                                                                            | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 37 to fix                                                |
| Code fences and anchors                                                      | 78 non-diagram fences; 78 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | 78 to anchor                                             |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                                  | every anchor matches its file                                                                                                                                                            | none                                                     |
| Output blocks                                                                | 0 unanchored                                                                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                     |
| Harness units                                                                | 78 example folders, 0 kata folders in `drilling/code` (5 more outside it), 83 code files, 0 `run.yaml`                                                          | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 3; convert the 78 existing folders          |
| Drilling page                                                                | 275 words; 4 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,725 words short; fix sections                          |
| Katas                                                                        | 5                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 3 to write; move 5                                       |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | none                                                     |
| `## Examples by Level` in `learning/overview.md`                             | absent (CRITICAL)                                                                                                                                               | present, one bullet per example                                                                                                                                                          | add (regenerate with the index command)                  |
| Frontmatter                                                                  | `format` by-example, `category` computer-science, `description` from plan 03; `estimatedHours` snapshot 2                                                       | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** 5 kata folders sit outside `drilling/code/`.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 78 code fences and 0 output blocks carry no anchor.
- **DC5** Headings are 78 × `## Example N` instead of `### Example N: Title`; `learning/overview.md` has no `## Examples by Level` section (CRITICAL when absent); 4 H1 headings inside lesson bodies.
- **DC6** 0 "Why It Matters" blocks for 78 examples; 0 key takeaways for 78 examples; 0 diagrams, 30 below the floor of 30.
- **DC7** Annotation density (comment lines per code line, code files of 78 units): median 1.0, 37 units below 1.0, 0 above 2.25.
- **DC9** 9,315 words; the floor is 28,000 (18,685 short).
- **DC10** 4 of 5 exact `##` sections (found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation); 275 drilling words, 4,725 short.
- **DC11** 5 katas; the floor is 8 (3 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 1, sleeps: 26, thread/goroutine/process uses: 30, asyncio uses: 2.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Rename 78 `## Example NN` headings to `### Example N: Title`; write the lessons (9,315 words, 28,000 needed), about 30 diagrams (none exist), and 78 key takeaways and 78 Why It Matters blocks (none exist).
- Move the 5 kata folders into `drilling/code/`, write 3 more, and write the drilling page (275 words today, 5,000 needed) with the exact `&` heading.
- Anchor the 78 unanchored fences and remove the 4 H1 headings inside lesson bodies.
- Raise annotation in the 37 units outside the band (median 1.0): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Determinism and environment: 26 sleeps, 30 spawn-order uses, and 1 clock read: real-process units synchronize with messages, collect results in the parent, and sort before printing; pids are never printed. `ERL_FLAGS` pins the scheduler count so the halved-CPU run matches (SP6). Capstone code uses OTP only.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention for interleaving.
- **Toolchain ids**: `elixir` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP6 (output independent of CPU count), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 4.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 12.9 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Mailbox ordering, scheduling fairness, supervisor restart intensity, link and monitor delivery (about 12 of 78) run a pure Elixir scheduler model with a seeded SplitMix64 choice of the next process and a virtual clock. The other units are linear message exchanges on the real BEAM.
- **Invariants** (checked after every step):
  - Messages from one sender to one receiver arrive in send order.
  - No message is duplicated, and a lost message is recorded as dropped.
  - A supervisor that sees more than max_restarts failures within max_seconds terminates and escalates.
  - A link delivers the exit signal to each linked process exactly once; a monitor delivers one DOWN message.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 18,685 (class L), units authored from scratch 3 (class S), reading edits 37 (class S).
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 12.9 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 9**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `just-enough-elixir`, `concurrency-and-parallelism`.
- In-plan prerequisites are audited first: `concurrency-and-parallelism` (wave 4).
- Prerequisites outside this plan (unchanged here): `just-enough-elixir`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `concurrency-and-parallelism` are DONE in the ledger; spikes SP6, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `actor-model-concurrency` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE actor-model-concurrency by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC1, DC2, DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 3 units authored and the 78 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `actor-model-concurrency` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `actor-model-concurrency` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit actor-model-concurrency course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Real-process units print nothing that depends on scheduling order; every ordering claim is shown by a model unit with the summary line.

## Accuracy notes

- OTP 29 facts (supervisor defaults, `:erpc`, process limits) are re-checked on erlang.org and hexdocs.pm with dates.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/actor-model-concurrency/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Spawn Process" to "Send To Named".
- **co-02 · intermediate** — examples 27–54 (28): from "genserver minimal" to "genserver call cast choice".
- **co-03 · advanced** — examples 55–78 (24): from "supervisor basic" to "capstone fault tolerant otp".

## Lineage

- Follows the Elixir primer and Concurrency; prepares the concurrency showdown capstone.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 85 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 84 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 69 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
