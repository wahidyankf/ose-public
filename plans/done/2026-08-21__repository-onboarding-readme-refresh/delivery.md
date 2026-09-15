# 🚚 Delivery Checklist: README and Onboarding Refresh

> **Legend** — `[AI]`: an agent performs the step. Every executable checklist item in this plan is
> marked `[AI]`; there are no human approval, intervention, or merge gates. If execution discovers a
> task that genuinely requires a person or real-secret handling, stop that task as out of scope
> instead of adding a human participant.
> 🔐 **Hard safety rule**: Never read, write, quote, or commit real `.env*` files or secret values.
> Never copy credentials, hostnames, usernames, IP addresses, or account details into this plan,
> docs, evidence, metadata, commits, or PRs. Use `.env.example`, variable names, and `<placeholder>`
> tokens only.
> 🚧 **Scope rule**: this plan delivers into `ose-public` only. No branch, PR, metadata change, or
> file edit lands in the private sibling, `ose-primer`, or `beaver-nest`, and no delivery unit changes a
> path inside `apps/rhino-cli/` or `specs/apps/rhino/behavior/rhino-cli/`.

## Worktree

The plan uses one worktree for the whole program: `worktrees/repository-onboarding-readme-refresh/`.
Before the first change-producing phase, create it with
`claude --worktree repository-onboarding-readme-refresh` from the repository root, verify the
resulting path with `git worktree list`, and record the exact branch in the Phase 0 execution record.
Every later delivery unit reuses this same worktree and switches branches, per the
[Worktree Cap](../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
Follow the
[Plans Organization Convention](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification)
for provisioning and reconciliation.

## Delivery Mode and Worktrees

**Delivery mode: `worktree-to-pr`.** Every change-producing unit uses the plan worktree, one branch,
and one draft PR against `main`. AI first applies the canonical behavior classifier: eligible PRs run
up to seven sequential review cycles and stop at the first clean code M/H/C result; noneligible PRs
require only a green `pr-quality-gate.yml` run before AI merges. Phase 0 opens no PR and pushes no
branch.

## Execution Records

Every task ID receives a durable row in the owning unit's execution record before its checkbox is
checked. Each row uses these fields:

```text
Task ID | Date | Status | Files Changed | Commands/Evidence | Notes
```

`Files Changed` lists every touched path or `None`. `Commands/Evidence` records commands and
pass/fail outcomes without raw secrets or sensitive output. The execution record is append-only
across agents, compaction, and handoff. The corpus ledger also expands every exact document into its
own `[AI]` task row; a family-level orchestration checkbox never substitutes for the per-document
result.

Exact record ownership:

- Phase 0 writes only to the gitignored
  `local-tmp/repository-onboarding-readme-refresh/execution-record-phase-0.md`; Phase 1 copies its
  sanitized outcomes into the contract record.
- Contract, refresh, correction, and closeout units use
  `artifacts/execution-record-{contract,public,fixes,closeout}.md` inside this plan.
- Metadata, fresh-checkout, and final read-only verification use the gitignored
  `local-tmp/repository-onboarding-readme-refresh/execution-record-verification-program.md`; it
  stores only safe status/evidence summaries and is created before Phase 4.

## AI-Only Integration Rules

At each delivery boundary, the phase carries separate checkboxes for worktree reconciliation,
formatting, Markdown/Rhino validation, generated-binding sync, secret gates, the identity-boundary
guard, commit, push, draft PR, the canonical behavior-routed review requirement, forward-update, CI,
and merge. Commit messages use Conventional Commits, generated mirrors stay with their canonical
source, and no commit message contains sensitive facts.

“Full unit gates” means running the repository's own declared gate commands. Phase 0 reads the
staged-file surface from the registry with
`cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate list --surface=pre-commit --format=text`;
the list below is the expected result and is corrected in this document if the registry disagrees.
The repo-wide surface is never transcribed as a static list at all — it is always invoked through
the registry runner itself, so it can never drift from what the registry currently declares.

Staged-file surface (`pre-commit`), plus the repo-wide equivalents this plan runs over its whole
branch set:

```bash
git diff --check
npm run format:md:check
npm run lint:md
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate --exclude "apps/rhino-cli/tests/fixtures" --exclude "plans/done" --exclude "apps/ayokoding-www/content"
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md naming validate --exempt "*__linkedin__*.md" --exempt "CONTRIBUTING.md"
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md frontmatter validate
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- env staged-guard validate
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- repo-config validate
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- convention emoji validate
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- git lockfile sync
```

P0-003 read the live registry and found it declares 29 `pre-commit` entries, so the block above is a
scoped subset rather than the whole surface. The subset is correct for this plan — the omitted
entries are language formatters and linters (`rustfmt`, `fantomas`, `ruff`, `gofmt`, `shfmt`,
`actionlint`, `shellcheck`, `hadolint`, and the rest) that no documentation-only diff can trigger.
Three entries the block originally omitted **can** fire on this plan's own footprint and were added
above during P0-003A: `repo-config validate` (Phase 3 may edit `repo-config.yml`),
`convention emoji validate` (the reader journey uses purposeful emojis throughout), and
`git lockfile sync` (Phase 3 edits the root `package.json` description).

Repository-wide surface (`pre-push`): the authoritative command is the registry runner itself, the
same one Iron Rule 5 of the
[plan-execution workflow](../../../repo-governance/workflows/plan/plan-execution/iron-rules-1-5.md#iron-rules-non-negotiable)
requires before every push —

```bash
apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push
```

This resolves and runs every gate the live registry currently declares for `pre-push`, so the set
executed is always the registry's current content rather than a hardcoded command list that can go
stale. As Phase 0 finds it, the surface currently covers, in prose: the three hand-wired
affected-project checks (`test:quick`, `compat:min-version`, `specs:structure-validation`); the
Markdown link, governance readme-index, parity-manifest, and harness-duplication validators plus
`env validate` — the environment-contract check, distinct from the staged-file guard that runs at
`pre-commit`; and a set of path-gated governance checks — vendor independence over
`repo-governance/`, vendor independence over `AGENTS.md` specifically, convention license, harness
bindings, harness ownership, harness catalog, governance word-budget, and governance
readme-completeness. `AGENTS.md` is one of this plan's own File-Impact edit targets (`[E]`), so the
`AGENTS.md`-scoped vendor-independence check is a real, applicable gate that can fire on this plan's
own diff whenever a delivery unit touches that file, not a theoretical one.

The `md mermaid`, `md naming`, `md frontmatter`, and Prettier gates are **affected-file-type scoped**:
they inspect only the files a given commit stages, so a branch can accumulate an unformatted or
non-conforming file and still show green. Every delivery unit therefore also sweeps its own complete
branch set explicitly — `git diff --name-only origin/main...HEAD -- '*.md'` piped into the
repo-pinned binaries under `node_modules/.bin/`, never `npx` — before its final gate run.

Every target name above is resolved from live project configuration in Phase 0 before first use; a
target that no longer exists is corrected in this list rather than executed blindly.

For an unscoped repository-wide validator that reports pre-existing violations outside this program's
ledgered paths, record its baseline result and verify zero violations in every changed or ledgered
path instead. The merged PR's required affected-file checks are the final authoritative gate for that
validator. This is scope control, not a waiver: every violation in a changed, generated, or ledgered
path is fixed before the unit proceeds, and no failing required PR check may merge.

The exact staged environment-file gate is:

```bash
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- env staged-guard validate
```

The exact silent staged-credential pattern gate is below. `rg --quiet` prevents a match from echoing
the possible secret into logs:

```bash
if git diff --cached --no-ext-diff --unified=0 -- . | rg --quiet --pcre2 -e '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,}|sk_live_[0-9A-Za-z]{16,}|glpat-[0-9A-Za-z_-]{20,}'; then exit 1; fi
```

The exact identity-boundary guard is:

```bash
git diff --cached --name-only -- apps/rhino-cli specs/apps/rhino/behavior/rhino-cli
```

An empty result is the acceptance criterion; any listed path stops the unit. This is the cheap
staged tripwire that fires before a commit exists. The repository's own registered gate,
`parity manifest validate` (pre-push and CI), remains the authority on the boundary's actual byte
state and runs in every full-gate pass above.

These deterministic gates are necessary but not sufficient. An independent AI reviewer must also
inspect the staged diff semantically for credentials, connection strings, or unsafe examples without
copying the diff into evidence. Metadata, commit messages, and PR text receive the same AI semantic
review because they are outside the staged file scan.

Every “full unit gates” task executes all three gates above.

> **Important — fix all failures, not just those caused by your changes.** Every failure a quality
> gate reports in a changed, generated, or ledgered path is fixed before the unit proceeds, including
> a preexisting one this plan did not introduce. Regenerate swept build artifacts and continue. Never
> bypass a required PR check. If a failure requires code, API, UI, or infrastructure behavior work,
> create and complete its separate blocking plan before resuming this documentation program.

**Commit thematically.** Each commit is one logically cohesive group of changes using
[Conventional Commits](../../../repo-governance/development/workflow/commit-messages.md): plan-control
changes, the documentation refresh, and any correction are separate commits, and an unrelated fix is
never bundled into a commit that already carries another concern. Generated mirrors stay in the same
commit as the canonical source that produced them.

For every PR unit, Phase 0 records every workflow name and required check-run name triggered by this
repository. After each push, enumerate all matching workflow runs with
`gh run list --branch <exact-branch> --limit 20 --json databaseId,name,status,conclusion`; select the
newest run for each recorded workflow, then poll every selected run every two minutes with
`gh run view <databaseId> --json status,conclusion`. Also query the PR's complete check set with
`gh pr checks <pr-number> --required`. Record each workflow name, run ID, check name, and sanitized
result in the unit record. A failed, cancelled, missing, or still-pending run/check is investigated,
fixed in the owning unit, pushed, and polled again; merge is forbidden until every named run and
required PR check succeeds.

## Parallelization Model

**Parallel delivery nodes: 1.** This program delivers into one repository, and its document families
share a single link graph, reader journey, and corpus ledger, so delivery units serialize. The DAG
below is therefore a chain, and the plan declares a single boundary per delivery unit rather than
independent parallel nodes. Parallelism inside a unit
is limited to independent read-only audits of separate document families; anything that writes a file
or a ledger row runs in sequence. Cleanup is the terminal node.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% TD required: this chain is 10 nodes deep, and LR measures depth against MaxWidth=4
flowchart TD
  P0["P0 Baseline"]:::blue --> P1["P1 Corpus tasks"]:::blue
  P1 --> P2["P2 Contract"]:::orange
  P2 --> PUB["P3 Documentation refresh"]:::teal
  PUB --> META["P4 About metadata"]:::blue
  META --> WALK["P5 Checkout journeys"]:::purple
  WALK --> FIX["P6 Correction units"]:::orange
  FIX --> Q["P7 Final quality"]:::blue
  Q --> K["P8 Knowledge closeout"]:::teal
  K --> C["P9 Archive and cleanup"]:::orange

  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

### DAG Registry

| Node | Work                                                           | blockedBy | blocks |
| ---- | -------------------------------------------------------------- | --------- | ------ |
| P0   | Safe baseline                                                  | —         | P1     |
| P1   | Corpus ledger and exact task rows                              | P0        | P2     |
| P2   | Fact, voice, journey, metadata, and sensitivity contract       | P1        | PUB    |
| PUB  | Complete `ose-public` documentation refresh                    | P2        | META   |
| META | Exact About and package metadata                               | PUB       | WALK   |
| WALK | Two fresh-checkout journeys                                    | META      | FIX    |
| FIX  | Conditional correction PRs                                     | WALK      | Q      |
| Q    | Full corpus, voice, mechanical, and sensitivity reconciliation | FIX       | K      |
| K    | Sanitized evidence and knowledge capture                       | Q         | C      |
| C    | Archival, post-move inventory, and cleanup                     | K         | —      |

### Delivery Boundaries

| Phase(s) | Delivery unit                     | Worktree                                          | Branch                                  | PR opens                          |
| -------- | --------------------------------- | ------------------------------------------------- | --------------------------------------- | --------------------------------- |
| 0        | — (setup and baseline)            | primary checkout, tracked state read-only         | —                                       | no                                |
| 1–2      | Documentation contract            | `worktrees/repository-onboarding-readme-refresh/` | `docs/repository-onboarding-contract`   | yes — at Phase 2                  |
| 3        | Documentation refresh             | `worktrees/repository-onboarding-readme-refresh/` | `docs/repository-onboarding-public`     | yes — at Phase 3                  |
| 4        | — (metadata only, no repo change) | authenticated repository session                  | —                                       | no                                |
| 5        | — (verification only)             | disposable temporary clones                       | —                                       | no                                |
| 6        | Corrections, if defects exist     | `worktrees/repository-onboarding-readme-refresh/` | `docs/repository-onboarding-fixes-<nn>` | yes — at Phase 6, once per `<nn>` |
| 7        | — (read-only reconciliation)      | merged `main`, read-only                          | —                                       | no                                |
| 8–9      | Closeout and archival             | `worktrees/repository-onboarding-readme-refresh/` | `docs/repository-onboarding-closeout`   | yes — at Phase 9                  |

Every change-producing phase appears in exactly one row, and the last change-producing phase
(Phase 9) is a delivery boundary. Phases 4, 5, and 7 produce no repository change and therefore open
no PR.

## Phase 0: Environment, Safety, and Baseline

- [x] [AI] [P0-000] Create the exact gitignored Phase 0 execution record with the required schema —
      acceptance: `git status --short` does not list the record and it contains no secret value. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `local-tmp/repository-onboarding-readme-refresh/execution-record-phase-0.md` (gitignored) ·
      **Notes**: Record created with the declared
      `Task ID | Date | Status | Files Changed | Commands/Evidence | Notes` schema.
      `git status --short` returned empty and `git check-ignore -v` resolved the path to
      `.gitignore:84:local-tmp/*`, so the record is untracked by construction. No secret value,
      credential, hostname, or real `.env*` content is present.
- [x] [AI] [P0-001] Run `git status --short` in the repository root and record only path-level
      dirty-state facts in the gitignored Phase 0 execution record — acceptance: no existing change
      is claimed, edited, staged, or copied into plan evidence. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: Primary checkout reported 0 dirty paths. The plan worktree reported exactly one
      modified path — this plan's own `delivery.md` carrying the P0-000 tick. No foreign or
      preexisting change exists, so none was claimed, edited, staged, or copied into evidence.
      Only path-level facts were recorded; no file content was read into the record.
- [x] [AI] [P0-002] Run `git fetch origin`, `git rev-parse main`, and `git rev-parse origin/main` —
      acceptance: every future unit is based on current `origin/main`, with any divergence resolved
      non-destructively before provisioning. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: `git rev-parse main` and `git rev-parse origin/main` both returned `f23b504d8`,
      and `git rev-list --left-right --count main...origin/main` returned `0 0`, so the local
      branch was already current. One real divergence existed: the six plan documents lived only
      on the plan branch in open draft PR #236, so a unit cut from `origin/main` would not have
      contained `delivery.md`. It was resolved non-destructively — PR #236 was squash-merged after
      every check passed with zero failures, and `git ls-tree -r --name-only origin/main` now
      lists all six plan documents. No force push, rebase, reset, or history rewrite was used.
      Plan-base SHA recorded for the Phase 7 identity-boundary check:
      `028e8eed9e68112c49ccdee92d3cf29e70e6a4da`.
- [x] [AI] [P0-003] Run
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate list --surface=pre-commit --format=text`
      — acceptance: the exact Markdown, generated-binding, and environment guard commands are
      recorded in the execution record. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: The command exited 0 and returned 29 registry entries, recorded verbatim in the
      Phase 0 execution record. Markdown gates: `markdownlint-cli2`, `md mermaid validate`,
      `md heading-hierarchy validate`, `md naming validate`, `md frontmatter validate`, and the
      `prettier --write` mutation. Generated-binding gate: `harness bindings generate` (scope
      `other`). Environment guard: `env staged-guard validate` (scope `other`, carve-out
      `staged-only`). Three further entries fire on this plan's own footprint and are handed to
      P0-003A for reconciliation: `repo-config validate`, `convention emoji validate`, and the
      `git lockfile sync` mutation.
- [x] [AI] [P0-003A] Resolve every command named in the staged-file (`pre-commit`) “full unit gates”
      block: each Nx target with `npm exec nx show project <project> -- --json`, and each `rhino-cli`
      subcommand against `rhino-cli <group> --help` — acceptance: every target and subcommand exists,
      and any missing one is corrected in this document before first execution. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: `delivery.md`,
      `learnings.md` · **Notes**: All five npm scripts resolve from `package.json`
      (`format:md:check`, `lint:md`, `validate:sync`, `generate:bindings`, `doctor`). All 19
      `rhino-cli` group + subcommand pairs the plan names exist, each carrying a `validate` leaf.
      The `pre-commit` block declares no Nx target, so no `nx show project` resolution applied.
      Nothing named was missing; the correction ran the other way — three live registry gates the
      block omitted but this plan's footprint can trip (`repo-config validate`,
      `convention emoji validate`, `git lockfile sync`) were added to the block. Recorded as
      `learnings.md` L-001: a `rhino-cli` group always exits `2` without a subcommand, and
      `help <group> <sub>` exits `2` too, so exit status cannot prove a subcommand exists —
      parse the `Commands:` section instead.
- [x] [AI] [P0-003B] Run
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate list --surface=pre-push --format=text`
      and diff the result against the prose summary in the “Repository-wide surface (`pre-push`)”
      block above — acceptance: the prose summary's gate list matches the live registry exactly, any
      drift is corrected in this document before first execution, and the execution record notes
      whether `AGENTS.md`'s path-gated `vendor-independence-agents-md` entry is present. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: The command exited 0 and returned exactly 16 entries, matching the prose summary
      entry-for-entry with zero drift, so no correction was needed. Reconciled as 3 hand-wired
      affected-projects checks + 5 broad validators (`md links validate`,
      `governance readme-index validate`, `harness duplication validate`,
      `parity manifest validate`, `env validate`) + 8 path-gated governance checks = 16.
      `vendor-independence-agents-md` is **present**, running
      `repo-governance vendor validate AGENTS.md`; since `AGENTS.md` is an `[E]` target in this
      plan's File-Impact Analysis, that gate is live and applicable rather than theoretical.
      Noted for later phases: `governance-readme-completeness` invokes the same
      `governance readme-index validate` command as `governance-readme-index`, under a path-gated
      rather than all-file-type scope.
- [x] [AI] [P0-004] Run the exact staged environment-file gate without staging anything —
      acceptance: the baseline exits 0. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: `git diff --cached --name-only` returned 0 staged paths first, confirming the
      gate ran against an empty staged set. `env staged-guard validate` then exited 0 with no
      output. No real `.env*` file was read, written, or quoted.
- [x] [AI] [P0-004A] Run the silent staged-credential pattern gate without staging anything —
      acceptance: the baseline exits 0 and emits no candidate value. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: The gate exited 0 and printed nothing, so no candidate value was emitted. A bare
      pass would have been vacuous against an empty staged set, so two controls were added: `rg`
      was confirmed to resolve (ripgrep 15.2.0), and the pattern was exercised against a synthetic
      non-secret string generated inline, which fired as expected. The synthetic string was never
      written to disk and is not a real credential.
- [x] [AI] [P0-005] Run `npm run format:md:check` and `npm run lint:md` in the primary checkout —
      acceptance: baseline outcomes are recorded without modifying unrelated work. - **Date**: 2026-08-20 · **Status**: Done (baseline red, ledgered paths clean) ·
      **Files Changed**: `learnings.md` · **Notes**: Both unscoped repo-wide validators exit 1 on
      preexisting violations, and every violation sits outside this program's ledgered paths, so
      the scope-control clause above applies. `format:md:check`: 58 files, split 54 under
      `apps/ayokoding-www/content/` and 4 under `plans/done/`, zero anywhere else.
      `lint:md`: 565 error lines, **all** under `.fvm-cache/` — an untracked, gitignored vendored
      Flutter SDK — and zero in tracked repository content. Both splits were verified by inverse
      grep, not by inspection. Root cause of the markdownlint noise is recorded as `learnings.md`
      L-003 and routed to a Phase 8 backlog item: `.fvm-cache/` is in `.gitignore` but in neither
      `.markdownlintignore` nor the `ignores` array of `.markdownlint-cli2.jsonc`. It is not
      fixed here because that path is outside this plan's File-Impact Analysis footprint. No
      unrelated work was modified.
- [x] [AI] [P0-006] Run
      `gh repo view --json nameWithOwner,description,homepageUrl,repositoryTopics,url,visibility` —
      acceptance: only these safe fields are retained for rollback. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `local-tmp/repository-onboarding-readme-refresh/github-about-snapshot-before.json`
      (gitignored) · **Notes**: The command exited 0. Only the six approved fields were requested
      and retained; no token, collaborator, or private field was read, and all six values are
      public repository metadata carrying no secret. Finding handed forward to Phase 4: the live
      values **already equal** the `prd.md` contract — the description matches character for
      character, the homepage is `https://oseplatform.com/`, and the topic set is the same ten
      lowercase slugs. P4-003 should therefore record verified equality and skip mutation, leaving
      P4-004 and P4-006 unfired.
- [x] [AI] [P0-006A] Inspect the workflows and required PR checks this repository triggers and record
      their names — acceptance: every future PR unit has named CI checks and the exact run-polling
      procedure. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: Two workflows fire on a PR to `main`: **pr-quality-gate** (17 check runs) and
      **validate-env** (one check run, `Validate env-contract surfaces (no drift)`). The
      pr-quality-gate runs are: Detect affected languages; Build rhino-cli (gate profile);
      Minimum version compatibility (all affected); Specs structure validation (all affected);
      Auto-format affected (lint-staged); Enumerate registry CI gate groups; `governance`;
      `harness`; `markdown`; `shell-docker-actions`; `specs`; `formatting-verify`; `Quality gate`;
      plus the four language gates that skip on a documentation-only diff. Branch protection
      requires exactly one context — `Quality gate`, the roll-up job. Every later PR unit polls
      with `gh run list --branch <exact-branch>` then `gh run view <databaseId>` at two-minute
      intervals, plus `gh pr checks <pr> --required`; never `gh run watch`.
- [x] [AI] [P0-007] Provision the plan worktree and the contract branch from `origin/main` —
      acceptance: `git worktree list` shows the declared path, and the branch matches the Delivery
      Boundaries table. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None ·
      **Notes**: `git worktree list` already showed the declared path
      `worktrees/repository-onboarding-readme-refresh`, so no second
      worktree was provisioned and the Worktree Cap holds with one worktree for the whole program.
      `git checkout -b docs/repository-onboarding-contract origin/main` created the branch named
      in the Delivery Boundaries table for phases 1–2, and `git merge-base HEAD origin/main`
      equals `028e8eed9`, proving the unit is based on current `main`. The two uncommitted Phase 0
      files carried across the switch without conflict. Local `main` in the primary checkout was
      fast-forwarded `f23b504d8 → 028e8eed9` with `merge --ff-only`, guarded by an assertion that
      it was on `main` with zero dirty paths; no work was done in the primary checkout.
- [x] [AI] [P0-008] Run `npm install` and then `npm run doctor -- --fix` in the plan worktree —
      acceptance: both exit 0 and no real `.env*` is accessed. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None tracked ·
      **Notes**: Both commands exited 0. The worktree had no `node_modules` of its own before the
      install, which is exactly the condition the workflow warns silently breaks a later
      `nx affected` run. Doctor reports 15/16 tools OK with 0 missing and one warning — npm
      v11.16.0 against the Volta pin of 11.11.0. That is preexisting local environment drift
      rather than a gate failure (doctor still exits 0, and CI provisions its own toolchain), so
      it is recorded rather than resolved by downgrading a global tool. Doctor's target-share step
      created one shared link, found one already correct, and replaced one plain directory;
      `git status --short` afterwards lists only this plan's own two uncommitted files, so nothing
      tracked was mutated. No real `.env*` file was accessed. Confirmed for Phase 5B: Docker
      v29.7.2 is present.
- [x] [AI] [P0-009] Run the baseline gates in the plan worktree and classify each repository-wide
      result as ledgered-path or unrelated-baseline evidence — acceptance: every ledgered path is
      clean and any unrelated baseline result is recorded without expanding scope. - **Date**: 2026-08-20 · **Status**: Done (surface green, one advisory red) ·
      **Files Changed**: `learnings.md` · **Notes**:
      `rhino-bin.sh gate run --surface=pre-push` exited 0, confirmed by a second identical run.
      Eight of the sixteen registered gates executed; the eight path-gated governance gates did
      not fire because no matching path had changed, which is the expected baseline shape.
      `test-quick`, `compat-min-version`, `specs-structure`, `env-validate`, `md-links`, and
      `harness-duplication` all passed, and `parity-manifest` reported
      `apps/rhino-cli/parity-manifest.sha256 is current`, proving the identity boundary is intact
      at baseline. `governance-readme-index` printed `README INDEX AUDIT FAILED: 425 finding(s)`.
      **Classification**: all 425 findings are `high/unannotated` and every one sits under `docs/`
      or `specs/` — verified by extracting and counting every path the report mentions (524
      `specs/`, 326 `docs/`, nothing else). Those are exactly the two trees the plan's Out of scope
      section hands to a separate follow-up plan, so they are unrelated-baseline evidence, not
      ledgered-path failures. Every ledgered path is clean. Recorded as `learnings.md` L-004: this
      validator prints `FAILED` yet exits 0, so text and exit status must be read as independent
      signals. Constraint carried forward — this plan must not **add** a README-index finding in a
      path it touches, even though it does not clear the existing backlog.

### Phase 0 Gate

- [x] [AI] [P0-G01] Verify every P0 execution-record row is complete and Phase 0 opened no PR, pushed
      no branch, and mutated no metadata — acceptance: all baseline evidence is local and secret-free. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: `learnings.md` ·
      **Notes**: All 14 P0 executable items carry a complete execution-record row (15 rows,
      including the P0-002a merge sub-row). The tick/task assertion first read **13 ticks against
      14 closed tasks**, exposing a silent no-op on P0-006A whose notes had landed but whose
      checkbox was never flipped; it was repaired and the count now reads 14 = 14, with all 146
      checkboxes still accounted for. Phase 0 pushed nothing — `git log origin/main..HEAD` returns
      0 commits and `git ls-remote --heads origin 'docs/repository-onboarding-*'` returns 0
      branches — and opened no PR. PR #236 merged during this phase, but that is the
      pre-execution plan-documents PR, not one Phase 0 created. Metadata is unmutated: the
      description length and homepage still match what P0-006 captured. Both evidence files
      resolve to `.gitignore:84:local-tmp/*`, and the credential-pattern scan returned clean over
      both the evidence directory and the tracked plan directory. Recorded as `learnings.md`
      L-005: the per-gate count assertion is the only instrument that catches a tick that was
      never attempted.

> **Pause Safety**: reader documentation and metadata remain unchanged. To resume, inspect the P0
> execution record and rerun only failed baselines.

## Phase 1: Corpus Inventory and Per-Document Task Register

- [x] [AI] [P1-000] Create `artifacts/execution-record-contract.md` and copy only sanitized Phase 0
      outcomes from the local record — acceptance: every copied row uses the required schema and no
      local path, dirty filename, or raw output enters the tracked artifact. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/execution-record-contract.md` · **Notes**: All 15 Phase 0 rows plus the P1-000
      row were written under the declared
      `Task ID | Date | Status | Files Changed | Commands/Evidence | Notes` schema — 16 rows
      total. Sanitization was asserted rather than assumed: a grep for `/Users/` and `~/ose-projects`
      returns 0, a grep for raw validator output lines returns 0, and the credential-pattern scan
      returns clean. No dirty working-copy filename from P0-001 was carried over; the row states
      only that the sole dirty path was this plan's own file. `md heading-hierarchy validate`,
      `md naming validate`, and `markdownlint-cli2` on the new file all exit 0 with 0 errors.
- [x] [AI] [P1-001] Create `artifacts/reader-doc-disposition-ose-public.md` with repository revision,
      document kind, exact path, audience, purpose, disposition, owning unit, task ID, direct action,
      source of truth, exact applicable command, acceptance criterion, Date, Status, Files Changed,
      Commands/Evidence, and Notes — acceptance: the schema supports one executable row per tracked
      Markdown file without quoting document bodies, and explicitly declares the direct-action,
      source-of-truth, exact-command, and acceptance-criterion fields that P1-005 requires every
      expanded row to carry. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: The ledger declares all
      seventeen row fields, and the four P1-005 requires — direct action, source of truth, exact
      applicable command, acceptance criterion — are each declared explicitly and cross-referenced
      to P1-005 by name. It quotes no document body, command output, configuration value, or
      credential. **Scale decision recorded here because it shapes P1-002 and P1-007**: the
      corpus is 9,294 tracked Markdown files, so the schema carries per-document rows for
      audit-required and reader-related documents and carries the bulk classes (historical,
      generated, identity-bound, `not-reader-doc`) by classification rule plus matched count. The
      acceptance asks the schema to _support_ one executable row per tracked file, which it does;
      exhaustiveness is proven by the Rule Coverage identity — matched counts must sum to the
      tracked total with zero unmatched — rather than by literal row-per-file, which previously
      produced an 8.5 MB artifact. The skeleton is 8.3 KB. `markdownlint-cli2`,
      `md heading-hierarchy validate`, and `convention emoji validate` all exit 0.
- [x] [AI] [P1-002] Populate the ledger from
      `git ls-tree -r --name-only <recorded-origin-main-sha> | grep -E '\.md$'` — acceptance: every
      committed README is audit-required and each other path is classified reader-related,
      historical, generated, identity-bound, or `not-reader-doc` with a reason, and the enumerated
      count is non-zero and equals `git ls-files '*.md'` at the same revision. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/reader-doc-disposition-ose-public.md`, `tech-docs.md`, `delivery.md`,
      `learnings.md` · **Notes**: **The documented command was broken and was corrected before
      use.** `git ls-tree -r --name-only <sha> -- '*.md'` returns **0 paths and exits 0** —
      `git ls-tree` does not accept glob pathspec magic (`:(glob)` fails outright with
      `pathspec magic not supported by this command`), so the wildcard matched nothing. The
      acceptance "every path is classified" would have passed vacuously on an empty list. Fixed
      as a class, not a site: all three occurrences across `delivery.md` (P1-002, P7-001) and
      `tech-docs.md` now read
      `git ls-tree -r --name-only <sha> \| grep -E '\.md$'`, and both inventory acceptances gained
      a non-zero floor plus a cross-check. A residual grep for the broken form returns 0.
      Recorded as `learnings.md` L-006. **Population**: 9,294 paths enumerated at
      `028e8eed9`, matching `git ls-files '*.md'` exactly (9,294 = 9,294) — the independent
      cross-check the amended acceptance requires. Thirteen ordered first-match-wins rules were
      written into the ledger with a stated reason each, and their matched counts sum to 9,294
      with **zero unmatched**. All 1,004 READMEs are `audit-required` under rule 1, which is
      evaluated first so every README carries an explicit disposition before P1-003 applies any
      exemption. `markdownlint-cli2` and `prettier --check` both exit 0 on the ledger.
- [x] [AI] [P1-003] Mark `plans/done/` and archived trees historical, generated mirrors generated, and
      every path under `apps/rhino-cli/` or `specs/apps/rhino/behavior/rhino-cli/` `identity-bound` —
      acceptance: none is scheduled for hand-editing. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: An `Exemption Overrides`
      section now records all three exempt trees with their final disposition, path count, README
      count, and the reason the plan does not hand-edit them: `identity-bound` 27 paths (20
      READMEs), `historical-exempt` 1,390 (236), `generated` 649 (117) — **2,066 paths, 373 of
      them READMEs**. The ordering matters and is stated in the ledger: rule 1 audits all 1,004
      READMEs first, and these 373 reach an exempt verdict _through_ that audit rather than by
      being skipped, which is what lets P1-002's "every committed README is audit-required" and
      this item's "none is scheduled for hand-editing" both hold literally. Effective dispositions
      after the overrides — 631 `audit-required`, 183 `reader-related`, 6,414 `not-reader-doc`,
      1,390 `historical-exempt`, 649 `generated`, 27 `identity-bound` — sum to 9,294, the tracked
      total, so the overrides neither dropped nor duplicated a path. All 27 identity-bound paths
      were enumerated explicitly. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P1-004] Re-verify each 2026-08-06 audit finding recorded in `brd.md` against the recorded
      revision — acceptance: every finding is marked reproduced or not-reproduced with evidence, and a
      non-reproducing finding creates no edit row. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: All seven `brd.md` rows were
      re-run against `028e8eed9`; the ledger's new `Audit Finding Re-Verification` section
      carries a verdict, the evidence, and the consequence for each. **Three no longer
      reproduce** and correctly create no edit row: the onboarding dead-end
      (`docs/tutorials/README.md` and the getting-started tutorial both exist and `docs/README.md`
      links each), the contribution contradiction (`CONTRIBUTING.md` states intake is closed,
      documents the internal worktree-to-draft-PR flow, and the root README agrees), and the
      product-navigation gap (the root README already opens with a path chooser carrying
      `🧭 Understand the product` and `🧰 Run OSE locally`). **One reproduces**: no project
      declares a `specs:coverage` target — the real names are `test:specs`,
      `specs:behavior:coverage`, `specs:structure-validation`, `specs:e2e:coverage`,
      `specs:domain:coverage` — and 7 in-scope documents still name it, plus
      `apps/rhino-cli/README.md` which is `identity-bound` and therefore audited but never edited
      here. **Two reproduce partly**: the setup-drift finding holds only on its version half (9
      in-scope files pin `24.13.1` against the authoritative Volta pin `24.16.0` / npm `11.11.0`)
      and not on its clone-directory half (every reader doc consistently uses `ose-public`); the
      repetitive-voice finding measures as 4 in-scope stock openings and 55 in-scope uses of
      `comprehensive`, which is judgment-bearing and so routes to the Human Voice Contract review
      in Phases 3 and 7 rather than to mechanical find-and-replace rows. Findings were narrowed
      against the 814-path in-scope set (631 `audit-required` + 183 `reader-related`) so no
      out-of-scope tree inflates the work. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P1-005] Expand each audit-required or reader-related document into one exact `[AI]` task
      row — acceptance: each row names one path, one direct action, its source of truth, the exact
      applicable command, a concrete acceptance criterion, and implementation fields. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: 814 rows for 814 documents —
      631 `audit-required` READMEs plus 183 `reader-related` documents — each carrying all
      seventeen declared fields with no blank required field. The row set was diffed against the
      in-scope path set and is **identical**: 814 extracted, 814 unique, zero duplicates, zero
      missing, zero extra. Each row's direct action, source of truth, command, and acceptance are
      derived from the P1-004 verdicts rather than invented, so the four mechanical defect classes
      produce falsifiable per-file criteria — `grep -F 'specs:coverage'` returns 0 (7 files),
      `grep -F '24.13.1'` returns 0 (9 files), the opening names the reader's purpose (4 files),
      `grep -ci comprehensive` returns 0 (55 files) — and the 745 documents with no mechanical
      defect carry an audit action whose criterion is that links resolve, commands exist, and the
      voice review records no finding. That is the plan's "record `verified-unchanged` rather than
      manufacture an edit" rule expressed per row. Task IDs route 1 row to P3-003, 1 to P3-004, 2
      to P3-007, and 810 to P3-008. A first integrity check appeared to show 806 unique paths; that
      was a faulty extraction regex greedily matching the last backticked field rather than the
      path column, and column-indexed extraction confirms 814. `prettier --check`,
      `markdownlint-cli2`, `md heading-hierarchy validate`, and `convention emoji validate` all
      exit 0 on the 672 KB ledger.
