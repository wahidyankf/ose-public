# Learnings: repository-onboarding-readme-refresh

<!-- Append generalizable, sanitized observations during execution. -->
<!-- Never copy secrets or sensitive private-repository facts into this file. -->
<!-- Triage every entry before archival, or record the explicit none escape. -->

## L-001 — `rhino-cli` exit codes cannot prove a subcommand exists

**Phase**: 0 (P0-003A) · **Date**: 2026-08-20 · **Routing**: idea — fold into
[`plans/ideas/q2-not-urgent-important/doc-command-existence-validation.md`](../../ideas/q2-not-urgent-important/doc-command-existence-validation.md),
which proposes exactly the validator this trap would break

A `rhino-cli` command group requires a subcommand, so `rhino-cli md --help` exits `2` with
`error: 'rhino-cli md' requires a subcommand but one was not provided`. `rhino-cli help md mermaid`
also exits `2` even though it prints the full help page successfully. Any existence check written as
`cmd --help && echo ok` therefore reports every real subcommand as missing.

**How to apply**: verify a subcommand by parsing the `Commands:` section of
`rhino-bin.sh --no-color help <group> <subcommand>`, never by its exit status. Pass `--no-color`
so ANSI escapes do not defeat the parser.

## L-002 — A plan's transcribed gate list is a subset, not the registry

**Phase**: 0 (P0-003/P0-003A) · **Date**: 2026-08-20 · **Routing**: idea — fold into
[`plans/ideas/q1-urgent-important/plan-checker-forward-reference-detection.md`](../../ideas/q1-urgent-important/plan-checker-forward-reference-detection.md),
the same shape of gap: `plan-checker` validates a plan's structure, not whether its claims about
the repository hold

The live `pre-commit` registry declares 29 entries; this plan transcribed eight. The gap was benign
for most of them (language formatters a documentation diff never triggers) but hid three gates that
genuinely fire on this plan's own footprint: `repo-config validate`, `convention emoji validate`,
and `git lockfile sync`.

**How to apply**: when a plan transcribes a gate list, reconcile it in both directions at Phase 0 —
not only "does every transcribed command exist" but also "which live gates does the transcription
omit that this plan's declared file footprint can trip."

## L-003 — `npm run lint:md` walks into the untracked `.fvm-cache/` SDK

**Phase**: 0 (P0-005) · **Date**: 2026-08-20 · **Routing**: idea — folded into
[`plans/ideas/q1-urgent-important/markdownlint-ci-gate-lints-zero-files.md`](../../ideas/q1-urgent-important/markdownlint-ci-gate-lints-zero-files.md).
The Phase 0 note said "file as a `plans/backlog/` item"; the backlog index requires promotion from a
two-pager first, and a brief on the same gate's opposite failure already existed, so the fold is the
correct route. Still not fixed inline

`.fvm-cache/` is gitignored (`.gitignore:198`) and holds a vendored Flutter SDK, but it appears in
neither `.markdownlintignore` nor the `ignores` array of `.markdownlint-cli2.jsonc`. The
`markdownlint-cli2 "**/*.md"` glob therefore walks into it, and `npm run lint:md` reports 565 errors
from third-party SDK documentation. Every one of those errors is phantom: zero markdownlint errors
exist in tracked repository content. The failure is invisible to CI, which scopes to affected files.

**How to apply**: a repo-wide `**/*.md` script needs its ignore list kept in sync with `.gitignore`
for vendored trees, or a red baseline trains readers to ignore the gate. Adding one `.fvm-cache/`
line to `.markdownlintignore` would restore the signal.

## L-004 — `governance readme-index validate` prints FAILED but exits 0

**Phase**: 0 (P0-009) · **Date**: 2026-08-20 · **Routing**: **code-homed** — `apps/rhino-cli`, so the
Code-Routing Downstream Rule makes a `plans/backlog/` plan mandatory and forbids an inline fix.
Filed as a fourth workstream in the existing
[`plans/backlog/rhino-cli-governance-tooling-defects/`](../../backlog/rhino-cli-governance-tooling-defects/README.md),
whose stated subject is exactly this defect shape: a tool that exits 0 while reporting failure

`gate run --surface=pre-push` exits 0 while its own output contains
`README INDEX AUDIT FAILED: 425 finding(s)`. Running the validator alone reproduces it: the audit
prints `FAILED`, lists every finding, and still exits `0`.

