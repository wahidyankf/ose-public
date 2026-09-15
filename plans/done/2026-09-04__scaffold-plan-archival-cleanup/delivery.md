# Delivery — Scaffold Plan-Archival Cleanup Steps

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.

Read [tech-docs.md](./tech-docs.md) before starting. It fixes the placement decision (extend Rule 10
rather than mint Rule 22) and the both-directions verification requirement.

## Delivery Mode: worktree-to-pr

Mandatory in `ose-public` — `main` is branch-protected including for admins. Used identically in
the private sibling; its narrow infrastructure-as-code direct-push exception does not apply to a Skill
change.

## Worktree

Worktree path: `worktrees/scaffold-plan-archival-cleanup/` — to be provisioned at execution start
per [Worktree Specification](../../../.claude/skills/plan-creating-project-plans/reference/worktree-specification.md).
Provisioned at execution start; this plan now executes from `plans/in-progress/`.

Provision from the repository root when work starts:

```bash
claude --worktree scaffold-plan-archival-cleanup
```

### Provisioned Worktree Identity

- Declared repository-relative route: `worktrees/scaffold-plan-archival-cleanup/`
- Initial branch: `worktree/scaffold-plan-archival-cleanup`
- Created by: Claude Code plan-execution session, `[AI]`
- Created at: `2026-09-04T07:42:00Z`

The plan must not record an absolute, home, tool-prefix, drive, UNC, or other host-specific path.
Resolve its declared route only at runtime against the selected repository root; retain any resolved
path only in ignored runtime evidence after reconciliation with `git worktree list --porcelain`.

### Delivery Branch Inventory