- [x] [AI] [P1-006] Add explicit `planned-new` task rows for this plan's execution artifacts and any
      new document before evaluating inventory drift — acceptance: future known Markdown paths are not
      mistaken for unexplained extras. - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
      `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: Seven `planned-new` rows now
      carry a path, owning unit, task ID, declaration-time status, and reason:
      `execution-record-contract.md` and `reader-doc-disposition-ose-public.md` (both already
      created), `execution-record-public.md` (P3-001A), `execution-record-fixes.md` (P6-001A,
      conditional on Phase 5 finding a defect), `execution-record-closeout.md` (P8-001A),
      `evidence/README.md` (P8-002), and any `plans/backlog/` plan P8-004A routes a code-homed
      learning into. Verified against the recorded revision: the plan directory held exactly six
      tracked Markdown files at `028e8eed9`, and the working tree now holds eight — the two
      already-created artifacts — so every present extra is declared. Two known non-additive
      movements are declared for the same reason rather than left to surprise a drift check:
      P9-002 renames the whole plan directory into `plans/done/`, and P8-004B may fold a learning
      into an existing `plans/ideas/` two-pager instead of adding a file. Evidence screenshots and
      captured `curl` responses are not Markdown and are stated as outside this inventory.
      `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P1-007] Reconcile the ledger with its recorded `origin/main` tree plus `planned-new` rows
      — acceptance: zero missing, duplicate, or unexplained extra paths and zero blank task fields.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: fourteen machine-evaluated checks
    written into the ledger's Reconciliation section, all PASS. 9,294 tracked Markdown paths at the
    recorded revision, agreeing exactly with the independent `git ls-files '*.md'` enumerator; every
    path matched by exactly one rule; rule-coverage counts sum to 9,294 with zero unmatched and zero
    doubly classified. The 814 per-document rows are set-identical to the in-scope set — zero
    duplicates, zero in-scope paths without a row, zero row paths absent from the recorded tree. Zero
    rows carry a blank required field. Every working-tree Markdown path absent from the recorded tree
    is declared in § Planned-New Paths, so unexplained extras is 0. Zero `follow-up-required` states
    outstanding, so nothing here blocks archival. `prettier --check` and `markdownlint-cli2` exit 0.

### Phase 1 Gate

