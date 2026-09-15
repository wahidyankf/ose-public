# 🛠️ Correction-Unit Execution Record: Iteration `@01`

Phase 6 execution record for correction iteration `@01`.

## Why This Iteration Exists

Phase 6 was first recorded **not applicable**, and that disposition was correct on the evidence
available at the time: both Phase 5 journeys passed with zero documentation defects, so there was
nothing to correct and no branch or PR was created.

Phase 7 then did its job. Two of its items independently routed defects back here:

- **P7-005** cross-read the repeated repository-wide claims and found `CONTRIBUTING.md` teaching a
  native-Windows setup path that the recorded platform contract forbids.
- **P7-003** ran two strict read-only checkers, which converged on that same defect and surfaced a
  second one neither the journeys nor the cross-read had caught: `CONTRIBUTING.md` never names the
  Rust/Cargo prerequisite that `npm install` depends on.

This iteration is that loopback. It gets its own branch, its own PR, and this record, per the phase
preamble's rule that a merged unit is never reused.

- **Branch**: `docs/repository-onboarding-corrections`
- **Base**: `origin/main` at `1542ea044`
- **Opened**: 2026-08-21

## Correction Rows

Each row is one exact defect, its source, and what was changed. No row bundles two defects.

| ID   | Source         | Severity | File                                           | Defect                                                                                                    | Correction                                                                                                                        |
| ---- | -------------- | -------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | P7-005, P7-003 | HIGH     | `CONTRIBUTING.md`                              | A `**Windows**:` heading plus "Download the installer from volta.sh" — a native-Windows setup path.       | Replaced with the contract's three-state platform sentence (macOS/Ubuntu supported, WSL2 unverified, native Windows unsupported). |
| C-02 | P7-003         | HIGH     | `CONTRIBUTING.md`                              | Rust and Cargo never mentioned, though `postinstall` runs `npm run doctor`, which is `cargo run …`.       | Prerequisites now name both toolchains and link the setup guide's rustup instructions.                                            |
| C-03 | P7-003         | MEDIUM   | `CONTRIBUTING.md`                              | Node and npm versions hardcoded in prose, against the repository's own single-source-of-truth rule.       | Replaced with a pointer to the versions pinned in `package.json`.                                                                 |
| C-04 | P7-003         | LOW      | `CONTRIBUTING.md`                              | "Getting Started" lists contributor steps with no in-section signal that intake is closed.                | The section opening now says so and anchors to § External Contributions.                                                          |
| C-05 | P7-003         | MEDIUM   | `CONTRIBUTING.md`                              | "Diátaxis" used twice with no gloss.                                                                      | The first normative use now defines it as a four-category documentation taxonomy.                                                 |
| C-06 | P7-003         | HIGH     | `docs/how-to/setup-development-environment.md` | Quick Start promises "this is all you need", then verifies with `npm run doctor` without installing Rust. | Added the documented rustup step, and reclassified Rust from Full to Minimal so the surrounding text agrees.                      |
| C-07 | P7-003         | LOW      | `docs/how-to/setup-development-environment.md` | Quick Start steps numbered `1, 2, 3, 4, 6` — no content missing, a renumbering slip.                      | Renumbered so the sequence is contiguous.                                                                                         |
| C-08 | P7-003         | MEDIUM   | `README.md`                                    | "WSL2" never expanded on first use, for an audience that includes non-engineers.                          | Expanded once to "WSL2 (Windows Subsystem for Linux 2)", within the 900-word budget.                                              |

**Two LOW findings were deliberately not actioned**, with reasons rather than silence: glossing
Husky and commitlint (that section's readers are already running `npm install` and reading
`package.json`), and the Quick Reference command repetition (an intentional cheat sheet, not
accidental duplication). Neither sits at a severity this program's gates block on.

## Follow-Up Sweep (P6-003B Review Findings)

The independent review of the staged diff found that two corrections had been applied only at the
site the finding named, not across the class — the exact failure mode this program has hit before.
The review's observations were resolved as follows.

**One row in this table was itself false when written, and is corrected below.** The C-03 row
claimed both surviving versions had been swept before commit. They had not: commit `cb489b874`
shipped with four hardcoded version literals still in
`docs/how-to/setup-development-environment.md`, and the sweep that row asserts was scoped to
`CONTRIBUTING.md` only. The commit message and the PR body repeated the same overstatement
("all hardcoded versions are removed"). The PR review caught it; see C-20 for the actual fix and
the corrected claim. The lesson is recorded rather than smoothed over: a sweep verified against
one file is not a class sweep, and stating it as one turned a scoping mistake into a false
gate-pass claim.

| Review finding                                                                                                                     | Severity | Resolution                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-03 half-applied: two more hardcoded versions survived, so the new "can never drift apart" sentence contradicted its own document | MEDIUM   | **This resolution was false as written.** Only `CONTRIBUTING.md` was swept; four literals survived in the setup guide and shipped in `cb489b874`. Corrected in C-20.                                                                               |
| C-06 half-applied: three statements still classified Rust as a Full-setup tool                                                     | MEDIUM   | All three corrected; Rust is now classified Minimal, with the reason (bootstrap runs the Rust tool checker) stated.                                                                                                                                |
| C-05 partial: `Diátaxis` still appeared cold in the project-structure tree                                                         | LOW      | The tree entry now points at the four categories listed directly beneath it.                                                                                                                                                                       |
| Orphaned `**macOS/Linux**:` label left by removing its Windows peer                                                                | LOW      | Block restructured: the platform statement leads, the install command follows unlabelled.                                                                                                                                                          |
| C-04's justification overstated — the closed-intake caveat was already the opening paragraph                                       | LOW      | The row was **corrected rather than defended**: reworded and downgraded MEDIUM → LOW, since the edit adds an in-section signal and an anchor, not a first surfacing.                                                                               |
| README headroom: C-08 consumed 5 of an 8-word budget margin                                                                        | LOW      | Accepted and recorded. `governance word-budget validate` reported 894 words at `cb489b874`; later rows moved it, and it stays under the 900-word fail threshold at every commit in this iteration. Any addition must still name an offsetting cut. |

The review confirmed the two things that most needed confirming: the added rustup command is
byte-identical to the one the same document already teaches in its full-setup section, and no
product or behavioral change is smuggled into this documentation unit.

## Voice Correction Rows (P7-004)

The independent read-aloud pass against the twelve-clause Human Voice Contract failed all five
documents on at least one clause. These rows are its corrections.

| ID   | Clause      | File                 | Defect                                                                                                           | Correction                                                    |
| ---- | ----------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| C-09 | V1          | tutorial             | Three sentences of product definition before the reader's task, the first verbatim from the README.              | Task paragraph now leads; the duplicated sentence is gone.    |
| C-10 | non-clause  | tutorial             | "recognise" — British spelling against an American corpus.                                                       | Aligned to "recognize".                                       |
| C-11 | V3          | `CONTRIBUTING.md`    | Nx and monorepo used cold at an audience directed to fork.                                                       | Both glossed on first use, with a link to Nx.                 |
| C-12 | V9          | `CONTRIBUTING.md`    | `npm install` failure answered only with a cache clean, though the file itself names missing Cargo as a cause.   | Added a missing-Cargo entry with the real route out.          |
| C-13 | V10, V12    | `CONTRIBUTING.md`    | Closed on a bare 🚀 whose celebratory tone fights the closed-intake message, with no next step.                  | Emoji removed; the file now ends on two concrete moves.       |
| C-14 | V9          | setup how-to         | Quick Start runs `source ~/.zshrc` for a path that explicitly invites Ubuntu readers.                            | Now `source ~/.zshrc   # or source ~/.bashrc on Ubuntu`.      |
| C-15 | V8          | setup how-to         | Rust step ended blind while the neighbouring Node step showed expected output.                                   | Added an expected-output line after `rustc --version`.        |
| C-16 | V3          | setup how-to         | "E2E" never expanded.                                                                                            | Expanded on first use.                                        |
| C-17 | non-clause  | setup how-to         | "Two setup paths" above three bullets.                                                                           | Corrected to "Three setup paths".                             |
| C-18 | V8          | `README.md`          | `nx show projects` block stated no outcome.                                                                      | Now says what the list contains, funded by an offsetting cut. |
| C-19 | V3, factual | related-repositories | Table described the private sibling as doing "local CoralPolyp sandbox work" — a codename removed on 2026-08-18. | Row now reads "infrastructure work".                          |

**C-19 is the row worth noting.** It entered as a voice finding about an unexplained term and turned
out to be a staleness defect: the sandbox it named had already been retired, and the comparison table
meant to help a reader choose a repository was describing work that no longer exists. A jargon lens
caught a fact error.

### Declined, With Reasons

| Finding                                                           | Why not actioned                                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| README `🌙` title mark flagged under V10                          | It is the project's brand mark. Removing branding is the owner's decision, not a voice pass's.                                                                                                                                   |
| README V11 — the 386-word local-setup section is not "map" shaped | Reversing it would undo a structure that already passed a maker-checker-fixer cycle and an independent voice review in Phase 3, and the proposed rewrite would cut the file to ~700 words. That is a redesign, not a correction. |
| CONTRIBUTING V2/V5/V8 and reference-page V12 findings             | Real, but they amount to rewriting two long documents wholesale — beyond this plan's File-Impact footprint. Recorded here so a later plan can pick them up.                                                                      |
| Husky/commitlint gloss; Quick Reference repetition                | LOW, and the second is an intentional cheat sheet.                                                                                                                                                                               |

## PR #239 Review Rows (P6-007@01)

Cycle 1 of the PR-review pipeline ran the scout plus eight discipline specialists against
`cb489b874`. It surfaced defects the pre-commit review had missed, including one the pre-commit
review had wrongly reported as fixed. Every row below is a real finding acted on, not a
restatement.

**How to read this section.** It is a chronological log, not a current-state summary. The review
cycles for PR #239 land here, beginning at C-20, and later cycles corrected earlier ones, including
several that corrected a correction. The range deliberately carries no upper bound: naming one made
it false the moment the next row landed, which is how C-50 came to exist. Where a row's fix was
later found wrong, the row says so and names the row that superseded it, rather than being
rewritten to look right. One row, `C-32`, breaks that rule: a misquoted error string in its own
text was corrected in place before the rule was written down. Its marker records what it used to
say.

The authoritative list is the markers themselves, not any prose summary: `grep '\*\*Superseded'`
over this file returns every superseded row. That is deliberate. Hand-written summaries of this same
fact kept being found wrong by a later cycle — among them a row range, a chain count, a chain list,
a claim that every chain was marked, and a duplicate-row count — so the record now points at
something greppable instead of something remembered. The prose here is a reading aid and makes no
completeness claim, including about that list.
**Superseded in part by C-50 and C-51**: those two summaries lived in this preamble, and each
version of it was rewritten when the next cycle found the figure wrong. `C-49`'s and `C-57`'s lived
elsewhere — see C-62 and C-66.

The narrative paragraphs between the tables use the same marker, so the same `grep` surfaces prose
and rows alike. Read a marker as evidence; do not read the absence of one as proof. The rows were
made self-checking a cycle before the prose was, and the first sweep of the prose missed a paragraph
that the next cycle found — see C-59.

The multi-step chains, where a fix was found wrong more than once: C-21 → C-31 → C-32 → C-36
(the Cargo prerequisite wording); C-27 → C-39 → C-44 (the `doctor --scope minimal`
disambiguation); and C-34 → C-37 → C-45 (the breakpoint amendment, then a wrong line-distance
inside the row that fixed it). To read what the branch currently asserts about any of these, read
the last row, not the first.

