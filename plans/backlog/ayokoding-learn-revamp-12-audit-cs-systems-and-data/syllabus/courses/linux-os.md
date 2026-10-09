# Linux OS

**Course ID**: `linux-os` · **Format**: By Example · **Category**: systems-and-networking.

**Scope note**: Audits and fixes the existing `linux-os` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `system-programming` keeps memory ownership; `computer-architecture` keeps hardware; this course keeps processes, files, pipes, signals, sockets, and the `/proc` view. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course. Because plan 09's filler guard lists the course, the fix also removes its baseline entry in the same commit.

**Short summary**: Explore Linux processes, system calls, file systems, and signals hands-on.

## Why this exists · the big idea

- **The problem before the solution**: none of its 78 examples is run by any check (0 `run.yaml`); 8,319 words against a floor of 28,000; none of 78 examples has a "Why It Matters" block; plan 09's filler guard flags it (FG2; unique-code ratio 0.12); 78 of 78 code units below the annotation band (median 0.12).
- **Keep-this-if-you-forget-everything**: A Linux program talks to the kernel through system calls; each C example shows one call, its result, and what goes wrong when it fails.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-c`, `just-enough-bash`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each concept is a system call a reader can run; the existing 78 sources are templated (guard FG2, unique-code ratio 0.12), so every unit is rewritten as a distinct program.
- **Wave**: 3 (slot 3); **size class**: XL (words to write 19,681, units authored 87); **expected defect classes**: 10 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                              | Target                                                                                                                                                                                   | Work                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 8,319                                                                                                                        | at least 28,000                                                                                                                                                                          | 19,681 to write                                          |
| Examples                                                                     | 78 as `### Example N`                                                                                                        | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                     |
| Mermaid diagrams                                                             | 31                                                                                                                           | 30 to 50                                                                                                                                                                                 | none                                                     |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 0 and 0 (for 78 examples)                                                                                                    | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | write 78 "Why It Matters" blocks; write 78 key takeaways |
| Annotation density (comment lines per code line, measured on the code files) | median 0.12; 78 below 1.0; 0 above 2.25 (of 78 units)                                                                        | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 78 to fix                                                |
| Code fences and anchors                                                      | 2 non-diagram fences; 2 code fences unanchored                                                                               | every code fence anchored or marked as an illustration                                                                                                                                   | 2 to anchor                                              |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                               | every anchor matches its file                                                                                                                                                            | none                                                     |
| Output blocks                                                                | 0 unanchored                                                                                                                 | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                     |
| Harness units                                                                | 78 example folders, 0 kata folders in `drilling/code`, 79 code files, 0 `run.yaml`                                           | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 87                                          |
| Drilling page                                                                | 286 words; 0 of 5 exact `##` sections; headings: Retrieval practice, Katas, Debugging drills, Capstone rehearsal, Self-check | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,714 words short; fix sections                          |
| Katas                                                                        | 0                                                                                                                            | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                               |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                            | none; the facts sit in References                                                                                                                                                        | none                                                     |
| `## Examples by Level` in `learning/overview.md`                             | absent (CRITICAL)                                                                                                            | present, one bullet per example                                                                                                                                                          | add (regenerate with the index command)                  |
| Frontmatter                                                                  | `format` by-example, `category` systems-and-networking, `description` from plan 03; `estimatedHours` snapshot 3              | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                |
| Filler guard (plan 09)                                                       | in `FILLER_BASELINE`: FG2 (unique-code ratio 0.12)                                                                           | no entry; guard passes with no baseline help                                                                                                                                             | remove the entry in this course's commit                 |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 2 code fences and 0 output blocks carry no anchor.
- **DC5** `learning/overview.md` has no `## Examples by Level` section (CRITICAL when absent).
- **DC6** 0 "Why It Matters" blocks for 78 examples; 0 key takeaways for 78 examples.
- **DC7** Annotation density (comment lines per code line, code files of 78 units): median 0.12, 78 units below 1.0, 0 above 2.25.
- **DC9** 8,319 words; the floor is 28,000 (19,681 short).
- **DC10** 0 of 5 exact `##` sections (found: Retrieval practice, Katas, Debugging drills, Capstone rehearsal, Self-check); 286 drilling words, 4,714 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): thread/goroutine/process uses: 21, subprocess uses: 21, environment/pid reads: 56, hash-order prints: 15.
- **DC13** Scan hits (approximate): file-system uses: 24, Linux-only calls: 43.
- **DC16** Listed in plan 09's `FILLER_BASELINE`; the guard's measured values are in the course notes below.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Rewrite the 78 programs as distinct, annotated C units with `run.yaml` (compile with `gcc -std=c23 -Wall -Wextra -Werror -o /tmp/main`, then run) and expected output; 8 katas as `before`/`after` units.
- Write the lessons (8,319 words, 28,000 needed): each example gets its five parts; the 31 diagrams stay and the missing ones are added.
- Replace the nonstandard drilling headings (`Retrieval practice`, `Katas`, ...) with the five exact sections at 5,000 words.
- Remove `linux-os` from `FILLER_BASELINE` in the same commit (guard FG2).
- 78 example programs, 8 katas, and a capstone are rewritten from scratch by `swe-developer` (test first); the old sources are reference only.
- Determinism and environment: `getpid()` and `/proc` numbers are never printed; programs print relationships (the child's parent id equals the parent's id) and sorted names. Signals are raised with `raise` or `kill` to self and handled before the next line, with no sleeps. The sandbox has no network, no added capabilities, and a seccomp profile: calls that need privilege (`mount`, `unshare`, `ptrace` of others) are demonstrated as the refusal (`errno` name printed) and the lesson states the sandbox limit. Outputs never contain pids, inode numbers, times, or the host kernel version.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode in a Linux container.
- **Toolchain ids**: `gcc`, `shell` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP8 (C toolchain: standard, sanitizers, seccomp profile), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 3.2 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 10.3 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 19,681 (class L), units authored from scratch 87 (class XL), reading edits 78 (class M). Every unit counts as fresh because the course is in plan 09's baseline.
- **Agent packets**: authoring split by learning page and by blocks of at most 15 examples, units by `swe-developer` in blocks of 10 (test first), then one packet per remaining defect group.
- **CI weight**: about 10.3 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 3**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `system-programming` (wave 8).