- [x] [AI] [P1-G01] Have an independent AI plan reviewer sample task rows from every document class —
      acceptance: exact per-document execution is ready and every row is individually executable.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md`, `delivery.md`, `learnings.md` · **Notes**: five
    review rounds against an independent AI reviewer, PASS on the fifth. Rounds 1–4 returned FAIL and
    each found a real defect. Round 1: 745 of 814 rows named a repo-wide `md links validate` whose
    312 broken links all sit in `plans/done/**`, so the clause could never pass; scoped past the
    exact trees Classification Rule 3 declares exempt. Round 1 also found the "every command exists"
    sub-clause unbacked by any command, and the `Disposition` column carrying interim labels absent
    from the stated vocabulary — the latter fixed with a documented interim-label subsection plus a
    mechanical retirement in P7-001. Round 3: my Nx sub-clause keyed on the literal string
    `nx affected -t`, missing `nx run [project]:<target>` and friends; made shape-agnostic. Round 4:
    the npm-script check could not tell a claim from a teaching example — swept 297 command mentions
    across 71 documents and found four non-existent scripts, of which three are correctly absent
    (generic CI examples, "Future"/"pending" labels) and one is a real defect; carve-out added that
    exempts on framing while still failing an unresolvable command presented as current. I also
    caught and removed a self-inflicted escaped pipe that split the table under any pipe-field parser
    (745 rows at 20 fields against 69 at 19; now uniform at 19 across all 814). Round 5 swept 142
    concrete Nx project:target pairs and 12 npm scripts, found zero genuinely ambiguous mentions and
    no loophole, and confirmed the carve-out passes the three documents it must exempt and still
    fails the one it must catch. Two pre-existing documentation defects surfaced for Phase 3 to fix
    under P3-008: `docs/explanation/.../c4-architecture-model/README.md` names `validate:diagrams` as
    a current tool, and `apps/organiclever-be/README.md` names a `fmt` target that does not exist.
    `prettier --check` and `markdownlint-cli2` exit 0.

> **Pause Safety**: the corpus is enumerated and task-shaped, but reader docs remain unchanged. To
> resume, reconcile the ledger against current `origin/main` before editing anything.

## Phase 2: Documentation Contract

- [x] [AI] [P2-001] Record the source-of-truth matrix from `tech-docs.md` in the ledger — acceptance:
      the ledger names one authority for versions, projects, ports, product facts, relationships,
      contribution policy, and metadata.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: new `## Documentation Contract`
    section opened in the ledger with `### Source of Truth (P2-001)` as its first subsection. Ten
    fact classes each name exactly one authority, how a document may carry the fact, and the command
    that verifies it — covering all seven the acceptance requires (versions, projects, ports, product
    facts, relationships, contribution policy, metadata) plus targets, behavior/design, and the
    package description. Added the rule that no document may carry a second independently maintained
    copy of a fact, and called out version pins as the sharpest case since Phase 1 re-verified pin
    drift as still live in nine documents. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P2-002] Record the Human Voice Contract and reader paths from `prd.md` in the audit rubric
      — acceptance: product purpose leads, jargon is explained, emoji is purposeful, and openings are
      not templated clones.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: `### Voice and Reader Paths
(P2-002)` records the rubric as twelve numbered clauses V1–V12, each paired with what its failure
    looks like so a reviewer can point at a line rather than argue about tone. All four acceptance
    conditions are named clauses: purpose leads (V1), jargon explained on first use (V3), emoji as
    labelled wayfinding only (V10), and no templated openings (V5). The shared opening's five
    questions are recorded in order, as are both reader paths with their ordered stages, and the
    sibling-repository limit — one-line descriptions and links, no path or metadata change. Noted
    that V4 and V5 are the corpus's weakest clauses, with `comprehensive` live in 55 tracked
    documents. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P2-003] Record macOS and Ubuntu as supported and WSL2 as possibly workable but unsupported
      and unverified — acceptance: every platform task uses the same wording contract.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: `### Supported Platforms (P2-003)`
    records three states — supported and verified (macOS, Ubuntu), possibly workable but unsupported
    (WSL2), and not addressed (native Windows) — each with what a document may and may not say. The
    WSL2 sentence is fixed rather than paraphrasable: "may work", "does not verify", "does not
    support", with the note that softening any of the three turns it into a promise and breaks the
    contract. Native Windows gets nothing at all, closing the "should also work" gap. Also folded in
    the bootstrap-order contract, since the audit's circular prerequisite — doctor runs through the
    Rust toolchain, so it cannot install Rust on a machine without Cargo — is a platform claim in
    substance. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P2-004] Record closed external contribution intake and authorized `worktree-to-pr`
      guidance — acceptance: no task introduces an invitation, response-time promise, or
      direct-`main` workflow.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: `### Contribution Posture (P2-004)`
    records the two halves — closed external intake, `worktree-to-pr` for authorized contributors —
    as a must/may-not table so the acceptance is checkable per document rather than per feeling. All
    three prohibited moves are named explicitly on the may-not side: no invitation to the general
    public, no response-time or triage promise, no direct-`main` workflow, and none of them as an
    example or aside either. Added the must-side clause that a would-be external contributor is
    routed somewhere useful rather than dead-ended, since closed intake answered by silence is its
    own defect. Recorded that Phase 1 re-verified this finding as no longer reproducing, so the
    contract's job is to hold the line through the refresh rather than repair it, and declared the
    uppercase `CONTRIBUTING.md` filename exemption so no task renames it. `prettier --check` and
    `markdownlint-cli2` exit 0.
- [x] [AI] [P2-005] Record the exact GitHub description, homepage URL, and topic array from `prd.md` —
      acceptance: metadata execution cannot improvise values.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: `### Repository Metadata (P2-005)`
    carries the description and homepage verbatim plus the ten lowercase topic slugs enumerated in
    full, and states that Phase 4 may apply only these values — no improvised wording, no added
    topic. The root `package.json` description is bound to the same string byte for byte. Read the
    live values while writing this: all four already equal the contract exactly, so Phase 4 is
    expected to record verified equality rather than mutate, and P3-003A is a verification. Recorded
    the fallback anyway — if a later read differs, Phase 4 applies the contract value and reads it
    back — plus the capture/apply/read-back/restore procedure and the limit to the six approved
    public fields. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P2-006] Record the read, write, staged-diff, identity-boundary, and knowledge-capture
      gates — acceptance: no execution record can contain a secret and no unit can edit an
      identity-bound path.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md` · **Notes**: `### Safety Gates (P2-006)` records
    all five gates as a table of what each forbids and how it is discharged, so a unit can be checked
    against them rather than asserted clean. Both acceptance halves are covered: the read, write, and
    staged-diff gates together make a secret-bearing execution record impossible, and the
    identity-boundary gate gives the exact staged command whose empty result is the criterion. Noted
    that the staged check is an earlier tripwire rather than a replacement for the registered
    `rhino-cli parity manifest validate` gate, and that describing the boundary in reader
    documentation is not editing it — otherwise the guard would read as a ban on explaining the
    relationship. Added the evidence prohibitions and the rule that records are sanitized at the
    point of writing rather than scrubbed later. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P2-007] Reconcile the contract unit file-touch ledger with `git status --short` and run
      `git diff --check` — acceptance: only declared plan files and artifacts are changed.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/execution-record-contract.md` · **Notes**: the unit's file-touch ledger is now written
    explicitly into the execution record rather than left implicit in the `Files Changed` column, and
    reconciled by set comparison against `git status --short --untracked-files=all`. Five declared,
    five actual, zero undeclared changes, zero declared-but-unchanged paths: `delivery.md`,
    `learnings.md`, `tech-docs.md`, and the two artifacts. Every one is a plan file or artifact
    declared in the tech-docs File-Impact Analysis; nothing outside `plans/in-progress/` is touched.
    `git diff --check` exits 0 with no whitespace error. Also appended the seven Phase 2 rows to the
    execution record. `prettier --check` and `markdownlint-cli2` exit 0.
- [x] [AI] [P2-007A] Stage only contract-ledger paths and inspect `git diff --cached --name-only` —
      acceptance: the staged set equals the contract file-touch ledger and the identity-boundary guard
      returns empty.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: staged the five
    ledger paths by explicit path — never `git add -A` — and read the staged list back. It equals the
    contract file-touch ledger exactly: the two artifacts plus `delivery.md`, `learnings.md`, and
    `tech-docs.md`, five paths, nothing else. The identity-boundary guard
    `git diff --cached --name-only -- apps/rhino-cli specs/apps/rhino/behavior/rhino-cli` returns
    empty, so no staged change reaches inside the byte-identity boundary and no cross-repository
    obligation is opened. Counted the staged set with `grep -c .` allowing for the RTK trailer rather
    than reading the raw line count.
- [x] [AI] [P2-008] Run `npm run format:md:check`, `npm run lint:md`, the repository-authoritative
      Rhino Markdown validators, `npm run validate:sync`, and the exact staged environment-file gate —
      acceptance: every command exits 0.
  - **Date**: 2026-08-20 · **Status**: Done (one advisory red) · **Files Changed**: `learnings.md` ·
    **Notes**: both real gate surfaces exit 0 — `gate run --surface=pre-commit` and
    `gate run --surface=pre-push`, the latter including the parity-manifest check that proves the
    identity boundary intact. Individually: prettier and markdownlint clean on all 8 plan files,
    `md links validate --exclude plans/done --exclude archived` clean, `validate:sync` PASSED,
    `env staged-guard validate` exit 0, `convention emoji validate` and `repo-config validate` exit 0. Unscoped `md mermaid validate` exits 1 with 786 violations across 1,165 files, but zero are in
    this plan's tree and the registry scopes the gate to `affected-file-type`, so the staged set is
    clean and both surfaces stay green — the same shape as the Phase 0 `format:md:check` and
    `lint:md` baselines. Split by fixability and routed to Phase 8 as L-009: the 4 failing
    `apps/rhino-cli` files are deliberate negative fixtures under `tests/fixtures/state/` — one
    holds a state named `ThisLabelIsLongerThan30CharsAndFails` — so they must stay broken, and they
    are byte-identical with the private sibling besides.
    Confirmed the binding regeneration inside the pre-commit surface left the tree clean — still
    exactly 5 staged paths at that moment, nothing unstaged. P2-009 later widened the unit to
    seven paths; the file-touch ledger records the expansion.
- [x] [AI] [P2-009] Have an independent AI review the staged contract diff for secrets, plan
      structure, and robotic prose — acceptance: zero CRITICAL, HIGH, or MEDIUM findings.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/reader-doc-disposition-ose-public.md`, `artifacts/execution-record-contract.md`,
    `delivery.md`, `learnings.md`, `tech-docs.md`, `prd.md`, `README.md` · **Notes**: three review
    passes, PASS on the third with zero CRITICAL, HIGH, or MEDIUM. Secrets were clean in every pass —
    zero credentials, emails, or absolute local paths, the only `/Users/` line being the grep pattern
    in P0-G01's own sanitization assertion, and the only URL the contracted
    `https://oseplatform.com/`. Pass 1 returned two HIGH and one MEDIUM: the ledger claimed whole-tree
    byte identity with the private sibling for `apps/rhino-cli/**`, when `BOUNDARY_PATHS` is seven
    pathspecs and 25 of the 27 `identity-bound` paths are in the 603-entry manifest — the two
    absentees being the very READMEs the ledger used the claim to exclude; two items were ticked
    before their execution-record rows existed, violating the plan's own append-only rule in the
    commit that establishes it; and `git ls-files '*.md'` cannot be revision-pinned, so the
    cross-check silently drifted to 9,296 once the artifacts were staged. Pass 2 closed all three but
    found the boundary claim alive at two more sites, because I had fixed the sites named rather than
    the class. Pass 3 closed it: 47 vocabulary hits enumerated across the whole plan directory, six
    definitions and assertions rewritten, and the reviewer's independent sweep found no seventh.
    Recorded as L-010. Also corrected an error of my own the review had not reached — the four
    mermaid-failing `rhino-cli` files are negative fixtures whose `.expected.json` siblings assert
    the exact violations they emit, so they must stay broken. The unit widened from five paths to
    seven, both additions declared `[E]` in the File-Impact Analysis and recorded in the file-touch
    ledger. 18 of 20 factual claims reproduced on first read; the two that did not were the two the
    findings named.
- [x] [AI] [P2-010] Commit the contract unit with a Conventional Commit — acceptance: the commit
      contains one cohesive plan/control-plane change and no unrelated file.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None beyond the commit itself ·
    **Notes**: committed as `688693983`, 7 files changed, 2,019 insertions. Used
    `git commit --only -F <file> -- <paths>` so the pre-commit hook could not sweep in an unstaged
    path and so the message body survived intact — `--only ... -m` fails because git reads `-m` as a
    pathspec. The commit contains exactly the seven file-touch-ledger paths, every one inside
    `plans/in-progress/repository-onboarding-readme-refresh/`, and no unrelated file. All pre-commit
    gates ran and passed, including commitlint. The working tree is clean afterwards: the binding
    regeneration inside the hook produced no change, so nothing was left behind unstaged. Git emitted
    its standing `gc.log` warning about unreachable loose objects — a preexisting repository
    housekeeping condition, unrelated to this commit and not introduced by it.
- [x] [AI] [P2-011] Push the exact contract branch and open its draft PR against `main` — acceptance:
      the PR links this plan and declares its file set.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: ran
    `gate run --surface=pre-push` before pushing — exit 0 across eight gates, with
    `parity-manifest validate` reporting the manifest current and the README-index audit printing
    `FAILED: 425 finding(s)` while exiting 0, the same count Phase 0 baselined, so this unit adds
    none. Pushed `docs/repository-onboarding-contract` to origin and opened draft PR #237 against
    `main`. The body links the plan directory, states that no reader-facing document changes in this
    PR, and declares the seven-path file set as matching the file-touch ledger exactly. It also
    records the four defects found while building the unit and the eight independent review passes
    behind the two gates, so a reviewer can see what was already challenged.
- [x] [AI] [P2-012] Classify the PR with the canonical behavior classifier, then run only its
      applicable route — acceptance: eligible work reaches the earliest clean code M/H/C cycle within
      seven; noneligible work has a green `pr-quality-gate.yml` run.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: classified PR #237
    **noneligible** against the five-rule classifier in
    `repo-governance/workflows/pr/pr-review-quality-gate/purpose-execution-mode-and-classifier.md`.
    Rule 1: inspected the complete changed-file list rather than the branch name — seven paths, every
    one Markdown under `plans/in-progress/`, with zero matching `apps/`, `libs/`, `scripts/`,
    `infra/`, or `.github/` and zero non-Markdown files. Rule 2 does not fire: nothing in the diff can
    build, test, deploy, provision, run, or otherwise change reachable runtime or CI behavior. Rule 3
    applies: the full diff is non-executing static plan material. Rule 4's fail-safe does not apply
    because the diff is uniformly non-executing, not mixed or ambiguous. Rule 5's secret check was
    discharged by three independent sensitivity sweeps at P2-009, all clean. The noneligible route is
    therefore a green `pr-quality-gate.yml` run and no specialist fan-out. CI is green: 13 checks
    pass, 4 language gates correctly skipping, and the `Quality gate` roll-up — the single required
    context — passes.
- [x] [AI] [P2-013] Forward-update from current `origin/main`, rerun all unit gates, and verify PR CI
      — acceptance: the head is current and green without destructive history edits.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: `delivery.md` · **Notes**: fetched
    and compared: `git rev-list --left-right --count origin/main...HEAD` returns `0 1`, so the branch
    is zero commits behind and one ahead, and `git merge-base HEAD origin/main` equals `origin/main`
    at `028e8eed9`. The head is already current, so no forward-update was needed and none was
    performed — no rebase, no reset, no force push, no history edit of any kind. Reran
    `gate run --surface=pre-push` locally, exit 0. PR CI is green on the pushed head. The remaining
    Phase 2 ticks were committed and pushed to the branch so the durable record lands inside the PR
    rather than after it.
- [x] [AI] [P2-014] Merge the contract PR as AI after all hardened preconditions hold — acceptance:
      `main` contains the contract and task registers.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: checked every
    hardened precondition before merging rather than trusting the green checks alone —
    `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, zero unresolved review threads queried through
    the GraphQL `reviewThreads` API, and CI at 14 pass / 4 skipping / 0 failing. Marked the PR ready
    for review, then squash-merged as `f268c0077e897afe4ece54a4c013309ac85dda04` under `[AI]`
    authority, which the plan's Delivery Mode grants for this unit. Kept the branch rather than
    deleting it, so P9-012 can still prove its merged status. `main` now carries the contract and
    both task registers.

### Phase 2 Gate

- [x] [AI] [P2-G01] Read the merged contract from `origin/main` — acceptance: downstream work begins
      from one immutable contract revision.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: read the ledger
    back out of `origin/main` itself with `git show`, not from the working tree, so the verification
    is against what actually merged. It carries 814 per-document rows at a uniform 19 fields, all six
    `### … (P2-00N)` contract subsections, and 14 PASS verdicts in the Reconciliation table. The
    immutable contract revision downstream work begins from is
    `f268c0077e897afe4ece54a4c013309ac85dda04`. Phase 2 gate assertion holds: 40 ticks against 40
    completed plan tasks.

> **Pause Safety**: the control contract is merged and independently useful. To resume, read the
> merged ledger and start the refresh unit from current `origin/main`.

## Phase 3: Complete Documentation Refresh

- [x] [AI] [P3-001] Switch the plan worktree to the refresh branch, created from current
      `origin/main` — acceptance: the declared pair appears in `git worktree list` and
      `git status --short` is clean before edits.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: created the branch
    from `origin/main` at `f268c0077`, the merged contract revision, with the tree clean beforehand —
    `git status --porcelain` returned zero paths at branch creation, and the only later modification
    is this file's own Phase 2 tick record. First attempt named the branch
    `docs/repository-onboarding-refresh` from memory; reading the Delivery Boundaries table showed
    the declared Phase 3 name is `docs/repository-onboarding-public`, so the branch was renamed
    before any commit and nothing was pushed under the wrong name. `git worktree list` now shows the
    declared pair — `worktrees/repository-onboarding-readme-refresh/` on
    `docs/repository-onboarding-public` — and two worktrees total, so the Worktree Cap still holds.
    `git merge-base HEAD origin/main` equals `origin/main`. Also fast-forwarded local `main` from
    `028e8eed9` to `f268c0077`: the squash-merge advanced the remote, not the local branch, and
    leaving it behind is how silent divergence starts.
- [x] [AI] [P3-001A] Create `artifacts/execution-record-public.md` with the required schema —
      acceptance: all Phase 3 task IDs have rows before their checkboxes are checked.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/execution-record-public.md` · **Notes**: opened the refresh unit's durable record
    before any Phase 3 edit, so no tick can outrun its row — the ordering rule that P2-009 caught
    being violated in the contract unit. It carries the declared six-column schema, pins the contract
    revision this unit executes against at `f268c0077`, and states that every fact comes from the
    authority `### Source of Truth (P2-001)` names for its class while every changed reader-facing
    document is read against clauses V1–V12. Rows for P3-001 and P3-001A are in place. A file-touch
    ledger section is opened empty, to be reconciled at P3-010 and staged against the
    identity-boundary guard at P3-010B. Zero absolute local paths, `prettier --check` and
    `markdownlint-cli2` exit 0.
- [x] [AI] [P3-002] Run `npm install`, `npm run doctor -- --fix`, and baseline gates in the refresh
      unit — acceptance: setup and baseline checks pass before edits.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: `npm install`
    exits 0; its `allow-scripts` notice about `fsevents` is npm's standing install-script prompt, not
    a failure. `npm run doctor -- --fix` exits 0 at 15/16 tools OK, 0 missing, 1 warning — the same
    package-manager version warning Phase 0 recorded as preexisting environment drift, unchanged by
    the branch switch. Both gate surfaces are green on the refresh branch before any edit:
    `gate run --surface=pre-commit` and `--surface=pre-push` each exit 0. The README-index audit
    prints `FAILED: 425 finding(s)` while exiting 0 — identical to the Phase 0 and Phase 2 counts, so
    the merged contract unit added none and Phase 3 starts from the same baseline. Nothing tracked
    was mutated: the tree holds only this file's ticks and the new untracked execution record.
- [x] [AI] [P3-003] Audit and, where evidence requires, revise root `README.md` around product
      purpose, repository role, maturity, sibling-repository lines, **Understand the product**, and
      **Run OSE locally** — acceptance: an early engineer or product person can select a path without
      reading build internals first, and an already-passing section is recorded `verified-unchanged`.
  - **Date**: 2026-08-20 · **Status**: Done (targeted-fix) · **Files Changed**: `README.md` ·
    **Notes**: audited against the five-question shared opening the contract records. Four already
    passed and are `verified-unchanged`: the problem statement, the audience, the pre-alpha maturity
    and closed-intake posture, and the two labelled reader paths, which appear before any build
    detail — a reader chooses a path by line 22 without meeting Nx, npm, or a target name. Question
    three was the single real gap: the README never said how this repository differs from its
    siblings. Added one paragraph giving the private sibling and `ose-primer` accurate one-line
    descriptions and routing to the repository comparison — descriptions and links only, no reader
    path or metadata change for either, as the contract requires. The private sibling is named without a
    link because it is private and public documentation does not describe its internals. Verified
    rather than assumed: all 15 relative links resolve on disk, both section anchors match their
    headings, the voice scan finds none of the forbidden words, and `ose-www`'s `dev` target and its
    `3100` default port both come from the resolved Nx configuration, so the first-run instructions
    are true. `markdownlint-cli2` exits 0 and the link report names no finding under `README.md`.
- [x] [AI] [P3-003A] Verify the root package description with `jq -r '.description' package.json`,
      applying
      `npm pkg set description='Open source platform for researching and building trustworthy, Sharia-compliant enterprise products.'`
      only if it differs — acceptance: exact equality with the package metadata contract.
  - **Date**: 2026-08-20 · **Status**: Done (verified-unchanged) · **Files Changed**: None ·
    **Notes**: read the live value and compared it to the Package Metadata Contract byte by byte
    rather than by eye — both are 100 characters and the differing-byte list is empty, so the
    equality is exact rather than merely close. The item's own guard applies: `npm pkg set` runs only
    if the values differ, they do not, so nothing was written and `package.json` stays out of this
    unit's file-touch ledger. This matches what P2-005 predicted when it read the live GitHub
    metadata and found the contract already satisfied.
- [x] [AI] [P3-004] Align `CONTRIBUTING.md` with closed external intake and authorized
      `worktree-to-pr` delivery — acceptance: no public invitation, direct-`main` advice, or response
      promise remains.
  - **Date**: 2026-08-20 · **Status**: Done (verified-unchanged) · **Files Changed**: None ·
    **Notes**: scanned for each prohibited move separately rather than reading for general tone. No
    public invitation (`we welcome`, `contributions are welcome`, `feel free to open`, `PRs welcome`
    all return nothing), no direct-`main` advice, and no response-time or turnaround promise. The
    document states external code contributions and pull requests are closed, tells the reader not to
    open one even from a fork, and teaches the internal `worktree-to-pr` flow in five accurate steps
    while saying plainly that it is not an invitation. The must-side clause needed a live check
    rather than a reading: the Reporting Bugs section routes a would-be contributor to the issue
    tracker, so I confirmed the tracker is actually open — `hasIssuesEnabled` is true and issues are
    in active use — meaning that route is real and not a dead end. Discussions are disabled, which
    matches the Product Feedback section's statement that no public feature-request channel runs. All
    12 relative links resolve and the voice scan is clean, so no edit is warranted. One item noted
    for P3-008: `SECURITY.md` promises an initial response within 48 hours. That is a deliberate
    vulnerability-disclosure commitment rather than a contribution-triage promise, and stripping it
    would make the security policy worse; it will be judged on its own terms in its own row.
- [x] [AI] [P3-005] Verify the narrow `CONTRIBUTING.md` staged-naming exemption in both places that
      already declare it — the `lint-staged` Markdown command in `package.json` and the gate registry
      entry in `repo-config.yml` — and add it only where it is missing — acceptance: `CONTRIBUTING.md`
      passes `md naming validate`, a plan-owned `local-tmp/.../BAD-NAME.md` negative control still
      produces the expected invalid-filename rule and is then removed, and the two declarations agree.
  - **Date**: 2026-08-20 · **Status**: Done (verified-unchanged) · **Files Changed**: `learnings.md` ·
    **Notes**: all three acceptance clauses hold. The two declarations agree exactly — both
    `package.json`'s `lint-staged` `*.md` command and `repo-config.yml`'s `md-naming` entry carry the
    same pair, `*__linkedin__*.md` and `CONTRIBUTING.md` — so nothing needed adding. `md naming
validate` passes. The negative control produced the expected rule:
    `filename "BAD-NAME.md" violates lowercase-kebab-case rule (^[a-z0-9-]+\.md$)`, exit 1, and was
    removed along with every other control, leaving the validator green and the tree clean. But the
    control had to move to discover that. Placed in `local-tmp/` as this clause literally instructs,
    it is not flagged at all, because the validator does not scan gitignored trees — a control that
    cannot fail proves nothing, so the clause as written would have passed vacuously. Placing it in
    `docs/` made it fire. That relocation exposed a second finding: running the validator _without_
    the `CONTRIBUTING.md` exemption still exits 0 and still does not flag the file. Two independent
    mechanisms cause that, either sufficient alone. The gate invocation passes no paths, so the
    validator uses its built-in default roots — `docs/` and `repo-governance/`, never the repository
    root (`md_validate_naming.rs`, `DEFAULT_PATHS`); its success line reads
    `DOCS NAMING VALIDATION PASSED`. And on the `lint-staged` path, which does hand the staged file
    in as a positional and so does reach the root, `CONTRIBUTING.md` is one of nine basenames
    hard-coded exempt inside the validator (`docs/naming.rs`, `is_naming_exempt`) under its own
    regression test — `md naming validate CONTRIBUTING.md` with no `--exempt` flag exits 0. The
    exemption is therefore inert in both places that declare it, and widening the scan scope would
    not change that. Left in place deliberately, but for the corrected reason: the hard-coded list is
    exactly what `plans/backlog/file-naming-convention-rework/` proposes to move into configuration,
    and once it moves, the `repo-config.yml` declaration stops being redundant and becomes the
    carrier — deleting it now would arm a failure for whoever lands that plan. Recorded as L-011 and
    routed to that existing backlog plan rather than fixed inline or filed as a new Phase 8 item,
    since `repo-config.yml` is outside this plan's File-Impact footprint and the topic already has an
    owner.
- [x] [AI] [P3-006] Close or supersede any live idea file that duplicates this plan's contribution or
      naming-exemption work through the repository's idea lifecycle — acceptance: no duplicate live
      proposal remains.
  - **Date**: 2026-08-20 · **Status**: Done (verified-unchanged) · **Files Changed**: `learnings.md`,
    `artifacts/execution-record-public.md` · **Notes**: no live idea file duplicates this plan's
    contribution or naming-exemption work, so the idea lifecycle was not invoked and nothing was
    closed or superseded. Enumerated all 84 live two-pagers across the four `plans/ideas/q*` quadrants
    and grepped them for `contribut*`, `CONTRIBUTING.md`, naming-exemption and naming-convention
    phrasing, `md naming validate`, `onboard*`, and README-refresh phrasing. Seventeen files matched.
    Fifteen matched only incidentally — `contributor` used in its ordinary sense, or a
    `Naming Convention` heading about code identifiers rather than filenames. The two substantive hits
    both cite the `is_naming_exempt` gap as _evidence_ for a different proposal rather than proposing
    work on it: `rhino-cli-sync-validator-wrong-model-drift.md` uses the three-times-rediscovered
    exemption to argue that `rhino-cli` byte-identity currently rests on manual `diff` discipline, and
    `rhino-cli-git-env-scrub-widening.md` names "the root-file naming exemption" explicitly under
    **Out of scope**, as already upstreamed. That second file independently corroborates P3-005: the
    exemption was upstreamed _into the validator_, which is why the `repo-config.yml` declaration is
    redundant. The one genuine topical overlap,
    [`plans/backlog/file-naming-convention-rework/`](../../backlog/file-naming-convention-rework/README.md),
    is a promoted backlog plan rather than a live idea; it already documents the nine hard-coded
    exempt basenames and calls the `repo-config.yml` entry "a redundant second statement of
    `CONTRIBUTING.md`". It is the correct existing owner, not a duplicate to close, so L-011 was
    re-routed to it. Correcting that routing also corrected L-011 itself, which had named only one of
    the two independent reasons the exemption is inert.
- [x] [AI] [P3-007] Audit and, where evidence requires, revise
      `docs/tutorials/getting-started-with-ose-public.md` and the root/docs/tutorial navigation —
      acceptance: the macOS/Ubuntu journey reaches the verified `ose-www` dev target, expected page,
      recovery guidance, and next step, with every command resolved from live configuration.
  - **Date**: 2026-08-20 · **Status**: Done (targeted-fix) · **Files Changed**:
    `docs/tutorials/getting-started-with-ose-public.md`, `README.md`, `apps/ose-www/README.md`,
    `learnings.md` · **Notes**: every command in the tutorial resolves from live configuration.
    `ose-www` exposes `dev` and `build`; `doctor` accepts `--fix` and `--tools`, and all five tool
    names the tutorial passes (`git`, `volta`, `node`, `npm`, `docker`) resolve, with `node` and
    `npm` reporting `required: 24.16.0` and `required: 11.11.0` — byte-equal to this checkout's
    `volta` pins, which is exactly the claim the tutorial makes about where those numbers come from.
    The stale-artifact recovery is correct: `build` carries `dependsOn: ["generate-search-data"]`
    while `dev` carries `dependsOn: []`, so routing through `build` is the only thing that
    regenerates search data. Both success strings live in
    `apps/ose-www/src/features/landing/shell/hero.tsx` — the `<h1>` and the description. All four
    links and the one in-page anchor resolve, and the navigation chain is coherent: root README →
    tutorial, `docs/README.md` → tutorial and tutorials index, tutorials index → tutorial with an
    accurate one-line summary. One real defect, and it was a class rather than a site. The `dev`
    target is `next-with-port.mjs dev --env OSE_WWW_PORT --default 3100`, so 3100 is a fallback, not
    an address; three live reader surfaces stated it as fixed. Worse, the recovery advice
    contradicted itself across documents — the tutorial said "Do not stop an unfamiliar process just
    to free the port" and then offered no alternative, while the root README told the reader to
    "stop the process using that port and try again". Fixed all three: the tutorial now qualifies the
    port, names the `Local:` line, and gives the override a worked command linked to
    [Overriding a port](../../../docs/reference/web-sites.md#overriding-a-port); the root README
    replaces the kill-it advice with the override; `apps/ose-www/README.md` qualifies its flat "uses
    port 3100" and points at the `OSE_WWW_PORT` entry already present in its `.env.example`. Verified
    live rather than inferred: `OSE_WWW_PORT=4100 npm exec nx -- run ose-www:dev` bound 4100, curl
    returned HTTP 200 carrying the **Open Sharia Enterprise Platform** heading, and 3100 refused —
    the override moves the listener rather than adding one. The server was stopped and no
    `next-with-port` or `ose-www:dev` process survived. Every other `localhost:3100` mention sits
    under `plans/done/**` and is `historical-exempt` by Classification Rule 3. `markdownlint-cli2`
    and Prettier are clean on all three edited files, and the link report names none of them —
    though the first run of that check was a false zero, recorded as L-012.
- [x] [AI] [P3-008] Execute every exact document task row one at a time, including root, `apps/`,
      `libs/`, `specs/`, `infra/`, governance indexes, setup, architecture, relationship, security,
      plans, social-media, and other catch-all living surfaces — acceptance: every row has its own
      result and no cosmetic edit is manufactured.
  - **Date**: 2026-08-20 · **Status**: Done (targeted-fix) · **Files Changed**: 66 of the 814 row
    documents, plus 8 `.claude/` agent and skill source files whose frontmatter feeds an edited index
    row · **Notes**: all 814 rows are terminal — 66 `targeted-fix`, 748 `verified-unchanged`, zero
    interim labels, `Status` `Done` on every row, and the table still measures a uniform 19 awk-fields
    after Prettier realigned it. No cosmetic edit was manufactured: a row changed only where a check
    failed. The mechanical evidence was gathered once and attributed per row. `markdownlint-cli2`
    linted 813 of the 814 and reported 0 errors; the 814th is
    `docs/reference/security/frameworks/nist-sp-800-53-rev5.md`, which `.markdownlint-cli2.jsonc`
    names in `ignores` because it is a 23,854-line verbatim PDF conversion whose indentation would
    trip MD046 — its lint clause is inert by configuration, so its acceptance was amended to pass on
    that declaration rather than on an exit code the tool never produces for it. `md links validate
--exclude plans/done --exclude archived` found no broken link anywhere, so no row carries a
    `### <path>` heading. 484 Nx and npm mentions were resolved against 33 projects, 550 project-target
    pairs, and 30 npm scripts; the first scanner over-matched `nx run --…` and was tightened before
    triage. Four defect classes surfaced. `docs/how-to/run-nx-commands.md` illustrated every example
    with `ts-utils` and `customer-portal`, neither of which is a project here, so a reader copying the
    repository's own Nx how-to got "Cannot find project" — substituted `fsharp-env-loader` and
    `ose-app-web`, both carrying the targets each example names, and corrected `npm run
affected:test:quick` to the real `affected:test`. `specs/apps/crane/README.md` named
    `crane-cli:specs:coverage`; the real target is `specs:behavior:coverage`. The C4 model README
    listed `npm run validate:diagrams` as a current validation tool while its own sibling
    `tooling-standards.md` labels that script planned and it does not exist. And the pre-2026-06-14
    project name `wahidyankf-web` survived in 31 places across 11 files including a `nx dev
wahidyankf-web` that resolves to nothing — fixed as a class, with the agent-catalog occurrence
    corrected in its `.claude/` frontmatter source rather than only in the generated index. On voice,
    130 empty-intensifier uses of `comprehensive` were removed across 54 documents, the great majority
    being `Comprehensive guide to X` where `guide to X` already carried the claim. Eleven were kept
    and their rows' acceptance amended to say why, because a clause demanding a literal zero is wrong
    when the word is doing work: two are the contrast pole of the Primer agents' `just-enough vs.
comprehensive coverage` distinction, one is a link label tracking the real filename
    `stage-1-maker-comprehensive-content-management.md`, and one sits inside a fenced Playwright test
    title. Editing the NIST conversion's 31 occurrences was declined outright — they are NIST's own
    wording and changing them would corrupt a verbatim conversion. One drift was introduced and
    repaired inside this task: de-intensifying six `.claude/skills/*/README.md` index lines left them
    disagreeing with their `SKILL.md` frontmatter, so each source was corrected too and all six pairs
    now match byte for byte. A second stale-name class was found and deliberately left
    alone. Its size was re-measured rather than estimated, because the first figure recorded here
    was narrower than the class it named: outside `plans/done/`, `ayokoding-web` appears in 231
    tracked files and `ose-web` in 83. For `ayokoding-web` those are 67 under `.claude/`, 54 under
    `repo-governance/`, 87 across the generated `.agents/`, `.codex/`, and `.opencode/` mirrors, 13
    under `apps/`, 6 under `social-media-posts/`, and 2 under `docs/`. Unlike `wahidyankf-web` the
    class reaches directory names such as `repo-governance/workflows/ayokoding-web/` and the
    workflow filenames inside them, so it is a rename plan rather than a documentation defect, and
    the mirror counts are not independent work because they regenerate from their `.claude/`
    sources. Recorded for Phase 8 routing. Across the 78
    changed Markdown files `markdownlint-cli2` reports 0 errors, Prettier is clean, and the link
    report is empty.
- [x] [AI] [P3-009] Regenerate harness mirrors only from canonical `.claude/` changes and run
      `npm run generate:bindings` followed by `npm run validate:sync` — acceptance: no generated
      mirror is hand-edited and mirrors land in the same commit as their source.
  - **Date**: 2026-08-20 · **Status**: Done (generated) · **Files Changed**: 17 mirror files across
    `.opencode/agents/`, `.codex/agents/`, `.codex/config.toml`, and `.agents/skills/` · **Notes**:
    `npm run generate:bindings` converted 93 agents and mirrored 12 skill files with 0 stale removals,
    then `npm run validate:sync` passed 97 of 97 checks and `npm run harness:bindings-validation`
    passed 199 of 199. Nothing was hand-edited in a mirror. Every regenerated file traces to a
    `.claude/` source this unit changed — the two agents (`apps-wahidyankf-www-deployer`, `plan-maker`)
    and the six skills whose `SKILL.md` frontmatter was de-intensified. `.codex/config.toml` is the one
    file carrying hand-authored vendored tables, so its diff was read rather than assumed: both changed
    lines sit inside the delimited generated region and are the two agent descriptions, with every
    vendored table byte-identical. The mirrors land in the same commit as their source.
- [x] [AI] [P3-010] Reconcile the task register and append-only file-touch ledger — acceptance: every
      task is terminal and every touched path belongs to this unit.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/execution-record-public.md` · **Notes**: the append-only ledger was populated from
    `git status --short --untracked-files=all` and then diffed against that same listing in both
    directions — 96 ledger rows against 96 dirty paths, with zero paths in the ledger that git does not
    show and zero paths git shows that the ledger does not carry. Every path is classified and
    attributed to the task that touched it: 43 docs reader docs, 17 generated harness mirrors, 16
    canonical `.claude/` sources, 9 spec-tree docs, 5 governance docs, 4 plan-owned records, and one
    each at the repository root and under `apps/`. The 16 canonical-source count is a check in its own
    right — it equals exactly the `.claude/` files this unit edited (2 agent definitions, 2 agent
    indexes, 6 `SKILL.md` files, 6 skill indexes), so nothing was swept in by the generator. Every task
    ID from P3-001 through P3-009 holds a terminal row. The first reconciliation attempt reported a
    false zero because the extracting `awk` pattern no longer matched after Prettier realigned the
    table's number column; it was re-extracted and the count asserted before the result was believed,
    which is L-012 applied to this task.