| Row  | Discipline   | Defect                                                                                                                                                                                     | Severity | Fix                                                                                                                                                                                                                                                                                                    |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-20 | Integrity    | The Follow-Up Sweep claimed the version sweep was complete; four literals still shipped in the setup guide, and the commit message and PR body repeated the claim                          | CRITICAL | All four replaced with commands reading the `package.json` pin; the false row and this record's framing corrected in place rather than quietly amended; PR body corrected                                                                                                                              |
| C-21 | Logic        | New troubleshooting text asserted `npm install` fails without Cargo. `postinstall` is `npm run doctor \|\| true`, so it never fails — verified by running both forms with Cargo off `PATH` | HIGH     | Every site restated: the check is silently skipped, the install still succeeds, and the failure only surfaces at an explicit `npm run doctor`. Fixed in README, CONTRIBUTING ×2, setup guide ×4, tutorial. **Superseded by C-31, C-32, and C-36**, which found this replacement wrong three times over |
| C-22 | Governance   | 34 ticked items from P5B-002 to P7-007 carried no Atomic Sync Ritual evidence block, against 84 that did                                                                                   | HIGH     | Blocks added to all 34; the count now equals the ticked count. **Superseded in part by C-33**, which found two of these 34 backfilled blocks asserted a `Files Changed` their own prose denies                                                                                                         |
| C-23 | Governance   | Evidence captured at 390/768/1440 px; conventions require 375/768/1280 px, and 390 is wider than 375, so the narrowest documented breakpoint was never exercised                           | MEDIUM   | Landing page re-inspected at all three documented widths; no horizontal overflow at any, zero console errors. Recorded as a supplementary capture, not a re-run of either journey                                                                                                                      |
| C-24 | Architecture | The C-18 offsetting cut removed README's only guidance for the changed-port case                                                                                                           | MEDIUM   | Restored, funded by shortening the Rust bullet, which the C-21 rewrite made shorter and more accurate at once                                                                                                                                                                                          |
| C-25 | Architecture | The platform statement had drifted: the setup guide said "not supported or verified" against "neither supported nor verified" elsewhere                                                    | MEDIUM   | Setup guide and tutorial harmonized to the P2-003 contract wording; all four documents now match                                                                                                                                                                                                       |
| C-26 | Docs         | The P7-001 ledger block asserted this file "will never be created" and that `evidence/README.md` comes later, while the same commit created this file and added eight evidence files       | MEDIUM   | Both statements amended to record what was true at the observation point without asserting a future the commit falsifies                                                                                                                                                                               |
| C-27 | Instruction  | "Minimal path" (what you install by hand) collided with `doctor --scope minimal` (which installed tools get inspected), making the linked governance workflow look contradictory           | MEDIUM   | The two senses distinguished in the setup guide; Rust's absence from the flag's set explained rather than treated as an error. **Superseded by C-39 and C-44**, which found this disambiguation misplaced twice                                                                                        |
| C-28 | Security     | `delivery.md` recorded a literal Docker bridge IP                                                                                                                                          | LOW      | Replaced with a placeholder. The address was private and the container destroyed, but the plan's rule has no private-range carve-out                                                                                                                                                                   |
| C-29 | Performance  | The three Phase 5B screenshots are byte-identical to their 5A counterparts                                                                                                                 | LOW      | Kept, with the reason stated: both were rendered by the same host browser against identical page bytes, so the 5B images evidence delivery from the container, not Ubuntu-side rendering                                                                                                               |
| C-30 | Self         | This record cited the README at 897 words                                                                                                                                                  | LOW      | Corrected. The figure is now pinned to a named revision, because an unpinned count goes stale the moment a later row edits the file — which is exactly what happened once before it was caught. **Superseded by C-35**, which found this corrected figure stale too                                    |

### A Gate I Reported Green That Was Not Measured (Cycle 1)

Worth recording because it is the same failure mode as C-20, caught a second time.

Every gate re-run in this iteration reported `md links validate` as "0 failures", derived from
`grep -c '[FAIL]'` over its output. That validator does not emit `[FAIL]` lines. It prints
`Error: found N broken links` and exits non-zero. The grep therefore returned a meaningless zero on
every run, and the non-zero exit code was never read — a green that measured nothing.

Reading it properly: 312 broken links across 110 files, listed as 116 report entries because a file
that breaks links in more than one category is reported once per category. All 110 are under
`plans/done/`, none is a file this branch touches, and each is byte-identical to `origin/main` (110
identical, 0 modified, 0 absent) — so they are a pre-existing archived-plan baseline, matching how the 58 `format:md:check`
failures were classified. The conclusion this iteration reached was right. The method that reached
it was not, and would have reported green just as confidently had the links been broken by this
branch.

The general rule, now applied: assert the exit code first, and confirm a validator actually emits
the token being counted before treating a count of zero as evidence.

### Declined, With Reasons — Cycle 1

| Finding                                                                                       | Why not acted on                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-source the Rust/Cargo rationale and platform statement across the four entry documents | Real duplication, and the drift it predicted did occur (C-25). But Markdown here has no include mechanism, and building one is a different plan. The wording is harmonized instead; the structural fix is deferred. |
| Add Rust to the governance workflow's `scope: minimal` table                                  | Would be wrong. `doctor --scope minimal` inspects already-installed tools, and Cargo built the checker before it ran. The collision is terminological and is fixed in the reader-facing document (C-27).            |
| Sweep the hardcoded versions in the TypeScript style guide                                    | About eight occurrences in a 1,500-line explanation document outside this plan's onboarding reader path. Named here as a deferred follow-up rather than silently widening the delivery unit.                        |
| Recapture the Phase 5A and 5B journeys at the documented breakpoints                          | The environments were torn down at the end of their phases. C-23 closes the coverage gap directly and says plainly what the new capture does and does not evidence.                                                 |

### Cycle 2 Rows (P6-007B@01)

Cycle 2 re-reviewed the remediation commit, with each specialist briefed to verify its own cycle-1
finding rather than re-file it. It found that the C-21 fix — the rewrite of the Cargo prerequisite
wording — was itself wrong in two ways. Recording that plainly: the correction for a false claim
contained two more.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                                                               | Severity | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-31 | Logic      | "The failure only becomes visible when you run `npm run doctor`" is too narrow. `npm install` also runs `prepare: husky`, and `.husky/pre-commit` runs under `set -e` calling `rhino-bin.sh`, which runs `cargo build` with no `\|\| true` — so a missing Cargo hard-blocks the first `git commit` and `git push`                    | HIGH     | Every site now names the Git-hook failure alongside `npm run doctor`. Verified by running the hook shim with Cargo off `PATH`: exit 127, not a warning                                                                                                                                                                                                                                                                                                                   |
| C-32 | Logic      | "Silently skipped" is wrong twice over: the `cargo: command not found` line **is** printed in `npm install` output, and the check was attempted and failed rather than skipped — only the exit code was discarded. It also contradicted this program's own adjacent issue title, which correctly said `npm install` prints the error | MEDIUM   | Replaced everywhere with the precise mechanism: the check runs, prints the error, and fails, while `npm install` discards the exit code and still reports success. **Superseded by C-36**, which found this row's own quoted error string backwards. That string was corrected in place at `9529a117d`, where this row read `command not found: cargo` — the one row in this file rewritten rather than marked, recorded here because the preamble says it never happens |
| C-33 | Governance | The script that backfilled the 34 evidence blocks asserted `Files Changed` for `P6-001A` and `P6-002` that their own adjacent prose flatly denies — both items record "not applicable" and "no file was changed in this phase". A fabricated record inside the fix for missing records                                               | HIGH     | Both corrected to "None inside the repository", with a note that the work happened later in iteration `@01`. A sweep now checks every not-applicable item for a non-`None` `Files Changed`; it returns 0                                                                                                                                                                                                                                                                 |
| C-34 | Governance | The breakpoint remediation produced conforming new captures but left `P5A-G01` and `P5B-G01` asserting an unqualified all-three-viewport PASS resting on the non-conforming widths, with no cross-reference. A reader of `delivery.md` alone could not discover the gap                                                              | MEDIUM   | Both gates now carry an amendment stating which widths were used, that 390 px is wider than the required 375 px so the narrowest breakpoint went unexercised, that the PASS stands only for what it measured, and where the supplementary capture lives. **Superseded by C-37**, which found this reached too few items                                                                                                                                                  |
| C-35 | Integrity  | The C-30 "corrected" word count was itself stale: it cited 894, the figure at `cb489b874`, but C-24 had since added a word, making the committed figure 895 — the same unmeasured-claim class, inside the fix for it                                                                                                                 | MEDIUM   | The figure is now pinned to a named revision rather than left floating, and the durable claim is the invariant that matters: under the 900-word threshold at every commit in this iteration                                                                                                                                                                                                                                                                              |

Cycle 2 also confirmed the C-20 remediation is complete for the reader-path file set — no version
literal remains in any of the four documents C-20 covered — and that the `volta install` commands
work at the point in the sequence where they now appear. The fifth reader-facing document,
`docs/reference/related-repositories.md`, carries no version literal and was never in that scope.

### Cycle 3 Rows (P6-007C@01)

Cycle 3 re-reviewed the cycle-2 remediation, briefed to hunt for a third generation of the same
failure — a false claim inside the fix for the second-order one. It did not find one: the integrity
specialist re-derived every figure in C-33 through C-35 against the committed tree, including
running the real `governance word-budget validate` binary at all three commits on this branch, and
each checked out. What it did find is a wrong quotation and two rendering or record defects.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                                           | Severity | Fix                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-36 | Logic      | The C-32 rewrite quoted the missing-Cargo error backwards as `command not found: cargo`, at both CONTRIBUTING.md sites and in C-32's own row. That is zsh's interactive phrasing; npm's default script shell is `/bin/sh` and the Husky shims are `sh`, which emit `cargo: command not found`                    | HIGH     | All three sites corrected. Reproduced first: `env -i PATH=<node and npm dirs> npm run doctor` prints `sh: cargo: command not found` and exits 127. The adjacent volta entry was left alone at this point, because volta is typed interactively where zsh does emit that order; C-43 below later removed its quoted string entirely, on the separate ground that two adjacent orders read as a typo |
| C-37 | Governance | `P5B-005` called 390x844/768x1024/1440x900 "all three mandated viewports" and `P5B-005A` called them "mandated breakpoints". The gate-level amendment landed in cycle 2 sat 175 and 148 lines later respectively, so a reader meeting these items first got an affirmatively false claim, not an unqualified one | MEDIUM   | Both phrases corrected, and the same amendment now appears on `P5A-006`, `P5A-006A`, `P5B-005`, and `P5B-005A`, not only on the two gates. The evidence filenames keep 390/1440 deliberately: renaming them to 375/1280 would misdescribe the images' own bytes. **Superseded in part by C-45**, which found the line distances in this row wrong                                                  |
| C-38 | Docs       | A blank line after the C-32 row terminated the cycle-2 table, leaving C-33 through C-35 as a header-less pipe block that GFM parses as a paragraph. It would have rendered on GitHub as literal pipe characters — inside the rows documenting this program's own corrections                                     | MEDIUM   | Blank line removed. Worth noting that no gate catches this: markdownlint reports 0 errors and Prettier reports the file already conforms, because without a delimiter row neither tool sees a table at all                                                                                                                                                                                         |
| C-39 | Docs       | The `doctor --scope minimal` disambiguation added in cycle 1 introduced a flag this document never demonstrates, in the Overview, before the reader has run `doctor` even once                                                                                                                                   | LOW      | Trimmed to a single clause. The disambiguation is kept, because the cycle-1 concern was real; the tangential aside about why Rust is absent from that flag's set is dropped. **Superseded by C-44**, which found the trim left the placement problem untouched                                                                                                                                     |
| C-40 | Docs       | The Desktop 1280px row in `evidence/phase-6-breakpoint-coverage.txt` broke the table's column alignment                                                                                                                                                                                                          | LOW      | The whole column widened to fit the longest label. Not gated — the file is `.txt`, so no Markdown formatter reads it                                                                                                                                                                                                                                                                               |

Cycle 3 also confirmed, by direct reproduction rather than reading, that the Git-hook exit code is
genuinely preserved end to end: Husky's dispatcher runs the hook as a child process, captures its
exit status, and re-exits with it; each shim runs under `set -e` with no `|| true`; and
`rhino-bin.sh` runs under `set -euo pipefail` and `exec`s the binary. It
found one nuance that does not change any shipped claim: `rhino-bin.sh` skips the Cargo build when
a fresh gate binary already exists, so a contributor who has built before would not see the block —
but every document making the claim is describing a first-time clone, where no such binary can
exist. **Superseded in part by C-41**: the first sentence above originally said the dispatcher
`exec`s the hook, which it does not — only `rhino-bin.sh` ends in a real `exec`. The conclusion
about the exit code survives the correction; the mechanism named was wrong when written.

### Cycle 4 Rows (P6-007D@01)