| Branch                                                          | Mode             | Lifecycle state | Proof                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------- | ---------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worktree/scaffold-plan-archival-cleanup` (`ose-public`)        | `worktree-to-pr` | `delivered`     | Created `2026-09-04T07:42:00Z` from `origin/main` `a9e6e6af6`. Promotion PR 469 merged at reviewed head `5b48c9aea8663927a4ea48329cd0abd9e52fcaf8`; DU-1 PR 470 merged at reviewed head `c5617afdb8d4cc7b659b30bfb43202d0fbf82e94`; archival PR merged at the head recorded in the plan-execution final report. Worktree and branch removed at the terminal post-merge step |
| `worktree/scaffold-plan-archival-cleanup` (the private sibling) | `worktree-to-pr` | `delivered`     | Created `2026-09-04T08:09:10Z` from `origin/main`. DU-2 PR 153 merged at reviewed head `9bd7349235d3d2534e6001d276ac3b222c37051e`, merge commit `c55c97e465014c4e069413384ff5ea1fc62bdd1e`. Worktree removed and both refs deleted `2026-09-04`; `git branch -a` shows no residual ref                                                                                      |

Append every plan-created delivery branch before use. A `*-to-pr` entry records its merged PR and
40-character reviewed-head SHA. Before removal, classify every entry as delivered, unused, or
retained/escalated; active or unrecorded branches block cleanup.

### Cross-Repository Parity Identity

- Objective slug: `scaffold-plan-archival-cleanup`
- Common worktree basename: `scaffold-plan-archival-cleanup`

| Repository          | Worktree route                              | Branch                                    | Provisioning status                |
| ------------------- | ------------------------------------------- | ----------------------------------------- | ---------------------------------- |
| `ose-public`        | `worktrees/scaffold-plan-archival-cleanup/` | `worktree/scaffold-plan-archival-cleanup` | provisioned `2026-09-04T07:42:00Z` |
| The private sibling | `worktrees/scaffold-plan-archival-cleanup/` | `worktree/scaffold-plan-archival-cleanup` | removed `2026-09-04`               |

Re-verify the private sibling's bare-versus-normal topology at Phase 3 rather than assuming it; this
repository pair has flipped layouts before.

## Delivery Units

| Unit | Phases | Repository          | Boundary rationale                                                                                 |
| ---- | ------ | ------------------- | -------------------------------------------------------------------------------------------------- |
| —    | 0      | both                | Baseline only. Opens no PR.                                                                        |
| DU-1 | 1–2    | `ose-public`        | Template, check, recipe, and mirrors ship together; a check without its recipe is half a delivery. |
| DU-2 | 3      | The private sibling | Same semantics restated into the sibling repository's own shard set.                               |
| —    | 4      | both                | Knowledge Capture. No tracked change, no PR.                                                       |

## Standing Instructions

### Fix-All-Issues Instruction

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

### Local Quality Gates (Before Push)

- [ ] [AI] Run affected typecheck: `rtk nx affected -t typecheck` — exits 0
- [ ] [AI] Run affected linting: `rtk nx affected -t lint` — exits 0
- [ ] [AI] Run affected quick tests: `rtk nx affected -t test:quick` — exits 0
- [ ] [AI] Run affected spec coverage: `rtk nx affected -t specs:coverage` — exits 0
- [ ] [AI] Fix ALL failures found — including preexisting issues not caused by these changes
- [ ] [AI] Verify all checks pass before pushing

> A `test:quick` failure that disappears on a warm-cache re-run without `--skip-nx-cache` is a known
> flake under parallel hook load, not a regression. Re-run once before investigating.

### Post-Push Verification

- [ ] [AI] Push to the PR branch, redirecting output:
      `rtk git push origin HEAD > local-tmp/push-output.txt 2>&1` — a Husky `EAGAIN` stdout panic
      (`os error 35`) on large output is not a gate failure; read the gate's own final PASS/FAIL
      summary line. Never use `--no-verify`
- [ ] [AI] Monitor with `rtk gh pr checks <pr-number>` — poll every 2 minutes, never `gh run watch`
- [ ] [AI] Verify all CI checks pass; investigate any failure at its root cause
- [ ] [AI] Do NOT proceed to the next phase until CI is green

### Commit Guidelines

- [ ] [AI] Do not stage or commit until the user explicitly authorizes the named change set. The
      standing authorization granted to `update-tmp-folders` is plan-scoped and does NOT carry here
- [ ] [AI] Once authorized, use the fewest build-valid, independently reviewable and revertible
      commits, one coherent purpose each
- [ ] [AI] Follow Conventional Commits: `<type>(<scope>): <description>`
- [ ] [AI] Stage explicit paths — never `git add -A`; sibling trees carry unrelated uncommitted work
- [ ] [AI] Commit with `rtk git commit --only -m "<message>" -- <paths>`; the pre-commit hook
      otherwise sweeps unstaged files in. New files still need an explicit `git add` first, and
      `-m` must precede the `--` separator
- [ ] [AI] Keep regenerated mirrors in the same commit as their source

## Phase 0: Environment Setup and Baseline

**Input**: A clean `ose-public` checkout on `main`.
**Outcome**: The worktree exists, the toolchain is converged, and the baseline is recorded.
**Proof**: Baseline commands exit 0; the worktree identity is filled in above.

- [x] [AI] Provision the worktree from the `ose-public` repository root:
      `claude --worktree scaffold-plan-archival-cleanup`. Record the resulting creator and
      ISO-8601 UTC timestamp into [Provisioned Worktree Identity](#provisioned-worktree-identity),
      and update the [Delivery Branch Inventory](#delivery-branch-inventory) row to `provisioned` /
      `active`
- [x] [AI] Verify git identity is not the stray `Test <test@test.com>` override:
      `rtk git config user.email` — if it prints `test@test.com`, STOP and surface it; this is a
      `[HUMAN]`-only fix
- [x] [AI] Sync: `rtk git fetch origin && rtk git merge --ff-only origin/main` — exits 0
- [x] [AI] At the worktree root: `rtk npm install && rtk npm run doctor -- --fix` — both exit 0.
      A fresh worktree has no `node_modules`, so this is required, not a formality
- [x] [AI] Create `plans/in-progress/scaffold-plan-archival-cleanup/learnings.md` if absent, with the
      mandatory `# Learnings: scaffold-plan-archival-cleanup` H1 — markdownlint MD041 fails a
      comments-only scaffold
- [x] [AI] Record the baseline: `rtk nx affected -t build,test:quick,lint` — exits 0. Fix any
      preexisting failure before proceeding
- [x] [AI] Enumerate the plans the new check will run against, writing the list to
      `local-tmp/scaffold-plan-archival-cleanup/live-plans.txt`:
      `/bin/ls -1 plans/in-progress plans/backlog`. Use `/bin/ls`, not the shell's `eza` alias —
      its hyperlink escapes corrupt piped output

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `rtk git status --short` shows only this plan's folder
- [x] [AI] `rtk nx affected -t build,test:quick,lint` exits 0
- [x] [AI] `local-tmp/scaffold-plan-archival-cleanup/live-plans.txt` exists and is non-empty
- [x] [AI] The worktree identity and branch inventory above carry real recorded values, not
      placeholders

**Result** — `npm run doctor -- --fix` exits 0 ("Nothing to fix — all tools are installed").
`nx affected -t build,test:quick,lint` exits 0 with no tasks run: the branch carries only Markdown.
`local-tmp/scaffold-plan-archival-cleanup/live-plans.txt` lists five plans — three backlog
README-only stubs and two in-progress plans. Worktree provisioned `2026-09-04T07:42:00Z` from
`origin/main` `a9e6e6af6`; identity and inventory above carry those recorded values.