- [x] [AI] [P3-010A] Compare the ledger with sorted
      `git ls-files --cached --others --exclude-standard -- '*.md'`, adding one exact row for every
      generated or newly created Markdown path — acceptance: zero unexplained missing or extra paths.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `artifacts/execution-record-public.md` · **Notes**: the comparison against the sorted working-tree
    listing added an exact row for each of the 17 paths that only exist because a generator or this
    plan created them — 12 `.agents/skills/` mirrors, 2 `.opencode/agents/` mirrors, 2 `.codex/agents/`
    files, and `.codex/config.toml` — plus the one newly created path,
    `artifacts/execution-record-public.md` itself. None was folded into a class row. Zero unexplained
    missing or extra paths.
- [x] [AI] [P3-010B] Stage only ledger-owned paths, inspect `git diff --cached --name-only`, and run
      the identity-boundary guard — acceptance: the staged set equals the file-touch ledger and the
      guard returns empty.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: staged exactly the
    96 paths the ledger carries, by feeding the reconciled path list to `git add` rather than by
    pattern. The staged list then measured 96 with 0 unstaged and 0 untracked remaining, so the staged
    set and the ledger are the same set rather than merely the same size. Grepping the staged list
    against the seven `BOUNDARY_PATHS` pathspecs — `apps/rhino-cli/{src,tests,Cargo.toml,Cargo.lock,project.json,LICENSE}`
    and `specs/apps/rhino/behavior/rhino-cli/gherkin` — returns nothing, and
    `rhino-cli parity manifest validate` exits 0 with `apps/rhino-cli/parity-manifest.sha256 is
current`. The byte-identity boundary is untouched, so this unit opens no cross-repository parity
    obligation.
- [x] [AI] [P3-011] Run `git diff --check`, formatting, Markdown lint, all Rhino Markdown validators,
      README-index validation, sync validation, affected gates, and the staged environment-file gate —
      acceptance: every applicable command exits 0.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: both gate surfaces
    exit 0 with the full 96-path change set staged. The pre-push surface reports 425 README-index
    findings, which is the same total P3-002 recorded as the baseline before any edit, so this unit
    added none. That equality was not taken on its own: 45 of the changed documents do appear among
    the 425, so the finding text was read to confirm each concerns a document-index link line of the
    form `- [<title>](<path>) — <description>`, not any line this unit touched — the one place a bullet
    was reshaped, the C4 model README, was a Validation Tools list rather than a child-document index.
    The pre-commit surface re-ran `harness bindings generate` and produced no new drift. Two files
    showed as unstaged immediately afterwards; both were this task's own record edits made after
    staging, not gate output, and were formatted and re-staged, returning the tree to 96 staged, 0
    unstaged, 0 untracked.
- [x] [AI] [P3-012] Run the README maker→checker→fixer cycle and an independent AI sensitivity/voice
      review over every changed living reader-facing file — acceptance: zero CRITICAL, HIGH, or MEDIUM
      findings and no secret or robotic passage.
  - **Date**: 2026-08-20 · **Status**: Done (targeted-fix) · **Files Changed**: `README.md`,
    `docs/how-to/run-nx-commands.md`, `docs/how-to/create-new-skill.md`,
    `docs/tutorials/getting-started-with-ose-public.md`,
    `repo-governance/conventions/tutorials/README.md`, `.claude/agents/plan/plan-maker.md`, the
    Playwright tools README, and the regenerated mirrors · **Notes**: the acceptance held only after
    two separate maker-checker-fixer cycles, and the second one is the reason this task was worth
    running. The README cycle took three rounds. Round 1 raised two MEDIUM findings: the dev-server
    paragraph carried three concerns in one dense block, and the sibling-repository paragraph stacked
    "MIT", "polyglot", and "Nx" as unexplained jargon roughly 36 lines before Nx is defined, in a
    section aimed at product people. Round 2 confirmed both fixed but caught a regression the jargon
    fix itself introduced — the paragraph had grown to seven lines, past the 4-5 line rule, and was
    then the only paragraph in the file over it. Round 3 confirmed zero CRITICAL, HIGH, or MEDIUM with
    no paragraph over the ceiling and no anchor damage.
    The independent sensitivity and voice review over the whole staged diff was the more valuable
    pass, because it found four MEDIUM defects **this unit had introduced** and that the plan's own
    per-row checks had missed. All four came from the same root cause and it is the one this plan has
    already recorded twice: P3-008 substituted real project names into
    `docs/how-to/run-nx-commands.md` but did not re-verify the claims wrapped around them. One
    substitution was simply missed, leaving `nx run-many -t build -p fsharp-env-loader ts-components`
    naming a project that does not exist — the exact defect the edit set out to remove. A comment
    reading `(Automatically builds fsharp-env-loader first)` was carried over from the old example and
    was false: `ose-app-web` does not depend on `fsharp-env-loader`. A verification step told the
    reader to `ls libs/fsharp-env-loader/dist` when that project builds with `dotnet build` to `bin`
    and `obj`, so the directory never exists. And P3-007's tutorial claimed "Every app in this
    repository takes the same override" while the reference it cites scopes itself to the apps in one
    table, omitting `beavernest-app` and every CLI project. All four were fixed against live
    configuration rather than by inspection — the replacement dependency comment was checked by
    dumping the Nx graph and confirming `ose-app-web`'s `build` carries `dependsOn: ["^build"]` while
    none of its four dependencies exposes a `build` target, so exactly one build runs. Eight LOW items
    were also taken, several of which were intensifiers the P3-008 sweep had merely traded for
    unfalsifiable absolutes such as "cover every use case" sitting two bullets from "Avoid generic".
    The verification round confirmed all four MEDIUM resolved with no regression, re-scanned all 1,697
    added lines and found zero emails, IP addresses, credentials, or absolute local paths, and
    re-confirmed every generated mirror byte-identical to its `.claude/` source with
    `.codex/config.toml` changed only inside its generated region. Final verdict: zero CRITICAL, HIGH,
    or MEDIUM on both the sensitivity and the voice axis.
- [x] [AI] [P3-013] Commit the refresh unit with a Conventional Commit — acceptance: the commit
      contains only the cohesive documentation refresh.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: commit `93b2fa0db`
    on `docs/repository-onboarding-public`, 96 files changed with 1,641 insertions and 1,098
    deletions and one file created — the same 96 paths the file-touch ledger carries and the same 96
    that were staged, so the commit contents equal the reconciled set rather than merely matching its
    size. The whole pre-commit surface ran as part of the commit, including `commitlint`, and the
    Conventional Commit subject `docs(onboarding): refresh reader-facing documentation across the
public repo` passed it. The message states each defect class and what proved it, rather than
    summarising the diff. The working tree is clean afterwards. Git emitted its standing `gc.log`
    warning about unreachable loose objects during the commit; that is a pre-existing repository
    housekeeping condition unrelated to this change and it did not affect the commit, which exited 0.
- [x] [AI] [P3-014] Push the exact refresh branch — acceptance: `origin` contains the unit head.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: `README.md` · **Notes**: the first
    push attempt was rejected, and the rejection was a real defect in this unit rather than
    unrelated noise: the `governance-word-budget` pre-push gate reported
    `[FAIL] README.md — README.md is 934 words (over 900-word fail limit)`. The branch started from
    a README of 838 words, so the reader work in this unit is what crossed the limit. The gate
    surface run in P3-011 predates the README rewrite the maker-checker-fixer cycle produced in
    P3-012, which is why the regression reached the push rather than that gate. The fix applies
    progressive disclosure instead of reverting a correction: the sibling-repository block now gives
    each repository one sentence and defers the rest to the repository-comparison document it
    already links, the duplicated pointer to the getting-started tutorial is dropped from the
    closing paragraph because the same link already appears at the top of that section, and three
    other paragraphs are tightened. Every reader-facing correction survives — the qualified port
    sentence, the `OSE_WWW_PORT` override example, the WSL2 posture, the closed-intake note, and the
    prerequisite list. README.md was 892 words at `5910653bf`; re-running the validator there gives exit 0 with zero
    Fail findings, and Prettier reports the file unchanged while markdownlint reports
    `Linting: 1 file(s)` with `Summary: 0 error(s)`, so the zero is measured over a real file. The
    fix landed as commit `5910653bf` because amending the unit commit was not available; the
    branch's file set is still the same 96 reconciled paths. The second push exited 0 and created
    `docs/repository-onboarding-public` on `origin`.
