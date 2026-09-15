<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: update-tmp-folders

Each entry records what execution actually surfaced, then the litmus test — _would a durable surface
catch this automatically next time?_ — and the terminal state that answer produced.

## L-1 — A plan's "single line" claim needs a recorded grep count behind it

**What happened.** `delivery.md` deferred the suppression-ledger move to Phase 4 on the premise that
it was "a single `.known-false-positives.md` line". The real count was 26 lines across 24 files
under `.claude/`, plus 11 more under `repo-governance/`. Splitting on the stated premise would have
left the repository naming two different ledger locations inside one PR. The delivery unit was
re-cut: all path references moved in DU-1, the file and the code default one PR later.

**Litmus.** Yes. A plan-authoring rule can require any "only N occurrences" claim to carry the
command and count that produced it, which turns an assumption into a checkable artifact.

**Terminal state.** Routed inline — `repo-governance/conventions/structure/plans/`.

## L-2 — The two repos' npm script names have diverged; never reuse a script name across them

**What happened.** `npm run harness:bindings-validation` exists only in `ose-public`;
the private sibling spells the same underlying command `validate:harness-bindings`. Separately, the plan
named the Markdown linter `md:lint` in four places; the real script in both repos is `lint:md`, and
`md:lint` exists in neither.

**Litmus.** Yes. The durable form is a rule that a cross-repo plan resolves script names per
repository against each `package.json`, rather than assuming symmetry.

**Terminal state.** Routed inline — `repo-governance/conventions/structure/related-repositories/`.

## L-3 — `git merge --ff-only origin/main` cannot work in a worktree after a squash merge

**What happened.** Twice (Phases 3 and 4) the post-merge refresh failed: a squash merge creates a
commit with no ancestry shared with the branch it squashed, so fast-forward is not merely refused,
it is undefined. The correct move is to verify `git diff HEAD origin/main` is empty — proving the
branch carries nothing the merge dropped — and then `git checkout -B <branch> origin/main`. No
`reset --hard`: uncommitted edits in the worktree survive `checkout -B`, and that was checked rather
than assumed.

**Litmus.** Yes. This is a mechanical git-workflow step that a convention can state once.

**Terminal state.** Routed inline — `repo-governance/development/workflow/`.

## L-4 — `--force-with-lease` "stale info" after a merge is usually a deleted branch, not a lease conflict

**What happened.** Three consecutive `--force-with-lease` rejections were first read as a lease
conflict. They were not. `ose-public` sets `delete_branch_on_merge: true`, so GitHub deleted the
remote branch at merge and `git ls-remote` returned empty — there was no remote ref for the lease to
compare against. `git fetch origin --prune` followed by a plain `git push -u` was the whole fix; no
force of any kind was needed. The two repos differ here: the private sibling sets
`delete_branch_on_merge: false`, so its branches survive a merge and must be deleted explicitly.

**Litmus.** Yes — both the diagnostic and the per-repo setting difference are durable facts.

**Terminal state.** Routed inline — `repo-governance/development/workflow/`.

## L-5 — `parity manifest generate` refuses to run against unstaged boundary files

**What happened.** Regenerating `apps/rhino-cli/parity-manifest.sha256` failed until the boundary
files it hashes were staged. The working sequence is: `git add` the boundary files, generate, then
stage the manifest.

**Litmus.** Yes. It is a fixed command ordering, and discovering it by failure costs a cycle every
time.

**Terminal state.** Routed inline — `repo-governance/conventions/structure/related-repositories/`.

## L-6 — `local-tmp/` is invisible to `md naming validate`, and not for the reason it looks like

**What happened.** Report filenames use double underscores, which the naming gate would normally
reject. `generated-reports` appears in `Md.fs`'s `namingSkipDirs`; `local-tmp` does not, which
looked like a live risk for the whole move. Probing settled it: a real
`local-tmp/docs/docs__a1b2c3__2026-09-04--12-00__audit.md` was written and `md naming validate`
passed, proving the walker never descends into `local-tmp/` at all. The probe file was removed.