Reading the source at Phase 8 sharpened this. The exit code is **correct**: all 425 findings are
kind `unannotated`, which `has_failing_finding` deliberately dark-launches — with `--fail-kinds`
empty every kind gates except that one, and only the `governance-readme-completeness` gate arms it.
The 425 split 163 in `docs/` and 262 in `specs/`; `repo-governance/` and `.claude/` contribute none.
So the defect is narrower and more interesting than "the two signals disagree": `format_text` counts
every finding and says `FAILED` without consulting the filter that decides the exit code, which
defeats the purpose of dark-launching a kind. A line that always reads `FAILED` above a green gate
is a line readers stop reading.

**How to apply**: when a gate's acceptance is "exits 0", record the exit code **and** scan the
output for a textual failure verdict — but before filing the disagreement as a defect, find which of
the two the tool actually intends. Here the intent was legible only in a doc comment on a private
function, and the imprecise version of this entry survived seven phases before anyone read it.

## L-005 — The per-gate tick/task count assertion is what catches a silent no-op tick

**Phase**: 0 (P0-G01) · **Date**: 2026-08-20 · **Routing**: execution technique — the Atomic Sync
Ritual already binds it; this entry records the evidence for running the count at every gate rather
than only at plan end. No repository change required

P0-006A's implementation notes were written and its task closed, but its checkbox stayed `- [ ]`.
Nothing errored: the notes edit succeeded, the task list looked correct, and only the phase-gate
assertion `count('- [x]') == count(completed tasks)` exposed the gap — 13 ticks against 14 closed
tasks. Anchoring the tick edit on the literal `- [ ]` marker makes such an edit fail loudly, but it
cannot help when the tick edit is simply never issued.

**How to apply**: run the independent count at **every** phase gate, not only at plan end. It is the
only instrument that detects a tick that was never attempted, as opposed to one that mis-anchored.

## L-006 — `git ls-tree` silently returns nothing for a `*.md` pathspec

**Phase**: 1 (P1-001/P1-002) · **Date**: 2026-08-20 · **Routing**: idea — fold into
[`plans/ideas/q1-urgent-important/acceptance-clause-vacuity.md`](../../ideas/q1-urgent-important/acceptance-clause-vacuity.md).
An inventory clause that passes trivially on an empty list is a vacuous clause; this is that brief's
thesis reached from a different direction

`git ls-tree -r --name-only <sha> -- '*.md'` returns **zero** paths and exits 0. `git ls-tree` does
not accept glob pathspec magic — `:(glob)` fails outright with
`pathspec magic not supported by this command` — so the wildcard is matched literally and nothing
hits. The same wildcard works with `git ls-files`, which is why the form reads as correct. At the
recorded revision the true count is 9,294; the pathspec form reported 0.

This is the dangerous shape of a false zero: an inventory step whose acceptance is "every path is
classified" passes trivially on an empty list. Three plan sites carried the broken form.

**How to apply**: enumerate a revision's files with
`git ls-tree -r --name-only <sha> | grep -E '\.md$'`, and give every inventory acceptance clause a
non-zero floor plus a cross-check against an independent enumerator (`git ls-files '*.md'`) so an
empty result fails instead of passing.

## L-007 — A repo-wide validator cannot serve as a per-row acceptance gate

**Phase**: 1 (P1-G01) · **Date**: 2026-08-20 · **Routing**: idea — fold into
[`plans/ideas/q1-urgent-important/acceptance-clause-vacuity.md`](../../ideas/q1-urgent-important/acceptance-clause-vacuity.md).
This is the never-pass pole of that brief's already-pass/never-pass pair, at a scale it has not yet
recorded: 745 rows sharing one unsatisfiable clause

745 of the ledger's 814 rows shared one acceptance template naming bare `md links validate`. The
command is repo-wide and unscoped, and at the recorded revision it reports `found 312 broken links`
— every one of them inside `plans/done/**`, a tree the same ledger classifies `historical-exempt`
and forbids editing. The clause therefore could never pass for any row, no matter what the executor
did to that row's own document. The inverse failure is just as easy to write: a repo-wide validator
that is already green makes every row's acceptance pass without the row being touched.

The independent reviewer at the phase gate found this; none of the seven preceding self-checks did,
because each of them read the clause as well-formed rather than executing it.

