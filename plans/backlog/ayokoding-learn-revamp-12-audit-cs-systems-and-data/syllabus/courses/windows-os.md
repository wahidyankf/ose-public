# Windows OS

**Course ID**: `windows-os` · **Format**: By Example · **Category**: systems-and-networking.

**Scope note**: Audits and fixes the existing `windows-os` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `linux-os` is the Linux counterpart; the Windows app development course is plan 13's. This course keeps processes, threads, handles, the registry, services, and PowerShell. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course. Because plan 09's filler guard lists the course, the fix also removes its baseline entry in the same commit.

**Short summary**: Learn the Windows object-and-handle model through Win32 C and PowerShell.

## Why this exists · the big idea

- **The problem before the solution**: none of its 78 examples is run by any check (0 `run.yaml`); 10,406 words against a floor of 28,000; plan 09's filler guard flags it (FG2, FG3, and FG6; unique-code ratio 0.18; near-duplicate share 0.73; repeated-paragraph share 0.68); 78 of 78 code units below the annotation band (median 0.57); a drilling page of 394 words.
- **Keep-this-if-you-forget-everything**: Windows hands you handles, not file descriptors; each example shows the object model through Win32 C or PowerShell.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-c`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each concept is a Win32 call or a PowerShell command; the sources cannot run in a Linux container, and guard FG2, FG3, and FG6 flag the course as templated.
- **Wave**: 12 (slot 1); **size class**: XL (words to write 17,594, units authored 87); **expected defect classes**: 10 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                              | Target                                                                                                                                                                                   | Work                                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 10,406                                                                                                                                       | at least 28,000                                                                                                                                                                          | 17,594 to write                                                                   |
| Examples                                                                     | 78 as `### Example N`                                                                                                                        | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                              |
| Mermaid diagrams                                                             | 32                                                                                                                                           | 30 to 50                                                                                                                                                                                 | none                                                                              |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 78 and 78 (for 78 examples)                                                                                                                  | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 78 of the 78 blocks found into 50 to 100 words (median 46; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 0.57; 78 below 1.0; 0 above 2.25 (of 78 units)                                                                                        | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 78 to fix                                                                         |
| Code fences and anchors                                                      | 1 non-diagram fences; 1 code fences unanchored                                                                                               | every code fence anchored or marked as an illustration                                                                                                                                   | 1 to anchor                                                                       |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                               | every anchor matches its file                                                                                                                                                            | none                                                                              |
| Output blocks                                                                | 0 unanchored                                                                                                                                 | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                                              |
| Harness units                                                                | 78 example folders, 0 kata folders in `drilling/code`, 93 code files, 0 `run.yaml`                                                           | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 87                                                                   |
| Drilling page                                                                | 394 words; 0 of 5 exact `##` sections; headings: 1. Recall Q&A, 2. Applied Scenarios, 3. Code Katas, 4. Self-check Checklist, 5. Explain Why | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,606 words short; fix sections                                                   |
| Katas                                                                        | 0                                                                                                                                            | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                                                        |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                            | none; the facts sit in References                                                                                                                                                        | none                                                                              |
| `## Examples by Level` in `learning/overview.md`                             | absent (CRITICAL)                                                                                                                            | present, one bullet per example                                                                                                                                                          | add (regenerate with the index command)                                           |
| Frontmatter                                                                  | `format` by-example, `category` systems-and-networking, `description` from plan 03; `estimatedHours` snapshot 4                              | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |
| Filler guard (plan 09)                                                       | in `FILLER_BASELINE`: FG2, FG3, and FG6 (unique-code ratio 0.18; near-duplicate share 0.73; repeated-paragraph share 0.68)                   | no entry; guard passes with no baseline help                                                                                                                                             | remove the entry in this course's commit                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 1 code fences and 0 output blocks carry no anchor.
- **DC5** `learning/overview.md` has no `## Examples by Level` section (CRITICAL when absent).
- **DC6** 78 of 78 "Why It Matters" blocks outside 50 to 100 words (median 46; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 78 units): median 0.57, 78 units below 1.0, 0 above 2.25.
- **DC9** 10,406 words; the floor is 28,000 (17,594 short).
- **DC10** 0 of 5 exact `##` sections (found: 1. Recall Q&A, 2. Applied Scenarios, 3. Code Katas, 4. Self-check Checklist, 5. Explain Why); 394 drilling words, 4,606 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): thread/goroutine/process uses: 3.
- **DC13** Scan hits (approximate): Windows-only calls: 90, sources cannot run in a Linux container (static mode).
- **DC16** Listed in plan 09's `FILLER_BASELINE`; the guard's measured values are in the course notes below.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Rewrite the 78 units as distinct programs that compile or parse; write the lessons (10,406 words, 28,000 needed) with an explicit statement of what the static run proves.
- Replace the numbered drilling headings with the five exact sections; add 8 katas as static `before`/`after` units (the `before` is a compile error or a parse error with the expected diagnostic) and 5,000 drilling words.
- Remove `windows-os` from `FILLER_BASELINE` in the same commit (guards FG2, FG3, FG6).
- 78 example units, 8 katas, and a capstone are rewritten from scratch (the C sources are templated); output shown in a lesson is labelled as a sample from a named Windows build, never as a harness result.
- Determinism and environment: Because nothing runs, lessons that show an `**Output**` block must say it is a recorded sample, with the Windows version and date, kept in a `sample/` expected file that the static run does not compare. Real Windows behaviour is checked by reading, not by the harness.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Static mode, reason `windows`.
- **Toolchain ids**: `windows-static` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP11 (Windows static mode), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 0 fences (every unit compiles or parses, so nothing is a pure illustration).
- **CI cost** (planning figure, replaced by the SP12 measurement): about 3.5 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 11.3 minutes.