**Litmus.** Yes. Someone will eventually read `namingSkipDirs`, notice the asymmetry, and "fix" it;
recording why the asymmetry is harmless prevents that.

**Terminal state.** Routed inline — `repo-governance/development/infra/temporary-files/`.

## L-7 — Family tokens are per-repository, so the same collision can resolve differently in each repo

**What happened.** The take-over-execution family resolves to `plan-takeover-execution` in
`ose-public` and `plan-take-over-execution` in the private sibling. Both follow the same rule —
declaration wins over filename — applied to each repository's own declarations. Forcing a match
would have renamed ~50 files for cosmetic symmetry.

**Litmus.** Yes, and the durable surface already exists: `local-tmp.md`'s
"declared, never derived" paragraph shipped in this plan. What it did not yet say is that the scope
of a declaration is one repository.

**Terminal state.** Routed inline — `repo-governance/development/infra/temporary-files/local-tmp*`.

## L-8 — zsh does not word-split an unquoted parameter

**What happened.** `$R $g`, with `g="md links validate"`, passed the whole string as a single
argument and produced a bare "unrecognized or not-yet-routed invocation" — a message that reads like
a missing command rather than a quoting bug. `${=g}` fixes it.

**Litmus.** No durable surface catches this: it is a property of the shell, it produces a
misleading error, and the fix is one character. Recording it as a rule would add a line nobody reads
at the moment they need it.

**Terminal state.** Discarded — shell-idiom knowledge with no durable home that would fire at the
point of failure.

## L-9 — Background feedback can be factually wrong and must be checked against the repository

**What happened.** A stop-hook message asserted that `scaffold-plan-archival-cleanup` "is not
mentioned as being executed at all". It had been completed and archived in the prior segment
(`ose-public` PRs #468, #469, #470, #472; the private sibling's PR #153; archived to
`plans/done/2026-09-04__scaffold-plan-archival-cleanup/`).

**Litmus.** No. The general principle — verify a claim against the repository before acting on it —
is already the Root Cause Orientation principle, and restating it for one class of message would
duplicate an existing rule rather than add coverage.

**Terminal state.** Discarded — already covered by an existing principle.

## L-10 — A file count is not an inventory; list a directory before deleting it

**What happened.** Phase 6 sweeps `generated-reports/` in every checkout. Its only stated guard is
`.known-false-positives.md`. Executing it against `ose-public` I recorded the entry count (492) and
deleted, without listing what was in there. Listing the private sibling's copy afterwards showed three
`.execution-chain-*` files alongside the reports — cross-family state that the rule this very plan
introduced says belongs at the `local-tmp/` root. So `ose-public`'s sweep almost certainly deleted
its own chain files, and I cannot now prove otherwise, because I kept a number instead of a listing.

The outcome happens to be correct: every rule and skill surface in both repositories now points
chains at `local-tmp/`, so a chain file under `generated-reports/` sat at a path nothing reads, and
relocating a stale one would only let a future report claim parentage from an unrelated finished
run. The private sibling was swept the same way deliberately, having reasoned it through rather than
having got there by accident.

**Litmus.** Yes, twice over. The convention can state which files a legacy sweep must relocate and
which it must not, and it can require a listing rather than a count — the cheap habit that would
have turned this from a lucky outcome into a checked one.

**Terminal state.** Routed inline —
`repo-governance/development/infra/temporary-files/status-exceptions-and-related.md`, new section
"Sweeping a Legacy `generated-reports/` Directory".

## L-11 — Three audit reports were committed inside a gitignored directory, and the plan assumed none could be