The governance specialist returned zero findings — the first clean verdict of this PR — and endorsed
the declined rename by quoting the convention clauses that do and do not require it. The other two
specialists found four defects, including the fourth-generation false claim cycle 3's own narrative
had introduced.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                        | Severity | Fix                                                                                                                                                                                                                                                                                                                     |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-41 | Integrity  | The Cycle 3 narrative claimed "Husky's dispatcher execs the hook" inside a sentence boasting direct reproduction. `.husky/_/h` runs `sh -e "$s"` as a child, captures `$?`, and calls `exit $c` — fork and wait, the opposite of `exec`. Only `rhino-bin.sh` genuinely `exec`s                | MEDIUM   | Reworded to the mechanism that is actually there. The conclusion the sentence supports is unaffected: fork-wait-`exit $c` propagates the status exactly as `exec` would, so the reader-facing claim about `git commit` still holds                                                                                      |
| C-42 | Docs       | The breakpoint amendment reached six leaf items but never the `P5-G01` rollup, which still summarized both journeys as an unqualified PASS with zero documentation defects. A reader who stops at the rollup — the natural stopping point — would never learn of the gap                      | MEDIUM   | The rollup now carries its own amendment, stating both that the PASS verdicts stand and that the coverage gap is real, and distinguishing a gap in this plan's execution from a defect in the product documentation. **Superseded by C-46**, which found that distinction argued from a label rather than a measurement |
| C-43 | Docs       | Correcting the cargo error string left two adjacent troubleshooting entries quoting shell errors in opposite word orders. Both are accurate — volta is typed interactively under zsh, cargo comes from `/bin/sh` inside an npm script — but that justification lived only in a commit message | LOW      | The volta entry no longer quotes a shell-specific string at all, so the false parallel disappears rather than being explained away                                                                                                                                                                                      |
| C-44 | Docs       | The trimmed `doctor --scope minimal` aside still named a flag the document never demonstrates, in the Overview, before the reader has run the checker once. Two independent docs passes flagged the same placement                                                                            | LOW      | Moved to the Related Documentation entry for the workflow that actually defines `scope: minimal`, which is the only place a reader meets the colliding term. The disambiguation survives; the digression does not                                                                                                       |

One imprecision survives in a place that cannot be corrected: the pushed commit message for
`ab0dc7b4c` says the false "mandated" claim sat "150 lines before the caveat". The real distances
at the parent commit are 175 lines for `P5B-005` and 148 for `P5B-005A`, so the figure describes
neither. Amending a pushed message is not worth a force-push. The `C-37` row above carried the
same wrong figure and _was_ correctable, so it now states both distances.
**Superseded in part by C-45**: a first pass at this disclosure named only the commit message, which
implied the error was confined to somewhere unreachable when half of it was sitting in editable
document text.

### Cycle 5 Rows (P6-007E@01)

Two findings, one from each specialist, and both are about the same thing: a claim that sounded
better than the fact underneath it. Four of the five reader-facing documents came back clean — after
five rounds of patching, the docs specialist read `README.md`, `CONTRIBUTING.md`, the setup guide,
and the tutorial end to end and found no accumulated incoherence, no contradiction between them, and
no ordering defect. `docs/reference/related-repositories.md` was not named in that brief and was not
part of that pass; the first end-to-end read covering all five was the Cycle 8 coherence pass.
**Superseded in part by C-58**: this paragraph originally said "the reader-facing documents
themselves came back clean", generalizing a four-document read to the whole set. The commit message
for `9810e71bd` carries the same unqualified claim and cannot be amended.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                                                                | Severity | Fix                                                                                                                                                                                                          |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-45 | Integrity  | The Cycle 4 disclosure said the wrong "150 lines" figure lived in a pushed commit message and was not worth a force-push. True but incomplete: the identical figure also sat in `C-37`'s own row, ordinary editable text in a file that same commit was rewriting. Disclosing only the unreachable half made the error look unfixable | MEDIUM   | `C-37` now states both real distances, 175 and 148, and the disclosure says plainly that a first pass named only the commit message. The two figures were re-derived at `9529a117d`: 1840−1665 and 1840−1692 |
| C-46 | Docs       | The new `P5-G01` rollup amendment said the coverage gap "is a coverage gap in this plan's own execution, not a defect in the product documentation, which is why it does not change either verdict". A category label cannot license an unchanged verdict — only a measurement can, and the amendment never gave one                  | MEDIUM   | Rewritten to lead with the measurement: the supplementary capture found no horizontal overflow and a correct `<h1>` at 375, 768, and 1280 px, and that result is what leaves the verdicts standing           |

### Cycle 6 Rows (P6-007F@01)

Both cycle-5 remediations came back verified. The rollup's measured result was checked against
`evidence/phase-6-breakpoint-coverage.txt` word for word and matches exactly; `C-45`'s arithmetic
was re-derived; and `C-37`'s "175 and 148 respectively" was checked for a transposed binding, which
would itself have been a new false claim. It binds correctly. The reader-facing documents were
untouched by that commit and re-confirmed unchanged.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                            | Severity | Fix                                                                                                                                                                         |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-47 | Integrity  | `C-42` still asserted, in the present tense, that the rollup amendment works by "distinguishing a gap in this plan's execution from a defect in the product documentation" — the exact framing `C-46`, in the same commit, had retired. A reader stopping at `C-42` got the retired justification | MEDIUM   | `C-42` now names `C-46` as its successor. The same sweep found `C-30`, `C-34`, and `C-37` in the same state, so all four gained markers, not only the row the finding named |
| C-48 | Docs       | `A Gate I Reported Green That Was Not Measured` carried no cycle marker while every sibling heading did, and sat after the Cycle 5 rows despite being the section's oldest narrative. A reader working through by cycle would date it five cycles wrong                                           | LOW      | It and `Declined, With Reasons — Cycle 1` moved to their chronological place before the Cycle 2 rows, and the heading is now labelled `(Cycle 1)`                           |

The docs specialist also observed that six cycles of rows had left the section usable as a log but
not as a current-state reference, since several rows were superseded rather than rewritten. That is
the right trade — rewriting them would erase the record this file exists to keep — so the fix is a
`How to read this section` preamble, plus the in-row markers `C-47` added. Claim and markers were
made to agree in both directions: the preamble says every superseded row names its successor, so
every one of them now does. **Superseded in part by C-49, C-51, C-52, C-53 and C-54**: this paragraph
also said the preamble named "all five supersession chains" — it named four, which is `C-49`, and
that sentence lived here rather than in the preamble it described. The agreement it claims held only
for the rows checked at the time; cycle 8 found an unmarked chain and cycle 9 found three more
unmarked rows, which is what eventually moved the completeness claim out of the prose and onto the
markers.

One process note, raised twice by specialists and worth recording. Review cycles ran against pushed
commits while this worktree already carried the next cycle's uncommitted fixes. Every specialist
handled it correctly by reading `git show <sha>:<path>`, and one of them found the `C-42` staleness
that the uncommitted draft happened to already fix. But a reviewer using a plain file read would
have judged unreviewed content. Reviews should run against a clean tree, or the brief should say
plainly that it is not one — as these briefs did from cycle 3 onward.

### Cycle 7 Rows (P6-007G@01)

The first cycle to run against a genuinely clean worktree, closing the process gap cycle 6 recorded.
Governance returned zero findings on a fresh pass over the whole branch diff, confirming from the
convention documents themselves — rather than from first principles — that `artifacts/` is properly
declared in this plan's `tech-docs.md` File-Impact Analysis, that `plans/` sits outside both the
word-budget and README-index gate scopes, and that nothing under `apps/rhino-cli/` or the rhino
specs is touched. Integrity found two defects, both inside the preamble written last cycle to fix
this very class.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                      | Severity | Fix                                                                                                                                                                                                                                                                                                                                            |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-49 | Integrity  | The Cycle 6 narrative said the preamble names "all five supersession chains". It names four. Five is the count of in-row markers — the `C-34 → C-37 → C-45` chain carries two of them but is one chain. A completeness claim, miscounted, inside the fix for miscounted completeness claims | MEDIUM   | Corrected to four at the time; C-51 later removed the count altogether. The same wrong figure is in the pushed `0db7beda2` message and stays there, disclosed here rather than force-pushed, on the same reasoning as C-45. **Superseded by C-51**, which found the chain list itself incomplete, so the corrected count of four was wrong too |
| C-50 | Integrity  | The preamble bounded itself at "C-20 through C-46" while the same commit appended C-47 and C-48 inside the section it was describing. False the instant it was written, with no time-lag excuse                                                                                             | MEDIUM   | The upper bound is gone rather than corrected. Naming one is what made it false, and a bound updated by hand would go stale again at the next row — as it just did twice                                                                                                                                                                       |

Both findings are the same shape as C-45: a claim about the record's own completeness, stated more
confidently than it had been checked. Worth noting where they were found — not in the reader-facing
documents, which no cycle has needed to change since `afb850f43`, but in the apparatus built to
audit them. **Superseded in part by C-55**: this sentence said the documents "have now been clean
for three consecutive cycles", which counted from the wrong end and included a cycle that did change
them. It is stated as a commit anchor rather than a streak count for that reason.

### Cycle 8 Rows (P6-007H@01)

Integrity returned clean — it re-derived the chain and marker counts by hand, confirmed the removed
row bound left no dangling reference, verified from `git log` that the wrong "five chains" figure
really is in the pushed `0db7beda2` message, and checked the three-cycle streak claim against the
actual per-commit file lists rather than accepting it. Docs gave the five reader-facing documents a
clean verdict and judged them ready to ship. Its one finding was in the apparatus again.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                      | Severity | Fix                                                                                                                                                                                                                                                                                                                                         |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-51 | Docs       | The preamble's chain list missed a chain. `C-44` says in its own text that `C-39`'s trim left the placement problem untouched, which is the same shape as every chain the preamble does name. Tracing it back, `C-27` introduced the disambiguation, `C-39` trimmed it, and `C-44` moved it | MEDIUM   | `C-27` and `C-39` gained markers and the chain joined the list. The chain _count_ is now gone from the narrative entirely — it had been wrong three times, for exactly the reason the row bound was, so it was restated without a figure — and cycle 9 went further, making the greppable markers authoritative and the prose a reading aid |

That is three separate completeness claims about this record — a row range, a chain count, and a
chain list — each found wrong by a later cycle. The pattern is specific enough to name: a summary
figure written from what the author remembered adding, rather than counted from the file. The
durable fix in each case turned out to be the same, which is to stop asserting the figure rather
than to keep correcting it. **Superseded in part by C-51 and C-57**: the count of three was itself
one of these figures, and it went to four the next cycle and five the cycle after.

### Cycle 9 Rows (P6-007I@01)

Five findings, all in the apparatus. Both specialists were briefed that cycle 8 had shown where the
remaining risk lived — integrity had verified "exactly four chains, no orphan superseded row"
against the list the claim itself supplied, while docs found a fifth chain by reading the rows — so
this cycle swept the full row set instead. That is what turned up all five.

| Row  | Discipline | Defect                                                                                                                                                                                                                   | Severity | Fix                                                                                                                                                                                                 |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-52 | Docs       | `C-32`'s own row had its misquoted error string corrected in place by `C-36`, with no marker. The preamble states this file never rewrites a row to look right, so the record contained a counterexample to its own rule | HIGH     | `C-32` marked, and the marker records what the row said at `9529a117d`. The preamble now states the exception rather than a rule the file breaks                                                    |
| C-53 | Docs       | `C-49`'s corrected count of four was itself invalidated by `C-51`, which found the chain list incomplete, so the count was too. Unmarked                                                                                 | MEDIUM   | Marked, and the row now says the count was corrected at the time and later removed altogether                                                                                                       |
| C-54 | Integrity  | `C-22` claimed its backfill of 34 evidence blocks stood unqualified. `C-33` had found two of those blocks asserted a `Files Changed` their own prose denies — "a fabricated record inside the fix for missing records"   | HIGH     | Marked. Verified the correction is genuinely applied: both items read `None inside the repository` in `delivery.md`                                                                                 |
| C-55 | Integrity  | The streak claim pinned last cycle was wrong. "Clean for the three cycles preceding this one" counts cycles 4, 5, 6, and cycle 4's own fix commit changed `CONTRIBUTING.md` and the setup guide                          | HIGH     | Replaced with a commit anchor: no cycle has changed those documents since `afb850f43`. Re-derived per commit, which also caught the first attempt counting from the wrong end                       |
| C-56 | Integrity  | With `C-22`, `C-32`, and `C-49` unmarked, "every supersession chain" was still a completeness claim the file did not satisfy — the fourth such claim to fail                                                             | MEDIUM   | Structural rather than textual: the in-row markers are now authoritative and greppable, and the prose is demoted to a reading aid that makes no completeness claim. Nothing left to recount by hand |

