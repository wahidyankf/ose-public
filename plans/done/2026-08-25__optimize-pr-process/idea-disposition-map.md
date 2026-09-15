# Idea Disposition Map: Optimize the Pull Request Process

This planning-only map records what the active plan retains before any idea is retired. It does not
edit an idea brief, idea index, or routing artifact. Historical `plans/done/**` references remain
unchanged.

## Source Evidence

- [Repo-grounded] Public source: `ose-public` commit
  `62608547df0d2063d369537e0753f22699456f44`. Its `plans/ideas/` tree contains 83 Markdown paths:
  82 briefs plus the index. The tree count used pinned `git ls-tree`; brief sizes used pinned
  `git show | wc -l -w`; inbound references used pinned `git grep -n -F`. All 19 paths below exist.
- [Repo-grounded] Private source: the private sibling commit
  `718c20c923707d777a89639f760f98d53740bd70`. The one brief is 135 lines and 1,381 words; its
  tracked inbound index entry is `plans/ideas/README.md:22`.
- [Repo-grounded] Private PR #63 (private, not linked) merged the
  two-path `PRIV-IDEAS` retirement at `25bb1d81f53156d001f2ab25cca07d23ab8ce062`. Its terminal
  comment names `PRE-A1-ADMISSION` as the public historical successor; no private overlay remains.

## Current Public Retirement State

The original 19-brief catalog below is immutable planning evidence, not a command to re-open a
completed unit. PRs #269–#271 retired nine briefs before ACTIVATE; PUB-IDEAS-4 completed two more
in PR #276; and PUB-IDEAS-5 completed two in PR #281. Those 13 retirements and their associated
backlink repairs are historical evidence only.

No public idea brief remains. PR #285 retired the cross-worktree set at
`5e45ae3e1969359a233ac8be2d7b176492d0531b`; PR #286 retired the cross-repository set at
`d440f7385aa32eadeaf224bb10a633837a31055a`; and PR #288 retired the final set at
`70dbe4187dd720d8fe344960d227c44cf3d549f5`. Their absent source paths and old forecast are
immutable historical evidence only. PR #291 supplied the reader-state receipt, and private PR #64
merged the native `PRIV-ADMISSION` receipt at `db40c969f8c6a554837efab1cf266c8d505c02a6`. Private
PR #65 completed `PRIV-A1` at `71c8a0f1f318bf856141f1067a31f15f307b7f3b`; public `PUB-A2` is now
the sole live unit, followed by a private A2 admission receipt and private A2 source delivery.

## Historical Public Dispositions

1. `plans/ideas/q1-urgent-important/acceptance-clause-vacuity.md`
   **Outcome:** `valid`. **Family:** falsifiable planning evidence. **Owner:** `REQUIREMENTS`.
   **Retirement:** `PUB-IDEAS`. Retain executable pass/fail evidence and a tool-capable executor;
   reject a general vacuity tool.
2. `plans/ideas/q1-urgent-important/deletion-authorized-by-absence.md`
   **Outcome:** `partial`. **Family:** recurring-defect root cause. **Owner:** `B`.
   **Retirement:** `PUB-IDEAS`. Retain the worked example; exclude runtime emitter/property tests.
3. `plans/ideas/q1-urgent-important/plan-checker-forward-reference-detection.md`
   **Outcome:** `partial`. **Family:** executable slice ordering. **Owner:** `EXECUTION`.
   **Retirement:** `PUB-IDEAS`. Earlier slices supply later inputs; prefer human/prompt judgment and
   reject a dependency parser.
4. `plans/ideas/q1-urgent-important/plan-decision-integrity-hardening.md`
   **Outcome:** `partial`. **Family:** decision traceability. **Owner:** `A1`.
   **Retirement:** `PUB-IDEAS`. Retain user-job evidence and reversal reasons; reject Step-5o tooling.
5. `plans/ideas/q2-not-urgent-important/class-sweep-completeness.md`
   **Outcome:** `valid`. **Family:** complete defect-class repair. **Owner:** `B`.
   **Retirement:** `PUB-IDEAS`. Check definitions, producers, normative copies, and enclosing blocks;
   reject an ownership registry or new discovery tool.
6. `plans/ideas/q2-not-urgent-important/cross-repo-governance-link-parity.md`
   **Outcome:** `partial`. **Family:** destination validation. **Owner:** `C`.
   **Retirement:** `PUB-IDEAS`. Reuse destination checks on propagated files; reject a general engine.
7. `plans/ideas/q2-not-urgent-important/gate-exclusions-need-a-named-owner.md`
   **Outcome:** `partial`. **Family:** review applicability. **Owner:** `A2`.
   **Retirement:** `PUB-IDEAS`. Explain every skip and alternate evidence; reject gate-schema tooling.
8. `plans/ideas/q2-not-urgent-important/governance-path-ownership-registry.md`
   **Outcome:** `conflict`. **Family:** single applicability authority. **Owner:** `A2`.
   **Retirement:** `PUB-IDEAS`. Retain one clear authority; reject the glob registry/schema/validator.