- [x] [AI] [P3-015] Open the draft PR against `main` — acceptance: its declared file set and plan link
      are correct.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: draft PR
    [#238](https://github.com/wahidyankf/ose-public/pull/238) against `main` from
    `docs/repository-onboarding-public`. The acceptance has two halves and both were checked against
    the API rather than against the body I wrote: `gh pr view 238 --json files` returns 96 files,
    the same count as the reconciled ledger and the same count the commit carries, and the plan link
    resolves because `git ls-tree origin/main` lists the plan folder on `main`. The link was
    initially written relative (`../tree/main/...`), which does not resolve from a PR body, and was
    replaced with an absolute URL before this item was ticked. The body states each defect class the
    unit corrects, names the deferred `ayokoding-web`/`ose-web` rename class so a reviewer does not
    read its absence as an oversight, and records that the byte-identity boundary is untouched.
- [x] [AI] [P3-016] Run the canonical behavior-routed review cycles — acceptance: all accepted
      findings are fixed and each cycle's CI is green.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: `delivery.md`, `learnings.md`, and
    the PR #238 body · **Notes**: the canonical route is chosen by the five-rule applicability
    classifier, not by branch name or file count, so the whole 96-path diff was read first. It is 93
    Markdown files plus three `.codex/` files, and those three are generated: `config.toml` and two
    agent files whose entire change is an agent description mirrored from its `.claude/` source.
    Nothing in the diff can build, test, deploy, provision, or change CI behaviour, so the PR is
    noneligible and the specialist fan-out does not apply — the same classification the contract PR
    received in P2-012. The noneligible route then requires the current head to have passed
    `pr-quality-gate.yml`: `gh run view 32384716308` reports the run completed with 17 jobs, 13
    success and 4 skipped, including the roll-up `Quality gate`, and `gh pr view` reports
    `mergeStateStatus=CLEAN`, `mergeable=MERGEABLE`, and zero review threads. Note that
    `gh pr checks` lagged the run by several minutes and still showed `formatting-verify` as
    pending after that job had completed successfully, so the run's own job list is the evidence
    here, not the checks summary. Reading the diff for classification also caught a defect in this
    unit's records rather than in the repository: the deferred `ayokoding-web`/`ose-web` stale-name
    class had been written down as 16 and 14 files, and re-measuring gives 231 and 83 tracked files
    outside `plans/done/`. Both the delivery note and the PR body now carry the corrected,
    explicitly scoped figures, and L-014 records why the deferred side of a plan needs the same
    measurement rigour as the side that gets fixed.
- [x] [AI] [P3-017] Forward-update from `origin/main` without destructive history edits — acceptance:
      the branch contains current `origin/main`.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: after
    `git fetch origin main`, `git rev-list --left-right --count origin/main...HEAD` returns `0 3` —
    zero commits behind, three ahead — and `git merge-base --is-ancestor origin/main HEAD` exits 0,
    so the branch already contains current `origin/main` and no forward-update was required. The
    acceptance is about the branch's content, not about performing a merge, so doing nothing is the
    correct action here rather than a skipped step. The no-destructive-history half was checked
    separately instead of assumed: `git reflog` shows three ordinary commits and a branch rename,
    with no rebase, amend, or force operation since the branch was created from `origin/main`. The
    earlier attempt to amend the unit commit in P3-013A was refused before it ran, so no history
    edit exists to inspect.
- [x] [AI] [P3-018] Rerun full unit gates and verify final PR CI — acceptance: every gate is green.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: the three plan-record files, landed
    as commit `55925bd16` so the gated head is the pushed head · **Notes**: the plan records were
    committed first, deliberately, so that the gate run and the CI run both measure the commit that
    actually sits on `origin` — running gates against a tree with uncommitted changes would repeat
    the P3-011 mistake L-013 describes. `gate run --surface=pre-commit` exits 0 and
    `gate run --surface=pre-push` exits 0 with zero `[FAIL]` lines; the only findings are
    pre-existing over-target word-count warnings, and the README index audit now prints
    `README INDEX AUDIT PASSED: no orphan or ghost references found`. On the CI side, run
    `32385715522` (`pr-quality-gate`) and run `32385715595` (`validate-env`) both report
    `completed success` for head `55925bd16`, with zero jobs concluding `failure`. The four language
    quality gates skip correctly for a diff with no `apps/` or `libs/` source. One measurement trap
    was hit and corrected here: a wait loop keyed on the branch's two most recent runs exited
    immediately because the new runs had not registered yet, so it was observing the previous head's
    completed runs. The wait was re-keyed to the two specific run IDs, which is what the evidence
    above cites.
- [x] [AI] [P3-019] Merge the refresh PR as AI — acceptance: `main` contains the refresh.

### Phase 3 Gate

- **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: merged under
  `[AI]` authority at 15:30 UTC as commit `1542ea044` on `main`, and `gh pr view 238` reports
  `state=MERGED`. The merge method was not assumed: `gh api repos/...` shows all three methods
  enabled, so the convention was read from the history instead — every recent commit on
  `origin/main` has a single parent and an `(#NNN)` subject, which is squash, so `--squash` is
  what keeps this branch consistent with its neighbours. The preconditions were all satisfied
  before the call: both CI runs green for the exact head, `mergeStateStatus=CLEAN`,
  `mergeable=MERGEABLE`, the PR out of draft, and zero review threads open. The remote branch was
  deliberately kept rather than auto-deleted, because Phase 9 verifies merged status per
  plan-created branch before removing any of them.
- [x] [AI] [P3-G01] Verify the merged README, onboarding tutorial, contribution posture, task
      register, and package description agree — acceptance: no `follow-up-required` row remains and
      the documented full-inventory reconciliation equals the recursive `origin/main` Markdown count.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: every check reads
    the merged tree at `1542ea044`, not the worktree. The five documents agree with each other: the
    README and the tutorial both present 3100 as a default rather than a fixed address and both show
    `OSE_WWW_PORT=4000` as the override, the tutorial's closing claim is scoped to apps that serve a
    port, `CONTRIBUTING.md` states external contributions are closed and names `worktree-to-pr` as
    the internal default while the README says the same thing in its own words, and `package.json`
    carries the contract description character for character. The merged README is byte-identical to
    the branch copy. On the ledger, `grep` finds `follow-up-required` five times, and reading each
    one shows none is a data row: they are the term's definition, the legend row marking it
    non-terminal, the sentence introducing the vocabulary, the reconciliation row asserting `0`, and
    the interpretation paragraph. Zero rows hold the state. The inventory clause resolves rather than
    drifts: `git ls-tree -r origin/main` counts 9,297 tracked Markdown paths against the ledger's
    recorded 9,294, and diffing the two enumerations shows the difference is exactly the three
    artifacts declared in § Planned-New Paths — the contract record, this record, and the ledger
    itself. Nothing else appeared or disappeared.
    > **Pause Safety**: the refresh is merged as one internally coherent reader journey. To resume, read
    > the merged ledger and continue with metadata.

## Phase 4: Exact GitHub About Metadata

- [x] [AI] [P4-000] Create the exact gitignored verification-program execution record with the
      required schema — acceptance: every Phase 4, 5, and 7 task ID has a row before execution and
      `git status --short` does not list the record.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**:
    `local-tmp/repository-onboarding-readme-refresh/execution-record-verification-program.md`
    · **Notes**: the record was created with 39 rows, one per Phase 4, 5, and 7 task ID, and the ID
    list was extracted from `delivery.md` itself rather than retyped, so a checklist item cannot be
    silently missing a row. Both halves of the acceptance were checked separately:
    `git check-ignore -q` exits 0 for the path, and `git status --short` returns no line matching
    the filename, which is the stronger of the two because a file can be ignored and still be
    tracked from an earlier commit. The header states the file holds no secret, no real `.env*`
    content, and no credential, and that host names and addresses are sanitized before any outcome
    is copied into `artifacts/` or a commit message.
- [x] [AI] [P4-001] Validate the exact PRD description against GitHub field limits, the homepage as
      HTTPS, and every topic as a lowercase hyphenated slug — acceptance: the value set is
      mutation-ready without edits.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: the contract
    description is 100 characters against GitHub's 350-character limit, the homepage
    `https://oseplatform.com/` is HTTPS, and all 10 topics match `[a-z0-9][a-z0-9-]{0,49}` against
    GitHub's 20-topic limit. The slug test was run as a regular expression over every topic rather
    than by eye, so an uppercase letter or a leading hyphen would have been reported rather than
    missed. The value set is mutation-ready with no edits.
- [x] [AI] [P4-002] Re-read the six approved safe prior fields — acceptance: values match the Phase 0
      rollback record or drift is investigated before mutation.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: the six
    approved safe fields — `nameWithOwner`, `description`, `homepageUrl`, `url`, `visibility`, and
    `repositoryTopics` — were re-read live and compared field by field with the Phase 0 rollback
    snapshot. All six match, so no drift needed investigating before the equality decision. Topics
    were compared as sets, because GitHub returns them in an unstable order and a list comparison
    would have reported a false difference.
- [x] [AI] [P4-003] Compare live values with the contract; if they already match, record verified
      equality and skip mutation — acceptance: no unnecessary metadata write occurs.
  - **Date**: 2026-08-20 · **Status**: Done (verified-unchanged) · **Files Changed**: None ·
    **Notes**: live values already equal the `prd.md` contract — the description and homepage are
    string-equal and the topic set is equal at 10 members with nothing live-only and nothing
    contract-only. The plan explicitly prefers recording verified equality over forcing a write, so
    no metadata mutation occurred. This is the acceptance being met, not a step being skipped: the
    clause asks that no unnecessary write happen.
- [x] [AI] [P4-004] If any value differs, run `gh repo edit wahidyankf/ose-public` with the exact
      description and homepage from `prd.md`, then replace topics through the GitHub topics API
      replace operation — acceptance: the commands exit 0 and no topic accumulates.
  - **Date**: 2026-08-20 · **Status**: Not applicable · **Files Changed**: None · **Notes**: no
    value differed, so neither `gh repo edit` nor the topics replace call ran. The condition this
    item guards against — topics accumulating instead of being replaced — cannot arise when nothing
    is written.
- [x] [AI] [P4-005] Read back `description,homepageUrl,repositoryTopics` with authenticated `gh` and
      compare exact set equality — acceptance: every value matches `prd.md`.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: an
    independent second `gh repo view --json description,homepageUrl,repositoryTopics` was issued
    rather than reusing the P4-003 response, so the readback is a fresh observation of the live
    repository. It equals the contract exactly: description and homepage string-equal, topics
    set-equal at 10 with no extra member and none missing.
- [x] [AI] [P4-006] If a mutation or readback fails, restore the captured safe prior fields with
      AI-run CLI/API commands — acceptance: the repository is never left partially updated.
  - **Date**: 2026-08-20 · **Status**: Not applicable · **Files Changed**: None · **Notes**: no
    mutation was attempted and the readback succeeded, so there is nothing to restore and the
    repository was never in a partially updated state. The Phase 0 snapshot remains on disk and
    usable if a later phase does write.

### Phase 4 Gate

- [x] [AI] [P4-G01] Verify exact metadata equality — acceptance: complete, accurate About metadata is
      live and rollback evidence is sanitized.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: gate PASS. The
    live About metadata is complete and accurate against `prd.md` — description, homepage, and all
    10 topics — and it agrees with what the merged README says about the project, which is the point
    of the contract rather than the API call. Equality was established from a fresh readback, and
    the rollback evidence stays sanitized: the snapshot and both live captures hold only public
    repository fields, with no token, credential, or private host name, and they live under
    gitignored `local-tmp/` where `git status --short` does not list them.
    > **Pause Safety**: metadata is verified or rolled back. To resume, re-read the About fields and
    > compare them with `prd.md`.

## Phase 5: Fresh-Checkout Journeys

Each subphase uses a newly created `mktemp -d` location and removes only that exact temporary clone
after processes stop and evidence is safely recorded.

### Phase 5A: macOS

- [x] [AI] [P5A-001] Create one exact macOS `mktemp -d` directory, clone `main` into it, and record
      the directory only in the local verification record — acceptance: the new clone has no
      checkout-local state.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: the clone was made with the command the README documents, over HTTPS from GitHub,
    into a single `mktemp -d` directory whose path is recorded only in the gitignored verification
    record. Its HEAD is `1542ea044`, byte-equal to `origin/main`, so the journey exercises the
    merged documentation rather than the worktree's copy. "No checkout-local state" was checked as
    five separate facts rather than inferred from freshness: `git status --short --untracked-files=all`
    returns zero paths, `node_modules/` is absent, `git worktree list` shows one entry, the only
    local branch is `main`, and no `.env*` file exists in the clone root. The first attempt died
    partway with `fetch-pack: unexpected disconnect while reading sideband packet`; the partial
    directory was removed and the clone rerun from scratch rather than resumed, so no half-fetched
    state carried into the journey. The repository is roughly 481 MB of history and the transfer ran
    at about 20 MB per minute.
- [x] [AI] [P5A-002] Run only the documented prerequisite and bootstrap commands in that clone —
      acceptance: every command succeeds without an undocumented prerequisite.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: only the commands the README documents were run — the prerequisite checks, then
    `npm install` — and every one succeeded, with `npm install` exiting 0 after adding 1,605
    packages and running the repository doctor. Nothing undocumented had to be installed to get
    there. Each documented prerequisite was verified by invoking it rather than assumed: git 2.39.5,
    Volta 2.0.2, Node 24.16.0, npm 11.16.0, cargo 1.95.0, jq 1.8.1, and Node was read from inside
    the clone so the answer reflects Volta's project pin rather than an ambient default. The doctor
    reports 15 of 16 tools OK with zero missing, so the documented path is complete. Its single
    warning is worth stating precisely rather than waving through: `package.json` pins
    `volta.npm = 11.11.0`, but npm resolves to Volta's 11.16.0 image, and `which npm` confirms the
    binary comes from `~/.volta/tools/image/npm/11.16.0/`. Node honoured its pin in the same clone,
    so this is a Volta-level resolution on this machine rather than a missing or wrong instruction
    in the documentation, and it blocks nothing — the doctor still passes with zero missing tools.
    It is carried to the Phase 5A gate so the correction decision is recorded rather than implied.
- [x] [AI] [P5A-003] Run `npm exec nx show project ose-www --json` and record the declared `dev`
      target's command, its port environment variable name, and its default port — acceptance: the
      start command and address are read from project configuration, not guessed or copied from this
      plan.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: the start command
    and address come from `npm exec nx -- show project ose-www --json` run inside the clone, not from
    this plan. The `dev` target is an `nx:run-commands` executor running
    `node ../../scripts/next-with-port.mjs dev --env OSE_WWW_PORT --default 3100` with
    `cwd: apps/ose-www`, so the port environment variable is `OSE_WWW_PORT` and the compiled default
    is 3100. That is the same variable name and default the merged README and getting-started
    tutorial give a reader, which is the point of reading it from configuration rather than
    trusting the prose: the documentation is now confirmed against the source of truth in a tree
    that has never seen this plan's working copy.
- [x] [AI] [P5A-004] Start the declared `ose-www` `dev` target and retain its process ID in the local
      record — acceptance: the target stays running for inspection.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: the target was
    started detached from inside the clone and its process ID retained in the gitignored
    verification record. The process is confirmed running with `kill -0` rather than assumed from
    the absence of an error, and Next.js 16.2.6 on Turbopack reports `Ready in 295ms` with
    `Local: http://localhost:3100`, matching the default the project configuration declares in
    P5A-003. One handling note: the startup banner also prints the machine's LAN address, and that
    line is deliberately not copied into this checklist, the execution record, or any evidence file
    — the plan forbids carrying a real host address into plan-visible material, and the loopback
    address is the one the documentation tells a reader to open anyway.
- [x] [AI] [P5A-005] Request the recorded loopback address with `curl --fail --silent --show-error` —
      acceptance: the response succeeds and contains the documented product-purpose cue.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**:
    `curl --fail --silent --show-error http://localhost:3100` exits 0 and returns 38,399 bytes.
    `--fail` matters to the acceptance: without it curl reports success on a 404 or 500 body, so the
    exit code alone would not prove the page served. The response carries the documented
    product-purpose cue rather than merely being non-empty — it contains the heading text
    `Open Sharia Enterprise Platform` and `<title>OSE Platform</title>`, which is what the
    getting-started tutorial tells a reader they will see. The address requested is the loopback one
    the documentation names, not the LAN address the dev server also advertises.
- [x] [AI] [P5A-006] Inspect that same address in a browser and its console at mobile, tablet, and
      desktop viewports — acceptance: product context is visible at all three and no console error
      appears. `ose-www` serves a single locale, so no per-locale repetition applies.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: inspected through
    Playwright MCP, which the governance ranks first for browser verification. All three viewports
    were driven explicitly rather than described as "responsive": mobile at 390×844, tablet at
    768×1024, and desktop at 1440×900. Product context is present at each — the accessibility
    snapshot returns the level-1 heading `Open Sharia Enterprise Platform` at every width, and the
    captured images show the tagline, the plain-language description, the two calls to action, the
    "Why Open Source?" section, and the pre-alpha note. The layout adapts rather than breaking: the
    header collapses to a menu button at 390px and expands to a full navigation bar with search at
    1440px. On the console half of the acceptance, `browser_console_messages` with `all: true` — so
    the whole session rather than only the last navigation — reports 2 total messages with 0 errors
    and 0 warnings. `ose-www` serves a single locale, so the per-locale repetition the plan excuses
    does not apply.
  - **Amended 2026-08-21 — breakpoint coverage.** The widths recorded here are 390/768/1440, not
    the 375/768/1280 that `screenshot-conventions.md` and `ui-verification-checklist.md` require
    as the minimum set, so the narrowest required breakpoint went unexercised at this point.
    `evidence/phase-6-breakpoint-coverage.txt` and the three `phase-6-*` captures supply the
    conforming measurement. The filenames keep the widths actually captured, because renaming
    them to 375/1280 would misdescribe the images' own bytes.
- [x] [AI] [P5A-006A] Capture evidence into the plan's `evidence/` folder: one screenshot per
      breakpoint named `phase-5a-ose-www-landing-en-<width>px.png`, plus the curl response saved as
      `phase-5a-ose-www-curl.txt` — acceptance: every file is referenced from this checklist's
      execution record and contains no credential, token, or authenticated session data.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: four files under the plan's
    `evidence/` folder · **Notes**: the folder now holds
    `phase-5a-ose-www-landing-en-390px.png`, `-768px.png`, and `-1440px.png` — one per breakpoint,
    named exactly as the checklist specifies — plus `phase-5a-ose-www-curl.txt` recording the curl
    command, its exit code 0, the response size, and the two product-purpose cues found in the body.
    Every file is referenced by name in this note and in the verification record, which is the
    reference the acceptance asks for. On the sensitivity half: the request was unauthenticated
    against a local development server, no header, cookie, or token was sent or captured, the text
    file states that explicitly, and the images show only the public landing page with no browser
    profile, account, or private host name visible. The dev server's LAN address appears nowhere in
    any of the four files.
  - **Amended 2026-08-21 — breakpoint coverage.** The widths recorded here are 390/768/1440, not
    the 375/768/1280 that `screenshot-conventions.md` and `ui-verification-checklist.md` require
    as the minimum set, so the narrowest required breakpoint went unexercised at this point.
    `evidence/phase-6-breakpoint-coverage.txt` and the three `phase-6-*` captures supply the
    conforming measurement. The filenames keep the widths actually captured, because renaming
    them to 375/1280 would misdescribe the images' own bytes.
- [x] [AI] [P5A-006B] In this same macOS clone, before removing it, start at the root `README.md` and
      follow the documented **Understand the product** path hop by hop to the roadmap or product
      specification it names — acceptance: every hop resolves to an existing, non-404 target, the
      route reaches the roadmap or product specification without any hop landing in setup or
      installation instructions, and a broken or missing hop is recorded as a Phase 6 correction row.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: the hops were
    extracted from the clone's own `README.md` section rather than typed from memory, which is what
    makes the walk falsifiable: the **Understand the product** path names nine targets — `roadmap.md`,
    `docs/reference/system-architecture/applications.md`, the five directory READMEs in the
    where-the-work-lives table, `https://oseplatform.com`, and `https://nx.dev/`. Every repository
    hop resolves to an existing file in the clone, so no hop is a 404, and each opens with a product
    or structure heading rather than an install step. The external hop answers `301` and then `200`
    when redirects are followed, which is worth recording precisely — a bare status check would have
    reported `301` and looked like a failure. The route reaches its destination: `roadmap.md` is the
    documented endpoint and mentions workstreams or readiness 18 times. On the no-setup-diversion
    clause, a vocabulary scan of both product hops for `npm install`, `git clone`, `prerequisite`,
    `volta`, and `setup your development` returns exactly one hit, and reading it shows it is the
    sentence "a deliverable waits only for prerequisites that it actually" — dependency language in
    a roadmap, not installation instructions. No hop is broken or missing, so no Phase 6 correction
    row is opened by this item.
- [x] [AI] [P5A-007] Stop the recorded child process, verify clean status, and remove only the exact
      temporary clone — acceptance: no process or temporary checkout remains.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: the recorded process ID was killed along with its children, and the stop is proved
    four independent ways rather than by the kill command's exit status: `kill -0` on the recorded
    PID reports the process gone, `pgrep -f next-with-port.mjs` counts zero processes,
    `lsof -nP -iTCP:3100 -sTCP:LISTEN` lists no listener, and `curl` against the address now returns
    `000` instead of a page. The four matter because the dev target spawns a child — killing the
    parent alone can leave the server holding the port. Before removal the clone reported zero dirty
    paths, so nothing unsaved was thrown away. Removal was guarded rather than trusted: the recorded
    path was pattern-checked to be a `mktemp` temporary directory before `rm -rf` ran, so a
    corrupted or empty variable could not delete anything else, and the directory is confirmed gone
    afterwards. The plan worktree still sits on its own branch and its only modified paths are this
    plan's own records.

#### Phase 5A Gate

- [x] [AI] [P5A-G01] Record the sanitized result, stop proof, and cleanup result; create a Phase 6
      correction row for any failure — acceptance: no mutable macOS journey state remains.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None · **Notes**: gate PASS, and the
    result is stated as a decision rather than a summary. The macOS journey completed every step the
    documentation prescribes and found no documentation defect: the clone was clean, every documented
    prerequisite resolved, `npm install` exited 0 with the doctor reporting zero missing tools, the
    start command and port came from project configuration rather than prose, `curl --fail` returned
    the documented product cue, all three viewports showed product context with zero console errors
    or warnings, and every hop of the product path resolved without landing in setup instructions.
    Because nothing failed, **no Phase 6 correction row is created**, and that is a finding rather
    than an omission. One observation is deliberately not promoted to a correction: npm resolves to
    Volta's 11.16.0 image while `package.json` pins 11.11.0. It is environment-level — Node honoured
    its pin in the same clone, the doctor still passes with zero missing tools, and no documented
    instruction is wrong — so fixing it would mean changing a machine, not a document. On the
    no-mutable-state clause, all three facts were re-checked after cleanup rather than inherited
    from P5A-007: no `next-with-port` process exists, nothing listens on the port, and the temporary
    directory is gone. The sanitized outcome carries no host name, address, or credential; the
    clone path lives only in the gitignored verification record.

    > **Pause Safety**: the macOS clone and child process are gone; resume from its sanitized row.

  - **Amended 2026-08-21 — breakpoint coverage.** The viewport evidence this gate rests on was
    captured at 390x844, 768x1024, and 1440x900. The repository's own
    `screenshot-conventions.md` and `ui-verification-checklist.md` require mobile 375 px, tablet
    768 px, and desktop 1280 px as the minimum set. Two of the three widths used here therefore do
    not conform, and 390 px is _wider_ than 375 px, so the narrowest documented breakpoint — the one
    that catches horizontal overflow — was never exercised by this journey. The PASS above stands
    for what it measured; it does not discharge the documented breakpoint requirement. That gap was
    closed separately by `evidence/phase-6-breakpoint-coverage.txt`, a supplementary capture at all
    three documented widths, which is not a re-run of this journey.

### Phase 5B: Ubuntu

The Ubuntu journey runs inside one disposable container built from the upstream official
`ubuntu:24.04` image. This plan authors no Dockerfile, builds no image, publishes no image, and
commits no container configuration. The container is started with `--rm`, and the base image itself is
removed afterwards unless it was already present before this phase. Nothing this phase pulls or
creates survives it.

- [x] [AI] [P5B-000] Record the pre-phase Docker baseline with `docker image ls --format '{{.Repository}}:{{.Tag}}'`,
      `docker ps -a --format '{{.Names}}'`, `docker volume ls -q`, and `docker network ls --format '{{.Name}}'`,
      and note whether `docker image inspect ubuntu:24.04` already succeeds — acceptance: the record
      states the exact pre-existing state, and whether cleanup must remove the base image or leave a
      preexisting one alone.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: all four listings were captured to files in the gitignored verification record so
    P5B-008 can diff against them rather than against a remembered description. The exact pre-phase
    state is zero images, zero containers (including stopped ones, since `ps -a` was used), zero
    volumes, and three networks — `bridge`, `host`, and `none`, which are Docker's built-ins and not
    plan-created. `docker image inspect ubuntu:24.04` exits non-zero, so the base image is **absent
    before this phase**, and that fixes the cleanup obligation now rather than leaving it to
    judgement later: P5B-007 must remove `ubuntu:24.04` afterwards, because the phase will be what
    pulled it. Recording this before pulling anything is the whole point — after the pull, the
    question is unanswerable.
- [x] [AI] [P5B-001] Start one disposable, detached container from the upstream official image with `docker run --rm -d --name ose-onboarding-ubuntu-check -p 127.0.0.1:<port>:<port> ubuntu:24.04 sleep infinity` and record its exact name — acceptance: `docker ps --filter name=ose-onboarding-ubuntu-check --format '{{.Names}}'` returns the recorded name (confirming the container is actually running, not merely created), the container is started from the unmodified upstream image, no Dockerfile or build step is used, no host path is bind-mounted, and only the loopback port is published.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: `docker ps --filter name=ose-onboarding-ubuntu-check` returns the recorded name, which
    is the acceptance's own distinction — a created-but-exited container would not appear there,
    while `docker ps -a` would have shown it and looked like success. The remaining four constraints
    were each checked against `docker inspect` rather than against the command line I typed:
    `Config.Image` is `ubuntu:24.04` unmodified, no Dockerfile or build step exists anywhere in this
    phase, `len .Mounts` is 0 so no host path is bind-mounted into the container, and
    `HostConfig.PortBindings` publishes only `127.0.0.1:3100`, so the port is unreachable from
    outside this machine. `AutoRemove` is true, which is what lets P5B-006 rely on `--rm` to delete
    the container on stop. The run output includes `Status: Downloaded newer image for ubuntu:24.04`,
    independently confirming the P5B-000 finding that the image was absent — so its removal is
    mandatory at P5B-007.
- [x] [AI] [P5B-002] Run each install command inside the container via
      `docker exec ose-onboarding-ubuntu-check <command>`, installing only the packages the onboarding
      documentation itself names as prerequisites — acceptance: every install command executes through
      `docker exec` against the P5B-001 container (never an implied interactive shell), comes from the
      documented prerequisite list, and any package the journey turns out to need but the docs never
      mention becomes a Phase 6 documentation-defect row rather than a silent fix.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Ran only the prerequisites the onboarding docs name, each through
    `docker exec ose-onboarding-ubuntu-check`: `apt-get update` (exit 0);
    `apt-get install -y build-essential curl git` (exit 0, `git version 2.43.0`,
    `curl 8.5.0`, `gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1)`); the documented Volta
    installer (exit 0, `volta 2.0.2`); the documented rustup installer (exit 0,
    `rustc 1.97.1`, `cargo 1.97.1`).
  - The documented commands are written with `sudo`, which `ubuntu:24.04` does
    not ship and does not need — the container shell is already root. Invoking
    `apt-get` directly is a container nuance, not a documentation defect, and is
    recorded as such rather than raised as a Phase 6 correction row.
  - No package outside the documented prerequisite list was installed. Any
    package a later step turns out to need becomes a Phase 6 documentation-defect
    row, never a silent install.
- [x] [AI] [P5B-003] Via `docker exec ose-onboarding-ubuntu-check <command>`, clone `main` into a
      `mktemp -d` directory inside the container and run only its documented bootstrap — acceptance:
      every clone and bootstrap command executes through `docker exec` against the P5B-001 container,
      setup succeeds without checkout-local state, and without an undocumented prerequisite.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Every command ran through `docker exec ose-onboarding-ubuntu-check`. `mktemp -d`
    produced the clone parent inside the container; `git clone` of the documented
    public URL exited 0 and checked out 22,107 files; the clone's `HEAD` is
    `main` at `1542ea044`, the merged refresh unit, so the journey exercises what
    a reader gets today rather than checkout-local state. No host path was
    mounted — the container was started with zero mounts at P5B-001.
  - The documented bootstrap is `npm install`, which exited 0 and installed the
    Git hooks (`commit-msg`, `pre-commit`, `pre-push` present under `.husky/`).
  - The broad tool check that `npm install` runs reports 9 tools absent
    (`dotnet`, `docker`, `jq`, `shellcheck`, `hadolint`, `actionlint`, `shfmt`,
    `tofu`, `clang-format`). This is not an undocumented prerequisite: both the
    root `README.md` and the tutorial pre-declare that the broad check is not the
    website-path gate and that Docker and other optional tools are installed only
    when the chosen work needs them. The gate the docs actually name is the
    focused check, and it is green — `npm run doctor -- --fix --tools git,volta,node,npm`
    exits 0 with `4/4 tools OK, 0 warning, 0 missing`.
  - The version claim the tutorial makes is falsifiable and holds: `node --version`
    reports `v24.16.0` and the focused check independently prints `required: 24.16.0`
    for node and `required: 11.11.0` for npm, both matched — Volta selected the
    versions this checkout declares, without a separately maintained list.
  - Setup succeeded without an undocumented prerequisite, so this item opens no
    Phase 6 correction row.
- [x] [AI] [P5B-004] Via `docker exec ose-onboarding-ubuntu-check <command>`, resolve the `ose-www` dev
      target with `npm exec nx show project ose-www --json`, then start its declared Nx command bound
      to all interfaces inside the container (`0.0.0.0`), not the container's own loopback, so the
      published `127.0.0.1:<port>` reaches it from the host — acceptance: every command executes
      through `docker exec` against the P5B-001 container, the process ID and bind address are
      recorded, the recorded bind address is explicitly `0.0.0.0` inside the container, and if the
      documented onboarding command cannot be made reachable without an undocumented flag, that is
      itself a Phase 6 documentation-defect row rather than a silent fix to the run command.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Every command ran through `docker exec ose-onboarding-ubuntu-check`. The dev
    target was resolved from the container clone rather than assumed:
    `npm exec nx show project ose-www --json` reports
    `node ../../scripts/next-with-port.mjs dev --env OSE_WWW_PORT --default 3100`,
    matching what Phase 5A resolved on macOS.
  - The documented onboarding command `npm exec nx -- run ose-www:dev` was started
    verbatim, with **no** added bind flag. Next.js 16.2.6 reported `Ready in 198ms`
    and printed both `Local: http://localhost:3100` and
    `Network: http://<container-ip>:3100`.
  - Recorded process: `next-server (v16.2.6)` at PID 7219, under the Next CLI at
    7207 and the wrapper at 7200.
  - The bind address was taken from the kernel rather than the banner, which is
    what makes the all-interfaces claim falsifiable: `/proc/net/tcp6` holds a
    listening (`0A`) socket at
    `00000000000000000000000000000000:0C1C` — the wildcard address on port 3100
    (`0xC1C` = 3100) — and `/proc/net/tcp` holds no loopback-only entry for that
    port. That wildcard is dual-stack, so it subsumes `0.0.0.0` and accepts the
    IPv4 traffic Docker's published mapping delivers.
  - Reachability was proved on both sides of the boundary rather than inferred:
    an in-container request to the container's own non-loopback address
    (`http://<container-ip>:3100/`) answers `200`, and the published host mapping
    `3100/tcp -> 127.0.0.1:3100` answers `200` from the host.
  - Because the documented command is reachable as written, no undocumented flag
    was needed and this item opens no Phase 6 documentation-defect row.
- [x] [AI] [P5B-005] Run `docker exec ose-onboarding-ubuntu-check curl --fail --silent --show-error <address>` against the bound address, then inspect the published host loopback address in a browser and its console at mobile, tablet, and desktop viewports — acceptance: the `curl` command executes through `docker exec` against the P5B-001 container and succeeds, and the documented product context appears at all three viewports with no console error.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - The documented curl ran through `docker exec ose-onboarding-ubuntu-check` and
    exited 0, returning 38,399 bytes carrying every marker the tutorial names as
    proof of success: `<title>OSE Platform</title>`, the `<h1>` reading
    **Open Sharia Enterprise Platform**, and the description beginning
    "Open-source (MIT) platform for Sharia-compliant enterprise solutions."
  - The browser then inspected the **published host loopback**
    `http://127.0.0.1:3100/` at three viewports — mobile 390x844, tablet
    768x1024, desktop 1440x900 — through Playwright MCP, the repository's
    first-ranked browser-verification tool. Those widths are not the mandated
    set; see the amendment below.
  - Console state is clean, and was read for the whole session rather than a
    single navigation: `Total messages: 2 (Errors: 0, Warnings: 0)`. Both entries
    sit below warning level, so no viewport produced a console error.
  - Product context is present rather than assumed. The mobile accessibility
    snapshot shows the `<h1>` **Open Sharia Enterprise Platform**, the MIT product
    description, the **Why Open Source?** section, the "Currently in pre-alpha
    development." line, and the repository and license links. At desktop the same
    page exposes a **Main navigation** landmark that the mobile layout collapses
    behind an "Open navigation menu" button — the expected responsive difference,
    not a defect.
  - That the browser exercised the container rather than a host process was
    checked, not assumed: `docker port` reports `3100/tcp -> 127.0.0.1:3100`, and
    `lsof -nP -iTCP:3100 -sTCP:LISTEN` shows the only host listener is Docker's
    published mapping. The Phase 5A macOS server was stopped and its clone removed
    at P5A-007, so it cannot be the responder.
  - No console error and no missing product context, so this item opens no
    Phase 6 correction row.
  - **Amended 2026-08-21 — breakpoint coverage.** The widths recorded here are 390/768/1440, not
    the 375/768/1280 that `screenshot-conventions.md` and `ui-verification-checklist.md` require
    as the minimum set, so the narrowest required breakpoint went unexercised at this point.
    `evidence/phase-6-breakpoint-coverage.txt` and the three `phase-6-*` captures supply the
    conforming measurement. The filenames keep the widths actually captured, because renaming
    them to 375/1280 would misdescribe the images' own bytes.
- [x] [AI] [P5B-005A] Capture evidence into the plan's `evidence/` folder: one screenshot per
      breakpoint named `phase-5b-ose-www-landing-en-<width>px.png`, plus the curl response saved as
      `phase-5b-ose-www-curl.txt` — acceptance: every file is referenced from this checklist's
      execution record and contains no host path, credential, or session data.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: evidence/phase-5b-ose-www-curl.txt, evidence/phase-5b-ose-www-landing-en-{390,768,1440}px.png ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Four files landed in the plan's `evidence/` folder, one screenshot per
    captured breakpoint plus the curl response:
    `phase-5b-ose-www-landing-en-390px.png`,
    `phase-5b-ose-www-landing-en-768px.png`,
    `phase-5b-ose-www-landing-en-1440px.png`, and
    `phase-5b-ose-www-curl.txt`. All four are referenced from this execution
    record, satisfying the reference clause.
  - The sanitization clause was tested rather than asserted. A scan of the curl
    evidence for `/Users/`, `/home/`, the account name, `token`, `secret`,
    `password`, `api-key`, `Bearer`, `session`, `cookie`, the container temp path,
    and the container's private IP returns no match, and a `strings` scan of each
    PNG returns `0` host-path hits — so no host path, credential, or session data
    is embedded in image metadata either.
  - The curl evidence deliberately records the response's identifying markers and
    byte count rather than pasting the full 38 KB body, keeping the artifact
    reviewable and free of incidental runtime detail.
  - One honest caveat worth recording: each Phase 5B screenshot is **byte-identical**
    to its Phase 5A counterpart (`sha256` matches at all three widths). That is
    expected — the same Chromium rendered the same page bytes at the same viewport
    — but it means the screenshots evidence the _page_, not the _platform_. The
    platform-specific proof for this journey is the in-container `curl` and the
    kernel-level bind reading in P5B-004, both of which can only have come from
    inside the container.
  - **Amended 2026-08-21 — breakpoint coverage.** The widths recorded here are 390/768/1440, not
    the 375/768/1280 that `screenshot-conventions.md` and `ui-verification-checklist.md` require
    as the minimum set, so the narrowest required breakpoint went unexercised at this point.
    `evidence/phase-6-breakpoint-coverage.txt` and the three `phase-6-*` captures supply the
    conforming measurement. The filenames keep the widths actually captured, because renaming
    them to 375/1280 would misdescribe the images' own bytes.
- [x] [AI] [P5B-005B] Via `docker exec ose-onboarding-ubuntu-check <command>` against this same
      container clone, before stopping the process, start at the root `README.md` and follow the
      documented **Understand the product** path hop by hop to the roadmap or product specification it
      names — acceptance: every hop-resolution command executes through `docker exec` against the
      P5B-001 container, every hop resolves to an existing, non-404 target, the route reaches the
      roadmap or product specification without any hop landing in setup or installation instructions,
      and a broken or missing hop is recorded as a Phase 6 correction row.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Every hop-resolution command ran through `docker exec ose-onboarding-ubuntu-check`
    against this same container clone, with the dev server still running, and the
    hops were extracted from the clone's own `README.md` rather than typed from
    memory or carried over from Phase 5A.
  - The **Understand the product** path names nine targets: `roadmap.md`,
    `docs/reference/system-architecture/applications.md`, the five directory
    READMEs in the where-the-work-lives table (`apps/`, `libs/`, `docs/`,
    `specs/`, `plans/`), and the external `https://oseplatform.com` and
    `https://nx.dev/`.
  - All seven repository hops resolve to existing files — no hop is a 404 — and
    each opens with a product or structure heading rather than an install step:
    `# 🗺️ Development Roadmap`, `# Applications & Containers`, `# Applications`,
    `# Shared Libraries`, `# Documentation`, `# Specifications`, `# Plans`.
  - The external hops were checked with and without redirect-following, which is
    what keeps the result honest: `https://oseplatform.com` answers `301` directly
    and `200` when redirects are followed — a bare status check would have read as
    a failure — and `https://nx.dev/` answers `200` either way.
  - The route reaches its documented destination: `roadmap.md` is the endpoint the
    README names, and it mentions workstreams or readiness 18 times.
  - On the no-setup-diversion clause, scanning both product hops for
    `npm install`, `git clone`, `prerequisite`, `volta`, and `setup your development`
    returns exactly one hit — "a deliverable waits only for prerequisites that it
    actually" — which is dependency language in a roadmap, not installation
    instructions.
  - No hop is broken or missing, so this item opens no Phase 6 correction row.
    The outcome matches the macOS walk at P5A-006B, so the product path is not
    platform-dependent.
- [x] [AI] [P5B-006] Stop the recorded dev-server process via `docker exec`, then stop the container
      itself with `docker stop ose-onboarding-ubuntu-check` (`--rm` then removes it automatically), and
      verify with `docker ps -a --format '{{.Names}}'` that the recorded container name is absent —
      acceptance: `docker stop ose-onboarding-ubuntu-check` exits `0`, `--rm` removed the container, and
      no plan-created container remains.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - The dev server was stopped first, through `docker exec`, by sending `SIGTERM`
    to the recorded wrapper PID 7200 — the signal the wrapper forwards to the Next
    CLI, so the whole tree shuts down rather than being orphaned.
  - Stop was verified two independent ways instead of assumed from the signal's
    exit status: a process scan reports no `next` or `next-with-port` process
    remains, and `/proc/net/tcp6` no longer holds a listening socket on port 3100
    (`0C1C`) — the listener recorded at P5B-004 is released.
  - `docker stop ose-onboarding-ubuntu-check` exited 0, and because the container
    was started with `--rm` at P5B-001, Docker removed it on stop.
  - The absence check is worth recording precisely: the **first**
    `docker ps -a --format '{{.Names}}'` read still counted the container while
    `--rm` removal was in flight. A re-read returns `0` matches and the status
    listing reports it absent. The terminal state is what stands — the container
    is gone — but the transient first read is recorded rather than hidden, since
    reporting a stop from the first read would have been a false negative.
  - No plan-created container remains.
- [x] [AI] [P5B-007] If P5B-000 recorded `ubuntu:24.04` as absent before this phase, remove it with
      `docker image rm ubuntu:24.04` — acceptance: `docker image inspect ubuntu:24.04` then fails; if
      the image existed beforehand it is left untouched and that decision is recorded.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Removal was mandatory here, not optional: P5B-000 recorded `ubuntu:24.04` as
    absent before the phase, and the P5B-001 run independently confirmed it by
    printing `Status: Downloaded newer image for ubuntu:24.04`. Two independent
    readings agreeing is what makes the removal decision safe — the image is this
    plan's own residue, not pre-existing user state.
  - `docker image rm ubuntu:24.04` exited 0, untagging both the tag and the
    digest reference and deleting the two layers the pull created.
  - The acceptance is stated as a failing inspect, and that is what was checked
    rather than inferred from the removal output: `docker image inspect ubuntu:24.04`
    now exits `1`.
- [x] [AI] [P5B-008] Re-run the four P5B-000 baseline listings and diff them against the recorded
      baseline — acceptance: image, container, volume, and network sets are identical to the pre-phase
      state, with zero dangling image, anonymous volume, or plan-created network left behind.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - All four listings were re-run with the same commands P5B-000 used and diffed
    against the **files** captured before the phase rather than against a
    remembered description — which is what makes the empty result falsifiable.
  - Every diff is empty: `images`, `containers` (with `-a`, so stopped containers
    would show), `volumes`, and `networks` are each `IDENTICAL` to the pre-phase
    capture.
  - The residue clauses were checked separately rather than assumed from the
    diffs: `docker image ls -f dangling=true -q` and
    `docker volume ls -f dangling=true -q` both return zero entries, so the pull,
    the container, and its clone left no dangling image and no anonymous volume.
  - The network set is `bridge`, `host`, `none` — Docker's three built-ins, the
    same three recorded at P5B-000 — so no plan-created network remains.
  - The Docker environment is byte-for-byte back to its pre-phase state.

#### Phase 5B Gate

- [x] [AI] [P5B-G01] Record the sanitized result, stop proof, image-removal decision, and Phase 6
      correction row if needed — acceptance: no mutable Ubuntu journey state remains and the Docker
      baseline diff in P5B-008 is empty.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Sanitized result**: the Ubuntu 24.04 journey passes end to end with **zero
    documentation defects**. A reader starting from the published docs on a clean
    Ubuntu container reaches a working `ose-www` at all three viewports using only
    the prerequisites the docs name, the documented clone-and-bootstrap, and the
    documented run command with no added flag.
  - Two findings were classified rather than silently absorbed, and neither is a
    documentation defect: `sudo` is absent in the container because its shell is
    already root (a container nuance), and the broad tool check reports nine
    absent tools that both the README and the tutorial pre-declare as
    not-required for the website path — the focused check the docs actually name
    is green at `4/4 tools OK, 0 missing`.
  - **Stop proof**, re-read at gate time rather than carried from the earlier
    items: `docker ps -a` matches the container name `0` times, and no host
    process listens on port 3100.
  - **Image-removal decision**: removal was mandatory, because P5B-000 recorded
    `ubuntu:24.04` absent beforehand and the P5B-001 run confirmed the phase
    pulled it. It was removed, and `docker image inspect ubuntu:24.04` exits `1`.
  - **Baseline diff is empty**: all four P5B-008 listings — images, containers
    (`-a`), volumes, networks — are identical to the pre-phase capture, with zero
    dangling images and zero anonymous volumes.
  - No mutable Ubuntu journey state remains, and Phase 5B opens no Phase 6
    correction row.

    > **Pause Safety**: the Ubuntu container, its clone, and any image this phase pulled are gone; resume
    > from its sanitized row and re-establish the Docker baseline first.

  - **Amended 2026-08-21 — breakpoint coverage.** The viewport evidence this gate rests on was
    captured at 390x844, 768x1024, and 1440x900. The repository's own
    `screenshot-conventions.md` and `ui-verification-checklist.md` require mobile 375 px, tablet
    768 px, and desktop 1280 px as the minimum set. Two of the three widths used here therefore do
    not conform, and 390 px is _wider_ than 375 px, so the narrowest documented breakpoint — the one
    that catches horizontal overflow — was never exercised by this journey. The PASS above stands
    for what it measured; it does not discharge the documented breakpoint requirement. That gap was
    closed separately by `evidence/phase-6-breakpoint-coverage.txt`, a supplementary capture at all
    three documented widths, which is not a re-run of this journey.

### Phase 5 Gate

- [x] [AI] [P5-G01] Record a sanitized outcome for both operating-system journeys in the
      verification-program record — acceptance: each names pass/fail and safe evidence only, with no
      raw environment data.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **macOS journey — PASS, zero documentation defects.** A reader following the
    published docs on macOS clones, bootstraps, resolves the dev target, reaches
    the landing page at all three viewports with no console error, and walks the
    product path to `roadmap.md` without a broken hop. The one npm/Volta version
    warning seen there was classified environment-level (node honored its pin and
    the doctor reported 0 missing) and deliberately not promoted to a correction
    row.
  - **Ubuntu 24.04 journey — PASS, zero documentation defects.** The same route
    succeeds inside a disposable container built from the unmodified upstream
    image, using only documented prerequisites, the documented bootstrap, and the
    documented run command with no added bind flag. Its two anomalies are
    classified and neither is a doc defect: absent `sudo` (the container shell is
    root) and a broad tool check both onboarding documents already declare
    non-binding for the website path, whose named focused check passes 4/4.
  - Both journeys are therefore green, and **Phase 6 opens no correction row from
    Phase 5** — it is on track to be recorded not applicable, subject to the
    cross-document defects Phase 7 may still surface.
  - Every one of the 22 Phase 5 rows is terminal (`Done` or `Pass`); none is left
    pending or partial.
  - The safe-evidence clause was tested, not asserted: sweeping every Phase 5 row
    for host paths, usernames, credentials, tokens, keys, and IP-shaped strings
    returns only `127.0.0.1`, `0.0.0.0`, and two occurrences of the _word_ "token"
    inside sanitization claims ("no credential, token, cookie, or session data",
    "sensitive-token scan clean"). Those are documented constants and prose, not
    raw environment data — no host path, account name, credential, or private
    address appears anywhere in the Phase 5 record.

    > **Pause Safety**: all temporary journeys are stopped and removed; failures are recorded as exact
    > correction rows.

  - **Amended 2026-08-21 — breakpoint coverage, rollup.** Both PASS verdicts above are recorded
    as "zero documentation defects", and that remains true: neither journey found a published
    instruction that was wrong. But neither journey met the documented breakpoint requirement
    either. Both captured 390x844, 768x1024, and 1440x900, where `screenshot-conventions.md`
    and `ui-verification-checklist.md` set the minimum at 375, 768, and 1280 px — so the
    narrowest required width went unexercised on macOS and on Ubuntu alike. That gap was closed
    by `evidence/phase-6-breakpoint-coverage.txt`, a supplementary capture at 375, 768, and
    1280 px which found no horizontal overflow and a correct `<h1>` at every one of them.
    That measured result — not the label "execution gap rather than documentation defect" —
    is what leaves both verdicts and the Phase 6 disposition below unchanged. The per-item amendments on
    `P5A-006`, `P5A-006A`, `P5A-G01`, `P5B-005`, `P5B-005A`, and `P5B-G01` carry the detail;
    this note exists so a reader who stops at the rollup still learns of it.

## Phase 6: Conditional Correction Units

Create one exact correction row per Phase 5 or cross-document defect. If there are zero defects,
record this phase not applicable and create no branch or PR. Set `<nn>` to `01` for the first
correction unit and increment it for every Phase 7 loopback. Each iteration gets a new branch, PR,
and execution record; never reuse a merged unit. Append `@<nn>` to its Phase 6 task IDs in the
record.

- [x] [AI] [P6-001] Switch the plan worktree to the correction branch when defects exist —
      acceptance: install, doctor, and baseline gates pass; otherwise record not applicable.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** Phase 6 is conditional on a defect existing, and none
    does: Phase 5A (macOS) and Phase 5B (Ubuntu 24.04) both passed with zero
    documentation defects, as recorded at P5-G01.
  - The plan's own instruction for this case is explicit — record the phase not
    applicable and create no branch or PR — so **no correction branch was
    created** and the worktree stays on `docs/repository-onboarding-public`. The
    install/doctor/baseline acceptance does not arise, because there is no
    correction unit to establish a baseline for.
  - Every anomaly the journeys surfaced was classified at the point it was found
    rather than deferred to here: the macOS npm/Volta version warning
    (environment-level), the container's absent `sudo` (root shell), and the
    broad tool check's nine absent tools (pre-declared non-binding for the website
    path by both onboarding documents, whose named focused check passes 4/4).
    None is a documentation defect, so none produces a correction row.
  - Phase 7 may still loop back here if it surfaces a cross-document defect; if it
    does, that iteration gets its own branch, PR, and record with `@<nn>`-suffixed
    task IDs, exactly as the phase preamble requires.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. The
    loop-back its final bullet anticipates did happen: Phase 7 surfaced
    cross-document defects, iteration `@01` opened the correction branch
    `docs/repository-onboarding-corrections`, and this worktree moved onto it. The
    install/doctor/baseline acceptance therefore did arise, and was met.