The three failed summary claims named last cycle are now four, and the fourth failed the same way as
the first three — so the fix stopped being "state it correctly" and became "stop stating it". A
`grep` over the markers answers the question the prose kept getting wrong. **Superseded in part by
C-57**: the fix was applied to the rows and not to the prose, and the paragraph that closed this
section carried a fifth invented count out of this very commit.

### Cycle 10 Rows (P6-007J@01)

Two findings, one from each specialist, and neither is in a row — both are in the narration around
the rows, which is the part of this file no sweep had been pointed at.
**Superseded in part by C-59**: prose had in fact been pointed at once before, by `C-55` the cycle
before this one, which rewrote a paragraph rather than a row. Saying no sweep had touched it wrote
the immediate predecessor out of the account.

Integrity found the fifth failed summary count, and it was written into the same commit that
announced the file had stopped making them. The paragraph closing the Cycle 9 section said "56
numbered rows — four of them listed twice"; no mechanical reading of the file produces four. Three
IDs recur as a row-start (`C-03`, `C-05`, `C-06`) and five of the Follow-Up Sweep's cells name an
earlier row (`C-03`, `C-04`, `C-05`, `C-06`, `C-08`). The row-total itself was right and the
duplicate count was invented the same way the four before it were: written from memory of what had
been added rather than counted from the file. The narration no longer carries a maintained count.

Docs found that the Cycle 5 paragraph generalized a four-document read into a verdict on all five.
The cycle-5 brief named `README.md`, `CONTRIBUTING.md`, the setup guide, and the tutorial;
`docs/reference/related-repositories.md` was not in it. The document was covered later — the Cycle 8
pass named all five and cleared them — so nothing shipped unread, but the Cycle 5 sentence claimed a
coverage it did not have, and so does the pushed commit message for `9810e71bd`.

| Row  | Discipline | Defect                                                                                                                                                                                                                                                         | Severity | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-57 | Integrity  | "56 numbered rows — four of them listed twice" is wrong under every mechanical reading: three IDs recur as a row-start, five sweep cells name an earlier row. The fifth failed summary count, written into the commit announcing the fix for the previous four | MEDIUM   | The narration states no maintained count. The row range is left to speak for itself, since the last row number is visible in the table and needs no separate figure to stay true                                                                                                                                                                                                                                                          |
| C-58 | Docs       | The Cycle 5 paragraph said "the reader-facing documents themselves came back clean" on the strength of a brief that named four of the five. `docs/reference/related-repositories.md` was not in that pass                                                      | MEDIUM   | The paragraph now names the four that were read, says which document was not, and points at the Cycle 8 pass that first covered all five. The identical claim in `9810e71bd`'s commit message is disclosed as unamendable. The Cycle 2 paragraph's unqualified "the four documents" was scoped in the same edit — it was ambiguous rather than wrong, since the fifth document carries no version literal and was never in `C-20`'s scope |

Both findings landed in narration, not in a row, and that is the point worth keeping. The marker
scheme made the rows self-checking; the prose between them had never been swept as a set. The two
defects had been there for different lengths of time: `C-58`'s survived five cycles, while `C-57`'s
was written by the cycle-9 commit and caught in the next one.

### Cycle 11 Rows (P6-007K@01)

Three findings, and the first is the same failure one layer out. Cycle 10 extended the marker
convention from the rows to the prose, swept the prose, marked four paragraphs, and then stated that
the narrative paragraphs now carry a marker wherever a later cycle overtook one. The sweep had
missed one. The Cycle 7 closing paragraph claimed the reader-facing documents "have now been clean
for three consecutive cycles" at `063026455`, softened the wording to "were clean for the three
cycles preceding this one" at `bc20ca4bd` without fixing the arithmetic, and was rewritten in place
at `14d2f67d7` as the literal implementation of `C-55` — a paragraph, not a row. So `C-55` had
already pointed at prose a cycle before the sweep that claimed nothing had, and the sweep neither
found it nor counted it.

That is another completeness claim about this record failing, and the second time one has failed
inside the commit meant to close the class — `C-57` was the first, one cycle earlier. The count of
how many have failed is deliberately not given here; that count is itself one of the figures this
record kept getting wrong. The response is the same one that worked for the rows,
applied honestly this time: the preamble no longer says the prose is fully marked. It says a marker
is evidence and the absence of one is not proof, and it names this miss so a reader knows the sweep
has a history of being incomplete.

The other two findings are the cost of the extension itself. A marker dropped mid-paragraph broke
the sentence after it — the pronoun "It", whose antecedent was three sentences up, bound instead to
the correction — which is a real argument that prose markers belong at a paragraph boundary and not
wherever the corrected sentence happens to sit. And the closing sentence flattened two defects of
very different ages into one "sitting there for cycles".

| Row  | Discipline | Defect                                                                                                                                                                                                                                                                                                                       | Severity | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-59 | Integrity  | The Cycle 7 paragraph carried a false three-cycle streak claim through two commits and was rewritten in place at `14d2f67d7` per `C-55`, with no marker. Cycle 10's claim that the prose now all carries one was false when written, and its "nothing had been pointed at the prose" framing wrote `C-55` out of the account | HIGH     | The paragraph is marked. The preamble drops the completeness claim for prose and states the miss instead; the Cycle 10 narration is marked where it wrote its predecessor out. Same framing appears in `c8054b7d3`'s pushed message and stays there, disclosed rather than force-pushed. The prose was then re-swept mechanically, by diffing non-table lines across every consecutive commit pair rather than by reading, which also gave the preamble a marker for the summaries it hosted — miscounted at the time as four; see `C-62` |
| C-60 | Docs       | Inserting the `C-41` marker mid-paragraph orphaned the pronoun "It" in the next sentence, which a cold reader binds to the correction rather than to "Cycle 3" three sentences up                                                                                                                                            | MEDIUM   | The marker moved to the end of the paragraph, restoring the original sentence flow. The convention is now to place a prose marker at a paragraph boundary, which is where the other five already sit                                                                                                                                                                                                                                                                                                                                      |
| C-61 | Docs       | "Both defects had been sitting there for cycles" is true of `C-58`, which survived five, and false of `C-57`, which the cycle-9 commit introduced and the next cycle caught                                                                                                                                                  | MEDIUM   | The sentence gives the two ages separately instead of a shared one                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Cycle 12 Rows (P6-007L@01)

The mechanical re-sweep cycle 11 ran was the right method and it still put a marker in the wrong
place. It marked the preamble as the home of four failed summaries. Three of them lived there; the
fourth, `C-57`'s "56 numbered rows — four of them listed twice", lived in the paragraph that closes
this whole section, some three hundred lines below. So the paragraph that actually carried the
corrected claim had no marker, and the misattribution went out three times in one commit — in the
marker, in `C-59`'s Fix cell, and in the pushed message.

Two things about that are worth stating rather than smoothing. The sweep found the right set of
paragraphs and then recorded where one of them was from memory instead of from the diff it had just
run. And the failure landed inside the mechanism the preamble declares authoritative, which is the
third consecutive cycle where the fix for this class contained a fresh instance of it.

Integrity also went back to the first commit and found the earliest instance of the same shape,
never recorded: the Scope Discipline paragraph opened as "All eight rows edit prose in three
reader-facing documents" while nineteen rows were already in the file, and the row count was
corrected silently one commit later. The "three documents" half was accurate when written — the file
named exactly three at that point — so only half of that finding stands, and the row is written to
say which half.

Docs found `C-59`'s narration calling itself "the fifth completeness claim about this record to
fail" when `C-57` already held that ordinal one cycle earlier. Nothing in the text distinguished two
tallies, so the ordinal is gone rather than renumbered; the narration now says plainly that the
count is not given because the count is one of the figures this record kept getting wrong.

One disclosure that belongs here rather than in a row. The brief written for this cycle told both
specialists the file carried "nineteen markers, six of them in prose". Nineteen was right; six was
the figure from one commit earlier, and the true number was nine. The docs specialist caught it and
reported it rather than working from it. The same defect class this record chronicles reached the
briefing that was sent to audit it.

| Row  | Discipline | Defect                                                                                                                                                                                                                                         | Severity | Fix                                                                                                                                                                                                                          |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-62 | Integrity  | The preamble's new marker named `C-49`, `C-50`, `C-51` and `C-57` as summaries that lived in it. `C-57`'s lived in the section's closing paragraph, which was left unmarked. Repeated in `C-59`'s Fix cell and in `f1a15185f`'s pushed message | HIGH     | The preamble marker names the three that were actually there; the closing paragraph carries its own marker for `C-57`. `C-59`'s Fix cell is corrected. The pushed message stays as it is, disclosed rather than force-pushed |
| C-63 | Integrity  | The Scope Discipline paragraph opened at `cb489b874` as "All eight rows edit prose in three reader-facing documents" with nineteen rows already present, and the row count was corrected silently at `14e58716e` with no row and no marker     | MEDIUM   | The paragraph is marked and the original wording recorded. **Superseded by C-67**: this row's "only the row count was wrong" resolution is false — both figures were wrong, and the finding it downgraded was correct whole  |
| C-64 | Integrity  | `C-59`'s narration said the Cycle 7 paragraph "carried that claim through `063026455` and `bc20ca4bd`", collapsing two different phrasings into one quoted string                                                                              | LOW      | The narration now gives both phrasings and says the `bc20ca4bd` rewording softened the sentence without fixing the arithmetic                                                                                                |
| C-65 | Docs       | `C-59`'s narration called itself "the fifth completeness claim about this record to fail" while `C-57` already held that ordinal, with nothing in the text distinguishing two tallies                                                          | MEDIUM   | The ordinal is removed rather than renumbered, and the narration says why: the count of failed counts is itself one of the figures this record kept getting wrong                                                            |

Worth being plain about the shape of this: twelve review cycles have produced the rows numbered
above, and every cycle after the fourth changed only plan records, never a reader-facing document.
Those five documents have not needed a change since `afb850f43`, and the cycle 12 docs pass cleared
them to ship again. **Superseded in part by C-57 and C-62**: this is the paragraph that carried "56
numbered rows — four of them listed twice", the count `C-57` removed. `C-59`'s marker was put on the
preamble instead, which is where two of the other summaries lived but not this one.

### Cycle 13 Rows (P6-007M@01)

Two corrections and one decision. The narration ends here.

Integrity found that `C-62` — last cycle's fix for a mislocated summary — mislocated a different
one. It moved `C-49` onto the preamble; `C-49`'s claim ("the preamble names all five supersession
chains") was made _about_ the preamble from the Cycle 6 closing paragraph, which is where it now
sits. And it found that `C-63`'s "half stands" resolution was false: at `cb489b874` the file already
referenced all five reader-facing documents, so both figures in that sentence were wrong, and both
were corrected in one hunk. The original finding was right whole.

The second one is mine to own. I checked that claim by grepping the row tables for `.md` filenames.
The voice table's File column uses short names — `tutorial`, `related-repositories` — so the grep
returned three documents and I read a false negative as a refutation. I then wrote that refutation
into cycle 13's brief as established fact. The specialist re-derived it from the blob and disagreed,
correctly. This is the same false-zero class as the `md links validate` gate recorded near the top
of this section, made while adjudicating a finding about unverified claims.

Docs made the call the loop needed. The record has crossed from hard to read into functionally
non-narrative: growth per cycle over the last four cycles ran +734, +776, +699, +848 words —
accelerating, not settling — while the five reader-facing documents have been byte-identical since
`afb850f43`. Every row from `C-41` on audits this record's own prose rather than anything a reader
of the repository will see. Three consecutive cycles have now found that the fix for a false
narrative claim contained a fresh one. **Superseded in part by C-71**: this sentence added "eight
cycles back" to the commit anchor, and cycles 5 through 13 is nine.

So the narration closes. Not because it is finally correct — `C-66` and `C-67` are proof it is not —
but because it has become a surface that generates defects faster than it retires them, at no
benefit to any shipped document. The rows and their markers remain the record. Everything above this
heading is historical and will not be rewritten again.

