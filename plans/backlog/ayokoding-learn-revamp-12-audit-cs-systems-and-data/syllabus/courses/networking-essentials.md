# Networking Essentials

**Course ID**: `networking-essentials` · **Format**: By Example · **Category**: systems-and-networking.

**Scope note**: Audits and fixes the existing `networking-essentials` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `advanced-networking` keeps TLS, proxies, and overlays; `distributed-systems` keeps failure across machines; this course keeps addressing, DNS, TCP, HTTP, and sockets. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Follow a request from URL to response through DNS, TCP, and HTTP.

## Why this exists · the big idea

- **The problem before the solution**: none of its 82 examples is run by any check (0 `run.yaml`); 180 fences and output blocks without an anchor; a drilling page of 4,579 words; 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: A web page is a chain of lookups and conversations; each example performs one step (DNS, TCP, HTTP) against a program on the loopback address.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-python`.
- **Edges plan 02 removes**: `backend-essentials`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each step can be run and observed; 82 examples already follow By Example pace.
- **Wave**: 6 (slot 2); **size class**: L (words to write 421, units authored 8); **expected defect classes**: 8 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                   | Target                                                                                                                                                                                   | Work                                                                               |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 55,329                                                                                                            | at least 28,000                                                                                                                                                                          | none (floor met)                                                                   |
| Examples                                                                     | 82 as `### Example N`                                                                                             | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                               |
| Mermaid diagrams                                                             | 37                                                                                                                | 30 to 50                                                                                                                                                                                 | none                                                                               |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 106 and 86 (for 82 examples)                                                                                      | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 23 of the 106 blocks found into 50 to 100 words (median 79; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.15; 19 below 1.0; 6 above 2.25 (of 82 units)                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 25 to fix                                                                          |
| Code fences and anchors                                                      | 189 non-diagram fences; 90 code fences unanchored                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 90 to anchor                                                                       |
| Lesson-to-file anchors (plan 05's method)                                    | 4 path anchors: 4 resolve to a file, of which 0 differ from it; 0 missing                                         | every anchor matches its file                                                                                                                                                            | none                                                                               |
| Output blocks                                                                | 90 unanchored                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | 90 to anchor                                                                       |
| Harness units                                                                | 82 example folders, 0 kata folders in `drilling/code`, 126 code files, 0 `run.yaml`                               | 82 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 82 existing folders                                    |
| Drilling page                                                                | 4,579 words; 4 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 421 words short; fix sections                                                      |
| Katas                                                                        | 0                                                                                                                 | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                                                         |
| Accuracy-note files and verification tags                                    | files: 1; tags: 0                                                                                                 | none; the facts sit in References                                                                                                                                                        | convert to References                                                              |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                           | present, one bullet per example                                                                                                                                                          | none                                                                               |
| Frontmatter                                                                  | `format` by-example, `category` systems-and-networking, `description` from plan 03; `estimatedHours` snapshot 7   | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 90 code fences and 90 output blocks carry no anchor.
- **DC6** 23 of 106 "Why It Matters" blocks outside 50 to 100 words (median 79; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 82 units): median 1.15, 19 units below 1.0, 6 above 2.25.
- **DC10** 4 of 5 exact `##` sections (found: Recall Q&A, Applied problems, Code katas, Self-check checklist); 4,579 drilling words, 421 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 12, sleeps: 14, thread/goroutine/process uses: 18, subprocess uses: 1, environment/pid reads: 3, hash-order prints: 15.
- **DC13** Scan hits (approximate): network calls: 73, file-system uses: 1, Linux-only calls: 1.
- **DC14** Leftover accuracy-note files: 1; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Rewrite the environment-bound units (the 38 `command.sh` units, and those of the 47 Python files that use sockets or HTTP clients which reach a real host; CP-1 sorts the loopback-ready files from the rest) as loopback, fixture, or model units; keep each example's concept.
- Anchor the 90 unanchored code fences and 90 output blocks; write 8 katas; add the fifth drilling section and 421 drilling words.
- Replace real IP addresses and hostnames in output with documentation ranges.
- Raise annotation in the 25 units outside the band (median 1.15): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 23 of the 106 "Why It Matters" blocks found (median 79 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: Examples that call the public internet (`curl https://...`, `dig`, `traceroute`) cannot run under `--network none`. They become (a) a server and client in one container on `127.0.0.1` with the port chosen by the test and never printed, (b) a recorded capture or DNS response stored as a fixture file that a program parses, or (c) a model. Real hostnames are replaced by documentation names (`example.com`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) in every expected file (decision D7).
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode on loopback with fixtures and models.
- **Toolchain ids**: `python`, `shell` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP7 (loopback networking and throwaway TLS keys under `--network none`), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.8 s per container invocation × 2 executions × 101 runs (82 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.4 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Packet loss, retransmission, window growth, and DNS cache expiry (about 12 of 82) run on a virtual network model with a virtual clock and seeded loss.
- **Invariants** (checked after every step):
  - The byte stream a receiver delivers equals the byte stream the sender sent, in order, under any seeded loss, duplication, or reordering of segments.
  - Sequence numbers never decrease for new data; the congestion window is never below one segment.
  - A DNS answer is served from cache until its TTL on the virtual clock elapses and never afterwards.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 421 (class S), units authored from scratch 8 (class S), reading edits 48 (class M). Raised by a documented override: about 86 environment-bound units are rewritten as loopback, fixture, or model units.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 9.4 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 6**, slot 2. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `distributed-systems` (wave 8), `advanced-networking` (wave 10).

## Prerequisite re-check

- Plan 02 result: Added: `just-enough-python`; Removed: `backend-essentials`.
- No prerequisite of this course is in this plan's 34; readiness (CP-0) has nothing to wait for.
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: no in-plan prerequisite; spikes SP7, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `networking-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE networking-essentials by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC6, DC7, DC10, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 82 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `networking-essentials` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `networking-essentials` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit networking-essentials course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No expected file contains a real public address, a hostname other than a documentation name, a port number chosen by the OS, or a time.

## Accuracy notes

- Protocol facts (TCP RFC 9293, DNS, HTTP semantics RFC 9110, HTTP/3 RFC 9114) are cited with RFC numbers and checked against rfc-editor.org.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/networking-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "curl a URL" to "Resolve, Then curl by IP".
- **co-02 · intermediate** — examples 29–60 (32): from "TCP Echo Server" to "Resolve a Hostname to an IP Address in Python".
- **co-03 · advanced** — examples 61–82 (22): from "http.client -- a GET Request via the Standard Library" to "A Full DNS -> TCP -> HTTP Explorer, with a UDP Contrast Note".

## Lineage

- Follows the Python primer; prepares advanced networking, distributed systems, and backend courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 32 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 28 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 26 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