**What happened.** Phase 6 opens with "Every path here is untracked and gitignored. Nothing in this
phase is committed or pushed." That is true of the private sibling and false of `ose-public`, which has
three `generated-reports/plan__*__2026-08-13__audit.md` files tracked on `main` despite
`.gitignore:90` ignoring the directory — they were added before the ignore rule or force-added past
it. The sweep therefore produced three unstaged **deletions of tracked files**, in the primary
checkout as well as the worktree.

`.gitignore` does not retroactively untrack anything, so nothing about the rule change caused this;
it merely surfaced it. The primary checkout was restored to clean (`git checkout -- generated-reports/`)
because a checkout sitting on `main` must not be left carrying uncommitted deletions, and the three
files are removed properly through this plan's own PR instead. They are stale `plan`-family audit
reports — exactly the artifact class this plan relocates — so deleting them is the outcome the
convention already asked for.

**Litmus.** Yes. A plan that sweeps a directory should verify the directory is actually untracked
rather than asserting it, and `git ls-tree -r --name-only origin/main -- <dir>` answers that in one
command.

**Terminal state.** Routed inline — the "Sweeping a Legacy `generated-reports/` Directory" section
in `repo-governance/development/infra/temporary-files/status-exceptions-and-related.md`, which now
also covers checking for tracked files before sweeping.

## L-12 — Two rule surfaces already described a path the code never wrote, and the sweep missed it because it only read prose

**What happened.** The Phase 2 propagation sweep classified every textual occurrence of
`generated-reports` and rewrote the instruction layer, including the `docs-converting-pdf-to-markdown`
skill reference, which now tells the reader that `crane report --init` "creates a UUID-chained,
UTC+7-timestamped report at `local-tmp/pdf-to-md/pdf-to-md__{uuid-chain}__{timestamp}__audit.md`."
Phase 1 separately wrote `local-tmp/.execution-chain-{scope}` into the `local-tmp/` layout rule. Both
sentences were false the moment they landed: `ReportManager.fs` hardcoded `generated-reports/` for the
report and a repo-root `.execution-chain-<scope>` for the chain file, in two byte-identical copies
(`apps/crane-cli` and `libs/fsharp-crane-core`). The preliminary archival audit found it by asking
which agent-invoked command produces a path, not which file contains the string.

The plan's scope named `rhino-cli`'s ledger as "the one code path that hardcodes a temporary
directory." That was an inventory taken from prose, and `crane-cli` was the second one.

**Litmus.** Yes. A propagation sweep that rewrites where output goes has to enumerate the _writers_,
not the _mentions_: `git grep -nE '"(generated-reports|local-tmp)' -- '*.fs' '*.ts' '*.sh'` finds a
hardcoded destination that no amount of reading Markdown will surface, because the code never spells
the word in a sentence a reviewer would read as an instruction.

**Terminal state.** Fixed inline as DU-6 — both `ReportManager.fs` copies now write
`local-tmp/pdf-to-md/` and `local-tmp/.execution-chain-<scope>`, with their unit tests, the crane BDD
steps, and `specs/apps/crane/cli/behaviors/reporting/report-management.feature` updated to match, and
the now-unreachable root `.execution-chain-*` entry removed from `.gitignore`. No instruction file
changed, because the instruction layer was already correct — only the code was wrong.

## Follow-ups reported without plan authorization

The three follow-ups recorded in
[tech-docs.md §Follow-Ups Recorded, Not Delivered](./tech-docs.md#follow-ups-recorded-not-delivered)
— a `generated-reports/` retention policy, a classification validator, and `Harness.fs`'s
unreachable `validateGeneratedReportsTools` check — are reported here as
**Reported without plan authorization**. No `plans/ideas/` two-pager was created for any of them,
because the user has not literally authorized a plan artifact for them. Handoff evidence: each is
described in `tech-docs.md` with its rationale, and the `Harness.fs` item additionally carries its
full disposition (unreachable branch, left unchanged deliberately, must not be cited as coverage) in
both repositories' RP-7 records and in the body of the private sibling's PR #155.