| Row  | Discipline | Defect                                                                                                                                                                                                      | Severity | Fix                                                                                                                                                                                                                                                  |
| ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-66 | Integrity  | `C-62`'s replacement preamble marker named `C-49` as a summary that lived in the preamble. It lived in the Cycle 6 closing paragraph, which said the preamble named "all five supersession chains"          | HIGH     | The preamble marker names only `C-50` and `C-51`. The Cycle 6 closing paragraph carries `C-49`                                                                                                                                                       |
| C-67 | Integrity  | `C-63` recorded the Scope Discipline finding as half-standing on the grounds that "three reader-facing documents" was right at `cb489b874`. All five were already referenced there; both figures were wrong | HIGH     | `C-63` is marked and the Scope Discipline marker corrected. The bad adjudication came from grepping for `.md` filenames against a table that uses short names, and it was asserted as fact in the next brief — recorded rather than quietly reversed |
| C-68 | Docs       | The record has crossed into functionally non-narrative: per-cycle growth accelerating across the last four cycles while the reader-facing set has not changed in eight                                      | MEDIUM   | The narration is closed as historical. Rows and markers carry the record from here; no further cycle rewrites the prose above this heading                                                                                                           |

### Cycle 14 Rows (P6-007N@01)

The first cycle scoped to what ships rather than to this record, and it found three things in one
pass — two of them on the shipping surface, which is where nine cycles of apparatus work had not
been looking.

Docs read the five reader-facing documents as the deliverable instead of re-confirming them
unchanged, verifying each command, flag, and target against the live repository, and cleared them.
Then it read `delivery.md` as a reader would and found seven Phase 6 rows still asserting that
nothing was committed, pushed, opened, reviewed, or merged under Phase 6 — while this branch is
that very correction unit, with a PR and thirteen completed review cycles behind it. `P6-007`'s own
acceptance clause, "findings are resolved", is what this loop has been discharging, and its row said
no cycle ran.

Integrity found a live ambiguity in the setup guide's Overview, in prose this PR introduced: "Step 6
below keeps that exit code". The document has two Step 6s — the Quick Start's `# 6. Verify`, which
is the one meant and does keep the exit code, and `### Step 6: Keep local environment data out of
onboarding`, which is what a reader scanning headings finds. Every step-number reference to the
verify step was replaced with a description of it, rather than only the site the finding named.

And it found the Cycle 13 closure paragraph miscounting its own evidence: byte-identical "since
`afb850f43`, eight cycles back" — cycles 5 through 13 is nine. The count is gone and the commit
anchor kept, which is what `C-55` established the first time this record pinned a streak from the
wrong end.

| Row  | Discipline | Defect                                                                                                                                                                                                                         | Severity | Fix                                                                                                                                                                                                                    |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-69 | Docs       | Seven Phase 6 rows in `delivery.md` (`P6-004`…`P6-010`) each assert "Nothing was committed, pushed, opened, reviewed, or merged under Phase 6". Iteration `@01` did all of it. Only the `P6-G01` gate row carried an amendment | HIGH     | Each of the seven carries an amendment naming what `@01` actually did and pointing here. The original disposition stands as an accurate record of Phase 6 as first executed                                            |
| C-70 | Integrity  | The setup guide's Overview says "Step 6 below keeps that exit code". Two Step 6s exist in that document; the heading-level one is about `.env` hygiene and says nothing about exit codes                                       | HIGH     | All three step-number references to the verify step now describe it instead of numbering it. The exit-code claim itself was re-verified: `npm run doctor` exits 127 without Cargo, `postinstall`'s `\|\| true` exits 0 |
| C-71 | Integrity  | The Cycle 13 closure paragraph and `5e0533953`'s message say the reader-facing documents have been unchanged since `afb850f43`, "eight cycles back". Cycles 5 through 13 is nine                                               | MEDIUM   | The count is removed and the commit anchor kept. The message stays as pushed, disclosed rather than force-pushed                                                                                                       |

### Cycle 15 — `2be98caac`

Integrity returned zero. Docs returned one HIGH, and it is the same defect as `C-69` at a site that
sweep did not reach: `delivery.md`'s `P7-001` bullet still declared that
`artifacts/execution-record-fixes.md` "never will exist, because Phase 6 recorded not applicable".
The sibling ledger `artifacts/reader-doc-disposition-ose-public.md` carried the corrective amendment
for the identical sentence already; `delivery.md`'s copy was the one that pass missed.

Treating the named site as the whole finding would have repeated `C-69`'s mistake a third time, so
the sweep ran over the phrase class rather than the sentence — `never will`, `will never`,
`never exist`, `no correction unit exists` — across every plan file. It found that `C-69` had
amended the **tail** of Phase 6 and left the **head** untouched: `P6-001` still said no correction
branch was created and the worktree stays on `docs/repository-onboarding-public`; `P6-003` still said
nothing was staged; `P6-003A` still said there were no unit gates to run; `P6-003B` still said there
was no correction diff for an independent review to read. All four are false of `@01`, and all four
had sat one screen above seven rows that said so.

Every Phase 6 row now carries a verdict rather than a silence. Fourteen of the fifteen carry a
supersession amendment; `P6-G01` carries the conditional-fired amendment it already had. The
fifteenth, `P6-002B`, is deliberately unamended and that is the finding's own rule applied to itself:
both its clauses survive `@01` — there was still no red coverage to turn green, and the only
non-Markdown paths `@01` added are twelve captured evidence artifacts, so still no source change. An absent marker there means checked-and-standing, which
is only legible because this paragraph says so.

| Row  | Discipline | Defect                                                                                                                                                                                                                      | Severity | Fix                                                                                                                                                                                               |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-72 | Docs       | `delivery.md`'s `P7-001` bullet asserts `artifacts/execution-record-fixes.md` "never will exist". The class sweep it triggered found `P6-001`, `P6-003`, `P6-003A`, and `P6-003B` carrying the same false `@01` disposition | HIGH     | `P7-001` and all four head rows amended. The `evidence/README.md` half of the `P7-001` bullet still stands — P8-002 has not run. `P6-002B` checked and left standing, for the reason stated above |

### Cycle 16 — `d805edee1`

The cycle opened on a figure this record had been repeating without ever counting it.

Iteration `@01` added twelve files under `evidence/`, not eight: `cb489b874` added the four Phase 5A
and four Phase 5B captures, and `14e58716e` added the four Phase 6 breakpoint captures once `C-23`
closed the 375px/1280px gap. The `C-26` row is not wrong — it describes what a single commit did,
and `cb489b874` did add exactly eight. What was wrong is every later sentence that reused that
figure to describe the whole iteration: the `P7-001` amendment in `delivery.md` written one cycle
ago, and the identical sentence in `artifacts/reader-doc-disposition-ose-public.md` written before
it. The number was correct when first written about a commit and became wrong the moment it was
promoted to a claim about the iteration.

The second finding is the same failure in a different currency. `P6-002`'s amendment and this
record's own Cycle 15 paragraph both said `@01` "changed Markdown only" — offered, in the second
case, as the stated reason `P6-002B` needs no amendment. Nine PNGs and three transcripts say otherwise.
The disposition survives, because none of the twelve is source, configuration, a test, or a
generated mirror, and that is what `P6-002B` actually turns on. Only the reason was false, and a
false reason for a true verdict is still a defect — the fifteen cycles behind this one exist because
that distinction kept getting lost.

Integrity found the third defect independently, and it is the sharper one. `P6-003A`'s amendment,
written one commit ago, listed six checks as unit gates that each exited 0 before every `@01`
commit. Checked against `repo-config.yml`: `format-prettier` and `markdownlint` are genuinely
`pre-commit` and genuinely blocked landings. `governance-readme-index`, `md-links`, and
`governance-word-budget` are `pre-push`/`ci` surfaces, run here by hand rather than by a hook — and
`governance-word-budget` is path-gated on `repo-governance/` and the harness directories, so it
would not have fired for this branch's diff under any circumstance. The remark-gfm table parse is
not a gate at all; it is a script run from the worktree because a blank line inside a Markdown table
splits it silently past both Prettier and markdownlint, which is how `C-33`…`C-35` lost their
header in the first place. The one claim in that sentence that survives is "each exited 0" — but not for the reason
the correction first gave. `md-links` carries `args.exclude: [plans/done]` in its registry entry,
and scoped that way it reports `All links valid!` and exits 0. The 312 broken links belong to a
hand-run invocation that omitted the exclude, which is not the gate. Every one of them sits in
`plans/done/`, which is what P3-012's round-1 finding established before this iteration began — so
the cycle-16 correction managed to regress against a fact the plan had already proved.

There is a fourth defect and it is mine. The first fix for `C-74` wrote "eight PNG screenshots and
four transcripts" — the split one review agent reported, adopted without counting. It is nine and
three. Two agents disagreed on the composition while agreeing on the total, and the correct response
was to run `git ls-tree` rather than to pick one. Recorded as `C-76` rather than quietly amended,
because a review finding is a claim to verify, not a fact to copy — and this record has now made
that mistake in both directions.

Cycle 17 then returned integrity clean and docs with one MEDIUM, and both pointed at counts rather
than claims. The README figure in `P7-004` was written unpinned and present-tense — "it now sits at
894 of 900 words" — and had drifted to 896 across two commits without anyone reading it again. That
is precisely what `C-30` and `C-35` are: the same sentence, going stale twice, with the fix for it
going stale in turn. The treatment those two rows prescribed was to pin the figure to a named
revision, and the one place that most needed it never received it. A second unpinned count turned up
in the same sweep, in the `P3-014` item.

The last one is a category error rather than a stale number. The broken-links report groups by
failure kind, so a file that breaks links in two categories appears twice; this record read its 116
section entries as 116 files. There are 110. Re-running the byte-identity check over the correct 110
returns 110 identical, 0 modified, 0 absent — the conclusion it supported was right, which is the
third time in this iteration a sound conclusion has rested on a figure nobody counted.

| Row  | Discipline | Defect                                                                                                                                                                                                         | Severity | Fix                                                                                                                                                                                                                      |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-73 | Docs       | `delivery.md`'s `P7-001` amendment and the same sentence in `reader-doc-disposition-ose-public.md` say `@01` added "eight files under `evidence/`". Twelve exist, all added by `@01`                           | HIGH     | Both corrected to twelve, split by the two commits that added them. `C-26` left standing — it describes one commit, which did add eight                                                                                  |
| C-74 | Docs       | `P6-002`'s amendment and this record's Cycle 15 paragraph both claim `@01` "changed Markdown only". It also added nine PNGs and three transcripts under `evidence/`                                            | HIGH     | Both reworded to name the twelve evidence artifacts. `P6-002B` still needs no amendment, now for the reason that actually holds: none of the twelve is source or a test                                                  |
| C-75 | Integrity  | `P6-003A`'s amendment named six checks as "unit gates" run "before every one of its commits". One is not a repository gate and three are `pre-push`/`ci` surfaces rather than pre-commit ones                  | HIGH     | Rewritten to separate the two real pre-commit gates from the three hand-run ones and the one ad-hoc script                                                                                                               |
| C-77 | Integrity  | `C-75`'s own fix then claimed `md-links` "exits 1 on a repository-wide baseline of 312 broken links", implying the gate is red. Its registry entry excludes `plans/done`, and so scoped it exits 0             | HIGH     | Corrected at both sites. The 312 come from a hand-run invocation that dropped the registry's `--exclude`; all sit in `plans/done/`, as P3-012 established before this iteration began                                    |
| C-78 | Docs       | `delivery.md`'s P7-004 item said the README "now sits at **894** of 900 words" — unpinned and present-tense. It was 894 at `cb489b874` and 896 at `3d23ad1f9`. A second unpinned count sat in the P3-014 item  | MEDIUM   | Both pinned to the revision they describe, the treatment `C-30` and `C-35` already prescribed for exactly this claim. The drift never crossed the 900-word fail limit                                                    |
| C-79 | Docs       | This record read the broken-links report's 116 section entries as 116 files. A file that breaks links in more than one category is reported once per category; the report covers 110 unique files              | MEDIUM   | Corrected to 110 files across 116 entries. Re-verified byte-identity against `origin/main` over the 110: 110 identical, 0 modified, 0 absent                                                                             |
| C-80 | Integrity  | `C-78`'s own row and prose cited the second unpinned count as sitting in a `P3-013A` item. `delivery.md` has no such item — the line is in `P3-014`, and `P3-013A` is a row ID in `execution-record-public.md` | MEDIUM   | Both citations corrected to `P3-014`. The pinned figures themselves were right; only the pointer to where the defect lived was wrong. `caabf7a02`'s pushed message carries the same wrong citation and is left as pushed |
| C-76 | Docs       | The first fix for `C-74` said "eight PNG screenshots and four transcripts", taken from a review agent's split without counting. It is nine and three                                                           | HIGH     | Counted directly — `git ls-tree` over `evidence/` returns 9 `.png` and 3 `.txt` — and corrected at both sites before the commit landed                                                                                   |