9. `plans/ideas/q2-not-urgent-important/merge-queue-adoption.md`
   **Outcome:** `partial`. **Family:** unstacked integration freshness. **Owner:** `EXECUTION`.
   **Retirement:** `PUB-IDEAS`. Recheck current base and CI; reject queue/vendor infrastructure.
10. `plans/ideas/q2-not-urgent-important/nx-affected-cross-worktree-contamination.md`
    **Outcome:** `partial`. **Family:** worktree isolation. **Owner:** `EXECUTION`.
    **Retirement:** `PUB-IDEAS`. Reuse one plan worktree per repo, keep WIP out of the primary
    checkout, and reject Nx or hook changes.
11. `plans/ideas/q2-not-urgent-important/plan-archival-in-pr-multi-repo-gap.md`
    **Outcome:** `valid`. **Family:** multi-repo plan closure. **Owner:** `EXECUTION`.
    **Retirement:** `PUB-IDEAS`. Name folder owner, PR order, final signal, and archival vehicle.
12. `plans/ideas/q2-not-urgent-important/plan-quality-gate-convergence.md`
    **Outcome:** `partial`. **Family:** planning convergence. **Owner:** `A1`.
    **Retirement:** `PUB-IDEAS`. Retain distinct lenses, class repair, and reproducible evidence;
    reject registries, new validators, saturation, and the superseded 3–5 target.
13. `plans/ideas/q2-not-urgent-important/pr-review-bot-identity.md`
    **Outcome:** `conflict`. **Family:** PR-native review status. **Owner:** `A3`.
    **Retirement:** `PUB-IDEAS`. Keep body/thread authority and AI markers; reject bot/App/token work.
14. `plans/ideas/q2-not-urgent-important/pr-review-disciplines-applicability-shard-empty.md`
    **Outcome:** `valid`. **Family:** risk-based review routing. **Owner:** `A2`.
    **Retirement:** `PUB-IDEAS`. Retain applicability and four-way fixer judgment, not fixed review.
15. `plans/ideas/q2-not-urgent-important/propagation-checklist-under-coverage.md`
    **Outcome:** `valid`. **Family:** actual-diff propagation. **Owner:** `C`.
    **Retirement:** `PUB-IDEAS`. Use `repo-rules-propagation`, the actual merged diff, justified
    exclusions, and live destination measurement; reject a new CLI.
16. `plans/ideas/q2-not-urgent-important/recurring-defect-family-escalation.md`
    **Outcome:** `valid`. **Family:** changed-strategy recovery. **Owner:** `B`.
    **Retirement:** `PUB-IDEAS`. Keep a PR-native family ledger; a second occurrence triggers a
    bounded invariant probe. Reject mechanical detection and scope exemptions.
17. `plans/ideas/q2-not-urgent-important/repo-rules-quality-gate-convergence.md`
    **Outcome:** `partial`. **Family:** rule-quality convergence. **Owner:** `C`.
    **Retirement:** `PUB-IDEAS`. Retain varied lenses, known-positive probes, and bounded ground
    truth; reject new machinery and saturation as an exit rule.
18. `plans/ideas/q2-not-urgent-important/review-loop-reviews-its-own-record.md`
    **Outcome:** `valid`. **Family:** bounded merge-ready state. **Owner:** `B`.
    **Retirement:** `PUB-IDEAS`. Keep scope stable, audit exact, target 1–3, recover 4–5, and stop
    before 6; reject mandatory three cycles, two-clean confirmation, or an indefinite loop.
19. `plans/ideas/q2-not-urgent-important/stale-checkout-ref-advance-drift.md`
    **Outcome:** `partial`. **Family:** safe worktree reuse. **Owner:** `EXECUTION`.
    **Retirement:** `PUB-IDEAS`. Re-pin and inspect without ref-writing a checked-out branch; reject
    detector/wrapper tooling.

## Private Disposition

1. `plans/ideas/q2-not-urgent-important/pr-review-governance-reference-defects.md` in the private sibling
   **Outcome:** `partial`. **Family:** cold-reader reference clarity. **Owner:** `REQUIREMENTS`;
   secondary `DESIGN`. **Retirement:** `PRIV-IDEAS`. Retain clear artifact/path/term references,
   two-repo archival and N/A semantics, scope guarding, semantic propagation, and fresh pins. Replace
   ambiguous `classifier evidence` with the review-route record. Reject “worthless without
   validator,” legacy Cycle 10/12/two-clean rules, three-repo assumptions, the stale five-consumer
   count (the pinned base has six), and the unrelated 168-annotation sweep. Private PR
   #62 review 5000710561 (private, not linked)
   remains historical discovery evidence, not current authority. This row was retired in private
   PR #63 and remains historical planning evidence only.

## Historical Retirement Rule

The original forecast allocated ten remaining briefs to five named `PUB-IDEAS-4`–`PUB-IDEAS-8`
subdeliveries. It is entirely historical: PRs #285, #286, and #288 retired its remaining public
briefs, and private PR #63 retired the private brief and index entry. The old DAG, order, and
checklists remain immutable audit receipts; they authorize no path, branch, PR, merge, or successor.
