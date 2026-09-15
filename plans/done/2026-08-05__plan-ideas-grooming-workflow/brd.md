# Business Requirements Document: `plan-ideas-grooming` Workflow

## Business Goal and Rationale

`plans/ideas/` is the first stage of this repo's plan lifecycle
(`ideas/ → backlog/ → in-progress/ → done/`) and is explicitly meant to stay browsable — the
[Ideas Folder convention](../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers)
frames it as "short enough to write in one sitting and triage at a glance." At 119 idea documents
across the four repos combined `[Repo-grounded]` (counted 2026-08-05; see Current-State Baseline
below), flat and unclassified in three of the four repos, that promise is already broken for a
human skimming the index, and it degrades further every time a new idea is filed with no mechanism
folding it into an existing brief or routing it to the repo where it actually belongs.

The business goal is to make `plans/ideas/` across all four repos a converging, self-tidying
surface instead of a strictly-growing one: duplicate ideas merge instead of re-accumulating,
urgency/importance become visible at a glance via folder structure, stale filenames get renamed to
match their (possibly merged, split, or relocated) content, and each idea lives in the one repo
where it is actually actionable. This plan is the first of two steps toward that goal — it builds
the mechanism (the workflow, named `plan-ideas-grooming` after Scrum's "backlog grooming" practice)
but does not yet run it.

## Current-State Baseline (Mechanically Verified, 2026-08-05)

Every number below was produced by `find`/`wc`/`grep`/`diff` against the four repos' live
`plans/ideas/` trees during this plan's authoring — none is estimated. See `tech-docs.md`'s
"Baseline Data" section for the exact commands.

### Per-repo idea count and two-pager conformance

| Repo                | Idea docs (excl. `README.md`) | Two-pager conformant | Non-conformant |
| ------------------- | ----------------------------- | -------------------- | -------------- |
| `ose-public`        | 51                            | 50                   | 1              |
| `ose-primer`        | 5                             | 5                    | 0              |
| The private sibling | 20                            | 17                   | 3              |
| `beaver-nest`       | 43                            | 43                   | 0              |
| **Total**           | **119**                       | **115**              | **4**          |

Conformance was checked mechanically per file: exactly one `#` (H1) line, exactly seven `##`
(H2) lines (the template's 7 named sections), and at least one `>` (blockquote) line within the
first 10 lines (the provenance note). The 4 non-conformant files:
`ose-public/governance-path-ownership-registry.md` (no blockquote detected in the first 10 lines),
`private-sibling/dependency-library-updates.md` and `private-sibling/onprem-e1000e-driver-update.md`
(8 H2 headings instead of 7 — an extra subsection each), and
`private-sibling/verify-deployed-reality-not-artifact.md` (no blockquote detected). These are noted as
a concrete input the future workflow run will need to reshape (per `prd.md`'s "two-pager reshape"
step) — this plan does not touch them.

### Cross-repo duplicate basenames

35 distinct idea-doc basenames (29% of all 119 files) appear under the same filename in two or
more of the four repos:

| Present in                                                   | Basename count | Byte-identical everywhere they appear | Diverged in ≥1 repo                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All 4 repos                                                  | 3              | 1 (`pr-review-bot-identity.md`)       | 2 (`source-code-credential-scanning.md`, `merge-queue-adoption.md`)                                                                                                                                                                                                                                                                                                         |
| 3 repos (`ose-public` + the private sibling + `beaver-nest`) | 4              | 0                                     | 4 (`standardize-cis.md`, `rhino-cli-env-backup-scripts.md`, `iam-service-module.md`, `demo-apps-standards-recheck.md` — each diverged from the private sibling's copy by 76-82 diff lines, while 2 of the 4 are byte-identical between `ose-public` and `beaver-nest`)                                                                                                      |
| 2 repos (`ose-public` + `beaver-nest`, exclusively)          | 28             | 20                                    | 8 (`vitest-glob-coverage-guard.md` 263 diff lines, `private-sibling-opencode-ci-monitor-orphan.md` 260, `audit-e2e-reuse-existing-server-config.md` 242, `cross-repo-governance-link-parity.md` 239, `mermaid-validator-does-not-check-syntax.md` 27, `sibling-main-ci-never-runs-on-merge.md` 18, `acceptance-clause-vacuity.md` 8, `syllabus-conformance-validator.md` 7) |
| **Total**                                                    | **35**         | **21**                                | **14**                                                                                                                                                                                                                                                                                                                                                                      |

Qualitative pattern observed: the private sibling's copies diverge the most from `ose-public`'s
(76-82 diff lines on every shared basename checked) — consistent with the private sibling adapting
shared ideas for its infra-private context rather than merely re-filing them. The 8 diverged
`ose-public`↔`beaver-nest` pairs with large diff counts (239-263 lines) are not simple duplicates;
they read as independently-evolved forks of a shared original idea, each repo appending its own
follow-up detail — the future workflow's merge step (`prd.md` US-3/`tech-docs.md` Step 2-3) will
need to reconcile content, not just delete a redundant copy, for these 8.

### Rough residency-rule candidate tally (heuristic, not authoritative — the future workflow decides for real)

- **Rule-6 (single-repo-only, already correctly placed)**: 11 files —
  4 `beaver-nest-*`-prefixed files in `beaver-nest` (`beaver-nest-first-deploy.md`,
  `beaver-nest-persistence-layer.md`, `beaver-nest-first-llm-integration.md`,
  `beaver-nest-be-nullbyte-path-error-envelope.md`) plus 7 infra-only files in the private sibling
  (`onprem-nic-hardware-fallback.md`, `onprem-e1000e-driver-update.md`,
  `onprem-gitops-iac-automation.md`, `on-premise-host-intake-runbook.md`,
  `ci-runner-health-monitoring.md`, `worktree-portable-terraform-state.md`,
  `re-enable-coralpolyp-staging-schedule.md`).
- **Rule-4 (generalizable, currently confined to one non-`ose-public` repo)**: roughly 12 files —
  2 in `ose-primer` (`rhino-cli-exclude-dir-shared-steps-gap.md`, `rust-msrv-1-94-1-upgrade.md`),
  ~6 in the private sibling (`dependency-library-updates.md`, `fsl-standards.md`,
  `ose-public-nx-affected-rhino-cli-gap.md`, `preexisting-deploy-workflow-failures.md`,
  `rhino-cli-sync-validator-wrong-model-drift.md`, `verify-deployed-reality-not-artifact.md`), and
  4 in `beaver-nest` (`coverage-artifact-relative-paths.md`, `cross-repo-port-registry.md`,
  `refresh-agent-illustrative-example-paths.md`, `specs-checker-phantom-nx-targets.md`) — this
  count is a filename-and-topic heuristic (does the concern read as cross-cutting tooling/governance
  rather than repo-local infra), not a rule-4 determination; the future workflow re-derives this
  from each file's actual content, not this list.
- **Rule-5 (secret-bearing, plausibly misplaced outside the private sibling)**: 1 plausible candidate —
  `rhino-cli-env-backup-scripts.md` (currently triplicated across `ose-public`, the private sibling, and
  `beaver-nest`) inherently concerns backing up real `.env*` secret values, though it is arguably
  also a generalizable _tooling_ concern (every repo's `rhino-cli` dev setup needs this), so its
  final residency is a genuine judgment call for the future workflow, not a clear-cut case. A
  mechanical keyword grep (`secret|credential|api[_-]?key|password|.env`) also hit
  `source-code-credential-scanning.md` and `audit-e2e-reuse-existing-server-config.md`, but reading
  both confirms they _discuss_ security tooling/test config rather than _requiring_ a real secret
  value themselves — flagged here explicitly as likely false positives so the future workflow does
  not over-apply Rule 5 from keyword matching alone.
- **Rename candidates (heuristic, seventh capability)**: not separately tallied — filename/content
  mismatch is only reliably detectable after the future workflow's merge/split/residency passes run
  (a filename earned post-merge or post-relocation), so a pre-run tally here would be speculative
  rather than mechanically grounded. `prd.md`'s acceptance criteria cover the rename mechanism's
  correctness directly instead.

## Business Impact

**Pain points** (observed, not hypothetical — see Current-State Baseline above for the full data):

- **Manual discovery cost.** The same idea (`rhino-cli-env-backup-scripts.md`) was independently
  filed, byte-identically or near-identically, in three separate repos `[Repo-grounded]` (confirmed
  via `diff`, 2026-08-05) — nobody noticed until this plan's authoring research checked for it
  directly. 35 idea-doc basenames (29% of all 119 files across the four repos) recur under the same
  filename in two or more repos, and 21 of those 35 are byte-identical everywhere they appear —
  pure, mechanically-confirmed duplication with zero divergence `[Repo-grounded]`.
- **No urgency signal.** A reader opening any repo's `plans/ideas/README.md` sees up to 51
  one-line hooks (`ose-public`) in filename-alphabetical order, with no way to tell which ideas are
  load-bearing right now versus purely aspirational, short of reading every file.
- **No residency discipline.** Ideas that are inherently generalizable across the four-repo
  ecosystem (governance/tooling concerns) are sometimes filed once (correctly, per the precedent
  set by `deploy-targets-registry.md` and `rhino-cli-language-rewrite-tradeoffs.md`, both
  `ose-public`-only by design), and sometimes filed redundantly per-repo instead, or left confined
  to a single sibling repo despite being generalizable (roughly 12 files by the heuristic tally
  above) — with no rule distinguishing the cases at filing time.
- **Stale filenames accumulate alongside stale content.** A merge, split, or relocation that only
  fixes an idea's content while leaving its old filename in place recreates the same
  discoverability problem one layer down — a reader can't tell from the filename what the doc now
  covers. No mechanism today renames a file to track its content.

**Expected benefits**: a converging idea corpus (duplicates resolve instead of accumulating), a
triage-at-a-glance folder structure (Eisenhower quadrants), filenames that stay truthful to their
content after grooming, and a residency rule that stops new redundant filings from recurring once
the workflow exists and is eventually run.

## Affected Roles

Solo-maintainer repo — no sign-off or stakeholder-approval ceremony. The roles below are hats the
maintainer wears, and agents that consume the resulting files:

- **Maintainer-as-idea-author**: files new two-pagers; benefits from a converging, not
  ever-growing, `plans/ideas/` across all four repos.
- **Maintainer-as-plan-promoter**: reads `plans/ideas/` to decide what to promote to `backlog/`;
  benefits from urgency/importance visibility and deduplication.
- **`plan-maker` / `plan-idea-promotion-planning`**: the workflow this plan already references —
  `plan-idea-promotion-planning` promotes a single ripe two-pager to a backlog plan; a converged,
  correctly-classified idea corpus makes its "which idea is ripe" judgment more reliable.
- **Any future invoker of `plan-ideas-grooming`** (the maintainer, or an agent acting on their
  behalf) in any of the four repos, once it exists — this plan's propagation requirement exists
  specifically so the workflow is runnable from whichever repo the maintainer happens to be working
  in, per their explicit instruction.

## Business-Level Success Metrics

1. **Observable fact**: `repo-governance/workflows/plan/plan-ideas-grooming.md` exists,
   byte-identical, in all four repos' git history after this plan's delivery — verifiable via
   `diff` across all four paths returning no output.
2. **Observable fact**: `rhino-cli repo-governance workflows naming validate` (or the equivalent
   `find | grep` audit command documented in `workflow-naming.md`) passes with the new filename
   included, in all four repos.
3. **Observable fact**: the `grooming` type token appears in `workflow-naming.md`'s Type
   Vocabulary table in all four repos, each adapted to that repo's own already-divergent copy of
   the file (not a blind byte-copy, since the files are confirmed non-identical pre-existing).
4. **Judgment call**: the workflow's own design (the classification rubrics, the relocation safety
   model, the rename mechanism, the recurrence trigger) is judged sufficient by the maintainer to
   run for real in a future invocation without further redesign. No baseline measured — this is a
   design-quality judgment, confirmed via this plan's post-write grill and, ultimately, by whether
   the future execution run needs mid-flight rework.

## Business-Scope Non-Goals

- This plan does not reduce the idea-file count in any repo. Zero files move, merge, split,
  rename, or relocate as part of this plan's delivery.
- This plan does not change `plans/ideas/README.md` in any repo, or create any quadrant subfolder.
- This plan does not evaluate or re-classify any existing idea brief against the new rubrics —
  that evaluation happens only when the workflow is actually invoked, in a future run.
- This plan does not change the `plans/ideas/` two-pager template itself (`workflow-naming.md`'s
  amendment and the new workflow file are the only convention-level changes).

## Business Risks and Mitigations

- **Risk**: adding a fifth workflow type token is a small but permanent expansion of a
  deliberately minimal, zero-exception vocabulary (`workflow-naming.md` currently states "No other
  type suffixes are permitted"). **Mitigation**: the token is added only after confirming (Q1 of
  this plan's grilling) that none of the four existing tokens (`quality-gate`, `execution`,
  `setup`, `planning`) fit the recurring-sweep-over-existing-docs shape; the new token's definition
  is written narrowly enough that it does not become a catch-all for future ill-fitting workflows.
- **Risk**: propagating a convention amendment across four already-divergent copies of
  `workflow-naming.md` risks introducing new drift if each repo's edit is applied carelessly.
  **Mitigation**: `delivery.md`'s propagation phases treat each repo's file as its own edit target
  (read-then-adapt, never blind-copy-then-overwrite), and each propagation is verified against that
  repo's own quality gates before being pushed.
- **Risk**: authoring a workflow whose actual reorganization behavior is never run (this plan's
  explicit scope boundary) risks the workflow doc going stale before its first real use.
  **Mitigation**: `prd.md`'s acceptance criteria require the workflow doc to state its own
  recurrence trigger explicitly, and `delivery.md`'s Knowledge Capture phase records a future-work
  learning recommending the first real run be scheduled promptly after this plan archives.
- **Risk**: a plan that touches four independent git repositories in one delivery is more
  operationally complex than a single-repo plan, with more surface area for a partial failure (one
  repo's push lands, another's doesn't). **Mitigation**: `tech-docs.md` documents each propagation
  phase as fully independent of its siblings (no shared state, no ordering constraint between
  `ose-primer`/the private sibling/`beaver-nest`), so a stalled or failed propagation in one repo never
  blocks the others, and `delivery.md`'s phase gates make each repo's completion state
  independently verifiable via direct `origin/main` checks (no PR state to reconcile).
- **Risk**: `main-to-origin-main` Delivery Mode means changes land on each repo's `main` with no
  PR-Review Maker→Fixer Cycle gate. **Mitigation**: this is an explicit, informed user override
  (not a default drift) scoped to this plan and to the future workflow's own low-stakes,
  `plans/**`-only runs; `delivery.md`'s Local Quality Gates (typecheck/lint/naming-validate/
  markdown-lint) still run before every push, in every repo, as the substitute verification gate.
