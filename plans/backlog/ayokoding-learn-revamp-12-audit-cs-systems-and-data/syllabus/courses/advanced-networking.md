# Advanced Networking

**Course ID**: `advanced-networking` · **Format**: Annotated Concept · **Category**: systems-and-networking.

**Scope note**: Audits and fixes the existing `advanced-networking` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `networking-essentials` keeps DNS, TCP, and HTTP basics; `system-design` keeps load estimation and building blocks; this course keeps TCP behaviour, TLS 1.3, HTTP/2 and 3, proxies, namespaces, and WireGuard. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Debug real network problems with load balancers, proxies, and TLS.

## Why this exists · the big idea

- **The problem before the solution**: none of its 62 examples is run by any check (0 `run.yaml`); 85 fences and output blocks without an anchor; 0 of 5 katas.
- **Keep-this-if-you-forget-everything**: Production network problems live in TLS, proxies, load balancers, and tunnels; each worked example reads a trace or a handshake and says what it proves.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `networking-essentials`, `just-enough-python`.
- **Edges plan 02 removes**: `build-your-own-orm-and-query-builder`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Most worked examples are annotated traces and diagrams; 62 worked examples exist (floor 45). The mode follows plan 03 (decision D11).
- **Wave**: 10 (slot 2); **size class**: L (words to write 0, units authored 28); **expected defect classes**: 8 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                                              |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 49,227                                                                                                                                                          | at least 22,000                                                                                                                                                                          | none (floor met)                                                                  |
| Examples                                                                     | 62 as `### Example N`                                                                                                                                           | at least 45, as `### Worked Example N: Title`, numbered 1 to N without gaps                                                                                                              | rename 62 headings to `### Worked Example N: Title`                               |
| Mermaid diagrams                                                             | 19                                                                                                                                                              | at least 10                                                                                                                                                                              | none                                                                              |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 66 and 67 (for 62 examples)                                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 20 of the 66 blocks found into 50 to 100 words (median 53; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.33; 3 below 1.0; 14 above 2.25 (of 39 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 17 to fix                                                                         |
| Code fences and anchors                                                      | 87 non-diagram fences; 43 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | 43 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                                  | every anchor matches its file                                                                                                                                                            | none                                                                              |
| Output blocks                                                                | 42 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 42 to anchor                                                                      |
| Harness units                                                                | 39 example folders, 0 kata folders in `drilling/code`, 67 code files, 0 `run.yaml`                                                                              | at least 27 code-bearing worked examples as example units (plan 06's 60 percent rule, adopted by plan 11), 5 kata units, 1 capstone unit, each with a `run.yaml`                         | author about 28; convert the 39 existing folders                                  |
| Drilling page                                                                | 6,459 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                     |
| Katas                                                                        | 0                                                                                                                                                               | at least 5 as `before`/`after` units in `drilling/code`                                                                                                                                  | 5 to write                                                                        |
| Accuracy-note files and verification tags                                    | files: 2; tags: 0                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                                                             |
| Frontmatter                                                                  | `format` annotated-concept, `category` systems-and-networking, `description` from plan 03; `estimatedHours` snapshot 5                                          | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 43 code fences and 42 output blocks carry no anchor.
- **DC5** 62 headings use `### Example N`, but the Annotated Concept convention and plan 11's completion test need `### Worked Example N: Title`.
- **DC6** 20 of 66 "Why It Matters" blocks outside 50 to 100 words (median 53; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 39 units): median 1.33, 3 units below 1.0, 14 above 2.25.
- **DC11** 0 katas; the floor is 5 (5 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 4, sleeps: 11, thread/goroutine/process uses: 7, subprocess uses: 1, environment/pid reads: 1.
- **DC13** Scan hits (approximate): network calls: 26, Linux-only calls: 2.
- **DC14** Leftover accuracy-note files: 2; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Rewrite the 26 `command.sh` units and any Python unit that reaches a real host; add units for code-bearing worked examples that have none (23 of 62 have no unit today); write 5 katas.
- Rename the 62 `### Example N` headings to `### Worked Example N: Title` (the convention and plan 11's completion test need that form); keep the `vpn-and-overlay.md` page as the fifth worked-example page.
- Replace real addresses and hostnames with documentation names; remove 2 leftover accuracy-note files into References.
- Raise annotation in the 17 units outside the band (median 1.33): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 20 of the 66 "Why It Matters" blocks found (median 53 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: 26 of the 39 unit folders hold `command.sh` and a recorded `output.txt` from real hosts (the other 13 are Python files): they use `tcpdump`, `dig`, `curl` to public sites, `traceroute`, and `wg`, which need the network, privilege, or tools the sandbox lacks. Each becomes (a) a loopback client and server (including TLS 1.3 with a throwaway key made inside the unit; the output carries protocol facts only, never key bytes, serial numbers, or dates, and SP7 decides between a key made at run time and a documented test-only key pair kept as a fixture), (b) a captured trace stored as a fixture and parsed by a program, or (c) a model. The recorded `output.txt` files are never used as expected files unless the unit reproduces them.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode on loopback with fixtures and models.
- **Toolchain ids**: `python`, `shell` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP7 (loopback networking and throwaway TLS keys under `--network none`), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 3.0 s per container invocation × 2 executions × 75 runs (62 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 7.5 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: TCP flow control, congestion control, QUIC loss recovery, and the WireGuard handshake state (about 10 of 62) run on a virtual network model.
- **Invariants** (checked after every step):
  - A TCP receiver's advertised window never exceeds its free buffer; the sender never has more than the window in flight.
  - Under seeded loss the delivered byte stream equals the sent stream.
  - A congestion window follows the stated increase and decrease rule at every step.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 28 (class M), reading edits 37 (class S). Raised by a documented override: 39 environment-bound units are rewritten and about 23 units are added.
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 7.5 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 10**, slot 2. Maker: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps; fixer: `tutorial-annotated-concept-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `system-design` (wave 11).

## Prerequisite re-check

- Plan 02 result: Added: `networking-essentials`, `just-enough-python`; Removed: `build-your-own-orm-and-query-builder`.
- In-plan prerequisites are audited first: `networking-essentials` (wave 6).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `networking-essentials` are DONE in the ledger; spikes SP7, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `advanced-networking` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE advanced-networking annotated-concept` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC5, DC6, DC7, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 28 units authored and the 39 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `advanced-networking` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `advanced-networking` (`annotated-concept`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit advanced-networking course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No lesson shows a trace that the unit cannot reproduce; recorded captures are named as fixtures and their origin is stated.

## Accuracy notes

- TLS 1.3 (RFC 8446), HTTP/2 (RFC 9113), HTTP/3 and QUIC (RFC 9114, RFC 9000), and WireGuard protocol statements are checked against their RFCs or the WireGuard whitepaper on the execution date.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/advanced-networking/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–16 (16): from "OSI Layer Mapping -- Annotating a curl -v Trace" to "Well-Known Ports Review".
- **co-02 · intermediate** — examples 17–36 (20): from "TCP Window Scaling -- Locating wscale in a Live Capture" to "HTTP/3 -- Attempting QUIC with curl".
- **co-03 · advanced** — examples 37–55 (19): from "QUIC vs. TCP -- Head-of-Line Blocking, Contrasted Stream by" to "Mutual TLS -- Both Sides Present and Verify a Certificate".
- **co-04 · vpn-and-overlay** — examples 56–62 (7): from "WireGuard -- Generating Keys and Bringing Up a Real Two-Peer" to "WireGuard vs. OpenVPN vs. IPsec -- a Decision Artifact".

## Lineage

- Follows Networking Essentials; prepares system design and site reliability work.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 96 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 92 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 77 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