## Scope Discipline

No correction here is a product change. The rows edit prose in five reader-facing documents and the
plan's own records; none touches source, configuration, a test, or a generated mirror. P6-002A and
P6-002B therefore remain not applicable in this iteration too — no defect was a product bug, so no
red coverage was needed and none was written. **Superseded in part by C-63 and C-67**: this paragraph
opened at `cb489b874` as "All eight rows edit prose in three reader-facing documents". Nineteen rows
and all five documents were already in the file, so both figures were wrong when written, and both
were corrected in one hunk at `14e58716e` with no row and no marker.

C-23 is the one row that produced new evidence rather than new prose. It ran the landing page at
the three documented breakpoints and checked `scrollWidth > clientWidth` at each. That is a
verification, not a product change: nothing in the application was modified, and the check passed
as it stood.

## Iteration `@02` — Phase 7 reconciliation findings

Iteration `@02` opened because the Phase 7 re-run against merged `origin/main` (`400712aa9`) did
not come back clean. Two independent reviewers ran against the five reader-facing documents. Every
row below was verified against a primary source before it was written; findings that did not
survive verification are recorded as rejected rather than silently dropped.

| Row  | Source         | Severity | Defect                                                                                                                                                                                             | Correction                                                                                                                    |
| ---- | -------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| C-81 | docs checker   | MEDIUM   | The setup guide's integration-test troubleshooting entry named host port `5432`. `docker-compose.integration.yml` maps `"5434:5432"` and `run-integration.sh` exports `Port=5434`.                 | Entry now names `5434`, explains the remap, and leads with `lsof -i :5434`.                                                   |
| C-82 | docs checker   | MEDIUM   | `CONTRIBUTING.md` listed ten valid commit types, omitting `build`, which the enforced `@commitlint/config-conventional` type-enum accepts.                                                         | List now carries all eleven enum members alphabetically.                                                                      |
| C-83 | docs checker   | LOW      | The setup guide attributed `cargo-llvm-cov` to `test:quick`. No `test:quick` invokes it — `rhino-cli:test:quick` is typecheck/lint/test:unit/test:specs, and `crane-cli` covers via `dotnet test`. | Comment now attributes coverage to `test:coverage` and `cargo-deny` to `deps:audit`.                                          |
| C-84 | voice reviewer | HIGH     | `CONTRIBUTING.md` asserted the project "adheres to a Code of Conduct". No `CODE_OF_CONDUCT.md` exists at any path; the sole match is the convention for authoring one.                             | Section now states the conduct standard directly and says plainly that no root file exists yet. See the follow-up note below. |
| C-85 | voice reviewer | HIGH     | `related-repositories.md` carried an instruction addressed to an execution agent — "preserve active goals during runner contention…" — on a reader-facing reference path.                          | Sentence removed; the surrounding parity paragraph is unchanged.                                                              |

### Cycle 1 of the `@02` review — one finding, fixed as a class

| Row  | Source              | Severity | Defect                                                                                                                                                                                         | Correction                                                                              |
| ---- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| C-86 | governance reviewer | MEDIUM   | `C-82` corrected `CONTRIBUTING.md`'s commit-type list but left every other surface stating the same enforced fact untouched, breaking a three-way consistency the repo maintains deliberately. | `build` added to every surface that states the set, and the harness mirror regenerated. |

The reviewer named two stale surfaces. A sweep for every tracked Markdown file stating the full type
set found **four**, so the fix was applied to the class rather than to the cited sites:

| Surface                                                                                            | Was                                             |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `repo-governance/development/workflow/commit-messages/valid-commit-types.md`                       | 10-row table plus a prose description section   |
| `repo-governance/development/infra/ci-conventions/git-hooks-standard-pre-commit-and-commit-msg.md` | 10-type inline list                             |
| `docs/reference/system-architecture/ci-cd.md`                                                      | 10-type inline list — not named by the reviewer |
| `.claude/skills/swe-developing-applications-common/reference/git-workflow.md`                      | 10-bullet list — not named by the reviewer      |

`.agents/skills/caveman-commit/SKILL.md` already carried all eleven and was left alone. Because
`chore` had been documented as covering build configuration, its description was narrowed where
`build` now covers that case, so the two do not overlap. `governance word-budget validate` exits 0
after the edit; the one WARN on `valid-commit-types.md` predates it (428 words at `400712aa9`,
already over the 400-word target). `npm run generate:bindings` then `npm run validate:sync` both
exit 0.

### Cycle 2 of the `@02` review — the class fix invented a convention

Both specialists converged on one defect in `C-86`, and the docs reviewer was right to escalate it.

| Row  | Severity | Defect                                                                                                                                                                                                                                                                        | Correction                                                                                                                          |
| ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| C-87 | HIGH     | `C-86` gave `build` the bullet "Dependency manifests and lockfiles" and narrowed `chore` to match. The repository does the opposite: dependency work is filed `chore(deps)`. The same table then still carried `chore: update dependencies`, so the file contradicted itself. | `build` redefined as build, packaging, and compiler configuration; `chore` restored as the home of dependency and lockfile updates. |

Counted against the merged history at `400712aa9`: **17** `chore(deps)` commits, all dependency or
lockfile work, and **4** `build` commits — Nx cache inputs, F# analyzer settings, and two
Dockerfiles. None of the four is a dependency change. The definitions now describe what each type is
actually used for, and both table examples are drawn from real commits rather than invented.

The cycle also closed a second, smaller overlap: `build`'s "Build tool configuration" sat beside
`chore`'s "Tooling changes", which are near-synonyms a contributor could not choose between. The
`chore` bullet is gone; the two types no longer share a category.

**Method note.** The first attempt to count these commits returned `0` for both `build` and
`chore(deps)` — a false zero from the filtered `git log` wrapper, and the third instance of that
hazard class in this iteration. Re-run through `rtk proxy` against 5,605 raw subjects, the real
counts are 4 and 17. Had the zero been believed, this row would have "confirmed" that neither
convention existed and left the invented one in place.

### Cycle 3 of the `@02` review — terminal

Both specialists returned **zero findings** against `7053b0beb`. The docs reviewer independently
hit the same false-zero this iteration hit twice — an anchored `--grep` returned 0 — recognised it,
re-ran through `rtk proxy`, and reached the same 17 and 4. That is the counts corroborated from a
second direction by a reader who did not take them on trust.

The governance reviewer cleared all five checks: `build` and `chore` are compatible on every surface
that describes them, the split leaves no change type homeless, the `.agents/` mirror is
byte-identical to its source, the eleven-type list is identical across all four bare-list surfaces,
and the word budget is green at 482 of a 500 fail threshold.

That last number is worth carrying forward: `valid-commit-types.md` entered this plan at 428 words,
already over its 400-word target, and leaves at 482. It is green, but the next edit to that file has
18 words of headroom.

**Cycle count.** Three cycles, terminating on a genuine zero. Iteration `@01` ran nineteen. The
difference is not that the reviewers were weaker — they found a `CRITICAL` here that `@01`'s
reviewers never had cause to look for — but that the review scope named the shipping surface and
excluded the plan's own records, which is exactly the change
`plans/ideas/q2-not-urgent-important/review-loop-reviews-its-own-record.md` proposed.

### Round 3 of `P7-003` — one more finding after the review had terminated

The PR-review cycles ended at three on a genuine zero, but `P7-003`'s own acceptance is two
consecutive zero-finding checker rounds, and round 3 against merged `7ebf8fec3` was the first of
those two. The README checker returned zero. The docs checker re-confirmed all five `@02` fixes and
returned one new finding.

| Row  | Source       | Severity | Defect                                                                                                                                                                                                                                      | Correction                                                                                                                                             |
| ---- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-88 | docs checker | MEDIUM   | The setup guide claimed in three places that `nx affected -t typecheck,lint,test:quick,test:specs` is "the full pre-push pipeline" / "the same targets pre-push would" run. The push hook runs `gate run --surface=pre-push`, not that set. | All three sites now point at the gate command, name `gate list --surface=pre-push` as the source of truth, and reframe the Nx command as a cache warm. |

Verified independently before applying, because the claim is exactly the kind a reader acts on:
`gate list --surface=pre-push` returns **16** gates. Three are Nx — `test:quick`,
`compat:min-version`, `specs:structure-validation` — and the last two were absent from the
documented command. The other thirteen are repository-wide `rhino-cli` checks (`md-links`,
`env-validate`, `governance-readme-index`, `harness-duplication`, `parity-manifest`, the two
`vendor-independence` entries, `convention-license`, the three `harness-*` entries,
`governance-word-budget`, `governance-readme-completeness`) that `nx affected` never sees. Meanwhile
`ose-www:test:quick` already composes `typecheck`, `lint`, `test:unit`, `test:coverage`, and
`test:specs`, so three of the four names in the documented list were redundant with the fourth. The
cited command was neither the same set as pre-push nor a superset of it, in either direction.

Swept for the class rather than the three cited lines: the literal target list appears in no other
tracked file, and `CONTRIBUTING.md`'s two pre-push mentions — "recommended for pre-push" and
"pre-push standard", both `nx affected -t test:quick` — are accurate and were left alone.

### Round 4 of `P7-003` — the C-88 rewrite verified, and one more pre-existing defect

Round 4 confirmed `C-88`'s replacement text against primary sources: it executed both documented
commands, read `.husky/pre-push` directly, and confirmed `compat:min-version` and
`specs:structure-validation` each appear in 29 `project.json` files. No inaccuracy in the new text.
It then found one further defect in text this plan had never touched.

| Row  | Source       | Severity | Defect                                                                                                                                                                                    | Correction                                                                                                       |
| ---- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| C-89 | docs checker | MEDIUM   | `CONTRIBUTING.md` listed "First line ≤ 50 characters" under **Important rules** and then said the format is "enforced by commitlint on every commit". Commitlint's enforced limit is 100. | 50 reframed as the readability target, 100 named as the line the hook stops you at, on every surface stating it. |

Verified with a control before applying, because "the tool enforces X" is exactly the claim a
contributor trusts: `@commitlint/config-conventional` sets `header-max-length` to `100` and
`commitlint.config.js` adds no override. A 75-character subject passes at exit 0; a 122-character
one fails. So the documented limit was not merely conservative — it was attributed to a gate that
does not impose it.

The sweep for the class found a **worse** instance the reviewer had not named.
`repo-governance/development/workflow/commit-messages/common-errors-and-fixes.md` headed a
troubleshooting section with the error string `"header must not be longer than 50 characters"` —
which commitlint never emits — and the `FAIL:` example under it is 77 characters and **passes**,
exit 0. A reader hitting the real error would not find it by searching that heading, and the example
teaching them what failure looks like was not a failure.