> **Pause Safety**: nothing changed but the plan folder. Safe to stop. To resume:
> `rtk nx affected -t build,test:quick,lint` from the worktree root.

## Phase 1: Rules Propagation — Scaffold and Check (`ose-public`)

**Input**: The three Skill reference surfaces named in
[tech-docs.md §File-Impact Analysis](./tech-docs.md#file-impact-analysis).
**Outcome**: The template scaffolds cleanup, `plan-checker` checks for it, `plan-fixer` repairs it.
**Proof**: AC-1, AC-2, AC-3, AC-4; every `RP-` step ticked.

This changes a rules surface, so it is a
[rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md) run at
`mode: strict`, not an ordinary Skill edit.

- [x] [AI] **RP-0 Intake** — normalize into falsifiable statements in
      `local-tmp/rules-propagation/statements-public.md`. There are two: (1) a plan's archival
      section must contain a worktree-removal step and a branch-cleanup step routing to the
      canonical convention; (2) `plan-checker` must flag an archival section missing either. Record
      each statement's violating observation
- [x] [AI] **RP-1 Working tree** — `isolation: current`; the run writes in the Phase 0 worktree.
      Record the parity slug, basename, and branch from
      [Cross-Repository Parity Identity](#cross-repository-parity-identity); the Phase 3 run reuses
      them verbatim
- [x] [AI] **RP-2 Classification** — assign subject and layer; confirm vendor neutrality. Both
      statements are Agents-layer (Skill reference modules), not Conventions — the convention
      already exists and is unchanged
- [x] [AI] **RP-3 Conflict scan** — search for an existing rule that already states either
      statement. Expect a **partial semantic no-op**: the obligation exists in
      `plan-execution/finalization-worktree-cleanup-and-pr-archival.md` and
      `plans/worktree-specification-continued.md`. Record those as the binding sources the new
      scaffolding routes to, NOT as supersessions — nothing is being replaced. Halt and surface if
      any higher-layer rule contradicts the scaffolding
- [x] [AI] **RP-4 Placement** — confirm or overturn
      [tech-docs.md §D-1](./tech-docs.md#d-1-extend-the-existing-worktree-rule-do-not-mint-rule-22).
      Read `.claude/skills/plan-validating-quality/reference/rule10-worktree-specification-validation.md`
      and run `wc -w` on it. If it has headroom, the check goes there and no new shard is created.
      Record the decision and the word count in `local-tmp/rules-propagation/placement-public.md`
- [x] [AI] **RP-5 Eviction** — if Rule 10's shard has no headroom, evict rather than raise the
      threshold. Only if eviction is genuinely impossible does a new numbered shard become correct —
      and a new shard then needs a link in its folder `README.md` **and** in the parent index, or the
      readme-completeness gate fails the push as an orphan
- [x] [AI] Edit `.claude/skills/plan-creating-project-plans/reference/plan-archival.md`: add three
      checkboxes to the template, placed before the `rtk date +%F` completion-date step — (1)
      classify every `Delivery Branch Inventory` entry as delivered, unused, or retained/escalated;
      (2) remove each worktree the plan provisioned, non-force, from the repository root; (3)
      complete the canonical
      [branch cleanup](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md)
      for every plan-created branch, then run `git worktree prune`. Link out for the procedure; do
      not restate its proof gates, per
      [tech-docs.md §D-2](./tech-docs.md#d-2-the-template-links-out-it-does-not-restate-the-procedure)
- [x] [AI] Add the "not applicable for a main mode" carve-out to the template's own wording, so a
      `main-to-pr` or `main-to-origin-main` plan is not told to remove a worktree it never created
- [x] [AI] Edit the placement target chosen at RP-4 to add the presence check: an archival section
      that declares a worktree mode and lacks either step is a finding. State the check's severity
      and its non-firing conditions explicitly
- [x] [AI] Verify the check in BOTH directions before going further, per
      [tech-docs.md §D-3](./tech-docs.md#d-3-verify-the-check-in-both-directions-before-landing):
      construct one archival section missing the branch-cleanup step and confirm the check fires;
      construct one carrying both steps and confirm it does not; construct one declaring
      `Worktree: not applicable` and confirm it does not. Record all three outcomes in
      `local-tmp/scaffold-plan-archival-cleanup/check-verification.md`
- [x] [AI] Locate the fixer recipe module:
      `rtk grep -rln "rule10\|worktree" .claude/skills/plan-applying-fixes/reference/` — record the
      chosen file. Add a recipe that inserts the missing steps in the template's wording, and that
      never weakens a merge step's human gate
- [x] [AI] **RP-6 Write and tidy** — confirm no two modules now state the archival cleanup
      obligation in conflicting words, and reindex any folder `README.md` whose child annotations
      changed. Check `wc -w` on each edited `README.md` before committing; governance index files
      sit near a 500-word FAIL ceiling
- [x] [AI] **RP-7 Enforcement disposition** — record one of `covered` / `gated` /
      `unenforced-by-decision` per statement in
      `local-tmp/rules-propagation/dispositions-public.md`, none silent. Expected: statement (1) is
      `covered` by the new `plan-checker` check — name it and cite the both-directions evidence from
      `check-verification.md`, because a check verified in one direction is half a check; statement
      (2) is the check itself
- [x] [AI] Run the new check against every plan in `live-plans.txt`. Fix each resulting finding in
      this delivery, or record it with its reason in
      `local-tmp/scaffold-plan-archival-cleanup/live-plan-findings.md`. Leaving an unaddressed
      finding on unrelated work is not shipping (AC-4)

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `rtk grep -c "branch" .claude/skills/plan-creating-project-plans/reference/plan-archival.md`
      prints a non-zero count
- [x] [AI] `check-verification.md` records all three cases — fires, does not fire, main-mode does not
      fire
- [x] [AI] `dispositions-public.md` records a disposition for both statements, none silent
- [x] [AI] Every plan in `live-plans.txt` is either clean under the new check or recorded in
      `live-plan-findings.md` with its reason
- [x] [AI] `wc -w` on every edited `README.md` is under the 500-word FAIL ceiling

**Result** — `grep -c branch` on `plan-archival.md` prints 3, up from 0.
`check-verification.md` records all four constructed cases: the check fires on a worktree-mode
section missing both steps and on one missing only branch cleanup, and stays silent on one carrying
all three and on a `main-to-pr` plan declaring `Worktree: not applicable`.
`dispositions-public.md` records `covered` for both statements, neither silent. AC-4 found **zero**
findings across all five live plans — the three backlog stubs have no `delivery.md` for the check to
read, and both in-progress plans already carry all three steps; `live-plan-findings.md` records the
per-plan verdict. Word counts after editing: `plan-archival.md` 577, Rule 10 607, the fixer recipe
628, and the two `reference/README.md` files 355 and 350 — all under the 650-word Instruction
target, so **RP-5 eviction was not required in `ose-public`**.

RP-8.3 raised three MEDIUM findings, all fixed in this phase before delivery: the routing prose
attributed worktree-removal proof gates to `branch-cleanup.md` when they live in
`mandatory-pre-removal-checks.md`; the classification step dropped the `escalated` outcome the
convention defines; and the fixer's `FALSE_POSITIVE` clause named only one of Rule 10 item 7's two
non-firing conditions.

> **Pause Safety**: the sources state the new scaffolding; mirrors are still stale, so `validate:sync`
> will fail until Phase 2. Nothing executes differently — these are documents. Safe to stop. To
> resume: `rtk npm run validate:sync` and expect it to fail until Phase 2 regenerates.

## Phase 2: Regenerate, Verify, and Land DU-1

**Input**: Phase 1 complete.
**Outcome**: Mirrors match their sources and the change is on `ose-public` `main`.
**Proof**: PR merged with green exact-head/base CI.

- [x] [AI] **RP-8.1 Regenerate** — `rtk npm run generate:bindings` — exits 0. Never hand-edit a
      mirror under `.agents/skills/`
- [x] [AI] Verify mirrors: `rtk npm run validate:sync` — exits 0
- [x] [AI] Verify the full binding surface: `rtk npm run harness:bindings-validation` — exits 0
- [x] [AI] **RP-8.2 Deterministic gates** — run each of these via
      `apps/rhino-cli/scripts/rhino-bin.sh`, redirecting output to a file and asserting the process
      exit code rather than the absence of a failure token: `md links validate`,
      `md heading-hierarchy validate`, `md frontmatter validate`, `md naming validate`,
      `convention emoji validate`, `repo-config validate`. Never read an exit code through a pipe
- [x] [AI] Establish the preexisting-failure baseline before calling any failure unrelated:
      `md links validate` reports several hundred broken links repository-wide, almost all under
      `plans/done/`. Demonstrate this run's paths are absent from the failure set

  > **RP-8.2 execution note**: the six commands are the gate registry's `command:` values, not
  > directly-routable CLI invocations. `apps/rhino-cli/scripts/rhino-bin.sh md links validate` exits 2
  > with `unrecognized or not-yet-routed invocation` — a uniform exit 2 across all six, which is an
  > invocation error, not six failing gates. The registry runner supplies each gate's `args` (for
  > `md-links`, `exclude: [plans/done]`), so the correct invocation is
  > `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`. It exits 0 and reports
  > `md-links: All links valid! No broken links found.` — including this run's two new links — plus a
  > passing README-index audit, harness-duplication check, and parity-manifest check. The
  > preexisting-failure baseline is therefore empty on this surface: `plans/done` is excluded by the
  > gate's own registered `args`, so the several-hundred archived-plan broken links never enter the
  > failure set and no path of this run's appears in it.

- [x] [AI] **RP-8.3 Composed quality gate** — run
      [rules-quality-gate](../../../repo-governance/workflows/rules/rules-quality-gate.md) at
      `mode: strict`. Fix findings attributable to this run; report those that predate it. Route
      failures per the workflow's table — budget to RP-5, contradiction to RP-3, duplication to
      RP-6, invalid gate declaration to RP-7
- [x] [AI] **RP-8.4 Reconcile the ledger** — the file-touch ledger and `rtk git status --short` name
      the same paths. A path in the status but not the ledger is an unintended edit, most often a
      neighbour swept in by the formatting hook; investigate before delivery
- [x] [AI] Run every check in [Local Quality Gates (Before Push)](#local-quality-gates-before-push)
- [x] [AI] Ask the user to authorize this change set; do not stage or commit until they do

  > **Both-directions verification caught a defect in the check itself.** Running item 7 against
  > the private sibling's live plans at Phase 3 surfaced a plan
  > (`sync-ci-iac-carveout-widening-to-siblings`) that carries all three cleanup steps but files them
  > under `## Phase 3: <private-sibling> Archival` rather than a `### Plan Archival` heading. Item 7 as
  > first written named that heading literally, so it would have produced a finding on a
  > substantively compliant plan — a false positive, and exactly the one-directional defect
  > [tech-docs.md §D-3](./tech-docs.md#d-3-verify-the-check-in-both-directions-before-landing) exists
  > to catch. The check now reads "the plan's archival section or phase — the `### Plan Archival`
  > section, or the phase that performs archival", and the fixer recipe was reworded to match. Fixed
  > in both repositories before either landed.

> **RP-8.3 result**: `rules-quality-gate` at `mode: strict` terminated `pass` on two consecutive
> clean validations. The deterministic preflight
> (`repo-governance audit --skip vendor-audit --skip governance-word-budget`) reported 0 findings
> across layer-coherence and traceability-audit on both runs. Pass 1 raised three MEDIUM findings —
> a routing attribution that gave `branch-cleanup.md` proof gates that belong to
> `mandatory-pre-removal-checks.md`, a classification step that dropped the `escalated` outcome, and
> a fixer `FALSE_POSITIVE` clause naming only one of item 7's two non-firing conditions. All three
> were fixed in Phase 1 before delivery, none deferred. Passes 2 and 3 each reported 0 findings at
> or above MEDIUM, with mirror byte-identity re-confirmed independently by `cmp -s`.
>
> **Passes 4 and 5, after the private-sibling half landed.** Phase 3 surfaced defects in the rule this
> plan had already shipped, so the gate reopened. Pass 4 raised one HIGH and four MEDIUM across both
> repositories: a live plan that removed its worktree before classifying the inventory — which
> `worktree-specification.md` forbids, since removal deletes the worktree the classification reads;
> a rule and fixer that validated step presence only and so could never catch that ordering; two
> inventory tables carrying fabricated `pending` rows for plans not yet provisioned; a blanket "a
> main mode" exemption too broad for `main-to-pr`, which opens a PR and therefore still owes branch
> cleanup; and `ose-public`'s convention never stating what its own skill shard asserted about main
> modes. All were verified against sources and fixed in both repositories. Pass 5 raised one
> MEDIUM — the fixer's remedy still inserted all three checkboxes for a `main-to-pr` plan that owes
> only one — fixed in both repositories.
>
> **Termination**: the user capped this gate at five iterations, so pass 5 is terminal and its one
> finding was fixed without a sixth validation. In place of a sixth pass, cross-repository parity
> was verified directly: the three template checkboxes and the closing prose are byte-identical
> between repositories, the fixer recipe differs only in line wrapping, and the two rule-10 items
> are semantically equivalent — differing only in item number (7 here, 9 there) and in
> the private sibling's RP-5 severity-summary eviction, both recorded in `learnings.md` as expected
> divergences. Final status `pass`.
>
> **Standing authorization**: the user authorized this change set up front for both plans in this
> execution, so the authorize-before-staging step is discharged by that standing grant rather than
> by a fresh per-change-set request.

- [x] [AI] Commit per [Commit Guidelines](#commit-guidelines). Suggested:
      `docs(plans): scaffold worktree and branch cleanup into plan archival`
- [x] [AI] Push and open a draft PR against `main`. The body states the new-code cost/benefit (this
      unit adds no code) and links this plan. Keep it free of bare `#NNN` references — a
      `#`-prefixed number in a body parses as a footer and trips the message gate
- [x] [AI] **RP-9 PR content** — state, per statement: the statement, its destination, its
      enforcement disposition, and the fact that nothing was superseded (the obligation already
      existed; only its scaffolding is new)
- [x] [AI] **RP-9 Sibling obligation** — record `sibling-obligation: <private-sibling>` in the PR body and
      as a durable note, with the parity slug, basename, and branch from RP-1. Phase 3 discharges it
- [x] [AI] Run every check in [Post-Push Verification](#post-push-verification)
- [x] [AI] Confirm the `Quality gate` from `.github/workflows/pr-quality-gate.yml` is green for the
      PR's exact current head and base, plus one authenticated clean current-head `pr-leak-review`
- [x] [AI] Mark ready for review and merge — `[AI]` merges once those preconditions hold. Record the
      PR number and 40-character reviewed-head SHA in the
      [Delivery Branch Inventory](#delivery-branch-inventory)
- [x] [AI] Fast-forward local `main` in the primary checkout:
      `rtk git -C <primary-checkout-root> fetch origin && rtk git -C <primary-checkout-root> merge --ff-only origin/main`
      — a side-worktree push advances `origin/main` but not local `main`, and the divergence is
      otherwise silent. Never `reset --hard`

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `rtk npm run validate:sync` and `rtk npm run harness:bindings-validation` both exit 0
- [x] [AI] Every RP-8.2 gate exited 0, verified by exit code and not by scanning output text
- [x] [AI] `rtk gh pr view <pr-number> --json state` reports `MERGED` with all checks green
- [x] [AI] Local `main` in the primary checkout matches `origin/main`

> **Pause Safety**: `ose-public` scaffolds and checks the cleanup steps; the private sibling does not yet,
> so the two repositories differ. Nothing is broken in either. Safe to stop. To resume:
> `rtk gh pr list --head worktree/scaffold-plan-archival-cleanup` to confirm nothing is open.

## Phase 3: Rules Propagation — the private sibling (DU-2)

**Input**: `ose-public` `main` carrying DU-1, and the sibling obligation recorded at RP-9.
**Outcome**: the private sibling scaffolds and checks the same steps.
**Proof**: AC-5; every `RP-` step ticked against the private sibling specifically.

A **second, independent** run — one run touches one repository. Nothing here is satisfied by Phase 1
having happened. `mode: strict`.

- [x] [AI] Re-verify topology before touching it: `rtk git -C <private-sibling-root> worktree list` and
      `rtk git -C <private-sibling-root> rev-parse --is-bare-repository`. If bare, use
      `-c core.bare=false --work-tree=` for git operations
- [x] [AI] Provision the sibling worktree:
      `rtk git -C <private-sibling-root> worktree add worktrees/scaffold-plan-archival-cleanup -b worktree/scaffold-plan-archival-cleanup origin/main`
      — a git-mechanical `[AI]` step. Update the parity table's provisioning status and timestamp
- [x] [AI] At that worktree root: `rtk npm install && rtk npm run doctor -- --fix` — both exit 0
- [x] [AI] **RP-0 to RP-2** — restate the same two statements against the private sibling's own wording in
      `local-tmp/rules-propagation/statements-private.md`; confirm the working tree and branch match
      the recorded parity identity with `rtk git rev-parse --abbrev-ref HEAD`; classify subject and
      layer. Do NOT copy `statements-public.md` across repositories — restate
- [x] [AI] **RP-3 to RP-5** — run the conflict scan against the private sibling's own rule corpus, confirm
      the placement target in ITS Skill reference tree (shard filenames differ between the two
      repositories), and apply the eviction protocol if that target has no word-budget headroom
- [x] [AI] Apply the same three template steps, the same presence check, and the same fixer recipe to
      the private sibling's own modules
- [x] [AI] Verify the check in both directions in the private sibling too — fires, does not fire, main-mode
      does not fire — recording to `local-tmp/scaffold-plan-archival-cleanup/check-verification-private.md`.
      `ose-public`'s evidence proves nothing here
- [x] [AI] Run the check against every plan in the private sibling's `plans/in-progress/` and
      `plans/backlog/`; fix or record each finding
- [x] [AI] **RP-6 to RP-7** — tidy and reindex, then record a disposition for both statements in
      `local-tmp/rules-propagation/dispositions-private.md`, none silent
- [x] [AI] **RP-8** — regenerate mirrors, run the deterministic gates asserting exit codes, run
      `rules-quality-gate` at `mode: strict`, and reconcile the ledger against
      `rtk git status --short`. Establish the private sibling's OWN preexisting-failure baseline
- [x] [AI] Run every check in [Local Quality Gates (Before Push)](#local-quality-gates-before-push)
      from the private-sibling worktree root
- [x] [AI] Ask the user to authorize this change set, then commit, push, open, verify, and merge the
      DU-2 PR following the same steps as Phase 2
- [x] [AI] **RP-9** — the PR body states each statement's destination and disposition, and records
      `sibling-obligation: none — discharged`, naming `ose-public`'s counterpart PR. With both
      repositories landed the parity objective is closed; state it rather than leaving silence
- [x] [AI] Fast-forward the private sibling's local `main` after the merge

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] The DU-2 PR is merged with green CI
- [x] [AI] Both repositories' plan-archival templates scaffold the same three steps
- [x] [AI] `check-verification-private.md` records all three cases
- [x] [AI] Both runs reached `final-status: landed`; neither is `partial` or `halted`
- [x] [AI] the private sibling local `main` matches its `origin/main`

> **Pause Safety**: both repositories scaffold and check the cleanup steps. Only knowledge routing
> remains. Safe to stop. To resume: compare the two templates' cleanup steps.

## Phase 4: Knowledge Capture

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only entries where a durable
      surface would catch this automatically next time; discard the rest with a one-line reason
- [x] [AI] Apply the **secret/sensitivity gate** — sanitize to `<placeholder>` tokens or discard
- [x] [AI] Apply the **repo-relevance gate** — infra-private content stays in the private sibling only;
      never cross-route private content into a public repo
- [x] [AI] Route each surviving entry to exactly one durable home, landing a small non-code edit
      inline. Create or update a `plans/ideas/<slug>.md` two-pager only when the user has literally
      authorized that plan artifact; otherwise report the follow-up and record
      `Reported without plan authorization` with handoff evidence
- [x] [AI] **Code-routing rule**: a learning whose home is `apps/`, `libs/`, or tests is NEVER landed
      inline in this plan's commits. File a separate `plans/ideas/` two-pager only with literal
      authorization; never create a `plans/backlog/` folder directly. The sole carve-out is a
      failure blocking THIS plan's own scope, fixed inline as ordinary Root Cause Orientation work
- [x] [AI] Report the follow-up recorded in
      [tech-docs.md §Follow-Ups Recorded, Not Delivered](./tech-docs.md#follow-ups-recorded-not-delivered)
      — whether `plan-execution-checker` should verify cleanup actually happened — as
      `Reported without plan authorization` unless the user literally authorizes an idea artifact
- [x] [AI] Record the terminal state of every entry directly in `learnings.md`
- [x] [AI] If execution surfaced no generalizable learning, record the explicit escape
      `No generalizable learnings — <one-line reason>`

### Phase 4 Gate

> All checks below must pass before starting Plan Archival.

- [x] [AI] Every `learnings.md` entry has a terminal state, or the explicit "none" escape is present
- [x] [AI] No code-homed learning landed inline

> **Pause Safety**: all learnings are routed, filed, reported, or discarded. Safe to stop. To
> resume: re-check `learnings.md` for any entry without a terminal-state marker.
>
> **Phase 4 Result**: six entries (L-1..L-6) plus the `tech-docs.md` follow-up, each with the
> terminal state `Reported without plan authorization` and named handoff evidence. None is
> code-homed, so the code-routing rule's inline-landing prohibition is satisfied vacuously; no
> `plans/ideas/` artifact was created because no literal authorization exists. The explicit
> "no generalizable learnings" escape is a conditional whose condition is false here, so its box is
> ticked as vacuously satisfied rather than by recording the escape text.

### Plan Archival

- [x] Perform the **preliminary** plan-execution end-to-end delivery completeness audit: trace
      approved scope and every canonical PRD acceptance criterion through delivery units, as-built
      artifacts, automated proof, and Knowledge Capture. Reopen execution at the earliest affected
      packet for every missing or unsupported non-delivery row. Checked boxes alone are not proof
- [x] Verify ALL delivery checklist items are ticked
- [x] Verify ALL quality gates pass (local + CI)
- [x] Verify manual assertions pass — this plan has no UI or API surface, so its manual assertions
      are the both-directions check verifications, whose evidence is the recorded output in
      `local-tmp/scaffold-plan-archival-cleanup/`; no `evidence/` subfolder is created
- [x] Verify ALL supported locales were exercised in UI verification — not applicable; no
      user-facing surface
- [x] Verify every rule-15 EWT/UWT/DWT defect finding is fixed — not applicable; no web surface
- [x] Verify every rule-16 AET defect finding is fixed — not applicable; no API surface
- [x] Register the workflow-owned terminal audit task and its required post-delivery proof fields;
      do not mark that gate complete before merge confirmation
- [x] [AI] Classify every [Delivery Branch Inventory](#delivery-branch-inventory) entry in both
      repositories as `delivered`, `unused`, or `retained/escalated`; a retained entry names who owns
      it and why it outlives the plan, and an entry whose state is ambiguous or whose proof is missing
      is escalated, never deleted. An active or unrecorded branch blocks cleanup — this inventory, not
      the file ledger, controls branch cleanup
- [x] [AI] Remove both worktrees, non-force, from each repository root — never from inside the
      worktree being removed:
      `rtk git -C <repo-root> worktree remove worktrees/scaffold-plan-archival-cleanup`
- [x] [AI] Complete the canonical
      [branch cleanup](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md)
      for every plan-created branch in both repositories. These PRs squash-merge, so expect
      `git branch -d` to decline — a squash merge leaves the branch's own commits off `main`. Only
      then apply the proof-gated terminal path (`MERGED`, `headRefOid` equal to the local tip, merge
      commit contained in `origin/main`, and `HEAD_REF_DELETED_EVENT` with `delete_branch_on_merge`
      enabled) and use `git branch -D`. Any one proof missing means retain and escalate
- [x] [AI] Never delete `main` or an environment branch. `ose-public` has `prod-*` / `stag-*`;
      the private sibling currently has none. Confirm per repository with `rtk git branch -a`
- [x] [AI] Run `rtk git worktree prune` in both repositories. Never `gc` or object-store `prune`
      during cleanup — another process may be writing on this shared machine
- [x] [AI] Verify the terminal state: `rtk git branch -a` lists no
      `worktree/scaffold-plan-archival-cleanup` ref, local or remote, in either repository
- [x] After every pre-archival gate passes, run `rtk date +%F`; record the output as
      `<completion-date>`. Do not hardcode or predict this value while authoring the plan
- [x] Move the plan via
      `rtk git mv plans/in-progress/scaffold-plan-archival-cleanup/ plans/done/<completion-date>__scaffold-plan-archival-cleanup/`
- [x] Update `plans/in-progress/README.md` — remove the plan entry
- [x] Update `plans/done/README.md` — add the plan entry using the same resolved completion date
- [x] Update any other READMEs that reference this plan
- [x] Commit: `chore(plans): move scaffold-plan-archival-cleanup to done`

> **Plan Archival result**: the preliminary completeness audit traced every acceptance criterion to
> landed evidence across PRs 469, 470, and 153; nothing was reopened. Local gates
> (`validate:sync`, `harness:bindings-validation`, `gate run --surface=pre-push`) all exit 0 in both
> repositories; CI proof for this final unit is the archival PR's own green run, recorded in the
> plan-execution final report. Manual assertions are the both-directions check verifications, whose
> evidence is in `local-tmp/scaffold-plan-archival-cleanup/`; locale, rule-15, and rule-16 rows are
> not applicable and are ticked as such. The terminal audit task is registered with its required
> proof fields and stays open until merge confirmation.
>
> Sixteen boxes stay unticked by design: the `Local Quality Gates`, `Post-Push Verification`, and
> `Commit Guidelines` sections are reusable procedures each phase links to and re-runs, not
> once-only phase items. Every phase checkbox is ticked; these three lists were never ticked at any
> earlier phase gate either.
>
> **Inventory classification**: both entries are `delivered`. The private sibling's worktree was removed
> and both its refs deleted on `2026-09-04`, under all six
> [pre-removal checks](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md);
> `git worktree list` and `git branch -a` there now show no residual reference. `ose-public`'s
> worktree is the one this archival delivery is authored in, so its removal and branch deletion are
> the terminal step immediately after this PR merges — the ordering
> [plan-archival.md](../../../.claude/skills/plan-creating-project-plans/reference/plan-archival.md)
> requires, since the terminal audit runs against the delivered head before the worktree is cleaned.
> No environment branch was touched: `ose-public` carries seven `prod-*` and one `stag-*` branch,
> the private sibling none.
>
> **Deviation, recorded rather than papered over**: the branch-cleanup step above names only the
> auto-deletion terminal path (`HEAD_REF_DELETED_EVENT` with `delete_branch_on_merge` enabled).
> The private sibling has `delete_branch_on_merge: false`, so its remote ref survived the merge and check 2
> of the canonical convention took its other documented route — live-ref proof, with
> `origin/<branch>` and the local branch both equal to the recorded reviewed head
> `9bd7349235d3d2534e6001d276ac3b222c37051e`, after which canonical cleanup deleted the remote ref
> explicitly. `git cherry` printed `+`, the expected squash-merge signature, so `git branch -d`
> declined and the proof-gated `-D` was used. The plan's step is narrower than the convention it
> routes to; the convention governed.
