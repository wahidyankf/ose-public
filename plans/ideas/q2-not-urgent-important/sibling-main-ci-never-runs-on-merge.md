# `main-ci` never runs on a sibling merge commit

One-line summary: the private sibling has no post-merge CI signal on `main`, because the
only workflow that would provide one is schedule-triggered — so a merge to `main` there
is verified by its PR checks and then never re-verified in its merged state.

> Provenance: the single unticked box in
> [`plans/done/2026-07-22__bare-repo-governance-hardening`](../../done/2026-07-22__bare-repo-governance-hardening/README.md)
> (188 checked, 1 unchecked). Recorded there as partially unmet rather than ticked; filed here so it
> does not die in `done/`.

## Problem / context

The bare-repo governance plan's terminal gate asked for CI green on `main` across every bound repo.
`ose-public` satisfied it. The private sibling did not, and the reason is narrower and more interesting than
"CI was red":

- On the private sibling at merge commit `1d64990bb`, **`pr-quality-gate` and `validate-env` both ran and
  both passed.** The merge was not unverified.
- **`main-ci` did not run at all**, because that workflow is schedule-triggered rather than
  push-triggered.

So the gap is exactly one workflow, and it is a trigger-configuration gap, not a failure. The
practical consequence: whatever `main-ci` checks that the PR-level workflows do not, no one learns
about until the next scheduled run — and if that run is infrequent, a merge can sit unverified for a
long window. Worse, the _absence_ of a run is easy to misread as a pass, because nothing is red.

This is the same shape as the vacuous-gate problem filed in
[mermaid-validator-does-not-check-syntax](../q1-urgent-important/mermaid-validator-does-not-check-syntax.md): a green board
that is green because nothing looked, not because something passed.

## Why now

- The bare-repo plan closed with this as its only unmet item, so the question is already scoped and
  the evidence is already gathered — the cheapest moment to act.
- Cross-repo parity is a standing norm here, and `ose-public` having a post-merge signal the private sibling
  lacks is precisely the kind of asymmetry that parity work exists to remove.
- A plan is currently in progress
  ([learning-plan-syllabus-folder-convention](../../done/2026-07-22__learning-plan-syllabus-folder-convention/README.md))
  whose Phase 6 merges PRs into the sibling. It will land changes there under exactly this blind
  spot.

## Prior art / precedents

- **`ose-public`'s own workflow set** — the counterexample worth copying: its post-merge runs fire on
  push to `main`, which is how the cross-repo CI record was verifiable at all.
- **GitHub Actions `on: push` vs `on: schedule`** — the whole question is which trigger `main-ci`
  declares; the fix may be a two-line change rather than a new workflow.
  [docs.github.com — events that trigger workflows](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- **[ci-post-push-verification](../../../repo-governance/development/workflow/ci-post-push-verification.md)**
  — the repo's existing rule that pushed app/lib code must have CI triggered and verified; this brief
  is that rule's unenforced case.
- **[standardize-repo-toolchain-parity](../../done/2026-06-13__standardize-repo-toolchain-parity/README.md)**
  — the prior cross-repo CI-standardization effort;
  whatever it did or did not normalize about triggers is the first thing to read.
- **[ci-setup-rust-toolchain-retry](./ci-setup-rust-toolchain-retry.md)** — an already-filed
  cross-repo CI defect, same family, and a candidate to fix in the same pass.

## Proposed direction (sketch)

- First **measure**, do not assume: read `main-ci`'s trigger block in both parity repos and write down
  what actually differs. The claim above is from one observation on one merge commit.
- Determine whether `main-ci` in the sibling is schedule-triggered deliberately (cost, runner
  capacity on the self-hosted stack) or incidentally. That answer decides everything downstream.
- If incidental: add the push trigger and confirm a real merge produces a run.
- If deliberate: make the absence explicit rather than silent — a documented statement that siblings
  have no post-merge signal, so no future plan's gate asks for one and quietly records it unmet.

## Rough scope & non-goals

In scope: the trigger configuration of `main-ci` across both parity repos, and whichever governance
sentence currently implies a post-merge signal exists everywhere.

Out of scope: what `main-ci` actually checks (not being re-litigated here); the self-hosted runner
capacity question, except as an input to the deliberate-versus-incidental call; the unrelated rustup
concurrency flake, which has its own brief.

## Risks & open questions

- **Is the schedule trigger a deliberate cost control?** Unknown. If the self-hosted runners are
  capacity-constrained, adding push-triggered runs to two more repos may be exactly what someone
  previously avoided. (open)
- **What does `main-ci` check that `pr-quality-gate` does not?** If the answer is "nothing material",
  this brief closes as a documentation fix rather than a CI change. Measuring that overlap is the
  cheapest way to size the whole thing. (open)
- Does the private sibling, being private and not part of every parity loop, want this at all? It is
  explicitly exempted from the content-parity workflow, and this may fall under the same exemption.
  (open)
- A push-triggered run on `main` in a bare-repo workflow may interact with how those repos are pushed
  to; unverified. (open)

## What success looks like + promotion signal

Success: for each parity repo it is written down and true whether a merge to `main` produces a
CI run, and no plan gate can ask for "CI green on `main`" in a repo where that signal does not exist.

Promotion signal: ripe as soon as someone has read both trigger blocks and answered the
deliberate-versus-incidental question. That is a ten-minute task and it decides whether this is a
two-line config change or a documented, accepted limitation.