| Surface stating the rule                                                          | Was                                                                                |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`                                                                 | 50 stated as a rule, then attributed to commitlint                                 |
| `repo-governance/development/workflow/commit-messages/common-errors-and-fixes.md` | Fabricated error string; a `FAIL:` example that passes — not named by the reviewer |
| `repo-governance/development/workflow/commit-messages/the-format-explained.md`    | 50 listed among rules that are genuinely enforced — not named by the reviewer      |

The replacement `FAIL:` example is 101 characters and was re-run through `commitlint` to confirm it
exits 1 on `header-max-length` before it was written down. Both governance files stay well inside
the word budget, at 267 and 260 against a 500-word fail threshold, and the gate exits 0.

**On convergence.** Rounds 3 and 4 each returned exactly one MEDIUM, both in long-standing text
neither this plan nor any earlier round had examined. That is not the oscillation
`plans/ideas/q2-not-urgent-important/review-loop-reviews-its-own-record.md` describes — the surface
is static and the findings are real and independently reproducible. It is a thorough reader sampling
a different claim each pass. The acceptance clause asks for two consecutive zeros, so the loop
continues, but the cost is being paid for genuine defects rather than for the record's own prose.

### Round 3 of `P7-004` — three documents pass, two carry real clause violations

Round 2's voice review returned FAIL on all five documents with roughly forty findings, three of
whose five HIGHs did not survive verification. Round 3 was run with the twelve contract clauses
made the exclusive judging surface: every finding had to cite a clause number and quote the
offending text, style preferences no clause names were declared out of scope, and PASS was stated
up front as a legitimate outcome. The result was **three PASS and two FAIL** — the first time this
review has distinguished between the documents rather than failing all of them.

| Row  | Source         | Clause | Defect                                                                                                                                                                                                                                                                  | Correction                                                                                                                                                                              |
| ---- | -------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-90 | voice reviewer | V3     | The tutorial says "Start the Nx development target" and uses `Nx` seven times without ever explaining it. V3 names Nx explicitly, and this is the Diátaxis tutorial — the designated novice on-ramp.                                                                    | First use now glosses Nx as a monorepo task coordinator and links `nx.dev`, matching the gloss the README and `CONTRIBUTING.md` already carry.                                          |
| C-91 | voice reviewer | V8     | `CONTRIBUTING.md`'s workflow steps 3, 4, and 5 give three consecutive commands with no expected outcome and no recovery route. Steps 3 and 4 are quality gates, so failing is the likely outcome V8 names.                                                              | Each of the three now states what success looks like and where to go when it does not.                                                                                                  |
| C-92 | voice reviewer | V12    | Six passages of stock filler or circular gloss: "Documentation is as important as code"; three article-dropped bullets in **Before Reporting**; "Description: Clear description of the bug"; "Actual behavior: What actually happens"; "Naming: Use descriptive names". | Filler sentence deleted; the telegraphic bullets rewritten as full sentences that say why each step helps; each circular gloss replaced with the specific thing it was standing in for. |

Verified before applying rather than taken on report. The tutorial's seven `Nx` mentions were listed
and read: none glosses the term, and a case-insensitive scan for `nx.dev`, "build system", "task
runner", "monorepo", and "orchestrat" returns nothing in that file while the same scan returns the
README's gloss at line 54. The `resolvePort` example now used for the naming bullet is a real
exported symbol in `libs/ts-env-loader`, not an invented illustration.

**Declined, with reason.** The reviewer also flagged a run of twenty bullets sharing the
`- **Label**: clause` shape across four consecutive sections. Declined: V5 governs documents not
being stamped from one template, not list items sharing a format, and a scannable label-first list
is what V10 asks a reference section to be. Rewriting those twenty into varied prose would trade a
clause the text satisfies for one it does not.

**Method note from the reviewer, worth keeping.** It reported that `IGNORECASE` is a no-op in this
machine's awk, so its first case-insensitive sweep silently ran case-sensitive, and that numbered
output arrived through a filter whose line numbers ran two short of the real file. It caught both
and re-derived every quoted line number against the raw file. Same family as the false zeros this
iteration hit four times: a tool that answers confidently in the wrong mode.

### Round 5 of `P7-003` — a claim that was true when written

Round 5 re-verified both earlier fixes with controls of its own: it ran `gate list --surface=pre-push`
and matched `C-88`'s description against the real 3-Nx-plus-13-repo-wide split, and it exercised
`commitlint` at 100 characters (pass) and 101 (fail) to confirm `C-89`. It then found one HIGH.

| Row  | Source       | Severity | Defect                                                                                                                                                                                | Correction                                                                  |
| ---- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| C-93 | docs checker | HIGH     | `related-repositories.md` said `beaver-nest` "carries its own fork of `rhino-cli`". That repository was rebuilt on Phoenix LiveView and Elixir and now carries no `rhino-cli` at all. | Clause rewritten to say what is true now, at both sites carrying the claim. |

Verified against the live repository with a non-vacuity control before applying: `beaver-nest`'s
`apps/` contains only `bnest-app` and `bnest-e2e` and its primary language is Elixir, while the
identical query against `ose-public` returns `rhino-cli`. So the absence is a real absence, not a
query that silently matched nothing.

This one is a different species from `C-88` and `C-89`. Those were wrong when written. This was
**true when written** and went stale underneath the document — `beaver-nest` was last pushed on
2026-08-20, one day before this round. No review cadence catches that class; only re-verifying an
external claim against its live source does, which is what the round did.

The sweep found the same claim in one other place,
`plans/ideas/q1-urgent-important/rhino-cli-parity-propagation-optimize-cis.md`, where it justified
excluding `beaver-nest` from the parity boundary. The exclusion is still right; its stated reason
was not. Both sites now say the same true thing, and the idea brief pins its statement to a date.

**Convergence, three rounds on.** Rounds 3, 4, and 5 each returned exactly one finding, in
previously-unexamined territory each time, and all three were real. The acceptance clause wants two
consecutive zeros and has not got one yet. What the pattern actually shows is that the five
documents make more checkable claims than any single round samples — not that the loop is
oscillating. That is worth carrying into the plan's learnings rather than resolving by lowering the
bar.

### Round 4 of `P7-004` — four pass, and the repair is now the defect

Round 4 returned **four PASS** — README, the setup guide, the tutorial, and
`related-repositories.md` — with one FAIL on `CONTRIBUTING.md`. Both of its findings are defects in
`C-91` and `C-92`, this plan's own round-3 repairs, not in original text.

| Row  | Source         | Clause  | Defect                                                                                                                                                                                                                                                                                                      | Correction                                                                                                                  |
| ---- | -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| C-94 | voice reviewer | V8, V12 | `C-91` rewrote workflow step 4 with a recovery route but no expected outcome — half the clause, while the steps either side of it carry both. `C-92` rewrote five of the six bug-template bullets and left `**Logs/screenshots**: Any relevant error messages or screenshots` in the old circular register. | Step 4 now opens with what success looks like before the failure guidance; the sixth bullet now matches the five around it. |

The reviewer's own words for the second one are worth keeping: the four rewritten bullets continue
in lowercase from their label, "then this one restarts as a capitalized stock fragment" — a seam
audible on a read-aloud pass that no lexical sweep would have flagged, because every individual
bullet is well-formed.

**The pattern this exposes.** For two consecutive rounds the only surviving findings have been
introduced by the previous round's repair. That is a narrower, more tractable version of what
`plans/ideas/q2-not-urgent-important/review-loop-reviews-its-own-record.md` describes: the fix step
and the authoring step are the same step, so a repair aimed at one clause can breach another, and a
partial repair to a list leaves the list less consistent than it found it. Round 5 was therefore
briefed to check every earlier rewrite against all twelve clauses rather than only the clause it was
meant to satisfy, and to check what a partial repair left behind next to it.

### Round 5 of `P7-004` — four pass, and the neighbour of a repair again

| Row  | Source         | Clause  | Defect                                                                                                                                                                                         | Correction                                                                                                                                                                          |
| ---- | -------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-95 | voice reviewer | V12, V5 | One fact — that Volta applies the `package.json` pins — stated four times in 42 lines of `CONTRIBUTING.md`, three in the identical `Volta will automatically …` frame, two near word-for-word. | The redundant note folded into the prerequisites bullet; the post-install line now says the one new thing it carried; the `npm install` line now states what that command produces. |

Both round-4 repairs held, and the reviewer confirmed round 3's rewrites clear all twelve clauses
rather than only the one each was written for. The one finding came from its neighbour-consistency
sweep, and the diagnosis is worth quoting: line 49 is round-3 rewritten text carrying the sharper
formulation, while lines 59, 73, and 90 are "the untouched legacy neighbours the refresh did not
reach — corroborated by their being the only three unwrapped long lines in a file otherwise wrapped
at 100 columns." A layout artefact identified the un-refreshed text.

That is the **third consecutive round** whose only surviving finding sits beside a repair rather
than inside original prose. Zero occurrences of the repeated frame remain, confirmed with a control
that fires on a planted copy.

**Declined, with reasons — recorded so a later round need not re-derive them.** The reviewer
examined and dropped three candidates itself: V8 against `git pull origin main` (applying V8 to
every command would also fail `brew update` and `rustc --version`, which passed four rounds, so the
operative reading is commands whose result the reader must interpret); V8 against the setup guide's
pre-push block (its pre-commit sibling is equally outcome-less and no repair created the asymmetry);
and V3 against `monorepo` in the setup guide (V3 is qualified _for the intended audience_, and a
reader already installing Rust, Docker, and Playwright is not the newcomer the clause protects).

**Its own false zero, disclosed.** Its first banned-vocabulary sweep returned all zeros because BSD
awk does not support `\b`. It noticed, re-ran with `grep -E`, and found the two real `just`
occurrences — both in the "merely" sense that V7 does not reach. That is the fifth instance of this
hazard class in this iteration and the second where the checking tool, not the checked text, was
the thing that lied.

### Round 7 of `P7-003` — the repair was the defect again, and this time factually

Round 6 returned zero. Round 7 was briefed that a second zero would close `P7-003`, and that the
editorial rewrites landed after round 5 were the one thing round 6 had not swept. That is where it
found its finding.

| Row  | Source       | Severity | Defect                                                                                                                                                                                                                                                                                 | Correction                                                                                                                                                                   |
| ---- | ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-96 | docs checker | MEDIUM   | `C-91`'s workflow step 5 said `prettier --write` "prints each one it changed, so an empty list means everything was already formatted". Prettier prints a line for **every** file it reads and tags untouched ones `(unchanged)`; an empty list is a state the command cannot produce. | Step 5 now describes the real signal: a tagged line means untouched, an untagged line means reformatted, and a run with no untagged lines means nothing needed reformatting. |

Reproduced against the repository's own pinned `prettier` 3.8.1 with a control that distinguishes
the two cases: an unformatted probe file prints a bare `10ms` line and is rewritten; the same file on
a second run prints `11ms (unchanged)`. The reviewer reached the same conclusion independently and
corroborated it against two upstream Prettier issues. The other half of the same sentence — that the
pre-commit hook runs the same formatter — is accurate and was left alone.

**Four consecutive rounds, across both reviews.** `C-94`, `C-95`, and `C-96` are all defects this
plan's own repairs introduced, and the voice review's rounds 3, 4, and 5 show the same pattern from
the other side. Three were breaches of a different clause than the repair targeted or a neighbour
left in the old register. This one is worse: a repair written to satisfy a **voice** clause invented
a **factual** claim about tool behaviour, and only the factual checker could catch it. The two
reviews are not redundant, and running them alternately is what surfaced this.

The general form is that the fixer and the author are the same actor, so every repair is new
unreviewed prose — the mechanism
`plans/ideas/q2-not-urgent-important/review-loop-reviews-its-own-record.md` describes, here reaching
the shipping surface rather than only the plan's own record.

### Round 6 of `P7-004` — four pass, and a repetition the round-3 commit called deliberate

| Row  | Source         | Clause | Defect                                                                                                                                                                                                                                                                                                                                     | Correction                                                                                                                                                                                                            |
| ---- | -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-97 | voice reviewer | V12    | One fact — the tool checker is a Rust program, so the check fails without Cargo — stated three times in a 34-line run of the setup guide, all three in the identical `tool checker is a Rust program` frame. Occurrences 2 and 3 are near-verbatim, one introducing a code block and the other a comment inside it, on the same screenful. | Occurrence 1 keeps the full mechanism, since it is the only one explaining why Rust sits in Minimal rather than Full. Occurrence 2 now states the consequence and points back. Occurrence 3 names the step it serves. |

`CONTRIBUTING.md` passed this round, so `C-95` held. The remaining defect is one the round-3 commit
message recorded as **deliberate**: "Rust now appears in the prerequisites, in the Minimal setup
path, and as an explicit Quick Start step ahead of the bootstrap command, each stating why it is
needed there." Stating why it is needed _there_ was the right instinct; restating the same cause in
the same words three times inside one screenful was not. Repetition placed for a reader who arrives
mid-document reads as machine-assembled to a reader going top to bottom, and V12 judges the second
reader.

The correction is subtractive. That is deliberate: `C-94`, `C-95`, and `C-96` were all defects
introduced by additive repairs, so a repair that removes words cannot introduce a new claim to be
wrong about. One occurrence of the frame remains, confirmed with a control, and the step-4 comment's
new cross-reference to step 6 was checked against the block's actual numbering.

**Declined, with reasons — carried forward.** The reviewer examined and dropped two candidates
itself. `CONTRIBUTING.md` explains the postinstall exit-code mechanism twice, sharing a near-verbatim
clause, but the two serve distinct entry points — before-you-bootstrap and you-already-hit-the-symptom
— and a troubleshooting entry reached by symptom has to stand alone. And
`related-repositories.md`'s real-time-not-batched cadence appears four times with no repeated frame,
each clause doing different work: assertion, mechanism, rationale, directionality.

### Round 8 of `P7-003` — zero, and the first of a new pair

Zero findings across all five documents. Round 7's single finding (`C-97`) had reset the
two-consecutive-zero streak, so round 8 restarts the count rather than closing it — one more clean
round is required.

The round was told to prioritise the two changes it had never seen, and it verified both by
execution rather than by reading:

- **`CONTRIBUTING.md` step 5.** It ran the repo-pinned `prettier@3.8.1` directly and confirmed the
  claim `C-96` replaced the false one with: `--write` prints one line per file, tags untouched files
  `(unchanged)`, and leaves reformatted files untagged. It then traced the pre-commit claim through
  `.husky/pre-commit` → `gate run --surface=pre-commit` → `repo-config.yml` → `package.json`'s
  `lint-staged` block, and confirmed prettier is genuinely wired over staged files for each glob it
  claims to cover.
- **The setup guide's Quick Start.** It confirmed `"postinstall": "npm run doctor || true"` discards
  the exit code while a bare `npm run doctor` does not — the exact asymmetry the Minimal bullet
  asserts — and that `rhino-bin.sh` `exec`s the Rust binary with its real exit code, so the hooks do
  require Rust.

It also re-verified, from source rather than from a sibling document, the commitlint 100-character
limit (by feeding 65-, 100-, and 104-character messages to `commitlint --edit`), the `test:quick`
five-step composition, the 3-Nx-plus-13-`rhino-cli` pre-push split, the `beaver-nest` state via
`gh api`, the 5434-versus-5432 port distinction against the actual compose files, and the Rust
lint-component warning severity against `checker.rs`.

That is the first round in this review where every high-value claim was checked against the thing
itself and none moved.

### Round 7 of `P7-004` — terminal: all five documents pass

Zero findings. `P7-004`'s acceptance is that every file passes, and round 7 is the first round to
return five PASSes.

| Round | README | CONTRIBUTING | setup guide | tutorial | related-repos | Findings applied                             |
| ----- | ------ | ------------ | ----------- | -------- | ------------- | -------------------------------------------- |
| 1     | FAIL   | FAIL         | FAIL        | FAIL     | FAIL          | 11 (`C-09`…`C-19`), 4 declined               |
| 2     | FAIL   | FAIL         | FAIL        | FAIL     | FAIL          | 2 (`C-84`, `C-85`), 3 rejected as overstated |
| 3     | PASS   | FAIL         | PASS        | FAIL     | PASS          | 3 (`C-90`…`C-92`), 1 declined                |
| 4     | PASS   | FAIL         | PASS        | PASS     | PASS          | 1 (`C-94`)                                   |
| 5     | PASS   | FAIL         | PASS        | PASS     | PASS          | 1 (`C-95`), 3 declined                       |
| 6     | PASS   | PASS         | FAIL        | PASS     | PASS          | 1 (`C-97`), 2 declined                       |
| 7     | PASS   | PASS         | PASS        | PASS     | PASS          | **0**                                        |

What moved the review from "FAIL everything with forty findings" to a per-document verdict was not a
weaker reviewer. Rounds 1 and 2 judged against an open-ended sense of quality; from round 3 the
twelve clauses were made the exclusive judging surface, every finding had to quote its text and cite
a clause, and PASS was stated up front as a legitimate outcome. Round 2 had three of five HIGHs fail
verification; rounds 3 through 7 had **none** — every finding held, and each round additionally
recorded the candidates it examined and dropped, with reasons, so no later round re-derived them.

Round 7 confirmed both of the changes it had never seen. On the subtractive `C-97` repair it made a
point worth keeping: the terser step-4 comment does not under-serve `V8`, because `V8`'s outcome
limb was always carried by the `rustc --version   # Expected: a version line…` line below the
command — the words removed sat _before_ the command and were never doing post-command work. And it
observed that the six Quick Start comments now read as one consistent run, so the repair removed the
outlier rather than creating one. That is the first repair in this iteration that improved its
neighbourhood instead of disturbing it.