**How to apply**: when a per-item acceptance names a repository-wide validator, either scope the
command to the item (`--exclude` the exempt trees, or filter its output to the item's own section)
or state explicitly how the executor reads a single item's verdict out of a global report. Then run
it once as literally written and confirm the verdict it returns today is the one the clause expects
**before** the edit — a clause that is already-pass or never-pass is not an acceptance criterion.

## L-008 — A fact check on documentation must know what is a claim

**Phase**: 1 (P1-G01) · **Date**: 2026-08-20 · **Routing**: idea — fold into
[`plans/ideas/q1-urgent-important/acceptance-clause-vacuity.md`](../../ideas/q1-urgent-important/acceptance-clause-vacuity.md)
as the carve-out hazard: a clause needs an exemption to avoid failing honest text, and the exemption
is itself a loophole unless it passes on a stated framing being present

The ledger's shared acceptance clause said "every npm script the document names resolves." Swept
across the corpus that is wrong four times over. `docs/explanation/.../fe-react/build-deployment.md`
names `npm run test:ci` and `npm run deploy` inside a fenced GitHub Actions example teaching a
general React pattern — those are not claims about this repository at all.
`.../c4-architecture-model/tooling-standards.md` names `npm run validate:diagrams` three times, each
explicitly labelled "Future" or "Implementation pending" — the document is already accurate, and a
literal check would fail it for being honest. Meanwhile its sibling
`.../c4-architecture-model/README.md` names the same non-existent script with no qualifier, which is
a real defect the check should catch.

Same string, three different verdicts. A mechanical resolution check cannot tell them apart, so the
clause has to carry the distinction itself.

**How to apply**: before writing "every X the document names must resolve", ask what makes something
a claim. Exempt mentions the document frames as generic illustration or labels future/planned, and
say the exempt mention passes _on that framing being present_ — otherwise the carve-out becomes a
loophole any unresolvable command can hide behind. The check then fails exactly the case that
deserves to fail: an unresolvable command presented as current.

## L-009 — A third repo-wide Markdown validator is red, and one tree is unfixable here

**Phase**: 2 (P2-008) · **Date**: 2026-08-20 · **Routing**: idea — folded into
[`plans/ideas/q2-not-urgent-important/ayokoding-mermaid-diagram-remediation.md`](../../ideas/q2-not-urgent-important/ayokoding-mermaid-diagram-remediation.md),
which already owns the only one of the three trees that is remediation work. Same correction as
[[L-003]]: a backlog folder requires promotion from a two-pager. Still not fixed inline

Run unscoped, `md mermaid validate` reports 786 violations and 17 warnings across 1,165 files:
588 `label_too_long`, 198 `width_exceeded`, 17 `subgraph_density`. They sit in three trees —
`apps/ayokoding-www` (256 files), `plans/done` (32), and `apps/rhino-cli` (4). This is the third
repo-wide Markdown validator found red at a green gate surface, after `format:md:check` and
`lint:md` in Phase 0.

The gate surface stays green because the registry scopes `md-mermaid` to `affected-file-type`, so it
only ever sees staged files. Zero violations exist in this plan's own tree, and both `gate run`
surfaces exit 0 on the staged set.

Two of the three trees are ordinary backlog work. The other two are not what they look like.

All four `apps/rhino-cli` files sit under `tests/fixtures/state/` and are in the parity manifest.
Reading one settles it: `03-long-state-label.md` contains a state literally named
`ThisLabelIsLongerThan30CharsAndFails`. These are **negative fixtures** — inputs authored to make the
validator fail, so that the validator's own tests can assert it does. "Fixing" them would break the
suite that proves the gate works, and they are byte-identical with the private sibling besides, so an edit
would open a cross-repository obligation for a change that should never be made.

`plans/done` is `historical-exempt` by this plan's own Classification Rule 3, so its 32 files want an
ignore-list entry rather than 32 rewrites of completed work.

**How to apply**: when filing a red-baseline follow-up, split the finding by what can actually be
fixed where, and open one failing file before assuming any of them is a defect. A single "fix 786
mermaid violations" item is not executable — it silently contains a set of deliberate negative
fixtures that must stay broken, a historical subset that wants an ignore-list entry rather than an
edit, and only then some real content to fix.

## L-010 — Enumerate a false claim by vocabulary, not by the line numbers a reviewer hands you

**Phase**: 2 (P2-009) · **Date**: 2026-08-20 · **Routing**: idea — fold into
[`plans/ideas/q2-not-urgent-important/class-sweep-completeness.md`](../../ideas/q2-not-urgent-important/class-sweep-completeness.md)
as a fourth missed-site shape: the definitional site, which re-injects the error into every
downstream use of the term

An independent reviewer found the ledger asserting that `apps/rhino-cli/**` and
`specs/apps/rhino/behavior/rhino-cli/**` are byte-identical with the private sibling. The real boundary is
seven pathspecs in `BOUNDARY_PATHS`, and of the 27 `identity-bound` Markdown paths exactly 25 are in
the 603-entry parity manifest. The reviewer named four sites. I fixed those four. The next pass
found the claim alive at two more — including the vocabulary entry that _defines_ the label the fix
was about, sitting 1,150 lines above the correction.

Only the third pass closed it, and it closed because the method changed: instead of patching the
cited line numbers, I grepped the whole plan directory for every term in the claim's vocabulary
(`byte-identical`, `byte identity`, `identity-bound`, `identity boundary`, `zero carve-outs`),
classified all 47 hits as definition, assertion, or incidental reference, and rewrote every
definition and assertion. The reviewer then enumerated independently and found no seventh site.

Two of the six sites were ones neither of us had looked at, and one of those carried a second,
unrelated error — it claimed the paths were audited `verified-unchanged` while the ledger recorded
them `identity-bound`.

**How to apply**: a reviewer's line numbers are a sample, not the population. When a finding is
"this claim is false", the unit of repair is the claim, so enumerate every place the claim's
vocabulary appears across every file in the delivery unit, and give each site a verdict. Check the
definitional sites first — a wrong definition re-injects the error into every downstream use of the
term, including the ones you just fixed. See [[feedback_fix_the_class_not_the_named_sites]].

## L-011 — A declared exemption can be inert, and only a negative control shows it

**Phase**: 3 (P3-005) · **Date**: 2026-08-20 · **Routing**: repository configuration — route to the
existing [`plans/backlog/file-naming-convention-rework/`](../../backlog/file-naming-convention-rework/README.md)
plan, which already owns the hard-coded exempt-basename list; do not fix inline and do not open a new
backlog item. Folded in at Phase 8 as that plan's tech-docs § 4A, because deleting the inert
declaration before its WS-B1 lands would arm a failure for whoever lands it

`CONTRIBUTING.md` is declared exempt from `md naming validate` in two places that agree exactly: the
`lint-staged` `*.md` command in `package.json` and the `md-naming` gate entry in `repo-config.yml`.
The exemption does nothing, and it is inert for **two independent reasons**, either of which alone
would suffice. First, the gate invocation passes no paths, so the validator falls back to its
built-in default scan roots — `docs/` and `repo-governance/`, never the repository root where
`CONTRIBUTING.md` lives (`md_validate_naming.rs`, `DEFAULT_PATHS`); its own success line says
`DOCS NAMING VALIDATION PASSED`. Second, even on the `lint-staged` path, which _does_ hand the
staged file to the validator as a positional argument and therefore does reach the root,
`CONTRIBUTING.md` is one of nine basenames hard-coded exempt inside the validator itself
(`docs/naming.rs`, `is_naming_exempt`), guarded by its own regression test. Running
`md naming validate CONTRIBUTING.md` with no `--exempt` flag at all exits 0.

Finding only the first reason would have been worse than finding neither, because it suggests a fix
— widen the scan scope — that would not change the outcome.

Three negative controls settled it. A `BAD-NAME.md` in `docs/` is flagged with the expected rule
(`violates lowercase-kebab-case rule (^[a-z0-9-]+\.md$)`) and exits 1. The identical file at the
repository root is not flagged. The identical file under gitignored `local-tmp/` is not flagged
either.

That last one matters twice over, because this plan's own acceptance clause told the executor to put
the control in `local-tmp/`. Following it literally produces an unflagged control, which reads as
either a broken validator or nothing at all — a clause that cannot fail is not a control.

Deleting the exemption is not this plan's call. Under the validator as it stands today it is pure
redundancy, but it is redundancy against a hard-coded list that
`plans/backlog/file-naming-convention-rework/` proposes to make configurable — and the moment that
list moves into configuration, the `repo-config.yml` declaration stops being redundant and starts
being the thing that carries the exemption. Removing it now would arm a failure for whoever lands
that plan. What matters here is _knowing_ it is currently inert, so nobody cites it as evidence the
repository root is protected.

**How to apply**: an exemption is a claim that something would otherwise fail. Test that claim by
removing the exemption, not by observing the gate pass with it. Place the negative control where the
validator actually looks — confirm its scan scope first, or the control proves nothing. And once one
reason for inertness is found, keep going: a second, independent reason changes what the fix is, and
stopping at the first one hands the next reader a repair that repairs nothing.

## L-012 — A linter's "0 errors" is only trustworthy next to its file count

**Phase**: 3 (P3-007) · **Date**: 2026-08-20 · **Routing**: execution technique — applies to every
remaining sweep in Phases 7 and 8, no repository change required

Verifying three edited documents, `markdownlint-cli2` printed `Summary: 0 error(s)` and Prettier
printed `All matched files use Prettier code style!`. Both were false. The file list had been held in
a shell variable and passed unquoted, and this shell does not word-split an unquoted variable, so
both tools received one argument that was the three paths joined by spaces. No such file exists.
`markdownlint-cli2` said so in the line directly above its summary — `Linting: 0 file(s)` — and
Prettier said so in a line its own success message contradicts: `[error] No files matching the
pattern were found`. Re-run with the paths written out, the same commands report `Linting: 3 file(s)`
and a genuine clean result.

A tool that lints nothing and a tool that lints everything successfully print the same summary. The
summary is not the evidence; the count is.

**How to apply**: when a check is meant to prove something about N specific files, assert that the
tool processed N files before believing its verdict. Prefer writing the paths literally into the
command over expanding a variable — and when a list must be a variable, print the processed count
and compare it against the expected one. See [[feedback_zsh_no_word_split_in_bash_tool]] and
[[feedback_benchmark_harness_false_zeros]].

## L-013 — A gate run before the last edit proves nothing about the commit

**Phase**: 3 (P3-014) · **Date**: 2026-08-20 · **Routing**: execution technique — applies to every
remaining unit in Phases 6, 8, and 9, no repository change required

This unit ran its full gate surface in P3-011 and then, in P3-012, ran a README maker-checker-fixer
cycle that rewrote reader-facing prose. Both steps passed on their own terms, so the unit was
committed. The push was then rejected: `README.md` had grown to 934 words against the 900-word fail
limit that the `governance-word-budget` gate enforces. The branch had started at 838 words, so the
overrun was created entirely by the P3-012 rewrite — the exact window the P3-011 gate run could not
see. The checklist ordering made this look correct at every individual step, which is what let it
through.

Content-quality cycles and mechanical gates measure different things, and a content cycle that
improves prose can move a file across a mechanical threshold the cycle knows nothing about.
Ordering gates before content work leaves that class of regression undetectable until push.

**How to apply**: treat the gate surface as a terminal step, not a phase-ordered one — re-run it
after the last edit of any kind, including edits produced by a quality cycle that has its own
passing verdict. When a checklist places a gate step before a content step, run the gate again
before commit rather than trusting the earlier green. See
[[feedback_word_budget_trips_on_small_governance_edits]].

## L-014 — A deferral needs the same measurement rigor as the work you did

**Phase**: 3 (P3-016) · **Date**: 2026-08-20 · **Routing**: execution technique — applies to every
deferral recorded in Phases 6 through 9, no repository change required

This unit fixed one stale-name class (`wahidyankf-web`, 31 occurrences in 11 files, each verified)
and deferred a second one (`ayokoding-web`, `ose-web`). The fixed class was counted exactly. The
deferred class was written down as "16 in-scope files" and "14" — a figure narrow enough that a
reader would size the follow-up at roughly the same effort as the work already done. Re-measuring it
gives 231 and 83 tracked files outside `plans/done/`, reaching directory names and workflow
filenames. The deferral was still the right call, and the corrected number is what makes that
obvious rather than debatable.

The asymmetry is the trap: what you fix gets counted because the count is the acceptance evidence,
while what you defer gets estimated because nothing forces a number.

**How to apply**: measure a deferral before recording it, with the same command you would use to
accept the fix, and state the scope the number covers — a bare count invites the reader to assume
the widest scope. When a later step re-derives the figure and it disagrees, correct the original
record rather than carrying two numbers. See [[feedback_acceptance_clauses_falsifiable_both_directions]].
