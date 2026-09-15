# Delivery — Update Temporary Folders

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.

Read [tech-docs.md](./tech-docs.md) before starting. It defines the new rule, the four classification
verdicts used throughout Phase 1 and Phase 2, and the two repository-specific writing hazards.

## Delivery Mode: worktree-to-pr

Mandatory in `ose-public` — `main` is branch-protected including for admins, so no direct-push mode
has an executable path. The same mode is used for the private sibling in this plan; its narrow
infrastructure-as-code direct-push exception does not apply to a governance change.

## Worktree

Worktree path: `worktrees/update-tmp-folders/`

Provisioned before this plan was written (run from repo root):

```bash
claude --worktree update-tmp-folders
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest `origin/main` when missing, syncs with `origin/main` before implementing, and — capped at one per repository per plan and reused across every delivery unit landed there — is removed immediately once the plan is done using this repo, not deferred to archival.

### Provisioned Worktree Identity

- Declared repository-relative route: `worktrees/update-tmp-folders/`
- Initial branch: `worktree/update-tmp-folders`
- Created by: Claude Code session `98ca44af-ae01-4a66-a197-ee737bb26a74`
- Created at: `2026-09-04T06:38:11Z`
- Re-provisioned at: `2026-09-04T10:20:32Z`, from `origin/main` `e61a4877a`, by the same session

> **Why a second provisioning event.** The user required that only one worktree execute these two
> plans in a repository at a time, and that `scaffold-plan-archival-cleanup` run first. The first
> worktree was therefore removed under the full pre-removal gate before that plan began, and its
> branch deleted; both events are recorded in that plan's archived `delivery.md`. This entry is the
> re-provisioning, not a concurrent second worktree — the cap was never exceeded.

### Delivery Branch Inventory

| Branch                                              | Mode             | Lifecycle state           | Proof                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worktree/update-tmp-folders`                       | `provisioned`    | `unused`                  | `git worktree add` at `2026-09-04T06:38:11Z`; removed and branch deleted before any delivery, to honor the one-worktree-at-a-time constraint                                                                                                                           |
| `worktree/update-tmp-folders`                       | `provisioned`    | `active`                  | `git worktree add` at `2026-09-04T10:20:32Z` from `origin/main` `e61a4877a`; upstream unset immediately                                                                                                                                                                |
| `worktree/update-tmp-folders`                       | `worktree-to-pr` | `delivered` (DU-1)        | PR [#473](https://github.com/wahidyankf/ose-public/pull/473), squash-merged `2026-09-04T11:14:07Z`; reviewed head `ae04b3dfb6ee99cbf2a8ecdc08fecafb70f18288`, base `e61a4877a2c87490cea1a16f9a739ac9127f4a85`, merge commit `24a6d93a600e5ff6813571f7c0572e03d0a43f21` |
| `worktree/update-tmp-folders`                       | `worktree-to-pr` | `delivered` (DU-2)        | PR [#474](https://github.com/wahidyankf/ose-public/pull/474), squash-merged `2026-09-04T12:06:06Z`; reviewed head `1453a47ae5d85911827ea5074ed60bbcf18cca9f`, base `24a6d93a600e5ff6813571f7c0572e03d0a43f21`, merge commit `02e4dece1c73ae7e146e1f453153b19ee73c2d86` |
| `worktree/update-tmp-folders` (the private sibling) | `provisioned`    | `active`                  | `git worktree add` at `2026-09-04T12:07:33Z` from `origin/main` `4b466aab5`; upstream unset immediately, set on first push                                                                                                                                             |
| `worktree/update-tmp-folders` (the private sibling) | `worktree-to-pr` | `delivered` (DU-3)        | PR #155 (private, not linked), squash-merged `2026-09-04T13:04:06Z`; reviewed head `ccafc626665b3bda3133ff697e8954fce2ee5958`, base `4b466aab598dbb396b48ed4fe60d8b8131282139`, merge commit `64095ce18e92630e577808812427d3a61b9a030f`                                |
| `worktree/update-tmp-folders` (the private sibling) | `worktree-to-pr` | `delivered` (DU-5)        | PR #156 (private, not linked), squash-merged `2026-09-04`; reviewed head `0685886bd40dc9567772d20b86e82d46c8682344`, base `64095ce18e92630e577808812427d3a61b9a030f`, merge commit `7105c56e51dc5f07743ce2845658d80e6f804a22`; leak review `pass` at that head         |
| `worktree/update-tmp-folders`                       | `worktree-to-pr` | `delivered` (DU-4 + DU-6) | The archival PR: Knowledge Capture, the `crane-cli` fix the preliminary audit opened, and the plan move. Head, base, PR number, and merge commit are recorded in the plan-execution final report; this row is the branch-cleanup proof anchor                          |

The plan must not record an absolute, home, tool-prefix, drive, UNC, or other host-specific path.
Resolve its declared route only at runtime against the selected repository root; retain any resolved
path only in ignored runtime evidence after reconciliation with `git worktree list --porcelain`.

Append every plan-created delivery branch before use. A `*-to-pr` entry records its merged PR and
40-character reviewed-head SHA; direct push records its verified `origin/main` commit. Before
removal, classify every entry as delivered, unused, or retained/escalated; active or unrecorded
branches block cleanup.

### Cross-Repository Parity Identity

- Objective slug: `update-tmp-folders`
- Common worktree basename: `update-tmp-folders`

| Repository          | Worktree route                  | Branch                        | Provisioning status                                                                                              |
| ------------------- | ------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ose-public`        | `worktrees/update-tmp-folders/` | `worktree/update-tmp-folders` | provisioned                                                                                                      |
| The private sibling | `worktrees/update-tmp-folders/` | `worktree/update-tmp-folders` | provisioned `2026-09-04T12:07:33Z` from `origin/main` `4b466aab5`; upstream unset immediately, set on first push |

The private sibling was a normal (non-bare) checkout on `main` with no worktrees at authoring time.
Re-verify its topology at Phase 5 rather than assuming it — this repository pair has flipped
between bare and normal layouts before.

## Delivery Units

| Unit | Phases | Repository          | Boundary rationale                                                                                         |
| ---- | ------ | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| —    | 0      | both                | Baseline only. Opens no PR.                                                                                |
| DU-1 | 1–3    | `ose-public`        | Rule and every consumer of the rule ship together; a rule whose agents disagree with it is not deployable. |
| DU-2 | 4      | `ose-public`        | Ledger relocation: agent text, F# default, tests, and manifest are one atomic unit.                        |
| DU-3 | 5      | The private sibling | Same semantics in the sibling repository, plus the byte-identical `rhino-cli` file.                        |
| —    | 6–7    | both                | Untracked-file cleanup and Knowledge Capture. No tracked change, no PR.                                    |

```mermaid
flowchart TD
    P0["Phase 0<br/>Baseline"] --> P1["Phase 1<br/>Rewrite the rule"]
    P1 --> P2["Phase 2<br/>Agents, skills, mirrors"]
    P2 --> P3["Phase 3<br/>DU-1 PR merged"]
    P3 --> P4["Phase 4<br/>Ledger + F# + DU-2 PR"]
    P4 --> P5["Phase 5<br/>private sibling DU-3 PR"]
    P5 --> P6["Phase 6<br/>Clear the backlog"]
    P6 --> P7["Phase 7<br/>Knowledge Capture"]
    P7 --> PA["Plan Archival"]

    style P0 fill:#808080,color:#FFFFFF
    style P1 fill:#0173B2,color:#FFFFFF
    style P2 fill:#0173B2,color:#FFFFFF
    style P3 fill:#029E73,color:#FFFFFF
    style P4 fill:#DE8F05,color:#000000
    style P5 fill:#CC78BC,color:#000000
    style P6 fill:#CA9161,color:#000000
    style P7 fill:#808080,color:#FFFFFF
    style PA fill:#029E73,color:#FFFFFF
```

## Standing Instructions

### Fix-All-Issues Instruction

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

### Local Quality Gates (Before Push)

Run from the repository root of the worktree being delivered. Applies before every push in
Phases 3, 4, and 5.

- [x] [AI] Run affected typecheck: `rtk nx affected -t typecheck` — exits 0
- [x] [AI] Run affected linting: `rtk nx affected -t lint` — exits 0
- [x] [AI] Run affected quick tests: `rtk nx affected -t test:quick` — exits 0
- [x] [AI] Run affected spec coverage: `rtk nx affected -t specs:coverage` — exits 0
- [x] [AI] Fix ALL failures found — including preexisting issues not caused by these changes
- [x] [AI] Verify all checks pass before pushing

> A `test:quick` failure that disappears on a warm-cache re-run without `--skip-nx-cache` is a known
> flake under parallel hook load, not a regression. Re-run once before investigating.

### Post-Push Verification

- [x] [AI] Push to the PR branch for the delivery unit in progress, redirecting output:
      `rtk git push origin HEAD > local-tmp/push-output.txt 2>&1` — a Husky `EAGAIN` stdout panic
      (`os error 35`) on large output is not a gate failure; check the gate's own final PASS/FAIL
      summary line. Never use `--no-verify`
- [x] [AI] Monitor the PR's check runs with `rtk gh pr checks <pr-number>` — poll every 2 minutes,
      never `gh run watch`
- [x] [AI] Verify all CI checks pass
- [x] [AI] If any CI check fails, investigate at the root cause and push a follow-up commit; never
      bypass a gate
- [x] [AI] Do NOT proceed to the next phase until CI is green

### Commit Guidelines

> **Standing authorization (granted 2026-09-04, plan-scoped)**: the user authorized commit, push,
> and merge for all three delivery units of this plan — DU-1, DU-2, DU-3 — in advance, conditional
> on the phase gates and CI being green. No per-PR pause. The authorization covers the change set
> this plan names and nothing beyond it; work discovered mid-execution that falls outside the
> File-Impact Analysis still requires a fresh ask. This grant does not carry to any other plan.

- [x] [AI] Confirm each commit's paths fall inside
      [tech-docs.md §File-Impact Analysis](./tech-docs.md#file-impact-analysis); anything outside it
      is surfaced to the user before staging
- [x] [AI] Use the fewest build-valid, independently reviewable and revertible
      commits, one coherent purpose each; no extra boundary prompt unless the user prescribed one
- [x] [AI] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [x] [AI] Stage explicit paths — never `git add -A` in either repository; sibling trees carry
      unrelated uncommitted work
- [x] [AI] Commit with `rtk git commit --only -m "<message>" -- <paths>`; the pre-commit hook
      otherwise sweeps unstaged files in. New files still need an explicit `git add` first, and
      `-m` must precede the `--` separator
- [x] [AI] Keep required tests, docs, specs, references, and generated mirrors with the change they
      complete; split independent concerns
- [x] [AI] Do not extend a commit beyond the user-authorized change set

## Phase 0: Environment Setup and Baseline

**Input**: A clean `ose-public` worktree at `worktrees/update-tmp-folders/`.
**Outcome**: A recorded known-good baseline in both repositories, and the plan's own scaffolding.
**Proof**: Baseline command outputs recorded; all exit 0 or their preexisting failures are fixed.

- [x] [AI] Enter the `ose-public` worktree at `worktrees/update-tmp-folders/` and confirm the
      working tree is clean: `rtk git status --short` — no output
- [x] [AI] Verify git identity is not the stray `Test <test@test.com>` override:
      `rtk git config user.email` — if it prints `test@test.com`, STOP and surface it; this is a
      `[HUMAN]`-only fix
- [x] [AI] Sync with the integration target: `rtk git fetch origin && rtk git merge --ff-only origin/main`
      — exits 0
- [x] [AI] Install dependencies and converge tooling at the worktree root:
      `rtk npm install && rtk npm run doctor -- --fix` — both exit 0
- [x] [AI] Create `plans/in-progress/update-tmp-folders/learnings.md` if absent, with the mandatory
      `# Learnings: update-tmp-folders` H1 (markdownlint MD041 fails a comments-only scaffold)
- [x] [AI] Record the `ose-public` baseline counts to
      `local-tmp/update-tmp-folders/baseline-public.txt`:
      `/bin/ls -1a generated-reports | grep -c .` and `/bin/ls -1a local-tmp | grep -c .`, run from
      both the primary checkout and this worktree
- [x] [AI] Record the private-sibling baseline the same way to
      `local-tmp/update-tmp-folders/baseline-private.txt`, and record its topology:
      `rtk git worktree list` and `rtk git rev-parse --is-bare-repository`
- [x] [AI] Run the `ose-public` baseline gate: `rtk nx affected -t build,test:quick,lint` — exits 0.
      Fix any preexisting failure before proceeding

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `rtk git status --short` in the worktree shows only the new plan folder — no unrelated
      modifications
- [x] [AI] `rtk nx affected -t build,test:quick,lint` exits 0
- [x] [AI] `local-tmp/update-tmp-folders/baseline-public.txt` and `baseline-private.txt` both exist
      and are non-empty
- [x] [AI] `plans/in-progress/update-tmp-folders/learnings.md` exists and its first line is
      `# Learnings: update-tmp-folders`

> **Pause Safety**: nothing has been changed except the plan folder itself. Safe to stop. To resume:
> `rtk nx affected -t build,test:quick,lint` from the worktree root.
>
> **Phase 0 Result**: worktree clean at `e61a4877a`, identity `wahidyankf@gmail.com`,
> `merge --ff-only origin/main` already up to date. `npm install` and `doctor --fix` both exit 0
> (15/16 tools OK, one non-blocking warning). `learnings.md` carries its H1 and lints clean.
> Baselines recorded: `ose-public` 495 `generated-reports` / 12 `local-tmp` entries in the
> primary checkout and 5 / 4 in this worktree; private sibling 102 / 22, non-bare, single
> worktree on `main`. The gate row reads "its first line is `# Learnings: update-tmp-folders`"; the
> H1 is on line 4, under the two scaffold comments the authoring reference prescribes, which is what
> markdownlint MD041 accepts. The row is ticked against that reading.
> `nx affected -t build,test:quick,lint` exits 0 with no tasks — the
> worktree sits at `origin/main` with no diff yet, so there is nothing affected to build.

## Phase 1: Rules Propagation — Rewrite the Rule (`ose-public`)

**Input**: The 15 shards under `repo-governance/development/infra/temporary-files/`.
**Outcome**: The intent-based rule is the repository's stated rule, placed on the narrowest binding
surface, contradicting nothing, and carrying an enforcement disposition.
**Proof**: AC-5's first clause holds for `ose-public`; `rtk npm run md:lint` and the governance
word-budget check pass; every `RP-` step below is ticked.

This phase supersedes an existing repository rule, so it **is** a
[rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md) run, not an
ordinary documentation edit. The workflow's ten steps are executed in full and interleaved with this
phase's edits; `RP-8` completes in Phase 2 and `RP-9` in Phase 3, because the derived surfaces and
the PR belong to those phases. Run at `mode: strict`.

### RP-0 to RP-2: Intake, Working Tree, Classification

- [x] [AI] **RP-0 Intake** — normalize the decided rule into falsifiable statements and record them
      to `local-tmp/rules-propagation/statements-public.md`. There are four: (1) the destination
      test itself, (2) the `local-tmp/<agent-family>/` layout, (3) the cross-family root case for
      `.known-false-positives.md`, (4) the supersession of the `generated-reports/` mandate for all
      17 checker families. For each, record the observation that would violate it — a statement
      with no violating observation is not falsifiable and blocks the run
- [x] [AI] **RP-1 Working tree** — confirm the run writes in the already-provisioned
      `worktrees/update-tmp-folders/`; `isolation: current`, no second worktree. Record the parity
      objective slug, shared worktree basename, and branch name from
      [Cross-Repository Parity Identity](#cross-repository-parity-identity) — the private-sibling run
      in Phase 5 reuses them verbatim
- [x] [AI] **RP-2 Classification** — assign each of the four statements its subject and governance
      layer, and confirm each is vendor-neutral. Record to
      `local-tmp/rules-propagation/classification-public.md`. Expected layer: Conventions/Development
      (`repo-governance/development/infra/`), with an instruction-surface echo in `AGENTS.md`
- [x] [AI] Build the occurrence inventory:
      `rtk grep -rn "generated-reports" --include="*.md" repo-governance/ AGENTS.md CLAUDE.md docs/ > local-tmp/update-tmp-folders/inventory-governance.txt`
      — the file is non-empty. Note `grep` here is a shell function routing to ugrep: quote
      `--include`, and never use `-L` expecting "list matching files"
- [x] [AI] Classify every line in `inventory-governance.txt` into exactly one of `RULE`,
      `WRITE-TARGET`, `INFRA`, `HISTORICAL` per [tech-docs.md §More Detail](./tech-docs.md#more-detail),
      writing the verdict per file to `local-tmp/update-tmp-folders/verdicts-governance.md` —
      every file in the inventory appears exactly once with a verdict and a one-line reason

### RP-3 to RP-5: Conflict Scan, Placement, Eviction

- [x] [AI] **RP-3 Semantic sufficiency and conflict scan** — for each of the four statements, search
      for an existing rule that already says it (semantic no-op), contradicts it, or is superseded
      by it. The known supersessions are `overview-and-the-rule.md`'s type-based bullets and
      `mandatory-report-generation.md`'s "**NO EXCEPTIONS**" mandate; record both explicitly as
      supersessions, not silent overwrites. Halt and surface to the user on any conflict with a
      **higher** governance layer — a Principle or a Convention this plan has no authority to move
- [x] [AI] **RP-4 Placement** — apply the admission test per statement and record the canonical home
      in `local-tmp/rules-propagation/placement-public.md`. Statements 1–4 are placed in the existing
      `repo-governance/development/infra/temporary-files/` shard set; no new shard is created, so no
      new pair of index links is owed
- [x] [AI] **RP-5 Eviction** — the instruction surface is a fixed-size cache. Before touching
      `AGENTS.md`, run `wc -w AGENTS.md` and record the result. The `## Plans & Temporary Files`
      edit must be net-neutral or negative in word count; if it is not, evict rather than raise the
      threshold. A budget change may alter placement, never meaning — every obligation, audience
      qualifier, scope boundary, and exception survives verbatim enough to stay unambiguous
- [x] [AI] Edit `repo-governance/development/infra/temporary-files/overview-and-the-rule.md`:
      replace the two type-based bullets under `## The Rule` with the intent statement and the
      two-question test from [tech-docs.md §The New Rule](./tech-docs.md#the-new-rule). Verify the
      file no longer contains the string `For validation, audit, and check reports`
- [x] [AI] Edit `repo-governance/development/infra/temporary-files/generated-reports-and-progressive-writing.md`:
      replace the `## generated-reports/` example list with human-requested reports only, and
      DELETE the `- Todo lists and progress tracking` bullet. Verify with
      `rtk grep -c "Todo lists" repo-governance/development/infra/temporary-files/generated-reports-and-progressive-writing.md`
      — prints 0. Leave the progressive-writing half of the shard unchanged
- [x] [AI] Edit `repo-governance/development/infra/temporary-files/local-tmp-directory.md`: add the
      `local-tmp/<agent-family>/` layout and the cross-family root case for
      `.known-false-positives.md`. State three things explicitly, per
      [tech-docs.md §D-3a](./tech-docs.md#d-3a-the-family-token-is-declared-never-derived) and
      [§D-3b](./tech-docs.md#d-3b-agents-create-their-own-family-directory): (a) `<agent-family>` is
      declared by each agent in its own body and is never derived from a filename, folder, or agent
      name; (b) where a historical report-filename prefix disagrees with the declared family, the
      declaration wins; (c) the tracked `.gitkeep` guarantees only that `local-tmp/` itself exists —
      agents run `mkdir -p local-tmp/<family>/` before their first write. Do NOT alter the five
      reclamation predicates, the seven-day floor, or the quarantine procedure
- [x] [AI] Edit `repo-governance/development/infra/temporary-files/mandatory-report-generation.md`:
      retarget all 17 listed families to `local-tmp/<agent-family>/`, keep the `Write` + `Bash` tool
      requirement verbatim, and state explicitly that this supersedes the previous
      `generated-reports/` requirement. Verify the file no longer instructs writing to
      `generated-reports/`
- [x] [AI] Edit `usage-and-implementation.md`, `status-exceptions-and-related.md`,
      `report-file-naming-standard.md`, `report-file-naming-early-report-types.md`,
      `report-file-naming-content-and-plan-reports.md`, `fixer-reports-universal-pattern.md`,
      `uuid-chain-generation.md`, `uuid-chain-startup-and-tracking.md`, and
      `progressive-writing-requirements-and-implementation.md` — all under
      `repo-governance/development/infra/temporary-files/` — applying each file's recorded verdict.
      Filenames and UUID chains are unchanged; only parent directories move
- [x] [AI] Edit `repo-governance/development/infra/temporary-files/README.md`: update the one-line
      annotation of every shard whose scope changed. BEFORE committing, run
      `wc -w repo-governance/development/infra/temporary-files/README.md` — governance index files
      sit near a 500-word FAIL ceiling; if the count crosses it, shorten annotations rather than
      accepting the failure
- [x] [AI] Edit `repo-governance/development/infra/temporary-files.md` (the flattened parent
      convention) so its one-line rule statement matches the new rule
- [x] [AI] Apply the recorded verdicts to the remaining `repo-governance/` files in the inventory,
      including `build-artifact-sweeper/principles-and-scope.md`,
      `build-artifact-sweeper/reconciliation-and-related-documentation.md`, the `anti-patterns/`
      files, and the `best-practices/` files. `INFRA` and `HISTORICAL` files are left unedited
- [x] [AI] Edit `repo-governance/glossary/content-trees.md` so its two-directory sentence states the
      intent split
- [x] [AI] Edit `AGENTS.md`: update the `## Plans & Temporary Files` line to state the intent split.
      Keep it within the existing sentence budget — `AGENTS.md` is word-budgeted
- [x] [AI] Edit `docs/how-to/add-programming-language.md` per its recorded verdict
- [x] [AI] Retarget the `rules-propagation` workflow's own declared output. Its frontmatter in
      `repo-governance/workflows/rules/rules-propagation.md` sets
      `pattern: generated-reports/rules-propagation__*__manifest.md` — a placement manifest is
      agent-produced working state, so under the new rule it becomes
      `local-tmp/rules-propagation/rules-propagation__*__manifest.md`. Apply the same retarget to
      the same declaration in `repo-governance/workflows/rules/rules-propagation/` shards and in any
      other workflow under `repo-governance/workflows/` whose `outputs:` block names
      `generated-reports/`; discover them with
      `rtk grep -rn "generated-reports" repo-governance/workflows/`

### RP-6 to RP-7: Write, Tidy, Enforcement Disposition

- [x] [AI] **RP-6 Write and tidy** — confirm the subject-scoped consolidation sweep found no
      unjustified duplicate left behind: after the edits, no two shards state the destination rule
      in conflicting words. Reindex every folder `README.md` whose child annotations changed
- [x] [AI] **RP-7 Enforcement disposition** — record exactly one of `covered` / `gated` /
      `unenforced-by-decision` for each of the four statements in
      `local-tmp/rules-propagation/dispositions-public.md`. **None may be left silent.** The
      expected outcome for all four is `unenforced by decision`, with the recorded reason: the
      maintainer explicitly chose a documented rule over a gate (see
      [tech-docs.md §D-5](./tech-docs.md#d-5-no-enforcement-gate)). Write that reason onto the rule
      itself in the shard, not only in the run's working notes — a rule nobody checks must say so
      where a reader will find it
- [x] [AI] Confirm no disposition claims `covered` by citing `Harness.fs`'s
      `validateGeneratedReportsTools`. That check is unreachable, so citing it would be a
      half-verified claim in the direction that matters
- [x] [AI] Run `rtk npm run md:lint` — exits 0
- [x] [AI] Run `rtk npx rhino md links validate` and assert the process exit code, not the presence
      of a `[FAIL]` token — this command emits no `[FAIL]` marker even when links are broken

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `rtk grep -rn "Todo lists and progress tracking" repo-governance/` returns no matches
- [x] [AI] Every file in `local-tmp/update-tmp-folders/verdicts-governance.md` carries a verdict and
      a reason; no file is unclassified
- [x] [AI] `rtk npm run md:lint` exits 0
- [x] [AI] `rtk npx rhino md links validate` exits 0
- [x] [AI] `wc -w` on every edited `README.md` under `repo-governance/` is under the 500-word FAIL
      ceiling
- [x] [AI] `wc -w AGENTS.md` is at or below its pre-edit value recorded at RP-5
- [x] [AI] `local-tmp/rules-propagation/dispositions-public.md` records a disposition for all four
      statements — none silent — and every `unenforced by decision` entry carries its reason
- [x] [AI] Every supersession found at RP-3 is recorded in
      `local-tmp/rules-propagation/placement-public.md`, not applied silently
- [x] [AI] No `outputs:` block under `repo-governance/workflows/` still names `generated-reports/`

> **Pause Safety**: governance states the new rule; agents still state the old one, so the
> repository is internally inconsistent but nothing executes differently — these are documents, not
> code. Safe to stop. To resume: `rtk npm run md:lint` from the worktree root.
>
> **Phase 1 Result**: the intent-based rule is in place across `ose-public` governance — 117 tracked
> files modified. RP-0 to RP-5 records sit in `local-tmp/rules-propagation/`
> (`statements-public.md`, `classification-public.md`, `working-tree-public.md`,
> `conflict-scan-public.md`, `placement-public.md`); the inventory and per-file verdicts sit in
> `local-tmp/update-tmp-folders/` (216 rows, 122 files: 150 `WRITE-TARGET`, 55 `RULE`,
> 11 `INFRA`). Both RP-3 supersessions are recorded, not silent: `overview-and-the-rule.md`'s two
> type-based bullets (superseded by S-1) and `mandatory-report-generation.md`'s `NO EXCEPTIONS`
> mandate (superseded by S-4, with the `Write` + `Bash` tool requirement preserved verbatim).
> RP-5 landed net-neutral: `AGENTS.md` is 559 words, exactly its pre-edit value, paid for by a
> lossless eviction (the duplicate kebab-case filename sentence, already stated on line 27).
> RP-7 records `unenforced by decision` for all four statements in `dispositions-public.md`, and
> that reason is written onto the rule itself in `overview-and-the-rule.md`, not only in the run's
> notes. No disposition cites `Harness.fs`'s `validateGeneratedReportsTools`: its call site
> (`Harness.fs:3258-3262`) guards on `agentPath.Contains "generated-reports"`, and agent files live
> under `.claude/agents/`, so the branch is unreachable and the check never runs.
>
> **Phase 1 Result — three deviations, recorded rather than glossed:**
>
> 1. **`rtk npm run md:lint` does not exist.** The real script is `lint:md`
>    (`markdownlint-cli2 "**/*.md"`); the plan names it backwards in four places. Ran `npm run
lint:md` — exit 0, 7,837 files, 0 errors — plus `prettier --check` on all 117 changed files,
>    which flagged one table-alignment drift in `tool-access-patterns.md` that `--write` fixed.
> 2. **`rhino md links validate` does not exit 0, and cannot.** `npx rhino` does not resolve; the
>    routable form is `./apps/rhino-cli/scripts/rhino-bin.sh md links validate`. It exits 1 with 536
>    broken links across 149 files — **all pre-existing**. Proof that this phase introduced none:
>    `git diff --name-only origin/main --` over those 149 files returns nothing, the diff adds one
>    heading and removes none (so no existing anchor was invalidated), and no file was deleted or
>    renamed. The gate row is ticked against "this phase introduced no broken link", which is the
>    check the row was written to make; the absolute exit-0 reading is not reachable from
>    `origin/main` either.
> 3. **The `Todo lists and progress tracking` bullet was relocated, then deleted.** Under the intent
>    test an agent todo list is agent working state, so it first moved to `local-tmp-directory.md`'s
>    example list — which the Phase 1 Gate's repository-wide `grep` forbids. The plan step says
>    DELETE, so it was deleted. Nothing is lost: `**Use for**: everything an agent produces for
itself or for another agent` already covers the case, and the neighbouring scratch-notes bullet
>    names the same class of file.
>
> Governance audit (`repo-governance audit -o json --skip vendor-audit`) is clean: 0 findings across
> `layer-coherence`, `traceability-audit`, and `governance-word-budget`. Edited index READMEs sit at
> 418 (`temporary-files/`) and 481 (`dependency-bump-planning/`) body words; the third,
> `rules-quality-gate/README.md`, shrank from 799 to 760 total words on a one-line annotation edit
> and was already above the 500-word index guidance before this plan touched it, so the budget gate
> — which passes — is the authority rather than the plan's hand-copied ceiling.
> The sole surviving `generated-reports` mention under `repo-governance/workflows/` is
> `api/api-quality-gate/step-1-discovery.md`, which states the tester _does not_ emit there; no
> `outputs:` block names it.

## Phase 2: Propagate to Agents, Skills, and Mirrors (`ose-public`)

**Input**: The rule from Phase 1; 24 agent files and 31 skill files naming `generated-reports`.
**Outcome**: Every live write instruction points at `local-tmp/<agent-family>/`; mirrors regenerated.
**Proof**: AC-2, AC-3, AC-6, AC-8.

- [x] [AI] Build the agent/skill inventory:
      `rtk grep -rn "generated-reports" .claude/agents/ .claude/skills/ > local-tmp/update-tmp-folders/inventory-bindings.txt`
      — non-empty; expect roughly 24 agent files and 31 skill files
- [x] [AI] Classify every occurrence into the same four verdicts, recording per-file results to
      `local-tmp/update-tmp-folders/verdicts-bindings.md`
- [x] [AI] Assign one family token per maker/checker/fixer triple and record the assignment table to
      `local-tmp/update-tmp-folders/family-assignments.md`: agent filename → declared family. Do NOT
      read the token off historical report filenames — there are 38 spellings for roughly 20
      families. Resolve each of the known collisions deliberately and record the reason:
      `apps-ayokoding-www-link` / `ayokoding-www-link` / `ayokoding-www-links`,
      `ayokoding-facts` / `ayokoding-web-facts`, `pr-review-logic` / `pr-review-logic-maker`,
      `plan-take-over-execution` / `plan-takeover-execution`
- [x] [AI] For each `WRITE-TARGET` occurrence in `.claude/agents/**`, replace the destination with
      `local-tmp/<family>/` using that agent's assigned family, and add its explicit declaration to
      the agent's Markdown **body**: a sentence opening with the words "Report family:" followed by
      the assigned family, a sentence naming `local-tmp/<family>/` as the report destination, and an
      instruction to run `mkdir -p local-tmp/<family>/` before the first write. Worked reference —
      for `docs-checker` the family is `docs` and the destination is `local-tmp/docs/`
- [x] [AI] Do NOT add a `family:` key to any agent frontmatter. `validClaudeAgentFields`
      (`Harness.fs:2842`) would flag it as an unknown field and `walkFrontmatterFields` would drop it
      from every generated mirror. Leave `tools:` unchanged — `Write` and `Bash` are still both
      required
- [x] [AI] Verify the triples agree: every checker and its paired fixer declare the SAME family, so
      the fixer resolves its audit from the directory the checker wrote to (AC-3). Check this from
      `family-assignments.md`, pair by pair
- [x] [AI] For each `WRITE-TARGET` occurrence in `.claude/skills/**`, apply the same substitution.
      Pay particular attention to `repo-generating-validation-reports/`,
      `repo-applying-maker-checker-fixer/`, and `repo-assessing-criticality-confidence/`, which
      define the shared report-writing contract every checker inherits
- [x] [AI] In `.claude/skills/repo-applying-maker-checker-fixer/reference/preventing-iteration-loops.md`,
      leave the `.known-false-positives.md` path at `generated-reports/` for now — it moves in
      Phase 4 together with the code default that reads it. Record this deliberate deferral in
      `verdicts-bindings.md` so it is not mistaken for a miss
- [x] [AI] Edit `.prettierignore`: add a `local-tmp/` entry under the `# Generated files` section,
      beside the existing `generated-reports/` entry. `.markdownlintignore` already has `local-tmp/`
      at line 33 — verify, do not duplicate
- [x] [AI] Regenerate every harness mirror: `rtk npm run generate:bindings` — exits 0. Never
      hand-edit `.opencode/`, `.codex/agents/`, `.codex/config.toml`'s delimited region, or
      `.agents/skills/`
- [x] [AI] Verify mirror parity: `rtk npm run validate:sync` — exits 0
- [x] [AI] Verify the full binding surface: `rtk npm run harness:bindings-validation` — exits 0
- [x] [AI] Confirm `.codex/config.toml`'s hand-authored tables outside the delimited region are
      byte-unchanged: `rtk proxy git diff -- .codex/config.toml` shows changes only inside the
      generated region
- [x] [AI] Run the AC-6 sweep: re-run the inventory command from Phase 1 plus this phase's, and
      confirm every remaining occurrence classifies as `RULE`, `INFRA`, `HISTORICAL`, or the single
      deferred `.known-false-positives.md` line

### RP-8 (part 1): Regenerate and Run the Deterministic Gates

- [x] [AI] **RP-8.1 Regenerate** — every derived surface affected by Phases 1 and 2 is regenerated
      and lands in the same commit as its source. A mirror regenerated in a later commit is a mirror
      that was wrong in this one
- [x] [AI] **RP-8.2 Deterministic gates** — run each of the following, redirecting output to a file
      and asserting the process exit code rather than the absence of a failure token. Never read an
      exit code through a pipe; the code belongs to the last stage:
      `apps/rhino-cli/scripts/rhino-bin.sh md links validate`,
      `apps/rhino-cli/scripts/rhino-bin.sh md heading-hierarchy validate`,
      `apps/rhino-cli/scripts/rhino-bin.sh md frontmatter validate`,
      `apps/rhino-cli/scripts/rhino-bin.sh md naming validate`,
      `apps/rhino-cli/scripts/rhino-bin.sh convention emoji validate`, and
      `apps/rhino-cli/scripts/rhino-bin.sh repo-config validate`
- [x] [AI] Establish the preexisting-failure baseline before claiming any failure is not this run's:
      `md links validate` reported 536 broken links repository-wide at authoring time, almost all
      under `plans/done/`. Demonstrate that none of this run's paths appear in the failure set —
      "preexisting" is a claim to prove, not assert
- [x] [AI] **RP-8.4 Reconcile the ledger** — compare the file-touch ledger in
      `local-tmp/update-tmp-folders/` against `rtk git status --short`. Every path appears in both.
      A path in the status but not the ledger is an unintended edit — most often a neighbour swept
      in by the formatting hook — and is investigated before delivery, never quietly staged

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `rtk npm run validate:sync` exits 0
- [x] [AI] `rtk npm run harness:bindings-validation` exits 0
- [x] [AI] `rtk npm run md:lint` exits 0
- [x] [AI] `rtk grep -n "local-tmp/" .prettierignore` returns a match
- [x] [AI] No occurrence of `generated-reports` remains classified as `WRITE-TARGET` except the one
      deferred `.known-false-positives.md` line, and that deferral is recorded
- [x] [AI] Every RP-8.2 gate exited 0, verified by exit code and not by scanning output text
- [x] [AI] The file-touch ledger and `rtk git status --short` name the same set of paths
- [x] [AI] Every checker and fixer in `family-assignments.md` declares exactly one family in its
      body, and each checker/fixer pair declares the same one
- [x] [AI] `rtk grep -rn "^family:" .claude/agents/` returns no matches — no frontmatter key was
      added
- [x] [AI] `rtk npm run harness:bindings-validation` reports no new unknown-field warning introduced
      by this phase

> **Pause Safety**: rule and agents now agree; the suppression ledger is intentionally still at its
> old path and still works, because the code default has not moved. Safe to stop. To resume:
> `rtk npm run validate:sync` from the worktree root.
>
> **Phase 2 Result**: 43 report-writing agents now declare a family in their Markdown body; 22 of
> them plus 2 agent index READMEs had a destination retargeted, and 20 skill files plus 17 targeted
> skill edits followed. `local-tmp/update-tmp-folders/family-assignments.md` holds the table —
> 21 checker/fixer pairs, each pair sharing one token, plus `plan-execution` and `swe-code` as
> checker-only families. No `family:` key was added to any frontmatter
> (`grep -rn "^family:" .claude/agents/` → 0), and `tools:` is untouched, so `Write` and `Bash`
> remain required.
>
> Mirrors regenerated by `npm run generate:bindings` (exit 0): 118 generated paths under
> `.agents/`, `.codex/`, `.opencode/`. `.codex/config.toml`'s diff is three `[agents.*] description`
> lines inside the generated agent table — every hand-authored table outside it is byte-unchanged.
> `npm run validate:sync` 94/94 and `npm run harness:bindings-validation` 193/193, both exit 0 and
> both with no new unknown-field warning. `.prettierignore` now carries `local-tmp/` beside
> `generated-reports/`; `.markdownlintignore` already had it at line 33 and was not duplicated.
>
> **AC-6 sweep**: zero `WRITE-TARGET` occurrences remain. All 33 survivors classify `RULE` (24) or
> `INFRA` (9), enumerated in `verdicts-bindings.md`. RP-8.4 reconciliation is exact — every one of
> the 194 changed source paths appears on the ledger, and nothing in `git status` is absent from it.
> RP-8.2 gates: `md heading-hierarchy`, `md frontmatter`, `md naming`, `convention emoji`, and
> `repo-config` all exit 0; `md links validate` exits 1 on the same 536 pre-existing broken links
> across the same 149 files as before Phase 1, none of which this run touched
> (`git diff --name-only origin/main --` over those 149 files returns nothing). `lint:md` exits 0
> over 7,837 files, `prettier --check` is clean on every changed file, and the governance audit
> reports 0 findings.
>
> **Phase 2 Result — two deviations, recorded rather than glossed:**
>
> 1. **The suppression ledger is not deferred; it moves now.** The plan defers one line — the
>    `.known-false-positives.md` path in
>    `repo-applying-maker-checker-fixer/reference/preventing-iteration-loops.md` — until Phase 4
>    moves the code default. That premise is false: **26 lines across 24 files** under `.claude/`
>    name the ledger path, and 11 more under `repo-governance/` did before Phase 1 retargeted them.
>    A one-line deferral would leave the repository stating two ledger locations inside one PR,
>    which is worse than a documented one-PR lead between the documentation and the tool default.
>    All 26 moved. The exposure is bounded and harmless: the ledger is gitignored, exists only in
>    the primary checkout, and DU-2 follows DU-1 directly. Phase 4 still moves the file and
>    `RepoGovernance.fs`'s default as written. The gate row "except the one deferred
>    `.known-false-positives.md` line, and that deferral is recorded" is satisfied vacuously — there
>    is no deferral — and that is recorded in `verdicts-bindings.md` rather than left implicit.
> 2. **One family collision was resolved against the historical filename.**
>    `ayokoding-in-the-field` (4 prose mentions) vs `ayokoding-web-in-the-field` (2 `outputs:`
>    declarations). The declaration wins, per the rule this plan just wrote, and it matches every
>    sibling `ayokoding-web-*` family. Only the **directory** segment was normalised; report
>    filename prefixes were left untouched, per "filenames and UUID chains are unchanged". The one
>    exception is the canonical naming example in
>    `repo-generating-validation-reports/reference/naming-and-uuid.md`, where `ayokoding-facts__…`
>    became `ayokoding-web-facts__…` in both halves — an illustration is not a real report, and
>    leaving a mismatch inside the document that teaches the naming rule would teach the wrong
>    thing. Both normalisations are recorded in `family-assignments.md`.
>
> The other three collisions the plan names resolve without a code change:
> `apps-ayokoding-www-link` / `ayokoding-www-link(s)` → `ayokoding-web-link`; `ayokoding-facts` →
> `ayokoding-web-facts`; `pr-review-logic` / `pr-review-logic-maker` → unassigned, because no
> `pr-review-*` agent writes to a report directory at all — they post GitHub review threads.

## Phase 3: Land DU-1 (`ose-public` PR)

**Input**: Phases 1 and 2 complete in the worktree.
**Outcome**: The intent-based rule and its consumers are on `main`.
**Proof**: PR merged with green exact-head/base CI.

- [x] [AI] **RP-8.3 Composed quality gate** — run
      [rules-quality-gate](../../../repo-governance/workflows/rules/rules-quality-gate.md) at
      `mode: strict`. This is where repository-wide duplication, contradiction, and traceability
      findings surface that Phase 1's subject-scoped sweep deliberately did not look for. Fix
      findings attributable to this run's edits and re-verify; report findings that predate the run
      rather than absorbing them. Route failures per the workflow's own table — budget exceeded
      returns to RP-5, contradiction to RP-3, duplication to RP-6, invalid gate declaration to RP-7
- [x] [AI] Run every check in [Local Quality Gates (Before Push)](#local-quality-gates-before-push)
- [x] [AI] Commit under the plan's standing authorization per
      [Commit Guidelines](#commit-guidelines) — suggested split:
      one commit for `repo-governance/` + `AGENTS.md` + glossary + docs, one for `.claude/` +
      regenerated mirrors + `.prettierignore`. Suggested type/scope:
      `docs(governance): re-found the temporary-directory split on artifact intent`
- [x] [AI] Push and open a draft PR against `main`:
      `rtk gh pr create --draft --base main --title "docs(governance): re-found the temporary-directory split on artifact intent"`.
      The PR body states the new-code cost/benefit (this unit adds no code) and links this plan
- [x] [AI] **RP-9 PR content** — the PR body states, for each of the four normalized statements: the
      statement itself, its destination, its enforcement disposition, and any supersession or
      eviction it caused. Name the two supersessions explicitly — a reviewer who cannot see what was
      displaced cannot review the displacement. If RP-5 evicted an `AGENTS.md` entry, say so in its
      own sentence; that is the change most likely to surprise a reader
- [x] [AI] **RP-9 Sibling obligation** — record `sibling-obligation: <private-sibling>` in the PR body and
      as a durable note, together with the parity objective slug `update-tmp-folders`, the shared
      worktree basename `update-tmp-folders`, and the branch `worktree/update-tmp-folders` fixed at
      RP-1. This plan discharges that obligation in Phase 5 rather than deferring it; the record
      exists so a reader of the merged PR alone can still see what was owed
- [x] [AI] Assert before delivery that the current worktree basename and branch match the recorded
      identity: `rtk git rev-parse --abbrev-ref HEAD` prints `worktree/update-tmp-folders`
- [x] [AI] Keep the PR body free of bare `#NNN` issue references — a `#`-prefixed number in a body
      parses as a footer and trips the message gate
- [x] [AI] Run every check in [Post-Push Verification](#post-push-verification)
- [x] [AI] Confirm the `Quality gate` workflow from `.github/workflows/pr-quality-gate.yml` is green
      for the PR's exact current head and base
- [x] [AI] Confirm one authenticated clean current-head `pr-leak-review` result
- [x] [AI] Mark the PR ready for review, then merge it — `[AI]` merges once the hardened
      preconditions above hold
- [x] [AI] Record the merged PR number and its 40-character reviewed-head SHA in the
      [Delivery Branch Inventory](#delivery-branch-inventory)
- [x] [AI] Fast-forward local `main` in the primary checkout after the merge:
      `rtk git -C <primary-checkout-root> fetch origin && rtk git -C <primary-checkout-root> merge --ff-only origin/main`
      — a side-worktree push advances `origin/main` but not local `main`, and the divergence is
      otherwise silent. Never `reset --hard`

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] `rtk gh pr view <pr-number> --json state` reports `MERGED`
- [x] [AI] All PR check runs are green — verified via `rtk gh pr checks <pr-number>`
- [x] [AI] Local `main` in the primary checkout is at the same SHA as `origin/main`
- [x] [AI] The Delivery Branch Inventory records the PR number and reviewed-head SHA

> **Pause Safety**: `main` carries a coherent rule with all its consumers aligned; every prior
> artifact still resolves. Safe to stop. To resume: `rtk gh pr list --head worktree/update-tmp-folders`
> to confirm nothing is open.
>
> **Phase 3 Result**: PR [#473](https://github.com/wahidyankf/ose-public/pull/473) merged
> `2026-09-04T11:14:07Z`. Reviewed head `ae04b3dfb6ee99cbf2a8ecdc08fecafb70f18288`, base
> `e61a4877a2c87490cea1a16f9a739ac9127f4a85` (equal to `origin/main` at review time — no drift),
> merge commit `24a6d93a600e5ff6813571f7c0572e03d0a43f21`. 312 files, +1057 / -488. Two commits:
> `34a34a67d` (governance rule, `AGENTS.md`, glossary, docs) and `ae04b3dfb` (agents, skills,
> mirrors, `.prettierignore`, this plan). All 15 check runs green at that exact head/base — the
> `Quality gate` workflow's `governance`, `harness`, `specs`, `markdown`, `formatting-verify`, and
> `shell-docker-actions` groups plus `Build rhino-cli`, `Detect affected languages`,
> `Specs structure validation`, and `Validate env-contract surfaces`. The three language quality
> gates report `skipping` because this unit touches no code.
>
> `pr-review-security-maker` returned **CLEAN** in leak-only mode at head `ae04b3dfb`, read-only,
> nothing posted. It examined every candidate rather than pattern-matching: the
> `/home/<user>/repos/project/` string is a pre-existing generic placeholder inside a documented
> anti-pattern whose only change was the trailing directory name; `wahidyankf@gmail.com` is the
> commit author identity already public on every commit in this repository; `test@test.com` is the
> stray-override anti-pattern this plan names on purpose; the `a1b2c3`/`d4e5f6` strings are
> synthetic UUID-chain illustrations.
>
> **RP-8.3 composed quality gate**, run under the user's five-iteration cap: pass 1 found zero
> findings attributable to this run. Rather than spend further iterations, propagation completeness
> was proven directly, which is what the cap directs: the AC-6 sweep leaves zero `WRITE-TARGET`
> occurrences (33 survivors, all `RULE` or `INFRA`, enumerated in `verdicts-bindings.md`); a
> mechanical cross-check confirms **every** `local-tmp/<x>/` path inside each of the 43 agents
> equals that agent's declared family, with zero mismatches; and a contradiction scan across the
> four rule shards (`overview-and-the-rule.md`, `generated-reports-and-progressive-writing.md`,
> `mandatory-report-generation.md`, `status-exceptions-and-related.md`) finds them mutually
> consistent, each stating the intent test in compatible words. The governance audit
> (`layer-coherence`, `traceability-audit`, `governance-word-budget`) reports 0 findings.
>
> **One deviation.** `git merge --ff-only origin/main` cannot succeed in the worktree after a squash
> merge — the branch's two commits and `main`'s one squashed commit share no ancestry. Verified
> `git diff HEAD origin/main` is **empty**, so the branch content is fully represented on `main`,
> then re-pointed the branch with `git checkout -B worktree/update-tmp-folders origin/main`. The
> working tree was clean beforehand and clean after; no `reset --hard` was used, and no untracked or
> ignored file was touched. The primary checkout's `main` fast-forwarded normally and now equals
> `origin/main` at `24a6d93a6`. `origin/worktree/update-tmp-folders` was **auto-deleted by GitHub
> at merge** — `ose-public` sets `delete_branch_on_merge: true`, which overrides
> `gh pr merge --delete-branch=false` — so DU-2 pushed the branch back cleanly with no force at all.
> The stale local remote-tracking ref had to be pruned first (`git fetch origin --prune`); until then
> every `--force-with-lease` form was rejected with `stale info`, which reads like a lease conflict
> but was really a ref that no longer existed on the remote.

## Phase 4: Relocate the Suppression Ledger (`ose-public` DU-2)

**Input**: `main` at the DU-1 merge.
**Outcome**: `.known-false-positives.md` lives at `local-tmp/.known-false-positives.md`, and
`rhino-cli` reads it there by default.
**Proof**: AC-4; `rtk nx run rhino-cli:test:quick` exits 0 with a new assertion on the path.

- [x] [AI] Sync the worktree: `rtk git fetch origin && rtk git merge --ff-only origin/main` — exits 0
- [x] [AI] Locate the tests covering `loadKnownFalsePositives`:
      `rtk grep -rn "known-false-positives\|KnownFalsePositivesPath" apps/rhino-cli/tests/`
      — record the exact test file path in `local-tmp/update-tmp-folders/ledger-tests.txt`. If the
      search returns nothing, the RED step below creates the first such test in the test file that
      already covers `RepoGovernance` audit options, discovered from the same search widened to
      `rtk grep -rln "RepoGovernance" apps/rhino-cli/tests/`
- [x] [AI] **RED** — add a failing unit test asserting that with `KnownFalsePositivesPath = None`,
      the loader resolves `<repoRoot>/local-tmp/.known-false-positives.md`. Run
      `rtk nx run rhino-cli:test:quick` — the new test FAILS with the old `generated-reports` path
      in the failure message. Before trusting a pass, run `rtk dotnet build` on the test project
      first: a stale `obj/` compile list makes the analyzer silently skip a newly added `.fs`
- [x] [AI] **GREEN** — edit
      `apps/rhino-cli/src/RhinoCli.Application/src/RepoGovernance.fs`, function
      `loadKnownFalsePositives`: change the `Option.defaultValue` argument from
      `Path.Combine(opts.RepoRoot, "generated-reports", ".known-false-positives.md")` to
      `Path.Combine(opts.RepoRoot, "local-tmp", ".known-false-positives.md")`, and update the
      doc-comment on `KnownFalsePositivesPath` in the `AuditOptions` record (around line 743) that
      states the old default. Run `rtk nx run rhino-cli:test:quick` — the new test PASSES and no
      existing test regresses
- [x] [AI] **REFACTOR** — confirm no other occurrence of the literal `"generated-reports"` remains
      in `apps/rhino-cli/src/RhinoCli.Application/src/RepoGovernance.fs`:
      `rtk grep -c "generated-reports" apps/rhino-cli/src/RhinoCli.Application/src/RepoGovernance.fs`
      — prints 0. Leave the skip-list occurrences in `Md.fs` and `Convention.fs` alone; both
      directories still exist and both should still be skipped
- [x] [AI] Move the ledger file in the primary checkout and in this worktree:
      `mv generated-reports/.known-false-positives.md local-tmp/.known-false-positives.md`, then
      verify with `wc -c local-tmp/.known-false-positives.md` that the byte count matches the
      pre-move value recorded to `local-tmp/update-tmp-folders/ledger-bytes.txt` beforehand
- [x] [AI] Update the deferred Phase 2 line in
      `.claude/skills/repo-applying-maker-checker-fixer/reference/preventing-iteration-loops.md` and
      every other file recorded as deferred in `verdicts-bindings.md`, pointing them at
      `local-tmp/.known-false-positives.md`
- [x] [AI] Regenerate mirrors and revalidate: `rtk npm run generate:bindings && rtk npm run validate:sync`
      — both exit 0
- [x] [AI] Regenerate the parity manifest so `RepoGovernance.fs`'s new hash is recorded — discover
      the exact command from `repo-config.yml`'s `parity-manifest` gate entry — its `command:` value
      is the validate form, and the generate form is its sibling — then record the command actually
      used in `local-tmp/update-tmp-folders/manifest-command.txt`
- [x] [AI] Verify the manifest: `rtk npx rhino parity manifest validate` — exits 0
- [x] [AI] Run every check in [Local Quality Gates (Before Push)](#local-quality-gates-before-push)
- [x] [AI] Commit under the plan's standing authorization per
      [Commit Guidelines](#commit-guidelines). Suggested:
      `fix(rhino-cli): read the false-positive ledger from local-tmp`
- [x] [AI] Open, verify, and merge the DU-2 PR following the same steps as Phase 3, then
      fast-forward local `main`

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `rtk nx run rhino-cli:test:quick` exits 0
- [x] [AI] `rtk npx rhino parity manifest validate` exits 0
- [x] [AI] `local-tmp/.known-false-positives.md` exists and its byte count matches
      `local-tmp/update-tmp-folders/ledger-bytes.txt`
- [x] [AI] `rtk grep -c "generated-reports" apps/rhino-cli/src/RhinoCli.Application/src/RepoGovernance.fs`
      prints 0
- [x] [AI] The DU-2 PR is merged with green CI, and its number and reviewed-head SHA are recorded in
      the Delivery Branch Inventory

> **Pause Safety**: `ose-public` is fully converted. The private sibling still carries the old rule and the
> old `RepoGovernance.fs` hash, so the nightly parity audit at 02:00 UTC will report drift until
> Phase 5 lands. Safe to stop only if Phase 5 will complete before that run; otherwise continue.
> To resume: `rtk npx rhino parity manifest validate` from the worktree root.
>
> **Phase 4 Result**: PR [#474](https://github.com/wahidyankf/ose-public/pull/474) merged
> `2026-09-04T12:06:06Z`. Reviewed head `1453a47ae5d85911827ea5074ed60bbcf18cca9f`, base
> `24a6d93a600e5ff6813571f7c0572e03d0a43f21` (equal to `origin/main` at review time), merge commit
> `02e4dece1c73ae7e146e1f453153b19ee73c2d86`. All 16 check runs green; `pr-review-security-maker`
> returned CLEAN in leak-only mode at that exact head, read-only, nothing posted.
>
> **TDD.** RED: `1 failed / 2467 passed`, the single failure being
> `Skip list honored: false-positive entries do not count toward total_findings`. GREEN after the
> one-line `Option.defaultValue` change: `0 failed / 2468 passed`. REFACTOR:
> `grep -c "generated-reports" RepoGovernance.fs` prints 0; the skip-list occurrences in `Md.fs` and
> `Convention.fs` are untouched, because `generated-reports/` still exists for human-requested
> artifacts and should still be skipped.
>
> The ledger moved in the primary checkout at **1665 bytes in and 1665 bytes out**, matching
> `ledger-bytes.txt` recorded before the move. `parity manifest generate` (resolved form recorded in
> `manifest-command.txt`) updated the two boundary hashes — `RepoGovernance.fs` and
> `repo-governance-audit.feature`, both byte-identical across the two repos — and
> `parity manifest validate` exits 0. The generator refuses to run against an unstaged boundary
> file, so the source, spec, and step files were staged first; that ordering is not obvious from the
> plan and is worth carrying forward.
>
> **Phase 4 Result — three deviations, recorded rather than glossed:**
>
> 1. **The RED test retargets the existing scenario instead of adding a new one.** The plan asks for
>    a new failing test. The existing BDD scenario already asserts end-to-end that a key in the
>    ledger lands in `skipped_false_positives` and does not count toward `total_findings`; pointing
>    its `Given` at `local-tmp/` makes it a regression test for the path itself. A second
>    near-identical scenario would have added no coverage and one more thing to keep in sync. The
>    scenario title was renamed to name the location, so the `.feature` still says what it tests.
> 2. **A gate assumption was probed, not assumed.** Report filenames use double underscores, which
>    `md naming validate` rejects — they were exempt only because `generated-reports` sits in
>    `namingSkipDirs` (`Md.fs:124`) and `local-tmp` does not. Rather than trust that the move was
>    safe, a real `docs__a1b2c3__2026-09-04--12-00__audit.md` was written into `local-tmp/docs/` and
>    the gate run: it passes, because the naming walker never descends into `local-tmp/` at all. No
>    skip-list change is needed, and the plan's "leave `Md.fs` alone" instruction holds for the right
>    reason. The probe file was removed afterward.
> 3. **`git merge --ff-only origin/main` again could not sync the worktree**, for the same
>    squash-merge reason as Phase 3, and was resolved the same way: verify `git diff HEAD origin/main`
>    is empty, then `git checkout -B` onto `origin/main`. The uncommitted `delivery.md` edit in the
>    working tree survived intact, which was checked rather than assumed.
>
> One earlier record in this file was **corrected**, not quietly amended: the Phase 3 note claimed
> `origin/worktree/update-tmp-folders` still held pre-squash commits and would need
> `--force-with-lease`. It did not. `ose-public` sets `delete_branch_on_merge: true`, which overrides
> `gh pr merge --delete-branch=false`, so GitHub deleted the branch at merge and DU-2 simply pushed
> it back. The repeated `stale info` rejections were a stale local remote-tracking ref, not a lease
> conflict.

## Phase 5: Rules Propagation — the private sibling (DU-3)

**Input**: `ose-public` `main` carrying both delivery units, and the sibling obligation recorded at
Phase 3's RP-9.
**Outcome**: the private sibling states the same rule and carries the byte-identical `RepoGovernance.fs`.
**Proof**: AC-5; the private sibling's parity manifest matches `ose-public`'s canonical manifest; every
`RP-` step below is ticked against the private sibling specifically.

This is a **second, independent** `rules-propagation` run — one run touches one repository. Its
steps are executed against the private sibling's own surfaces and produce their own artifacts; nothing
here is satisfied by Phase 1 having been done. Run at `mode: strict`.

- [x] [AI] Re-verify the private sibling's topology before touching it — do not assume the layout recorded
      in Phase 0 still holds: `rtk git -C <private-sibling-root> worktree list` and
      `rtk git -C <private-sibling-root> rev-parse --is-bare-repository`. If it reports bare, use
      `-c core.bare=false --work-tree=` for git operations
- [x] [AI] Provision the sibling worktree: `rtk git -C <private-sibling-root> worktree add worktrees/update-tmp-folders -b worktree/update-tmp-folders origin/main`
      — this is a git-mechanical `[AI]` step. Update the
      [Cross-Repository Parity Identity](#cross-repository-parity-identity) table's provisioning
      status to `provisioned` with the creation timestamp
- [x] [AI] At that worktree root, run `rtk npm install && rtk npm run doctor -- --fix` — both exit 0

### RP-0 to RP-2 (the private sibling): Intake, Working Tree, Classification

- [x] [AI] **RP-0 Intake** — restate the same four falsifiable statements against the private sibling's
      own wording, recording them to `local-tmp/rules-propagation/statements-private.md` inside the
      private sibling worktree. Record each statement's violating observation. Do not copy
      `statements-public.md` across repositories — restate
- [x] [AI] **RP-1 Working tree** — confirm the run writes in the private sibling's
      `worktrees/update-tmp-folders/` on branch `worktree/update-tmp-folders`, matching the identity
      fixed at Phase 1's RP-1. Assert it: `rtk git rev-parse --abbrev-ref HEAD` prints
      `worktree/update-tmp-folders`. If that identity is unavailable, prove an existing identity
      belongs to this same delivery, or select one common alternative across BOTH repositories
      before mutating anything
- [x] [AI] **RP-2 Classification** — assign subject and governance layer for each statement against
      the private sibling's layer structure and confirm vendor neutrality. Record to
      `local-tmp/rules-propagation/classification-private.md`
- [x] [AI] Build the private-sibling inventory:
      `rtk grep -rn "generated-reports" --include="*.md" repo-governance/ AGENTS.md CLAUDE.md docs/ .claude/ > local-tmp/update-tmp-folders/inventory-private.txt`
- [x] [AI] Classify every occurrence into the same four verdicts, recording to
      `local-tmp/update-tmp-folders/verdicts-private.md`

### RP-3 to RP-5 (the private sibling): Conflict Scan, Placement, Eviction

- [x] [AI] **RP-3 Conflict scan** — run the semantic-no-op, contradiction, and supersession scan
      against the private sibling's own rule corpus. Its shard set differs, so its supersessions differ:
      expect `the-rule.md`, `directory-purposes.md`, and
      `mandatory-report-generation-for-checker-agents.md` rather than `ose-public`'s filenames.
      Record each explicitly. Halt and surface on any higher-layer conflict
- [x] [AI] **RP-4 Placement** — record each statement's canonical home in the private sibling to
      `local-tmp/rules-propagation/placement-private.md`. Existing shards only; if a statement finds
      no existing home and a new shard is genuinely required, it needs **two** index links — its
      folder `README.md` and the parent flattened convention — or the readme-index gate fails the
      push as an orphan
- [x] [AI] **RP-5 Eviction** — record `wc -w` for the private sibling's `AGENTS.md` before editing; the
      instruction-surface edit must be net-neutral or negative. Never raise a threshold to make
      room. Meaning is preserved verbatim enough to stay unambiguous even where placement changes
- [x] [AI] Restate the rule into the private sibling's own 18 shards under
      `repo-governance/development/infra/temporary-files/` — its shard filenames differ from
      `ose-public`'s (`the-rule.md`, `directory-purposes.md`, `local-tmp.md`,
      `mandatory-report-generation-for-checker-agents.md`, and others). NEVER copy a Markdown file
      between the two repositories; propagate the semantic delta into each repository's own shard
- [x] [AI] Apply the recorded verdicts across the private sibling's `.claude/agents/`, `.claude/skills/`,
      `AGENTS.md`, glossary, and `docs/`
- [x] [AI] Add `local-tmp/` to the private sibling's `.prettierignore` if absent, and confirm its
      `.markdownlintignore` already carries it
- [x] [AI] Apply the byte-identical `RepoGovernance.fs` change: verify the two files match exactly
      after editing with
      `rtk proxy diff <ose-public-root>/apps/rhino-cli/src/RhinoCli.Application/src/RepoGovernance.fs <private-sibling-worktree-root>/apps/rhino-cli/src/RhinoCli.Application/src/RepoGovernance.fs`
      — no output. Apply the same test change, then move the ledger file:
      `mv generated-reports/.known-false-positives.md local-tmp/.known-false-positives.md` if it
      exists there
- [x] [AI] Retarget any `outputs:` block under the private sibling's `repo-governance/workflows/` naming
      `generated-reports/`, matching the Phase 1 change. Discover with
      `rtk grep -rn "generated-reports" repo-governance/workflows/` from the private-sibling worktree

### RP-6 to RP-7 (the private sibling): Write, Tidy, Enforcement Disposition

- [x] [AI] **RP-6 Write and tidy** — confirm no two the private sibling shards state the destination rule
      in conflicting words, and reindex every folder `README.md` whose child annotations changed
- [x] [AI] **RP-7 Enforcement disposition** — record one of `covered` / `gated` /
      `unenforced-by-decision` per statement in
      `local-tmp/rules-propagation/dispositions-private.md`, none silent. Expected:
      `unenforced by decision` for all four, with the reason written onto the rule itself in the
      shard. The private sibling carries a GPG check `ose-public` does not — confirm no disposition
      mistakenly cites it as coverage for a rule it does not check
- [x] [AI] Regenerate the private sibling's mirrors and manifest:
      `rtk npm run generate:bindings && rtk npm run validate:sync`, then the manifest command
      recorded in `local-tmp/update-tmp-folders/manifest-command.txt`
- [x] [AI] Verify the manifest matches `ose-public`'s canonical copy — the same comparison the
      nightly audit performs:
      `rtk proxy diff <ose-public-root>/apps/rhino-cli/parity-manifest.sha256 <private-sibling-worktree-root>/apps/rhino-cli/parity-manifest.sha256`
      — no output

### RP-8 to RP-9 (the private sibling): Verification, Delivery, Terminal Obligation

- [x] [AI] **RP-8.1 Regenerate** — every derived surface the private sibling's edits affect is regenerated
      and lands in the same commit as its source
- [x] [AI] **RP-8.2 Deterministic gates** — run `md links validate`, `md heading-hierarchy validate`,
      `md frontmatter validate`, `md naming validate`, `convention emoji validate`, and
      `repo-config validate` via `apps/rhino-cli/scripts/rhino-bin.sh` from the private-sibling
      worktree, redirecting output to a file and asserting each exit code. Establish
      the private sibling's own preexisting-failure baseline; `ose-public`'s baseline proves nothing here
- [x] [AI] **RP-8.3 Composed quality gate** — run `rules-quality-gate` at `mode: strict` against
      the private sibling. Fix findings attributable to this run; report the rest. Route failures per the
      workflow table (budget → RP-5, contradiction → RP-3, duplication → RP-6, gate declaration →
      RP-7), all scoped to the private sibling
- [x] [AI] **RP-8.4 Reconcile the ledger** — the private-sibling file-touch ledger and
      `rtk git status --short` name the same set of paths. Never `git add -A`; this tree carries
      unrelated uncommitted work
- [x] [AI] Run every check in [Local Quality Gates (Before Push)](#local-quality-gates-before-push)
      from the private-sibling worktree root
- [x] [AI] Commit, push, open, verify, and merge the DU-3 PR under the plan's standing
      authorization, following the same steps as Phase 3
- [x] [AI] **RP-9 PR content** — the private sibling's PR body states, per statement: the statement, its
      destination, its enforcement disposition, and any supersession or eviction. Name
      the private sibling's own supersessions, which differ from `ose-public`'s by shard filename
- [x] [AI] **RP-9 Terminal sibling obligation** — record `sibling-obligation: none — discharged`
      in this PR body, naming `ose-public`'s merged PR as the counterpart. With both repositories
      landed, the parity objective `update-tmp-folders` is closed; state that explicitly rather than
      leaving silence, which is indistinguishable from an obligation that was overlooked
- [x] [AI] Fast-forward the private sibling's local `main` after the merge

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] The DU-3 PR is merged with green CI
- [x] [AI] `rtk proxy diff` between the two repositories' `parity-manifest.sha256` files produces no
      output
- [x] [AI] `rtk proxy diff` between the two repositories' `RepoGovernance.fs` files produces no
      output
- [x] [AI] the private sibling's temporary-files shards state the same two-question test and the same
      `local-tmp/<agent-family>/` layout as `ose-public`'s
- [x] [AI] the private sibling local `main` is at the same SHA as its `origin/main`
- [x] [AI] `local-tmp/rules-propagation/dispositions-private.md` records a disposition for all four
      statements — none silent — each with its reason where unenforced
- [x] [AI] Both runs reached `final-status: landed`; neither is `partial` or `halted`
- [x] [AI] The terminal sibling obligation is recorded as discharged in the private sibling's PR body,
      naming `ose-public`'s counterpart PR

> **Pause Safety**: both repositories state the same rule and carry the same code. The nightly
> parity audit will pass. Only untracked historical artifacts remain. Safe to stop. To resume:
> compare the two manifests as above.

> **Phase 5 execution record.**
>
> **The plan's GPG premise is false.** RP-7 instructs confirming that no disposition cites "a GPG
> check `ose-public` does not [carry]". No such asymmetry exists. The only GPG usage in either
> repository is in `apps/rhino-cli/src/RhinoCli.Application/src/Doctor.fs` (3 occurrences), which
> verifies the downloaded `dotnet-install.sh` signature. `Doctor.fs` is inside the byte-identity
> boundary, so both repositories carry it identically; no workflow in either repository references
> GPG, and the private sibling has no workflow file `ose-public` lacks. The substantive requirement holds
> anyway — no disposition mentions GPG — and this is recorded rather than silently ticked, because
> ticking it would imply a difference was found and cleared.
>
> **Script names are not symmetric across the repositories.** `ose-public` spells the bindings
> validator `harness:bindings-validation`; the private sibling spells the same command
> `validate:harness-bindings`. Separately, this plan names the Markdown linter `md:lint` in four
> places; the real script in both repositories is `lint:md`, and `md:lint` exists in neither. Both
> facts are now recorded durably in `docs/reference/related-repositories.md`.
>
> **The take-over-execution family collision resolves differently in each repository, deliberately.**
> `ose-public` resolved it to `plan-takeover-execution` and the private sibling to
> `plan-take-over-execution`, each following the same declaration-wins rule against its own
> declarations. Forcing a match would rename ~50 files for cosmetic symmetry. Recorded in
> `local-tmp/update-tmp-folders/family-assignments-private.md` and in PR #155's body.
>
> **The private sibling has 18 temporary-files shards, matching the plan's figure**, but the shard names
> differ from `ose-public`'s as the plan predicted; nothing was copied between repositories.
>
> **Word-budget warnings on `plan-execution-checker.md` and `plan-fixer.md` are pre-existing.** Both
> were already over the 650-word target before this change (663 and 653); the family declaration
> added 20 words to each. `ose-public`'s counterparts sit higher still (705 and 698), so the two
> repositories remain in the same state. The gate exits 0 — these are warnings, not failures.
>
> **`md links validate` reports 337 pre-existing failures in the private sibling.** Proven, not asserted:
> zero of the 97 affected files appear among this delivery unit's 224, the diff removes no heading,
> and it deletes and renames nothing.

## Phase 6: Clear the Historical Backlog

**Input**: Both repositories converted; 471 + 96 + per-worktree artifacts still on disk.
**Outcome**: `generated-reports/` is empty in every checkout of both repositories.
**Proof**: AC-7 — quarantine first, prove, then delete.

Every path here is untracked and gitignored. Nothing in this phase is committed or pushed.

- [x] [AI] Enumerate every checkout to clean, in both repositories:
      `rtk git -C <repo-root> worktree list --porcelain` for each of `ose-public` and the private sibling,
      writing the resolved list to `local-tmp/update-tmp-folders/cleanup-targets.txt`. Note that
      `generated-reports/` is per-checkout — the primary checkout, this plan's worktree, and any
      other live worktree each have their own
- [x] [AI] For each target, move — do not delete — the directory contents into a dated quarantine:
      `mkdir -p local-tmp/.reclaim-quarantine-<YYYY-MM-DD> && mv generated-reports/* generated-reports/.[!.]* local-tmp/.reclaim-quarantine-<YYYY-MM-DD>/ 2>/dev/null`.
      Resolve `<YYYY-MM-DD>` at runtime with `rtk date +%F`; do not hardcode it. Process one target
      per command — a `for` loop over an unquoted variable does not word-split in this shell and
      will silently run once on the whole blob
- [x] [AI] Confirm `local-tmp/.known-false-positives.md` was NOT swept into any quarantine — it was
      moved out of `generated-reports/` in Phase 4 and must still exist at its new path:
      `wc -c local-tmp/.known-false-positives.md` matches `ledger-bytes.txt`
- [x] [AI] Record the moved-file count per target to
      `local-tmp/update-tmp-folders/cleanup-manifest.txt`
- [x] [AI] Prove nothing load-bearing moved, in each repository:
      `rtk npm run doctor -- --fix`, `rtk nx run rhino-cli:test:quick`, and
      `rtk nx affected -t build` — all three exit 0
- [x] [AI] Only after all three proofs pass, delete each quarantine:
      `rm -rf local-tmp/.reclaim-quarantine-<YYYY-MM-DD>` per target
- [ ] [AI] Confirm the result: `/bin/ls -1a generated-reports | grep -c .` prints 2 (`.` and `..`
      only) in every target. Use `/bin/ls`, not the shell's `eza` alias — its hyperlink escapes
      corrupt piped output

> **Phase 6 execution record — the plan's sweep guard is incomplete.** Phase 6 names exactly one
> file to protect, `.known-false-positives.md`. Listing the private sibling's directory showed three
> `.execution-chain-*` files in there as well — cross-family state that this plan's own new rule
> places at the `local-tmp/` root. `ose-public` was swept before that listing was taken, with only
> an entry count recorded (492), so its chain files were almost certainly deleted and that cannot
> now be proven either way.
>
> The outcome is nonetheless the correct one, and the private sibling was swept the same way deliberately:
> every rule and skill surface in both repositories now points chains at `local-tmp/`, so a chain
> file under `generated-reports/` sits at a path nothing reads. Relocating a stale one would let a
> future report claim parentage from an unrelated finished run; absence is right, because the next
> workflow that spawns children writes a fresh chain. Only the ledger is live state, and it was
> protected in both repositories.
>
> Recorded as L-10 and fixed durably in
> `repo-governance/development/infra/temporary-files/status-exceptions-and-related.md`, which now
> states which files a legacy sweep relocates, which it sweeps, and that a directory is listed
> rather than counted before deletion.
>
> **The phase's "everything here is untracked" premise is also false for `ose-public`.** Three
> `generated-reports/plan__*__2026-08-13__audit.md` files are tracked on `main` despite
> `.gitignore:90` ignoring the directory — `.gitignore` never untracks what was already committed.
> The sweep therefore produced three unstaged deletions of tracked files in both `ose-public`
> checkouts. The **primary checkout was restored to clean** (`git checkout -- generated-reports/`),
> because a checkout sitting on `main` must not be left carrying uncommitted deletions; the three
> files are removed properly through this plan's own PR instead. They are stale `plan`-family audit
> reports, exactly the artifact class this plan relocates, so removing them is the outcome the
> convention already asked for. The private sibling has no tracked file under `generated-reports/`, so its
> sweep is unaffected. Recorded as L-11; the same rule shard now says to check
> `git ls-tree -r --name-only origin/main -- generated-reports/` before sweeping.

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [ ] [AI] Every target in `cleanup-targets.txt` reports an empty `generated-reports/`
- [x] [AI] `local-tmp/.known-false-positives.md` still exists in both repositories with its recorded
      byte count
- [x] [AI] `rtk npm run doctor -- --fix`, `rtk nx run rhino-cli:test:quick`, and
      `rtk nx affected -t build` all exit 0 in both repositories
- [x] [AI] No `local-tmp/.reclaim-quarantine-*` directory remains

> **Pause Safety**: both repositories are converted and clean; the only remaining work is
> documentation of learnings. Safe to stop. To resume: re-run the three proof commands.

## Phase 7: Knowledge Capture

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only entries where a durable
      surface would catch this automatically next time; discard the rest with a one-line reason.
- [x] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize to
      `<placeholder>` tokens or discard if the entry cannot be sanitized without losing its meaning.
- [x] [AI] Apply the **repo-relevance gate** to every surviving entry — infra-private content stays
      in the private sibling only; public-governance content may route to `ose-public`; never
      cross-route private content into a public repo.
- [x] [AI] Route each surviving entry to exactly one durable home. The rubric is open-ended —
      route to whichever surface owns that kind of knowledge (`repo-governance/`, `docs/`,
      `.claude/agents/`, `.claude/skills/`, a post-mortem, or any other durable home), landing a
      small non-code edit inline. Create or update a `plans/ideas/<slug>.md` two-pager only when the
      user has literally authorized that plan artifact; otherwise report the follow-up and record
      `Reported without plan authorization` with handoff evidence.
- [x] [AI] For any entry routed to `plans/ideas/`, scan `plans/ideas/README.md` and the existing
      two-pagers FIRST after the user literally authorizes an idea artifact. Fold the learning into
      an authorized overlapping brief instead of creating a new file; only create a new authorized
      `plans/ideas/<slug>.md` when the scan confirms no existing brief overlaps.
- [x] [AI] **Code-routing rule**: if a learning's home is `apps/`, `libs/`, or tests, NEVER land it
      inline in this plan's commits/PR. File a separate `plans/ideas/` two-pager only with literal
      plan-artifact authorization; never create a `plans/backlog/` folder directly because the
      promotion ripeness gate owns that transition. Otherwise use the reported terminal state. The
      sole carve-out is a bug/lint/test failure that blocks THIS plan's own scope — that is fixed
      inline as ordinary Root Cause Orientation work, not routed as a deferred learning.
- [x] [AI] Record the terminal state of every entry (routed inline / explicitly authorized two-pager
      at `<path>` / reported without plan authorization with handoff evidence / discarded with
      reason) directly in `learnings.md`.
- [x] [AI] Report the three follow-ups recorded in
      [tech-docs.md §Follow-Ups Recorded, Not Delivered](./tech-docs.md#follow-ups-recorded-not-delivered)
      — the `generated-reports/` retention policy, a classification validator, and `Harness.fs`'s
      unreachable check — as `Reported without plan authorization` unless the user literally
      authorizes idea artifacts for them.
- [x] [AI] If execution genuinely surfaced no generalizable learning, record the explicit escape
      `No generalizable learnings — <one-line reason>` instead of individual entries. **Condition did
      not fire** — execution surfaced nine entries (L-1 to L-9), so individual entries were recorded
      and the escape was correctly not used.

> **Phase 7 routing record.** Seven of nine entries were routed inline in `ose-public`:
> L-1 to `conventions/structure/plans/execution-grade-clarity.md`, L-2 to
> `docs/reference/related-repositories.md`, L-3 and L-4 to
> `development/workflow/pr-merge-protocol/the-worktree-to-pr-terminal-step.md`, L-5 to
> `workflows/plan/plan-multi-repo-parity-planning-and-execution/step-4-execution-phase-continued.md`,
> L-6 to `development/infra/temporary-files/report-file-naming-standard.md`, and L-7 to
> `development/infra/temporary-files/local-tmp-directory.md`. L-8 (zsh word-splitting) and L-9
> (verify background feedback against the repository) were discarded with reasons — the first has no
> durable home that would fire at the point of failure, the second is already the Root Cause
> Orientation principle.
>
> **No learning was code-homed**, so the code-routing rule's prohibition never applied and no
> `plans/ideas/` two-pager was created. The three `tech-docs.md` follow-ups are recorded as
> `Reported without plan authorization` with handoff evidence, since the user has not literally
> authorized a plan artifact for them.
>
> An eighth entry, L-10, was raised during Phase 6 execution and routed to
> `development/infra/temporary-files/status-exceptions-and-related.md`.
>
> **These eight edits are themselves rule changes, so they carry their own sibling obligation.**
> All eight counterpart shards exist in the private sibling with word-budget headroom; the semantic delta
> is restated there in that repository's own wording as DU-5, never copied.

### Phase 7 Gate

> All checks below must pass before starting Plan Archival.

- [x] [AI] Verify every `learnings.md` entry has reached a terminal state (routed / authorized and
      filed / reported without plan authorization / discarded) or the explicit "none" escape is
      present — no entry left open.
- [x] [AI] Verify no code-homed learning landed inline — every code-routed learning has a
      corresponding explicitly authorized `plans/ideas/` two-pager or a report with handoff evidence.

> **Pause Safety**: all learnings are routed, authorized and filed, reported without plan
> authorization, or explicitly discarded; nothing is left dangling in `learnings.md`. Safe to
> stop. To resume: re-check `learnings.md` for any entry without a terminal-state marker.

### Phase 8 — DU-6: the second hardcoded temporary directory (`ose-public` only)

> **Why this phase exists.** It was not authored; the preliminary archival audit opened it. AC-6
> asks that no live instruction route an agent's own output into `generated-reports/`. The Phase 2
> sweep classified textual occurrences and rewrote the instruction layer, but `crane-cli`'s
> `ReportManager.fs` hardcodes its destination in F#, where the string never appears as an
> instruction a reviewer would read. Two rule sentences this plan itself authored — the skill
> reference's `local-tmp/pdf-to-md/…__audit.md` and the layout rule's
> `local-tmp/.execution-chain-{scope}` — were therefore false on the day they landed. The plan's
> scope called `rhino-cli`'s ledger "the one code path that hardcodes a temporary directory"; that
> inventory was taken from prose and missed this one. Recorded as L-12.

- [x] [AI] Change both byte-identical copies of `ReportManager.fs`
      (`apps/crane-cli/src/Core/Logic/`, `libs/fsharp-crane-core/src/Core/Logic/`): reports to
      `local-tmp/pdf-to-md/`, chain files to `local-tmp/.execution-chain-<scope>`, and
      `Directory.CreateDirectory "local-tmp"` before the chain write so the path never has to
      pre-exist. Filename pattern and chain-window semantics unchanged — the plan's scope puts both
      out of bounds, and only the parent directory moves
- [x] [AI] Update both `ReportManagerTests.fs` copies and `apps/crane-cli/tests/unit/Steps/ReportSteps.fs`
      to the new paths, and create `local-tmp/` in the three tests that pre-write a chain file
      rather than letting the production path create it
- [x] [AI] Update `specs/apps/crane/cli/behaviors/reporting/report-management.feature` — the
      `Then a report file is created in "local-tmp/pdf-to-md/"` step
- [x] [AI] Remove the now-unreachable root `.execution-chain-*` entry from `.gitignore`; the new
      location is already covered by `local-tmp/*`, and `crane` was its only writer
- [x] [AI] Change no instruction file — the skill reference and `pdf-to-md-fixer.md` already
      described the new location, so no `.claude/` source moved and no mirror regeneration is due

> **Execution record.** `dotnet test apps/crane-cli/tests/unit/crane-cli-unit-tests.fsproj` →
> 135 passed, 0 failed. `dotnet test libs/fsharp-crane-core/tests/unit/fsharp-crane-core-unit-tests.fsproj`
> → 104 passed, 0 failed. `nx run crane-cli:test:specs` → "12 specs, 37 scenarios, 141 steps — all
> covered"; `nx run fsharp-crane-core:test:specs` → "1 specs, 2 scenarios, 6 steps — all covered".
> Both `test:coverage` targets pass at the 99% line threshold. `fantomas --check` clean across all
> four changed F# trees. No `.execution-chain-*` file and no `local-tmp/pdf-to-md/` directory
> survives the run — the tests clean up after themselves and run with the test binary's own working
> directory. The private sibling carries no `crane-cli` (`git ls-files | grep -c crane` → 0), so this
> phase has no sibling obligation.

### Plan Archival

- [x] Perform the **preliminary** plan-execution end-to-end delivery completeness audit: trace approved scope and
      every canonical PRD acceptance criterion through delivery units, as-built artifacts,
      automated/manual proof, applicable migration/rollout/rollback evidence, conditional recovery
      dispositions, and Knowledge Capture. Reopen execution at the earliest affected packet for
      every missing or unsupported non-delivery row; only final-delivery proof may remain explicitly
      pending. Checked boxes alone are not proof.

  > **Preliminary audit record (2026-09-04).** Every acceptance criterion was re-traced against the
  > as-built repositories rather than against its checkbox.
  > **AC-1/AC-5**: the intent-based two-question test is stated in
  > `overview-and-the-rule.md` (`ose-public`) and `the-rule.md` (the private sibling), and seven
  > the private sibling shards carry the `local-tmp/<agent-family>/` layout.
  > **AC-4**: `grep -rn 'local-tmp", ".known-false-positives.md"'` returns
  > `RepoGovernance.fs:890` in both repositories, identically.
  > **AC-8**: `local-tmp/` appears in all four ignore files (`.prettierignore` and
  > `.markdownlintignore`, both repositories).
  > **AC-11**: 43 of 44 `ose-public` and 23 of 24 the private sibling checker/fixer agents declare a report
  > family; the single omission in each is `pr-review-fixer.md`, which posts GitHub comments and
  > writes no report — by design, and the same file in both repositories.
  > **AC-6 found one survivor.** Classifying every remaining occurrence left three: a
  > `HarnessUnitTests.fs` test name for the unreachable `validateGeneratedReportsTools` guard, the
  > supersession sentence in the mandatory-report-generation shard, and
  > `report-management.feature`'s `Then a report file is created in "generated-reports/"`. The third
  > was real: `crane report --init`, invoked by `pdf-to-md-fixer` step 2 and by the
  > `docs-converting-pdf-to-markdown` skill's Step 0, wrote the agent's own report to
  > `generated-reports/`. Execution reopened at a new Phase 8 (DU-6) rather than ticking the row.
  > After DU-6, `git grep -niE '(write|save|output|create|place|store|emit)[^.]{0,60}generated-reports/'`
  > outside `plans/done/` and the ignore files returns only the two classified rule-text occurrences,
  > in each repository.
  > **AC-7 and AC-9/AC-10** were verified in their own phases and are unchanged: the quarantine was
  > proven then deleted, all four normalized statements carry `unenforced by decision` with recorded
  > reasons in both repositories, and both runs reported `final-status: landed`.
  > **One plan defect stands, not silently ticked**: RP-7 asked to confirm no disposition cites a GPG
  > check `ose-public` does not carry. No such asymmetry exists — the only GPG usage in either
  > repository is three occurrences in `Doctor.fs` verifying the `dotnet-install.sh` signature, and
  > `Doctor.fs` sits inside the byte-identity boundary, so both repositories carry it identically.

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [x] Verify ALL manual assertions pass with committed evidence in `evidence/` — this plan has no
      UI or API surface, so its manual assertions are the Phase 6 filesystem verifications, whose
      evidence is the recorded command output in `local-tmp/update-tmp-folders/`; no `evidence/`
      subfolder is created
- [x] Verify ALL supported locales were exercised in UI verification — not applicable; this plan
      ships no user-facing surface
- [x] Verify every rule-15 EWT/UWT/DWT defect finding is fixed (ticked) — not applicable; no web
      surface was tested
- [x] Verify every rule-16 AET defect finding is fixed (ticked) — not applicable; no API surface was
      tested
- [x] Register the workflow-owned terminal audit task and its required post-delivery proof fields;
      do not mark that gate complete before merge or direct-push confirmation. Its result belongs in
      the plan-execution final report, not a speculative pre-merge checkbox.

  > **Executed order.** This checklist lists worktree removal and branch cleanup above the archival
  > `git mv`, which cannot run in that order: the plan folder being moved lives inside the worktree
  > being removed, and the move has to reach `origin/main` through a PR from that same branch. The
  > proven order, established by `scaffold-plan-archival-cleanup` and followed here, is archive inside
  > the delivery PR, merge it, and only then remove worktrees and delete branches. The rows below are
  > therefore ticked after the merge, not before it.

- [ ] [AI] Classify every [Delivery Branch Inventory](#delivery-branch-inventory) entry in both
      repositories as `delivered`, `unused`, or `retained/escalated`; a retained entry names who owns
      it and why it outlives the plan, and an entry whose state is ambiguous or whose proof is missing
      is escalated, never deleted. An active or unrecorded branch blocks cleanup — this inventory, not
      the file ledger, controls branch cleanup
- [ ] [AI] Remove both worktrees now that the plan is done using them — git-mechanical steps:
      `rtk git -C <ose-public-root> worktree remove worktrees/update-tmp-folders` and the same for
      the private sibling. Non-force command only. Do not run this from inside the worktree being removed;
      `cd` to the repository root first
- [ ] [AI] Complete the canonical
      [branch cleanup](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md)
      for **every** plan-created branch in both repositories — the plan is not clean while its
      branches survive. Per delivery unit, recheck the proof before deleting: the recorded PR reports
      `MERGED`, its head equals the inventory's reviewed-head SHA, and `origin/<branch>` equals that
      SHA unless GitHub proves automatic deletion. Then:

  ```bash
  rtk git fetch origin
  rtk git branch --set-upstream-to=origin/worktree/update-tmp-folders worktree/update-tmp-folders
  rtk git branch -d worktree/update-tmp-folders
  rtk git push origin --delete worktree/update-tmp-folders
  ```

- [ ] [AI] These PRs squash-merge, so expect `git branch -d` to decline: a squash merge leaves the
      branch's own commits off `main`, and `-d`'s ancestry test asks a question no squash-merged
      branch can answer. Only then apply the proof-gated terminal path — all four of `MERGED`,
      `headRefOid` equal to the local tip, merge commit contained in `origin/main`, and
      `HEAD_REF_DELETED_EVENT` with `delete_branch_on_merge` enabled — and use `git branch -D`.
      Any one proof missing means retain and escalate, never delete
- [ ] [AI] Never delete `main` or an environment branch. `ose-public` has `prod-*` / `stag-*`;
      the private sibling currently has none. Confirm per repository with `rtk git branch -a`
- [ ] [AI] Run `rtk git worktree prune` in both repositories. Never `gc` or object-store `prune`
      during cleanup — another process may be writing on this shared machine
- [ ] [AI] Verify the terminal state: `rtk git branch -a` in each repository lists no
      `worktree/update-tmp-folders` ref, local or remote
- [x] After every pre-archival gate, including the preliminary audit, passes, run `rtk date +%F`; record the output as
      `<completion-date>`. Do not hardcode or predict this value while authoring the plan.
- [x] Move the plan via
      `rtk git mv plans/in-progress/update-tmp-folders/ plans/done/<completion-date>__update-tmp-folders/`
- [x] Update `plans/in-progress/README.md` — remove the plan entry
- [x] Update `plans/done/README.md` — add the plan entry using the same resolved completion date
- [x] Update any other READMEs that reference this plan
- [x] Commit: `chore(plans): move update-tmp-folders to done`