It also hit, and caught, the zsh unquoted-variable false zero — the sixth instance of that hazard
class here, and the third time a reviewer's own tooling was the thing that lied.

### Round 9 of `P7-003` — terminal: the second consecutive zero

Zero findings. Rounds 8 and 9 are the consecutive pair `P7-003`'s acceptance requires, so the
factual-accuracy loop terminates here alongside `P7-004`, which terminated at voice round 7.

| Round | Findings | Corrections produced        |
| ----- | -------- | --------------------------- |
| 1     | 10       | `C-06`, `C-07`              |
| 2     | 5        | `C-81`…`C-85`               |
| 3     | 1        | `C-88`                      |
| 4     | 1        | `C-89` (plus a class sweep) |
| 5     | 1        | `C-93`                      |
| 6     | 0        | —                           |
| 7     | 1        | `C-96`                      |
| 8     | 0        | —                           |
| 9     | **0**    | —                           |

Round 9 was told explicitly that rounds 6 and 8 had already returned zero, and it re-derived its
verdicts from source anyway rather than inheriting them. It pinned `header-max-length: 100` and the
eleven-entry type enum by reading `@commitlint/config-conventional`'s compiled `lib/index.js`; it
dated the polyglot-demo removal banner by running `git log --diff-filter=D` and getting commit
`8bcc5c019` on 2026-04-18; it read the two compose files to confirm `5434:5432` against `5432:5432`;
and it confirmed the tutorial's success criteria by reading the literal `<h1>` string out of
`hero.tsx`.

One decline is worth keeping, because it is the kind of finding a weaker round would have reported.
`CONTRIBUTING.md`'s file-naming examples (`api-gateway`, `admin-dashboard`) use no suffix from the
type vocabulary in `app-naming-types.md`. The round searched `apps/rhino-cli/src/` for enforcement of
that vocabulary, found none, observed that the target document never claims the list is closed, and
dropped it as an illustration rather than a falsifiable claim. That is the correct call: the
examples demonstrate the `[domain]-[type]` shape, and a shape example does not inherit a
vocabulary's closure unless the vocabulary declares it.

The round's own false-zero audit is the first in this review to report that no negative result was
trusted blind — every zero it relied on was either itself a positive hit or corroborated by one, and
where RTK truncated a command's output it re-ran through a different path rather than accepting the
apparent mismatch.

### Why the loop took nine rounds

Worth stating plainly, because the count looks like thrash and mostly was not:

- **Rounds 1 and 2 (15 findings)** were the genuine backlog — defects that had been in these
  documents before the plan started.
- **Rounds 3, 4, and 5 (3 findings)** each reached territory no earlier round had examined. Round 4's
  `C-89` is the clearest case: it found a governance document quoting an error string commitlint
  never emits, under a `FAIL:` example that actually passes.
- **Round 7 (1 finding)** found a defect this plan's own repair had introduced — `C-91` had invented
  a false claim about `prettier --write` while satisfying a voice clause. That is the
  review-loop-reviews-its-own-record mechanism reaching the shipping surface.
- **Rounds 6, 8, and 9 (0 findings)** were clean.

The response to round 7 was to make the next repair (`C-97`) deliberately subtractive — a repair that
removes words cannot introduce a new claim to be wrong about — and to run both lenses against the
same state concurrently instead of alternating. Both changes held: nothing found a defect after
`C-97`.

### Rejected findings

The voice reviewer returned a FAIL verdict on all five documents with roughly forty findings. Three
of its five HIGH findings did not survive verification and were not applied:

- **README "focused check" is undefined.** The term is introduced in the same sentence that routes
  the reader to the tutorial, and the tutorial defines it at its line 97 with the exact command
  (`npm run doctor -- --fix --tools git,volta,node,npm`). Not a broken run path.
- **The tutorial's `npm install` step strands a reader whose Cargo install failed.** The tutorial
  installs Rust before that step, verifies `cargo --version`, gives recovery inline, and carries a
  dedicated `volta` or `cargo` is not found troubleshooting entry. The reader is caught earlier.
- **The "two sibling repositories" count misleads.** Defensible as written, and `P7-005` had
  already cross-read this claim across the document set.

The remainder were style preferences against clauses already measured clean. They are not applied
and not carried forward as debt.

### Out-of-scope follow-up

The repository has no root `CODE_OF_CONDUCT.md`, which
`repo-governance/conventions/writing/oss-documentation/code-of-conduct.md` requires, including a
reporting mechanism. Authoring one means choosing a covenant and publishing a contact address —
a governance decision with personal-data implications, outside a documentation-refresh plan.
`C-84` makes the prose true; it does not close the governance gap.

### Method failure caught during this iteration

Passing three paths through an unquoted shell variable to `prettier` and `markdownlint-cli2`
produced a false green from both: prettier reported no matching file and markdownlint reported
`Linting: 0 file(s)`, and both exited 0. Re-run with the paths written out, the same commands
linted three files and passed for real. A gate's exit code is only meaningful next to its file
count.

## File-Touch Ledger

| Path                                                                                               | Change                                                                                                                                                         | Owning Row                                                |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `CONTRIBUTING.md`                                                                                  | Platform statement, prerequisites, intake caveat, Diátaxis gloss; commit types; Code of Conduct; header length; command outcomes, filler, and Volta repetition | C-01…C-05, C-82, C-84, C-89, C-91, C-92, C-94, C-95, C-96 |
| `docs/how-to/setup-development-environment.md`                                                     | Quick Start Rust step and renumbering; integration port; cargo tool attribution; pre-push claim; Rust-reason repetition                                        | C-06, C-07, C-81, C-83, C-88, C-97                        |
| `README.md`                                                                                        | WSL2 expansion; Rust bullet accuracy; changed-port guidance                                                                                                    | C-08, C-21, C-24                                          |
| `docs/tutorials/getting-started-with-ose-public.md`                                                | Lead paragraph, spelling, platform wording, Cargo reason; Nx gloss                                                                                             | C-21, C-25, C-90                                          |
| `docs/reference/related-repositories.md`                                                           | Retired-sandbox row corrected to infrastructure work; executor instruction removed; beaver-nest fork claim                                                     | voice rows, C-85, C-93                                    |
| `plans/in-progress/…/evidence/phase-6-*`                                                           | Documented-breakpoint capture and its transcript                                                                                                               | C-23                                                      |
| `plans/in-progress/…/delivery.md`                                                                  | Phase 5–7 ticks and notes                                                                                                                                      | plan records                                              |
| `plans/in-progress/…/artifacts/*.md`                                                               | Ledger re-run, public record, this record                                                                                                                      | plan records                                              |
| `plans/in-progress/…/evidence/*`                                                                   | Phase 5A and 5B journey evidence                                                                                                                               | plan records                                              |
| `repo-governance/development/workflow/commit-messages/valid-commit-types.md`                       | commit-type consistency sweep                                                                                                                                  | C-86                                                      |
| `repo-governance/development/infra/ci-conventions/git-hooks-standard-pre-commit-and-commit-msg.md` | commit-type consistency sweep                                                                                                                                  | C-86                                                      |
| `docs/reference/system-architecture/ci-cd.md`                                                      | commit-type consistency sweep                                                                                                                                  | C-86                                                      |
| `.claude/skills/swe-developing-applications-common/reference/git-workflow.md`                      | commit-type consistency sweep                                                                                                                                  | C-86                                                      |
| `.agents/skills/swe-developing-applications-common/reference/git-workflow.md`                      | generated mirror of the above                                                                                                                                  | C-86                                                      |
| `repo-governance/development/workflow/commit-messages/common-errors-and-fixes.md`                  | header-length error string and failing example                                                                                                                 | C-89                                                      |
| `repo-governance/development/workflow/commit-messages/the-format-explained.md`                     | header-length rule reframed as a target                                                                                                                        | C-89                                                      |
| `plans/ideas/q1-urgent-important/rhino-cli-parity-propagation-optimize-cis.md`                     | same beaver-nest claim, pinned to a date                                                                                                                       | C-93                                                      |