## Static mode

- **Reason**: `windows` (plan 05's decision D12).
- **What the run proves**: The Win32 C units compile with the MinGW cross compiler (`x86_64-w64-mingw32-gcc -fsyntax-only` with the Windows headers) and the PowerShell units parse with the PowerShell parser; neither is executed. The run proves the code is well formed against the Windows API declarations, not what it prints on Windows.
- **Flag**: Plan 05's decision D12 extends static mode to Windows. Phase 0 confirms the merged schema accepts `reason: windows` and the default validators (SP11).

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 17,594 (class L), units authored from scratch 87 (class XL), reading edits 156 (class L). Every unit counts as fresh because the course is in plan 09's baseline.
- **Agent packets**: authoring split by learning page and by blocks of at most 15 examples, units by `swe-developer` in blocks of 10 (test first), then one packet per remaining defect group.
- **CI weight**: about 11.3 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 12**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `just-enough-c`.
- No prerequisite of this course is in this plan's 34; readiness (CP-0) has nothing to wait for.
- Prerequisites outside this plan (unchanged here): `just-enough-c`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: no in-plan prerequisite; spikes SP11, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `windows-os` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE windows-os by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): the packets above. Classes: DC2, DC3, DC5, DC6, DC7, DC9, DC10, DC11, DC12, DC13, DC16. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 87 units authored; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Static mode: every unit compiles or parses with the default validator; no lesson presents a static run as proof of runtime behaviour.
- [ ] CP-2b Filler baseline (plan 09): in this course's commit, remove `windows-os` from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one; leave `REWRITTEN_FILLER_COURSES` alone (decision D12); `FILLER` exits 0 and the course's row shows no fired rule with no baseline help.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `windows-os` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `windows-os` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): rewrite windows-os course and leave the filler baseline` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, plus the two baseline edits (the entry and the cap), and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: The course leaves the filler baseline in the commit that fixes it, and no lesson presents a static run as proof of runtime behaviour.

## Accuracy notes

- Win32 declarations, PowerShell 7 cmdlet names, and registry paths are checked against Microsoft Learn on the execution date; every API claim carries a source and date in References.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/windows-os/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Win32 Hello" to "PowerShell Registry Read".
- **co-02 · intermediate** — examples 27–54 (28): from "Create a Mutex" to "Close Every Handle".
- **co-03 · advanced** — examples 55–78 (24): from "Process and Two Threads" to "Windows OS Tour Capstone".

## Lineage

- Counterpart of Linux OS; prepares the Windows application course (plan 13).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 15 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