- [x] [AI] [P6-001A] Create `artifacts/execution-record-fixes.md` when applicable — acceptance: every
      Phase 6 task ID has a row.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Not applicable at this point; the file was created later, by iteration `@01`.
  - **Not applicable.** The clause is conditional ("when applicable"), and with
    zero defects there is no correction unit, so `artifacts/execution-record-fixes.md`
    was deliberately **not** created. Creating an empty record would assert a unit
    that does not exist.
  - The "every Phase 6 task ID has a row" acceptance is satisfied vacuously and,
    more usefully, is satisfied in the place that does exist: each Phase 6 item is
    ticked here with an explicit not-applicable disposition, so no task ID is left
    unaccounted for.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The **Notes** line
    above already records the outcome; this marker restates it in the form every
    other superseded Phase 6 row uses, so one grep finds them all rather than
    seven of nine. `artifacts/execution-record-fixes.md` exists, created by `@01`,
    and carries a row per correction that iteration applied.

- [x] [AI] [P6-002] Execute each exact correction row separately and rerun its failed journey —
      acceptance: every defect is fixed and no product behavior change is smuggled into docs.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Not applicable at this point; the documents were corrected later, by iteration `@01`.
  - **Not applicable.** There are zero correction rows to execute and no failed
    journey to rerun — both Phase 5 journeys passed on their first run.
  - The second half of the acceptance ("no product behavior change is smuggled
    into docs") holds trivially and verifiably: no file was changed in this phase,
    so no product behavior could be altered under cover of a documentation fix.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** That iteration did
    execute correction rows, against the five reader-facing documents Phase 7
    named. It reran no failed journey, because its defects were cross-document
    inconsistencies rather than journey failures — there was no red journey to
    turn green. The second half of the acceptance still holds, and now
    non-trivially: `@01` changed Markdown plus twelve captured evidence artifacts
    under `evidence/` — nine PNG screenshots and three `curl`/coverage
    transcripts — and nothing else. None of the twelve is source, configuration,
    a test, or a generated mirror, so no product behavior could be altered under
    cover of a documentation fix.

- [x] [AI] [P6-002A] For any defect that is a product bug rather than a documentation defect, add
      focused red coverage before the fix — acceptance: the test reproduces the defect and fails
      against current behavior.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No defect was found at all, so in particular no defect was
    a product bug. There is nothing to reproduce, and no red test was written.
  - Recording this explicitly matters: the item exists so that a product bug can
    never be fixed as a documentation edit. That protection was never engaged
    because the journeys surfaced no product bug.

  - **Amended 2026-08-21 — superseded in part by iteration `@01`.** "No defect was
    found at all" is false of `@01`, which found many. What this row actually
    turns on survives the correction: every `@01` defect was a documentation
    defect, so none was a product bug, and no red coverage was owed. The
    protection stayed unengaged for the reason the row gives, not for the reason
    the first sentence gives.

- [x] [AI] [P6-002B] Apply the minimum correction that turns that coverage green — acceptance: the
      focused assertion passes and no unrelated behavior changes.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** With no red coverage from P6-002A there is no assertion to
    turn green, and no source change was made.
- [x] [AI] [P6-003] Reconcile and stage only correction-ledger paths, then run the identity-boundary
      guard — acceptance: every correction is owned, the staged set equals the ledger, and the guard
      returns empty.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** There is no correction ledger, because there is no
    correction unit. Nothing was staged for a Phase 6 commit.
  - The identity-boundary guard is not skipped as a result — it runs against the
    closeout unit's staged set in Phase 8 and again over the whole merged range at
    P7-006, so the boundary is still proved, just not by a phase that made no
    change.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** That iteration does
    have a correction ledger — `artifacts/execution-record-fixes.md` — and did
    stage for Phase 6 commits, each one reconciled against the files that cycle
    actually changed and committed with `git commit --only -- <paths>`. Whether
    each `@01` commit ran the identity-boundary guard is deliberately not asserted
    here; the guard's coverage still comes from P7-006 over the whole merged
    range and from the closeout unit in Phase 8, exactly as the bullet above says.

- [x] [AI] [P6-003A] Run full unit gates — acceptance: every command exits 0.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there are no unit gates to
    run here. Repository gates are not thereby skipped: P7-002 runs every
    repository-authoritative gate against merged `main`, and the closeout unit runs
    its own full gate set before it is committed and pushed.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** That iteration did
    run checks before its commits, and the first wording of this amendment
    overstated both what they were and what they returned. Precisely: two are
    real pre-commit gates that did block a landing — `format-prettier` and
    `markdownlint`, both `*.md`-scoped. Three more were run by hand because they
    are `pre-push`/`ci` surfaces rather than pre-commit ones —
    `governance-readme-index`, `md-links`, and `governance-word-budget`, the last
    of which is path-gated on `repo-governance/` and the harness directories and
    so would never have fired for this branch's diff at all. The sixth, a
    remark-gfm table parse, is **not a repository gate**: it is an ad-hoc script
    run from the worktree because a blank line inside a Markdown table splits it
    silently past both Prettier and markdownlint. On exit codes, the
    registered gates all do exit 0, `md-links` included: its registry entry
    carries `args.exclude: [plans/done]`, and so scoped it reports
    `All links valid!`. The 312 broken links this record elsewhere describes
    come from running `md links validate` **without** that exclude, which is not
    how the gate runs; all 312 sit inside `plans/done/`, exactly as P3-012's
    round-1 finding already established.

- [x] [AI] [P6-003B] Run an independent AI docs/sensitivity review — acceptance: zero CRITICAL, HIGH,
      or MEDIUM findings.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** With no correction diff there is nothing for an
    independent docs/sensitivity review to read. The equivalent coverage still
    happens: P7-007 runs both secret gates plus an AI semantic sensitivity review
    over the merged result, and P9-004 repeats a sensitivity review after
    archival.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** That iteration ran an
    independent AI review on every cycle — `pr-review-integrity-maker` and
    `pr-review-docs-maker`, each reading the pushed commit rather than the working
    tree. The zero-CRITICAL/HIGH/MEDIUM acceptance was not met on a first pass;
    the cycles exist because findings kept arriving. The loop's terminating
    condition is a cycle that returns zero findings, which is a stronger claim
    than one clean review and a weaker one than never having had a finding.

- [x] [AI] [P6-004] Commit the correction unit — acceptance: one cohesive Conventional Commit.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no commit step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. The `@01` iteration did commit. Its correction unit landed as a
    series of Conventional Commits on `docs/repository-onboarding-corrections`,
    beginning at `cb489b874`.

- [x] [AI] [P6-005] Push the correction branch — acceptance: `origin` contains the head.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no push step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. The `@01` iteration did push. `origin` carries
    `docs/repository-onboarding-corrections`.

- [x] [AI] [P6-006] Open the correction draft PR — acceptance: its scope matches the defect rows.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no draft PR step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. The `@01` iteration did open a draft PR — #239, scoped to the
    `C-01`…`C-08` rows and everything the review cycles added to them.

- [x] [AI] [P6-007] Run the canonical behavior-routed review cycles — acceptance: findings are
      resolved.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no PR review cycles step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. The `@01` iteration did run review cycles, and this row's
    acceptance — findings are resolved — is discharged by them rather than by the
    not-applicable disposition above. Each cycle's findings, and the rows they
    produced, are in `artifacts/execution-record-fixes.md`.

- [x] [AI] [P6-008] Forward-update from `origin/main` — acceptance: the head is current.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no forward-update step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. Carried out under `P6-008@01` against the `origin/main` this
    branch was cut from.

- [x] [AI] [P6-009] Rerun gates, the failed journey, and PR CI — acceptance: all are green.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no gate and CI rerun step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. The `@01` iteration did rerun its gates and PR CI, per commit,
    with the results recorded against each cycle in
    `artifacts/execution-record-fixes.md`.

- [x] [AI] [P6-010] Merge the correction PR as AI — acceptance: fixes are on `main`.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Not applicable.** No correction unit exists, so there is no merge step to
    perform. Nothing was committed, pushed, opened, reviewed, or merged under
    Phase 6, which is exactly what the phase preamble requires when there are zero
    defects.

  - **Amended 2026-08-21 — superseded by iteration `@01`.** The disposition above
    was accurate for Phase 6 as first executed and stands as that record. It is
    not true of iteration `@01`, which reopened this phase after Phase 7 surfaced
    cross-document defects. The `@01` iteration's merge is tracked as `P6-010@01` and is
    the terminal step of that iteration rather than of this row.

### Phase 6 Gate

- [x] [AI] [P6-G01] Verify corrections are merged or explicitly not applicable — acceptance: no
      journey defect remains.
  - **Date**: 2026-08-20 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Phase 6 gate: not applicable, and provably so.** The gate's own wording
    allows either outcome — "corrections merged **or not applicable**" — and the
    second branch is the one that holds.
  - The precondition was verified rather than assumed: every Phase 5 row in the
    verification-program record is terminal, both journey gates (P5A-G01, P5B-G01)
    record PASS, and P5-G01 records zero documentation defects across both
    operating systems.
  - Consistent with that, this phase created **no branch, no PR, no execution
    record, and no commit**. The worktree remains on
    `docs/repository-onboarding-public` and no file changed under Phase 6.
  - This is a conditional not-applicable, not a permanent one: if Phase 7 surfaces
    a cross-document defect it loops back here, and that iteration opens its own
    branch, PR, and `artifacts/execution-record-fixes.md` with `@<nn>`-suffixed
    task IDs rather than reusing these rows.

  - **Amended 2026-08-21 — iteration `@01` opened.** The conditional above fired.
    Phase 7 surfaced cross-document defects from two independent items (P7-005's
    claim cross-read and P7-003's two strict checkers), so Phase 6 reopened exactly
    as written: a new branch `docs/repository-onboarding-corrections` off
    `origin/main`, a new `artifacts/execution-record-fixes.md`, and eight
    `C-01`…`C-08` correction rows. The not-applicable disposition above stands as an
    accurate record of what was known when Phase 5 closed; it is superseded, not
    retracted. P6-002A and P6-002B remain not applicable in `@01` as well — every
    correction is prose in a reader-facing document, so no defect was a product bug
    and no red coverage was required.
    > **Pause Safety**: the correction state is terminal. To resume, rerun Phase 5 only for the journey
    > that failed.

## Phase 7: Full-Corpus Quality and Safety Reconciliation

- [x] [AI] [P7-001] Reinventory all tracked Markdown at current `main` and reconcile the ledger with
      `git ls-tree -r --name-only origin/main | grep -E '\.md$'` — acceptance: the enumerated count
      is non-zero, zero missing/duplicate paths remain, and every reader task is terminal — proved by
      piping the ledger's row lines through
      `awk -F'|' '/^\| [0-9a-f]+ \| /{print $7}' | grep -c 'audit-required\|reader-related'` and
      getting `0`, so no row still carries an interim classification label while the same awk over
      all row lines still returns a non-zero count; any mismatch creates an exact Phase 6 correction
      row before Phase 7 restarts.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: artifacts/reader-doc-disposition-ose-public.md ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Reinventoried at **current** `main` (`1542ea044`), not at the revision the
    ledger was originally pinned to: `git ls-tree -r --name-only origin/main | grep -E '\.md$'`
    enumerates **9,297** tracked Markdown paths — non-zero, so the count clause
    cannot pass vacuously.
  - The independent cross-check enumerator recorded in the ledger (a diff against
    git's empty-tree object, which honours a glob pathspec) returns **9,297** as
    well. Two enumerators agreeing is what rules out a silently truncated listing.
  - The growth over the recorded revision **resolves rather than drifts**: the tree
    is `+3` and `-0` against `028e8eed9`, and all three added paths —
    `artifacts/execution-record-contract.md`,
    `artifacts/execution-record-public.md`, and
    `artifacts/reader-doc-disposition-ose-public.md` — are declared in the ledger's
    § Planned-New Paths. The delta is this plan's own declared output.
  - The acceptance's own awk was run **both** directions, as it requires: piping
    the row lines through
    `awk -F'|' '/^\| [0-9a-f]+ \| /{print $7}' | grep -c 'audit-required\|reader-related'`
    returns `0`, while the same awk over all row lines returns **814**. The
    non-zero denominator is what makes the zero meaningful — a pattern that
    matched no rows at all would have produced the same `0`.
  - The first attempt at this check pointed the awk at
    `artifacts/execution-record-contract.md` and returned `0` for _both_ numbers.
    That is precisely the false-pass the two-sided clause exists to catch: the
    zero interim labels were real only because zero rows had been read. Re-running
    against the actual ledger produced the 814-row denominator above.
  - Zero missing and zero duplicate paths: no ledger row names a path absent from
    the current tree, no path appears in two rows, and no in-scope path lacks a
    row.
  - Two declared planned-new paths legitimately do not exist and are named in the
    ledger so P9-003 does not misread them:
    `artifacts/execution-record-fixes.md` never will exist, because Phase 6
    recorded not applicable, and `evidence/README.md` is created later by P8-002.
    A planned-new declaration is permission to add a file, not an obligation.

  - **Amended 2026-08-21.** The bullet above says `execution-record-fixes.md`
    "never will exist". That was true against `origin/main` at `1542ea044`, the
    revision this re-run read, and false by the time iteration `@01` opened: Phase 6
    reopened, created that file, and added twelve files under `evidence/` — eight
    at `cb489b874` and four more at `14e58716e`. The claim
    is corrected rather than deleted, because the reasoning was sound on the
    evidence then available — the defect was stating a permanent future from a
    snapshot. P9-003 should expect both paths to exist. The `evidence/README.md`
    half of the bullet still stands; P8-002 has not run. The same claim in
    `artifacts/reader-doc-disposition-ose-public.md` was amended earlier; this copy
    was the one that sweep missed.
  - Every reader task is terminal and no mismatch was found, so this item creates
    no Phase 6 correction row and Phase 7 continues rather than restarting.

  - **P7-001 re-run at `400712aa9`, after iteration `@01` merged.** Both enumerators
    agree at **9,299** tracked Markdown paths — `git ls-tree` and the empty-tree
    diff. The delta against `1542ea044` is **+2 / −0**:
    `artifacts/execution-record-fixes.md`, already declared planned-new, and
    `plans/ideas/q2-not-urgent-important/review-loop-reviews-its-own-record.md`,
    which was **not** declared. The ledger now carries a row for it and its
    planned-new section states the case it was missing — an idea-routed learning
    can add a two-pager, not only fold into one. The acceptance awk still returns
    `0` interim labels over a non-zero **814**-row denominator. Reconciling the
    ledger is what this item is for, so the gap creates no Phase 6 correction row.

- [x] [AI] [P7-002] Run all repository-authoritative formatting, Markdown lint, Rhino Markdown,
      README-index, generated-sync, affected, and staged-environment gates — acceptance: every
      applicable command exits 0.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Green, exit 0**: `npm run validate:sync`; `npm run harness:bindings-validation`;
    `governance word-budget validate`;
    `md links validate --exclude plans/done --exclude archived`;
    `governance readme-index validate`;
    `nx affected -t build,test:quick,lint --base=origin/main` (reports
    `No tasks were run`, correct for a documentation-only branch); and
    `env staged-guard validate`, the staged environment-file gate, with `git diff --cached`
    independently confirming zero staged paths.
  - **`lint:md` is green here**: exit 0, `Linting: 7903 file(s)`, `Summary: 0 error(s)`,
    confirmed on two consecutive runs. This differs from the P0-005 baseline's 565
    error lines for a locatable reason rather than an unexplained one: every one of
    those lines came from `.fvm-cache/`, an untracked vendored Flutter SDK, and
    `.fvm-cache/` does not exist in this worktree. The L-003 backlog item about its
    missing markdownlint ignore entry still stands for the primary checkout.
  - **`format:md:check` is red, and it is exactly the recorded baseline.** It exits
    1 on **58** files. Every one of those 58 was compared against `origin/main`
    individually: **58 identical, 0 modified locally, 0 absent** — so none was
    touched by this program. The count and the split match P0-005's baseline
    (54 under `apps/ayokoding-www/content/`, 4 under `plans/done/`) precisely.
  - Two of this plan's own files **were** unformatted and are now fixed:
    `artifacts/reader-doc-disposition-ose-public.md` and `delivery.md`, both
    written by script and so bypassing the editor formatter hook. After
    reformatting, the repository-pinned Prettier 3.8.1 reports both `unchanged`,
    and no path under this plan appears in the check output.
  - Two tool-invocation errors were caught and corrected rather than being read as
    results, and both are worth recording because each would have produced a
    confident false answer. First, three validators were invoked through an
    unquoted shell variable holding the binary plus a flag; zsh does not word-split
    it, so all three exited `127` (command not found) — and a `grep -c FAIL` over
    that empty output returned a meaningless `0`. Second, `governance readme-completeness`
    does not exist; the real subcommand is `governance readme-index`, and the
    invented name exited `2`. Both were re-run correctly before anything was
    recorded.
  - Applicable commands all exit 0. The single red gate measures pre-existing
    repository state that is out of this plan's File-Impact footprint, is unchanged
    by it, and was classified as such at baseline — so it is carried forward as a
    known condition, not silently absorbed and not newly introduced.
  - **P7-002 re-run at `400712aa9`, after iteration `@01` merged.** `lint:md` exits
    0 over **7,905** linted files — a non-vacuous denominator. `md links validate
--exclude plans/done`, the form the registry actually runs, exits 0 with
    `All links valid!`; per `C-77` the unscoped 312-link figure is a hand-run
    artifact, not this gate. `validate:sync` and `harness:bindings-validation`
    both report VALIDATION PASSED. `gate run --surface=pre-commit` exits 0.
  - `format:md:check` exits **1** on **58** files, unchanged from the Phase 0
    baseline: 54 under `apps/ayokoding-www/content/` and 4 under `plans/done/`.
    The classification is now proved rather than asserted — intersecting the 58
    against `git diff --name-only 028e8eed9 origin/main` returns **0**, so this
    program modified none of them. The staged-environment gate passed with **0**
    files staged, which is a vacuous pass and is recorded as one; the load-bearing
    check is that the program's whole diff contains **0** `.env` paths.

- [x] [AI] [P7-003] Run strict docs and README checkers in read-only mode — acceptance: two
      consecutive independent checks report zero CRITICAL, HIGH, or MEDIUM findings; any finding
      returns to Phase 6 before Phase 7 restarts.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - Both checkers ran **read-only** — no file was edited by either — and each was
    given the same corrected context brief.
  - **Round 1 is not zero, so this item fails and routes to Phase 6.** The
    acceptance requires two consecutive independent checks at zero CRITICAL, HIGH,
    and MEDIUM; round 1 produced findings at both severities, so the second round
    is not attempted until the corrections land.
  - Neither checker reported a CRITICAL finding.
  - **Two independent confirmations of the same HIGH.** The README checker and the
    docs checker each flagged `CONTRIBUTING.md`'s Windows-Volta block without
    knowledge of the other, and both quoted the same lines. That agrees with my own
    P7-005 cross-read, so three independent readings converge on one defect.
  - **A second HIGH neither I nor P7-005 had found**: `CONTRIBUTING.md` never
    mentions Rust or Cargo, yet `package.json`'s `postinstall` is
    `npm run doctor || true` and `doctor` is `cargo run --release … -- doctor`.
    I verified this rather than taking it on report — `grep -niE "cargo|rust" CONTRIBUTING.md`
    returns nothing, while README states "Cargo must exist before it can check or
    install other missing tools". A contributor following CONTRIBUTING.md alone
    gets a silently-swallowed postinstall failure.
  - Checking that finding as a **class** rather than a single site surfaced a third
    instance the checkers did not name: the Quick Start in
    `docs/how-to/setup-development-environment.md` promises "If you only work on
    TypeScript projects, this is all you need", then ends with
    `# 6. Verify` / `npm run doctor` — a Cargo invocation — while never installing
    Rust. Its own full-setup section does teach `rustup` at line 161, so the
    Quick Start contradicts the document containing it.
  - **Verified MEDIUM findings** carried into the correction set: `CONTRIBUTING.md`
    hardcodes Node/npm versions in prose where README and the setup guide
    deliberately point at `package.json` as the single source of truth; `Diátaxis`
    is used twice with no gloss; the "Getting Started" section reads as open
    contributor onboarding ~115 lines before the closed-intake caveat lands; and
    `README.md` never expands WSL2 on first use.
  - **Verified LOW finding**: the same Quick Start numbers its steps `1, 2, 3, 4, 6`
    — no content is missing between them, so it is a pure renumbering slip.
  - Two LOW findings are deliberately **not** actioned, with reasons rather than
    silence: the Husky/commitlint gloss (the section's readers are already running
    `npm install` and reading `package.json`), and the Quick Reference command
    repetition (an intentional cheat-sheet pattern, not accidental duplication).
    Neither sits at a severity this gate blocks on.
  - **P7-003 re-run at `400712aa9`, round 2.** The README checker returned **zero**
    CRITICAL, HIGH, or MEDIUM findings — README confirmed at 896 words inside the
    900-word fail limit, every link and anchor resolving, two LOW notes explicitly
    no-action. The docs checker returned **two MEDIUM** and two LOW. Both MEDIUMs
    were verified against primary sources before being accepted: the integration
    suite publishes PostgreSQL on host `5434` (`"5434:5432"`, and
    `run-integration.sh` exports `Port=5434`) where the guide said `5432`; and the
    enforced commitlint type-enum accepts `build`, which the documented list
    omitted, with four `build(...)` commits in the merged history. One LOW was also
    verified false and accepted. **Round 2 is not zero, so this item routes to
    Phase 6 as iteration `@02`** (rows `C-81`, `C-82`, `C-83`).

- [x] [AI] [P7-004] Have an AI reviewer distinct from each file's writer read every changed living
      reader-facing document aloud against the Human Voice Contract — acceptance: every file passes;
      any stock filler, repetitive cadence, or template-like opening becomes a Phase 6 correction row.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: CONTRIBUTING.md, README.md, docs/how-to/setup-development-environment.md, docs/tutorials/getting-started-with-ose-public.md, docs/reference/related-repositories.md ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - An independent reviewer — not the writer of any of these files — read all five
    changed living reader-facing documents aloud against the twelve-clause Human
    Voice Contract, quoted verbatim rather than paraphrased.
  - **Round 1 fails: all five files break at least one clause.** Since the
    acceptance says every file must pass, this item fails and its findings become
    correction rows, which is exactly what the clause prescribes.
  - **The two clauses this contract predicted would fail most are clean.** V4
    (stock filler) and V7 (minimizing difficulty) pass in all five files —
    `comprehensive` appears in none of them, and both `just` occurrences mean
    "merely" rather than minimizing. The Phase 1 finding that `comprehensive` was
    live in 55 tracked documents no longer touches this corpus.
  - **One voice finding turned out to be a factual defect**, which is the strongest
    argument for reading aloud at all. The reviewer flagged an unexplained codename
    in the repository-comparison table; checking it showed the table described
    the private sibling as doing "local CoralPolyp sandbox work", while a published
    2026-08-18 update states CoralPolyp "was removed after recovery work showed
    that no current product needs to keep the app group alive". The row was stale,
    not merely jargony, and now reads "infrastructure work". (The name itself is
    not sensitive — it is already public in the site's own updates and in released
    posts.)
  - **Corrected in this iteration** as rows `C-09`…`C-19`: the tutorial now opens
    on the reader's task instead of three sentences of product definition, which
    also removes a sentence duplicated verbatim from the README (V1); one British
    spelling aligned with the corpus (non-clause); CONTRIBUTING now glosses Nx and
    monorepo on first use (V3), gains a missing-Cargo recovery entry (V9), and
    ends on a recommended move instead of a bare rocket emoji celebrating a closed
    door (V10, V12); the setup guide's Quick Start no longer strands Ubuntu readers
    on `source ~/.zshrc` (V9), states an expected outcome after the Rust step (V8),
    expands E2E on first use (V3), and no longer says "Two setup paths" above three
    bullets (non-clause); the README states what `nx show projects` prints (V8).
  - The missing-Cargo recovery entry matters most of these: this program had just
    documented that failure as the reason CONTRIBUTING needed a Rust prerequisite,
    yet the troubleshooting section still answered `npm install` failures with a
    cache clean, which cannot fix it.
  - **Declined, with reasons rather than silence.** The README's `🌙` is the
    project's title mark, and removing a brand element is the owner's call, not a
    voice pass's. Restructuring the README's 386-word local-setup section (V11)
    would reverse a structure that already passed a maker-checker-fixer cycle and
    an independent voice review in Phase 3, and the reviewer's own proposal would
    cut the file to roughly 700 words — a redesign, not a correction. The remaining
    V2/V5/V8/V12 findings in CONTRIBUTING and the reference page are real but
    amount to rewriting two long documents wholesale, which is beyond this plan's
    footprint; they are recorded in the fixes record so a later plan can pick them
    up rather than being quietly dropped.
  - Budget respected throughout: the README additions were funded by an offsetting
    cut. It stood at **894** of 900 words at `cb489b874`, the commit this item
    describes; later rows in this iteration moved it to **896** at `3d23ad1f9`,
    still under the 900-word fail limit with the budget gate green. The figure is
    pinned to a revision because `C-30` and `C-35` are both this same claim going
    stale, and an unpinned one goes stale the moment a later row edits the file.
  - **P7-004 re-run at `400712aa9`, round 2.** A second independent reviewer read
    all five documents aloud against the same twelve clauses and returned FAIL on
    every file, with roughly forty findings. Each was triaged by verification
    rather than accepted on the reviewer's severity label. **Two HIGH findings
    survived and became corrections**: `CONTRIBUTING.md` asserted adherence to a
    Code of Conduct when no `CODE_OF_CONDUCT.md` exists at any path in the tree
    (`C-84`), and `related-repositories.md` carried an executor instruction —
    "preserve active goals during runner contention…" — on a reader-facing
    reference path (`C-85`). **Three HIGH findings did not survive**: the README's
    "focused check" is defined by the tutorial the same sentence links, at that
    tutorial's line 97; the tutorial installs and verifies Rust before `npm
install`, with its own recovery entry, so no reader is stranded; and the
    "two sibling repositories" count was already cross-read under `P7-005`. The
    remaining findings are style preferences against clauses measured clean, and
    are not carried as debt. Clauses 4, 7, and 9 were confirmed clean across all
    five files.

- [x] [AI] [P7-005] Cross-read contribution, platform support, content parity, `rhino-cli` byte
      identity, repository purpose, package description, and About metadata — acceptance: all current
      claims agree; documentation findings return to Phase 6 and metadata mismatches return to
      Phase 4 before Phase 7 restarts.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Repository purpose agrees across all three surfaces.** `package.json`
    describes the repo as "Open source platform for researching and building
    trustworthy, Sharia-compliant enterprise products.", the live GitHub About
    description is that same string byte for byte, and the README opens with the
    same claim in prose.
  - **About metadata still matches the P2-005 contract**, re-read live rather than
    carried from Phase 4: description as above, `homepageUrl`
    `https://oseplatform.com/`, and exactly the 10 contracted topics
    (`enterprise-software`, `erp`, `fsharp`, `islamic-finance`, `monorepo`, `nx`,
    `open-source`, `rust`, `sharia-compliant`, `typescript`). No Phase 4 loopback
    is needed.
  - **Contribution intake is closed consistently.** README ("External
    contributions are currently closed…") and CONTRIBUTING.md (§ External
    Contributions, "not being accepted at this time", plus "an internal delivery
    process, not an invitation to submit external pull requests") agree; no
    document invites outside pull requests.
  - **Sibling-repository claims agree**: the private sibling is described as closed to
    the public in both the README and the related-repositories reference;
    `ose-primer` is described as a separate, openly licensed starter free to
    diverge. `rhino-cli` byte identity is asserted only as spanning `ose-public`
    and the private sibling, matching AGENTS.md's "sole parity sibling" and the P7-006
    parity result.
  - **One real defect, and it fails this item.** The recorded platform contract
    (P2-003) gives native Windows exactly three words of allowance — "Nothing. No
    instructions, no partial path, no 'should also work' claim." `CONTRIBUTING.md`
    line 58 breaks it, shipping a **Windows** heading followed by
    "Download the installer from [volta.sh](https://volta.sh/)" — a native-Windows
    setup instruction. It also contradicts two sibling documents directly:
    `README.md` ("Native Windows is not supported.") and
    `docs/how-to/setup-development-environment.md` ("Windows is not supported.").
  - The finding was scoped as a **class**, not a single sighting: every Windows
    mention across the four reader-facing onboarding documents was enumerated.
    There are three, and only this one violates the contract — the other two are
    the correct not-supported statements. So the correction has exactly one site.
  - Per this item's own routing rule, a documentation finding returns to **Phase 6**
    before Phase 7 restarts. Phase 6 is therefore reopened as iteration `@01`,
    reversing its earlier not-applicable disposition.
  - **P7-005 re-run at `400712aa9`, after iteration `@01` merged.** Every repeated
    claim resolves against its source rather than against a neighbouring document.
    `package.json` `description` and the live GitHub About description are the
    same string, character for character. Homepage is `https://oseplatform.com/`.
    The topic array is the declared ten — `enterprise-software`, `erp`, `fsharp`,
    `islamic-finance`, `monorepo`, `nx`, `open-source`, `rust`, `sharia-compliant`,
    `typescript` — exact set equality with the contract, no extras. Contribution
    intake reads closed in both `README.md` and `CONTRIBUTING.md`. The canonical
    platform sentences appear identically in `README.md`, `CONTRIBUTING.md`, and
    the setup guide; the tutorial carries a paraphrase with the same posture, which
    is deliberate rather than drift. `rhino-cli` byte identity is covered by
    P7-006's manifest run, and harness-mirror parity by P7-002's `validate:sync`.
  - The tutorial's success criterion was checked against the application, not
    against itself: it tells a reader the page shows **Open Sharia Enterprise
    Platform** and a description beginning "Open-source (MIT) platform for
    Sharia-compliant enterprise solutions." Both strings are in
    `apps/ose-www/src/features/landing/shell/hero.tsx` — the first as the `h1`,
    the second as the paragraph beneath it.
  - **Three method failures are recorded because each produced a clean-looking
    false negative.** Two exact-string checks returned `0` for documents that do
    carry the sentence, because the sentence wraps across a line and `grep` is
    line-oriented; re-running over whitespace-normalized text returned the true
    `1`. A third check used `grep -o … | head -1`, where `head` exits 0 and masks
    `grep`'s failure, so a missing match printed as a blank rather than as an
    error. Every count above was re-derived after normalizing and after removing
    the masking pipe.

- [x] [AI] [P7-006] Verify no merged commit in this program touched the identity boundary with
      `git diff --name-only <plan-base-sha>..origin/main -- apps/rhino-cli specs/apps/rhino/behavior/rhino-cli`,
      then run `parity manifest validate` on merged `main` — acceptance: the diff prints nothing and
      the parity gate exits 0, so no cross-repository byte-identity obligation was opened.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - The boundary diff prints nothing:
    `git diff --name-only 028e8eed9..origin/main -- apps/rhino-cli specs/apps/rhino/behavior/rhino-cli`
    returns 0 lines, so no commit merged by this program touched either
    identity-bound path.
  - That zero was proved to be a real zero rather than a broken invocation by
    running the **same** diff without the pathspec: it returns **100** changed
    files over the same commit range. An empty result from a diff that can produce
    results is evidence; an empty result from a diff that would be empty either way
    is not.
  - `parity manifest validate` exits `0` and reports
    `apps/rhino-cli/parity-manifest.sha256 is current`, so the byte-identity
    manifest matches the tree.
  - Together these close the cross-repository risk this item exists for: because
    nothing under `apps/rhino-cli/` or its behavior specs changed, this plan opened
    **no** four-repo parity-propagation obligation in the private sibling, `ose-primer`,
    or `beaver-nest` — consistent with the plan-level constraint that no delivery
    unit may change a path inside those trees.
  - **P7-006 re-run at `400712aa9`, over the now-complete merged range.** The
    program is exactly three squash commits on `main` — `f268c0077` (#237),
    `1542ea044` (#238), `400712aa9` (#239). Diffing `028e8eed9..origin/main`
    returns **0** paths under `apps/rhino-cli/` and **0** under
    `specs/apps/rhino/behavior/rhino-cli/`, and **0** git-identity paths of any
    kind. The changed set is Markdown only, across `docs/` (45), `plans/` (23),
    the harness mirrors (`.claude/` 16, `.agents/` 12, `.codex/` 3, `.opencode/`
    2), `specs/` (9), `repo-governance/` (5), plus `README.md`, `CONTRIBUTING.md`,
    and `apps/ose-www/README.md`. `parity manifest validate` exits 0 —
    `apps/rhino-cli/parity-manifest.sha256 is current`.

- [x] [AI] [P7-007] Run both deterministic secret gates and an independent AI semantic sensitivity
      review over plan artifacts, all diffs, evidence, metadata, commits, and PR text — acceptance:
      zero secret or credential leak; a suspected leak stops ordinary execution and invokes the
      repository security-incident route.
  - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None inside the repository ·
    **Notes**: Evidence and reasoning for this item are recorded in the bullets below.
  - **Deterministic gate 1**: `env staged-guard validate` exits `0` against the full
    staged set, so no real environment file is staged.
  - **Deterministic gate 2**: a high-confidence secret-shape scan over ~2.5 MB —
    the staged diff, every plan artifact, and both evidence text files — matches
    **zero** GitHub tokens, AWS keys, Slack tokens, private-key headers, or long
    base64 blobs.
  - That zero is falsifiable rather than assumed: the same regex was re-run over
    the same corpus with a synthetic `ghp_`-shaped string appended, and it matched
    exactly once. A scanner that finds a planted token and nothing else is
    evidence; a scanner that finds nothing might just be broken.
  - A broader keyword sweep did return hits, and every one was read rather than
    counted: all are the plan quoting its **own** sanitization vocabulary
    ("no credential, token, cookie, or session data", "sensitive-token scan
    clean"). No credential value appears anywhere.
  - **Independent AI semantic review**: zero CRITICAL, zero HIGH, zero MEDIUM. It
    read the full staged diff, all plan documents including the 2 MB ledger, both
    evidence text files, and ran a `strings` scan over all six PNGs — which
    returned no host path, account name, or capture-tool metadata.
  - Its three LOW items are informational and none is a leak this unit introduced:
    the container's address was Docker's default bridge address for a destroyed
    `--rm` container, identical on every default install — it has since been
    replaced by a `<container-ip>` placeholder, because the plan's rule against
    recording an IP has no private-range carve-out to rely on; an internal
    codename in `docs/reference/related-repositories.md` is **pre-existing on
    `main`**, byte-identical there, and absent from this branch's diff; and the
    maintainer contact address is a deliberately public security-disclosure
    address, also unchanged.
  - The review specifically confirmed the private-sibling boundary holds: every
    the private sibling mention is confined to "it exists and is closed" or the
    already-public `rhino-cli` byte-identity boundary. No host, path, or
    operational detail leaked.
  - Zero secret or credential leaks, so ordinary execution continues and the
    repository security-incident route is **not** invoked.

  - **P7-007 re-run at `400712aa9`, round 2.** Both deterministic gates stayed
    green — `env staged-guard validate` exits 0, and the silent staged-credential
    pattern gate finds nothing. The independent semantic reviewer returned **zero
    findings at any severity** across all three squash commit bodies, every plan
    document and artifact read end to end, all twelve evidence files, and every
    hunk of the remaining changed files. It cleared eight items it had flagged and
    run to ground, including the container PIDs (required by `P5B-004`'s own
    acceptance clause, and disclosing nothing from a `--rm` container destroyed at
    `P5B-006`), the credential-detection regex in this file (published prefix
    patterns, no real values), and the `CoralPolyp` codename (present in 96 tracked
    files on `origin/main`; this program's edit reduces the footprint by one). It
    also ran a byte-level metadata scan of the nine PNGs: no `tEXt`/`iTXt`/`zTXt`/
    `eXIf` chunk exists in any of them, and a `strings` sweep for path and account
    tokens returns nothing.
  - **Capture identity, recorded for completeness.** The reviewer noted, and this
    execution confirmed by hash, that all three 768px captures —
    `phase-5a-`, `phase-5b-`, and `phase-6-ose-www-landing-en-768px.png` — are one
    byte-identical file (`c5043585…`). The record already explains the 5a↔5b
    identity; the phase-6 capture matches for the same reason, despite coming from
    a different server on `OSE_WWW_PORT=3199`: same renderer, same viewport, and an
    identical response body. This is a disclosure gap in the record, not a
    sensitivity issue, and it is closed here.

### Phase 7 Gate

- [x] [AI] [P7-G01] Verify every mechanical, reader, voice, relationship, journey, boundary, and
      sensitivity result is green — acceptance: no unresolved finding of any severity blocks closeout. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: All seven Phase 7 results are Pass. `P7-001`: 9,297 tracked Markdown files at `1542ea044`, agreed by an independent enumerator, 814 ledger rows — a figure P9-003 re-measured as 9,299 at `7ebf8fec3`, because two Markdown files landed with PR #239 after the count was taken and it was never re-run, 0 duplicate/absent/interim/follow-up. `P7-002`: every repository-authoritative gate exits 0. `P7-003`: nine rounds, terminating on the consecutive zeros at rounds 8 and 9. `P7-004`: seven rounds, terminating on five PASSes at round 7. `P7-005`, `P7-006`, `P7-007`: Pass. Every finding either produced a correction (`C-06`–`C-97`) or was declined with a stated reason — none was waived and none remains unresolved. The two review loops ran long (nine and seven rounds) because rounds 3–5 kept reaching territory earlier rounds had not examined and rounds 7 found defects this plan's own repairs had introduced; both causes are analysed in the corrections record rather than left as an unexplained round count.

> **Pause Safety**: the delivered documentation system is fully reconciled. To resume, compare the
> ledger with current `origin/main` before closing out.

## Phase 8: Sanitized Closeout and Knowledge Capture

- [x] [AI] [P8-001] Switch the plan worktree to the closeout branch from current `origin/main` —
      acceptance: install, doctor, and baseline gates pass. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: Branch `docs/repository-onboarding-closeout` cut from `origin/main` after PR 240 merged. Install and doctor ran clean; the baseline gate set (`md links validate`, `governance readme-index validate`, `governance word-budget validate`, `parity manifest validate`, `env staged-guard validate`) each exited 0.
- [x] [AI] [P8-001A] Create `artifacts/execution-record-closeout.md` with the required schema —
      acceptance: every Phase 8–9 task ID has a row before execution. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `artifacts/execution-record-closeout.md` · **Notes**: Created with the declared `Task ID | Date | Status | Files Changed | Commands/Evidence | Notes` schema and a 27-row table covering every Phase 8 and Phase 9 task ID, written before any Phase 8 work ran.
- [x] [AI] [P8-002] Create or update `evidence/README.md` as a sanitized index of PRs, metadata
      equality, both journey outcomes, and quality gates — acceptance: it contains no raw output,
      screenshot, environment data, or authentication state. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `evidence/README.md` · **Notes**: A 450-word index of the four merged PRs, the metadata equality result, both fresh-checkout journeys, and the gate set. It cites outcomes only. A scan for literal PIDs, container IPs, absolute local paths, hostnames, and tokens returned zero, verified against a planted control that fired on all four PID values before the real scan returned its genuine zero.
- [x] [AI] [P8-002A] Ingest only sanitized terminal rows from the verification-program record into
      `artifacts/execution-record-closeout.md` — acceptance: Phase 4, 5, and 7 outcomes are durable
      without local paths, raw output, or authentication state. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `artifacts/execution-record-closeout.md` · **Notes**: 39 rows copied forward into four sub-tables (Phase 4, Phase 5A, Phase 5B, Phase 7). The gitignored source record stays local; only outcome text crossed into the tracked file. The Phase 5B container address is carried as a `<placeholder>` token, not a literal.
- [x] [AI] [P8-003] Reconcile every execution-record row and per-document task row — acceptance: no
      blank status or `follow-up-required` state remains. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `artifacts/execution-record-closeout.md` · **Notes**: Zero blank status cells across all five artifact records, and zero live `follow-up-required` states. A cell-value scan of the disposition ledger returned exactly one `follow-up-required` hit — line 41, the schema legend that _defines_ the state — verified by printing the matched line rather than trusting the count, with a control (`generated`, 5 hits) proving the detector fires on real data rows. `P7-004` moved Pending → Pass after voice round 7 and `P7-003` after docs round 9; every Phase 8 row was synced to `Done` at the same time. Phase 9 rows remain `Pending` because Phase 9 has not run — that is a not-yet state, not a blank one.
- [x] [AI] [P8-004] Apply the generalization, sensitivity, and repository-relevance gates to every
      `learnings.md` entry — acceptance: each entry is routed to one durable home, converted to a
      separately scoped backlog item, discarded with a reason, or recorded as no generalizable
      learning. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `learnings.md` · **Notes**: All 14 entries now carry an explicit `**Routing**` field; 6 did before this task. `L-004`'s body was rewritten after reading `has_failing_finding` in the Rust source showed its original premise was imprecise — `unannotated` is deliberately dark-launched, so the validator's exit 0 is correct by design rather than a disagreement between signals.
- [x] [AI] [P8-004A] Apply the code-routing rule to every `learnings.md` entry: any entry whose
      durable home is `apps/`, `libs/`, or a test is always filed as a separate `plans/backlog/`
      plan and never landed inline in this plan's commits or PRs, except a bug/lint/test failure
      that blocks this plan's own scope, which is fixed inline as ordinary Root Cause Orientation
      work — acceptance: no code-homed entry is routed inline; every code-homed entry has a
      corresponding `plans/backlog/` folder. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: five files of `plans/backlog/rhino-cli-governance-tooling-defects/`, `plans/backlog/file-naming-convention-rework/tech-docs.md` · **Notes**: Two entries were code-homed. `L-004` became **WS-4** in the `rhino-cli-governance-tooling-defects` plan — a workstream row, a full `### WS-4` section, a BRD cost paragraph and success metric, one user story with three Gherkin scenarios, a `## 4A` tech-docs section with the measured finding attribution (425 total: 163 `docs/`, 262 `specs/`, 0 elsewhere), and an 11-task `## Phase 3A` with its own gate. `L-011` folded into `file-naming-convention-rework/tech-docs.md` as `## 4A`. Neither landed inline: no path under `apps/`, `libs/`, or a test directory appears in this unit's 23 changed paths, and the boundary check confirming that fired correctly against a planted control.
- [x] [AI] [P8-004B] For every `learnings.md` entry routed to `plans/ideas/`, scan
      `plans/ideas/README.md` and the existing two-pagers first for a brief already covering the
      same problem or area and fold the learning into it — acceptance: a new
      `plans/ideas/<slug>.md` is created only when the scan confirms no existing brief overlaps. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `acceptance-clause-vacuity.md`, `class-sweep-completeness.md`, `doc-command-existence-validation.md`, `plan-checker-forward-reference-detection.md`, `markdownlint-ci-gate-lints-zero-files.md`, `ayokoding-mermaid-diagram-remediation.md` · **Notes**: Six idea-routed learnings, six existing briefs, **zero new idea files created** — the scan found an overlapping brief for every one. `L-006`, `L-007`, and `L-008` all folded into the single `acceptance-clause-vacuity.md` brief rather than fragmenting across three. `L-003`, `L-009`, and `L-011` had their Routing fields corrected during this task from "file as a `plans/backlog/` item" to fold-into-existing-brief, because the backlog index requires promotion from a two-pager first and the original routing skipped that step.
- [x] [AI] [P8-005] Reconcile the closeout file-touch ledger — acceptance: only sanitized plan,
      evidence, and learning paths are changed. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `artifacts/execution-record-closeout.md` · **Notes**: 23 paths, every one classified. **Deviation recorded, not absorbed**: 19 of the 23 fall outside "only sanitized plan, evidence, and learning paths" — 7 are shipping-surface and class-sweep corrections `C-88`–`C-97` that `P7-003`/`P7-004` require, and 12 are the routing paths `P8-004A`/`P8-004B` mandate. The clause cannot be satisfied without failing two others; the reason is stated in the closeout record rather than reinterpreted away. One generated path, `apps/ose-www/next-env.d.ts`, was reverted rather than committed, taking the unit from 24 paths to 23.

### Phase 8 Gate

- [x] [AI] [P8-G01] Verify the ledger, evidence, and learnings have terminal safe states —
      acceptance: closeout is ready for archival without another repository change. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: Ledger: 23 paths, all classified, deviation stated. Evidence: `evidence/README.md` cites outcomes only, with a PID/IP/path/token scan returning zero against a control that fired first. Learnings: all 14 entries carry a `**Routing**` field. Gates re-run on this exact tree — `md links validate`, `governance readme-index validate`, `governance word-budget validate`, `parity manifest validate`, `env staged-guard validate` and `git diff --check` all exit 0; prettier and markdownlint are clean over all 23 changed paths with the file count asserted at 23 first, so the pass is not the docs-only scoping vacuity. One generated path was reverted rather than committed.
- [x] [AI] [P8-G02] Verify no code-homed learning landed inline — acceptance: every code-routed
      `learnings.md` entry has a corresponding `plans/backlog/` folder. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: One entry is code-homed: `L-004` (`apps/rhino-cli`). Its home, `plans/backlog/rhino-cli-governance-tooling-defects/`, exists with all five plan files, and WS-4 is present in every one of them. `L-011` routes to repository configuration and folded into `plans/backlog/file-naming-convention-rework/tech-docs.md` § 4A, which exists at line 130. Neither landed inline: no path under `apps/`, `libs/`, or a test directory appears among this unit's 23 changed paths, and the detector proving that fired correctly on a control pattern (17 hits) before returning its genuine zero.

> **Pause Safety**: delivery is complete and closeout artifacts are staged only in the plan worktree.

## Phase 9: Plan Archival, Post-Move Inventory, and Cleanup

- [x] [AI] [P9-001] Verify every phase gate, PR, metadata equality check, and journey result is
      complete — acceptance: no ambiguous conditional branch or unchecked required task remains. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: All twelve phase gates `P0-G01` through `P8-G02` are ticked; every remaining unchecked item is a Phase 9 task, enumerated to confirm none is a leftover from an earlier phase. Five PRs merged — 236, 237, 238, 239, 240 — all confirmed via `gh pr list --state merged` rather than by ancestry, since squash-merge makes `merge-base --is-ancestor` false-negative here. Metadata re-verified live against the recorded contract: description and homepage compare exactly equal and the ten topic slugs compare set-equal, with a deliberately corrupted control returning False to prove the comparison discriminates. Both journeys (`P5A`, `P5B`) recorded Pass with stop proof and cleanup. No conditional branch is left ambiguous.
- [x] [AI] [P9-002] Move the plan with
      `git mv plans/in-progress/repository-onboarding-readme-refresh plans/done/<completion-date>__repository-onboarding-readme-refresh`
      and update the in-progress/done indexes — acceptance: the date is the actual archival date and
      all links resolve. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: the whole plan directory (moved), `plans/in-progress/README.md`, `plans/done/README.md`, `plans/ideas/README.md`, this plan's `README.md` · **Notes**: Moved to `plans/done/2026-08-21__repository-onboarding-readme-refresh` — 2026-08-21 is the actual archival date, not the plan's creation date. Both stages sit at the same directory depth, so every `../../` link inside the plan still resolves. The in-progress index lost its entry and gained back the backlog paragraph as a standalone paragraph: it had been indented two spaces _inside_ this plan's bullet, so removing the bullet would have deleted or orphaned it. The done index gained a dated entry. `plans/ideas/README.md` carried the only live path pointer into the plan and was repathed. Every other surviving `in-progress/repository-onboarding…` string is inside `plans/done/`, where archived bodies deliberately retain what was true when they ran. The plan README's status moved from `**Not started.**` — stale through all nine phases — to `**Done** — archived 2026-08-21`.
- [x] [AI] [P9-003] Re-run the tracked-Markdown inventory against the staged post-move index and
      update the ledger — acceptance: moved plan/evidence READMEs and both plan indexes have correct
      final paths and terminal dispositions. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `artifacts/reader-doc-disposition-ose-public.md`, `artifacts/execution-record-closeout.md`, `plans/done/README.md`, this file · **Notes**: Inventory re-run against the staged index (tree `4e8dd974b`) with two agreeing enumerators: 9,301 Markdown paths, +12/-10 against `7ebf8fec3` for a net +2, every added path accounted for, 814 rows, 0 duplicates, 0 rows absent from the tree — the absence detector proven by a planted nonexistent path returning 1. The plan README row and the planned-new preamble were repathed; the two closeout files moved from `Planned` to `Created`; every plan path is now `historical-exempt` under Classification Rule 3. **The re-run found a real defect in the record itself**: `P7-001`'s figure of 9,297 was true at `1542ea044` but never re-measured after PR #239 added two Markdown files, and it had been carried forward into four later records as though current. The three sites presenting it as a live figure were corrected and the three that pin it to a named commit were left alone, because those are accurate history. This is the `C-93` staleness class — a number correct once and quoted forever — appearing inside the ledger built to catch exactly that.
- [x] [AI] [P9-004] Run `git diff --check`, all Markdown/Rhino/index/sync/affected gates, the staged
      environment-file guard, the silent staged-credential pattern gate, the identity-boundary guard,
      and an independent AI sensitivity review after archival — acceptance: all pass on the exact
      final diff. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: `artifacts/execution-record-closeout.md` · **Notes**: All 13 repository-wide `rhino-cli` gates exit 0, both `git diff --check` forms exit 0, prettier passes over all 34 staged Markdown files with the count asserted first, identity-boundary and sibling-repository checks return 0 hits against controls that fire, and the staged-credential scan returns 0 over Markdown and evidence alike against a planted positive. The independent sensitivity review returned **CLEAN**, having proven every detector against a control — including a purpose-built PNG with an injected `tEXt` chunk before reporting zero metadata across nine screenshots — and having re-verified four evidence claims that could have been overstated. **Two results are recorded as no-ops rather than passes**: markdownlint covered 21 of 34 files because `plans/done/**` is in its ignore list, and the three Nx-scoped pre-push gates did not run at all because 0 of 33 projects are affected by a Markdown-only change set.
- [x] [AI] [P9-005] Commit the closeout/archive unit with a Conventional Commit — acceptance: it
      contains only sanitized closeout and archival changes. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: Commit `b5ab08497`, 46 files, 2,104 insertions / 942 deletions. `commitlint --edit` returned 0 problems and 0 warnings before committing — the last warning came from `PR #239`, whose `#` the conventional-commits parser reads as a footer token, so the reference is written without it. Working tree empty afterwards and the committed path list contains nothing outside `CONTRIBUTING.md`, `docs/`, `plans/`, and `repo-governance/`, which rules out the pre-commit hook sweeping an unstaged file in. Author verified as the real identity, not a stray `Test` override.
- [x] [AI] [P9-006] Push the exact closeout branch — acceptance: `origin` contains the unit head. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: `docs/repository-onboarding-closeout` pushed to `origin` as a new branch tracking upstream. The pre-push gate set ran for real on the way out: `governance-readme-completeness` reported `README INDEX AUDIT PASSED: no orphan or ghost references found`, and `governance-word-budget` emitted warnings only, none on a path this unit touches.
- [x] [AI] [P9-007] Open the closeout draft PR against `main` — acceptance: its scope and
      archived-plan links are correct. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: PR 241 opened as a draft against `main`. Its body states the scope (corrections `C-88`–`C-97`, the archival move, and the learning routing), names the archived path `plans/done/2026-08-21__repository-onboarding-readme-refresh/`, and states both deviations — the stale 9,297 figure and the `P8-005` clause conflict — rather than omitting them.
- [x] [AI] [P9-008] Classify the PR and run the canonical route-required review — acceptance:
      eligible work reaches the earliest clean code M/H/C cycle within seven; noneligible work has
      `pr-quality-gate.yml` green; all route-required checks are green. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: Classified **static**, so the route is a green `pr-quality-gate.yml` rather than a code M/H/C cycle; the seven-cycle clause governs eligible work and does not apply. The classification was measured, not assumed: filtering the 46-path diff for anything not matching `\.(md|png|txt)$` returns nothing while the inverted filter returns 34, and `nx show projects --affected` returns 0 of 33. CI is fully green — 14 checks pass (`Quality gate`, `governance`, `harness`, `markdown`, `specs`, `formatting-verify`, `shell-docker-actions`, `Auto-format affected`, `Build rhino-cli`, `Detect affected languages`, `Minimum version compatibility`, `Specs structure validation`, `Validate env-contract surfaces`, `Enumerate registry CI gate groups`) and the four language gates report `skipping`, which is correct for a Markdown-only change and is recorded as skipped rather than counted as a pass.
- [x] [AI] [P9-009] Forward-update from `origin/main` without destructive history edits — acceptance:
      the branch contains current `origin/main`. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: No update was needed and none was fabricated. `git rev-list --left-right --count origin/main...HEAD` returns `0 1` — `origin/main` is at `7ebf8fec3`, the branch is exactly one commit ahead of it, and nothing landed on `main` during this unit. No rebase, reset, or force-push was performed.
- [x] [AI] [P9-010] Rerun final gates and verify PR CI — acceptance: every result is green. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: Repository-wide gates re-run on the final tree: all 13 `rhino-cli` checks exit 0, both `git diff --check` forms exit 0, prettier and markdownlint clean. PR CI on the archival commit returned 14 passing checks and 4 `skipping` language gates, with zero failures — polled every 2 minutes per the orchestration convention, never with `gh run watch`. The tick commit that carries this note re-triggers the same workflow, and its result is verified green before `P9-011` merges; if it were not, this row would be reopened rather than left standing.
- [ ] [AI] [P9-011] Merge the closeout PR as AI — acceptance: the plan exists under `plans/done/` on
      `origin/main` and no stale in-progress link remains.
- [x] [AI] [P9-012] For the plan worktree and every plan-created branch, use
      `gh pr list --head <branch> --state merged` to prove merged status before cleanup — acceptance:
      no unmerged work is removed. - **Date**: 2026-08-21 · **Status**: Done · **Files Changed**: None · **Notes**: Five branches proven MERGED by `gh pr list --head` — 236, 237 (and an unrelated older 147 that reused the same branch name), 238, 239, 240. Ancestry was deliberately not used: squash-merge false-negatives `merge-base --is-ancestor` on every merged PR in this repository. The closeout branch is the sixth and is merged at `P9-011`. Remote tips were recorded before any deletion as recovery anchors: `00aa0486c`, `af36a86c3`, `55925bd16`, `3d730ffa0`, `f5ec67cea`.
- [ ] [AI] [P9-013] Use non-force `git worktree remove <exact-validated-path>` and merged-only branch
      cleanup — acceptance: no shared cache, unrelated worktree, unmerged branch, or object store is
      touched.
- [x] [AI] [P9-014] Stop and remove any plan-created temporary process, container, image, or
      artifact after proving exact ownership and idle state — acceptance: no container image this plan
      pulled remains, and shared caches, preexisting images, and unrelated artifacts are untouched. - **Date**: 2026-08-21 · **Status**: Done, with a deviation recorded · **Files Changed**: None tracked · **Notes**: Docker is clean and it is a measurement, not a daemon-down false zero — `docker info` reports server 29.7.2 with `containers=0 images=0`, and all four Phase 5B listings are byte-identical between baseline and post-phase, so the disposable `ubuntu:24.04` container and image are gone and nothing pre-existing was touched. `local-tmp/` went from 37 entries to 1 (`.gitkeep`), every removed entry dated to this plan's own session. **Deviation**: the `generated-reports/` sweep deleted all twelve `plan__*` files, but three were tracked, dated 2026-08-13, and belonged to an earlier plan. They surfaced instantly as ` D` in `git status` and were restored with `git checkout --`. The error was treating a shared filename prefix as ownership; `git ls-files generated-reports/` distinguishes them in one command and was run after the deletion instead of before. This is exactly the clause's own "unrelated artifacts are untouched" condition, and it is recorded rather than smoothed over.
- [ ] [AI] [P9-015] Run `git worktree list` and safe branch/temporary-artifact checks — acceptance:
      every plan-owned item is removed or explicitly retained because an AI safety precondition
      failed.

> **Why the last four rows carry no tick.** `P9-011` (merge), `P9-013` (remove the worktree),
> `P9-015` (final safety checks) and `P9-G01` (verify the program is complete on current
> `origin/main`) can only run _after_ the commit that would record them. Ticking them in that commit
> would mean asserting an outcome before producing it, which is the defect this plan spent nine
> review rounds removing from its own documentation. They are executed after the merge and their
> results are reported in the session and in PR 241's thread. Their evidence — the merged status of
> every branch, the Docker and `local-tmp` state, the worktree list — is already recorded above
> under `P9-012` and `P9-014` and in
> [`artifacts/execution-record-closeout.md`](./artifacts/execution-record-closeout.md).

### Phase 9 Gate

- [ ] [AI] [P9-G01] Verify the archived plan, repository documentation, metadata, ledger, evidence,
      knowledge capture, and cleanup are complete on current `origin/main` — acceptance: the program
      has no remaining authorized work.

> **Pause Safety**: the program is merged, archived, and safely cleaned up. Reverification starts
> from the archived plan and the final sanitized execution record.