## Prerequisite re-check

- Plan 02 result: Kept: `just-enough-c`, `just-enough-bash`.
- No prerequisite of this course is in this plan's 34; readiness (CP-0) has nothing to wait for.
- Prerequisites outside this plan (unchanged here): `just-enough-c`, `just-enough-bash`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: no in-plan prerequisite; spikes SP8, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `linux-os` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE linux-os by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): the packets above. Classes: DC2, DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12, DC13, DC16. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 87 units authored; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-2b Filler baseline (plan 09): in this course's commit, remove `linux-os` from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one; leave `REWRITTEN_FILLER_COURSES` alone (decision D12); `FILLER` exits 0 and the course's row shows no fired rule with no baseline help.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `linux-os` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `linux-os` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): rewrite linux-os course and leave the filler baseline` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, plus the two baseline edits (the entry and the cap), and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: The course leaves the filler baseline in the commit that fixes it; every unit is a distinct program (guard FG2 passes).

## Accuracy notes

- Syscall semantics are checked against the man-pages project and the kernel version the catalog image reports (printed once into an evidence file, never into a course file).
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/linux-os/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Hello with write" to "List mounts".
- **co-02 · intermediate** — examples 27–54 (28): from "Basic pipe" to "Read signals as descriptors".
- **co-03 · advanced** — examples 55–78 (24): from "Mini shell" to "Capstone process tour".

## Lineage

- Follows the C and Bash primers; prepares system programming and networking.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 14 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 13 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 13 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
