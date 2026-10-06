---
title: SDLC Gate Standard
description: Historical record of the 2026-07 gate-mechanics standardization, plus the current stable gate contract; it imposes no alignment obligation between repositories
category: reference
tags:
  - sdlc
  - gates
  - quality
  - ci
  - hooks
created: 2026-06-30
---

# SDLC Gate Standard

> Historical source: the 2026-07 standardization technical record in `plans/done/`.

This document preserves the 2026-07 cross-repository standardization record. It is not the
current executable contract: RHINO is now an independently released executable pinned by version
and per-platform SHA-256 digest in `rhino.lock`, and the repository no longer contains an in-tree
Rhino application (retired 2026-09-19). The dated analyses below remain useful
as history only. They bind no repository to another: `ose-public` and its private sibling are
independent, neither is the source of the other's gates, and each evolves its own.

## Current stable v0.4 operating contract

`repo-config.yml` and its checksum-pinned `./rhino` binary are the authoritative contract. Run
`./rhino gate list --output text` to inspect every declared surface; the current registry has
`pre-commit`, `commit-msg`, `pre-push`, and `pull-request` only. It has no `ci` surface and `gate
list` does not filter by surface. Run a declared surface with `./rhino gate run --surface <name>`.

The supported repository-level checks include `./rhino repo-config validate`, `./rhino gate
validate`, `./rhino harness adapters generate`, `./rhino harness adapters validate`, `./rhino env
validate`, `./rhino governance vendor validate`, `./rhino governance word-budget validate`, and
`./rhino md internal-link validate`. Word-budget validation has no declared gate and runs on demand; internal-link
validation is the pull-request gate `md-internal-link`, beside `md-readme-index`.
Generated adapters are routes to canonical `AGENTS.md`,
`.agents/agents/`, and `.agents/skills/`; never hand-edit a generated adapter.

[Lifecycle Stages](#lifecycle-stages) restates the registry's current surfaces; every later
section is a historical record, not a source of commands or current ownership claims.

## Lifecycle Stages

This section restates each stage's declared gates as of the pinned RHINO. The registry is normative:
when this section and `./rhino gate list` disagree, the registry wins, and
[Git Hook Lifecycle](../../repo-governance/development/workflow/git-hook-lifecycle.md) owns the hook
mechanics.

| Stage              | Surface                                 | Trigger                       |
| ------------------ | --------------------------------------- | ----------------------------- |
| 1. pre-commit      | `.husky/pre-commit`                     | `git commit` (before message) |
| 2. commit-msg      | `.husky/commit-msg`                     | `git commit` (on the message) |
| 3. pre-push        | `.husky/pre-push`                       | `git push`                    |
| 4. PR quality gate | `.github/workflows/pr-quality-gate.yml` | pull request (+ branch push)  |

A standalone `validate-env.yml` workflow runs on `pull_request` and `push:main` in parallel with the
PR gate. No full-quality pipeline is part of the gate set; impacted `test:integration` and
`test:e2e` run by manual selection during development/review, while complete higher-layer suites
run only in scheduled or manually dispatched full-quality workflows. `deps:audit` remains outside
the gate. None runs in a hook or PR/main gate.

### Command Scope

A gate's reach is one of four kinds. The registry expresses it through each gate's declared `inputs`
and `run-on` bindings, not through a scope field.

- **affected file-type** — files matching a glob, limited to the changed set (the staged index at
  pre-commit; the pull request's explicit base-to-head range on the pull-request surface). For
  example: `format-staged`, `md-mermaid`, `shellcheck`, `hadolint`, `actionlint`.
- **all file-type** — files matching a glob across the whole repository. For example:
  `markdownlint`, `md-heading-hierarchy`, `md-naming`, `md-frontmatter`, `convention-emoji`.
- **affected projects** — the touched Nx project graph (`nx affected`); per affected project only.
  For example: `test:quick`, which only the pull-request workflow's language jobs run.
- **other** — not file-type or project scoped: the commit-message and range screens, the
  repository, adapter, vendor, quality-gate, and environment validators, and the `detect` and
  `Quality gate` CI plumbing.

The same check moves only along this scope axis between local and CI surfaces. For example,
file-scoped checks are staged locally and recomputed from the PR change set in CI.

### Gate Composition Rule

One composition rule, one formatter verification rule, and one exclusion govern every stage:

1. **The pull-request surface holds every local gate.** `repo-config.yml` declares
   `gates.composition.pull-request.relation: at-least`, and `./rhino gate validate` fails a local gate
   that the pull-request surface lacks; today the surface also adds `md-mermaid-repository`,
   `md-internal-link`, and `md-readme-index`. Inspect
   the sets with `./rhino gate list --output json`.

2. **Every formatter mutation has one CI verifier.** `format-staged` declares both modes: locally it
   applies the formatted bytes to the index; on the pull-request surface it replays the formatters
   and fails if any byte would change (`ci: verify-clean`).

3. **Heavy/uncacheable tiers never run in any hook or PR/main gate.**
   Run impacted `test:integration` and `test:e2e` targets manually during development/review and
   complete suites on schedule. `deps:audit` remains scheduled; none belongs to a gate surface.

**Gate rule summary**: the pull-request surface holds at least every local gate; `test:quick` runs
only in the PR workflow's language jobs, and no hook runs it; `test:integration` and `test:e2e` run
only through manual impacted or scheduled/manually dispatched full-quality workflows; `deps:audit`
remains scheduled. None of the last three runs in a gate.

In CI, the `Repository policy` job and the language jobs run in parallel and join at `Quality gate`.
Locally, each hook runs its gates in registry order and stops at the first failure.

### Stage 1: pre-commit

`.husky/pre-commit` runs `./rhino gate run --surface pre-commit`: the declared gates, in registry
order, stopping at the first failure:

| #   | Gate                                                                                               | Scope              | What it does                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `public-safety-tree`                                                                               | other              | Screens the tracked tree, its names, and the staged additions as outbound material.                                                                        |
| 2   | `format-staged`                                                                                    | affected file-type | Formats staged files by extension and applies the formatted bytes to the index (a `mutation` gate).                                                        |
| 3   | `repo-config`, `harness-adapters`, `governance-vendor`, `governance-quality-gates`, `env-validate` | other              | Validate `repo-config.yml`, the generated harness adapters, vendor neutrality of governance, the quality-gate layout, and the declared environment policy. |
| 4   | `markdownlint`                                                                                     | all file-type      | Lints every Markdown file with `markdownlint-cli2`.                                                                                                        |
| 5   | `md-mermaid`                                                                                       | affected file-type | Validates Mermaid diagrams in the staged Markdown files.                                                                                                   |
| 6   | `shellcheck`, `hadolint`, `actionlint`                                                             | affected file-type | Lint staged shell scripts, Dockerfiles, and workflow files; a missing linter binary fails the gate.                                                        |
| 7   | `md-heading-hierarchy`, `md-naming`, `md-frontmatter`, `convention-emoji`                          | all file-type      | Check heading structure, filenames, front matter, and the emoji convention.                                                                                |

Pre-commit is the fast stage — it does not run `test:quick`. Per-project `typecheck`, `lint`, and
`test:quick` run in the PR workflow's language jobs, never in a hook.

The tool linters are registry gates over staged paths (`scripts/lint-shell`,
`scripts/lint-dockerfiles`, `scripts/lint-workflows`), not `nx run` targets.

The `./scripts/git-identity-check.sh` script is removed and replaced by the Git Identity Guardrail: a
behavioural rule, not a mechanical gate. **No AI agent may set or modify git user identity
(`user.name`/`user.email`) at any scope.** Specifically, an agent must not run
`git config --local user.name`/`user.email`, the bare `git config user.name`/`user.email` (which
writes to the local repo config by default inside a worktree), `--global`/`--system` identity, or
edit a `[user]` section in `.git/config`. Commit identity always comes from the developer's own global
config (`~/.gitconfig`, optionally via `includeIf "gitdir:…"` for per-tree identities). This mirrors
the [no-real-.env agent guardrail](../../repo-governance/conventions/security/secrets-and-env-standards.md).
This rule governs interactive agents working in a developer's repo/worktree — it does not forbid a CI
workflow from configuring a service-account/bot identity in its own YAML (for example, the
`github-actions[bot]` identity used by the PR-gate format-commit-back).

### Stage 2: commit-msg

`.husky/commit-msg` runs `./rhino gate run --surface commit-msg --message-file "$1"`:

| #   | Gate                           | Scope | What it does                                                                                                                                                                                                 |
| --- | ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `public-safety-commit-message` | other | Screens the commit message as outbound material. The Conventional Commits format is not a hook gate; review checks it, per [Commit Messages](../../repo-governance/development/workflow/commit-messages.md). |

### Stage 3: pre-push

`.husky/pre-push` runs `./rhino gate run --surface pre-push --push-updates-stdin`: the declared
gates, in registry order, stopping at the first failure:

| #   | Gate                  | Scope | What it does                                                                                                                                                                     |
| --- | --------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `public-safety-tree`  | other | Screens the tracked tree, its names, and the refs being pushed as outbound material.                                                                                             |
| 2   | `public-safety-range` | other | Screens every commit in the pushed range (ids, messages, names, and each commit's additions). The range comes from the push updates, falling back to `refs/remotes/origin/main`. |
| 3   | `leak-review-tests`   | other | Runs the offline `scripts/leak-review/tests/run.sh` suite of the leak-review record check against a stand-in forge.                                                              |
| 4   | `env-validate`        | other | `./rhino env validate`: the declared environment policy.                                                                                                                         |

Pre-push runs no `test:quick`, no Markdown lint, and none of `md internal-link validate`,
`governance vendor validate`, `harness adapters validate`, or `governance word-budget validate`.
Vendor and adapter validation run at pre-commit and on the pull-request surface. Internal-link and
README-index validation run only on the pull-request surface; word-budget validation has no declared gate: run it on
demand.

Project BDD coverage runs inside `test:quick` through static targets:

| Nx target                 | Validates                                                                        | Applies to              |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| `test:coverage:<layer>`   | Exactly-one implementation or valid higher-layer exemption per expanded scenario | Each applicable adapter |
| `test:coverage:behaviour` | Recursive corpus, explicit When/Then, bindings, adapters, and exemption syntax   | Every owner/E2E project |

Repeated primary keywords are valid for one continuous journey. Link targets under `specs/**.md`
are checked by the pull-request gate `md-internal-link`; run `./rhino md internal-link validate` to check them before
pushing.

### Stage 4: PR Quality Gate

`pr-quality-gate.yml`. Language jobs run only for languages detected among the affected projects.

| Job                                                        | Exact command(s) CI runs                                                                                                                                                                                                                                                             | Scope             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| detect                                                     | `npx nx show projects --affected`, then each project's tags — derives which language jobs run. Runs no test.                                                                                                                                                                         | other             |
| repository-policy                                          | `./rhino gate run --surface pull-request --base <sha> --head <sha>` — the whole `pull-request` surface: every local gate (with `format-staged` verifying clean), the commit-message and range screens, `md-mermaid-repository`, `md-internal-link`, `md-readme-index`, and the rest. | other             |
| language job (TypeScript, .NET, Flutter, Java, Go, Python) | `nx affected -t typecheck,lint,test:quick` (plus `compat:min-version` where declared) — types/lint, Unit runtime, and applicable static coverage; no Integration/E2E runtime                                                                                                         | affected projects |
| quality-gate                                               | Sentinel join — `needs: [repository-policy, typescript, dotnet, flutter, java, go, python]`; fails if any needed job failed. Runs no other command.                                                                                                                                  | other             |

All jobs except the join run in parallel. No `test:integration`/`test:e2e`: the language jobs run the
fast set that no local hook runs.

## Target Standard

Historical: the 2026-07 plan synthesized a gate-check standard by picking the strongest wiring per
surface. It is a record, not a current target. The named winner per surface:

> **An aggregate audit is not an enforcement path.** Gates invoke validators directly by `command:`;
> nothing invokes an umbrella command such as a retired harness aggregate. Wiring a new validator into
> an aggregate therefore gives it coverage when someone types the aggregate, and **no CI
> enforcement**. A validator is enforced only once it is a `gates:` entry with a declared surface —
> observed during `update-harness-support` Phase 10, where the catalog drift guard needed its own
> path-gated entry to deliver the claim its plan made.

| Surface                                                                                | Standard (winner)                                                                                                                                                                 | Rationale                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **commit-msg**                                                                         | `npx --no -- commitlint --edit "$1"` + `@commitlint/config-conventional`                                                                                                          | Conventional Commits, locked.                                                                                                                                                                                                                                                                                          |
| **Tool-lint (file-type, via lint-staged)**                                             | shellcheck/hadolint/actionlint as lint-staged entries, run at commit (staged) + CI (`--diff`)                                                                                     | Tool-linting is pure file-type dispatch — lint-staged already does this for formatters, so one mechanism covers both; no per-project Nx graph, and changed-files-only avoids the whole-repo glob tripping on stray `local-tmp/*.sh`; standalone `shell:lint`/`dockerfiles:lint`/`actions:lint` Nx targets are dropped. |
| **PR quality-gate filename**                                                           | `pr-quality-gate.yml`                                                                                                                                                             | "pr" is clearer than "commons" for the gate's role.                                                                                                                                                                                                                                                                    |
| **Markdown workflow filename**                                                         | None — deleted                                                                                                                                                                    | Markdown validation is folded into the gates (per-file md validators in the lint-staged job; `md internal-link validate` as the `md-links` gate job) — `validate-markdown.yml`/`markdown-validate.yml` is removed.                                                                                                     |
| **Env workflow filename**                                                              | `validate-env.yml` (standalone)                                                                                                                                                   | The one check that keeps a standalone workflow (secrets-adjacent, parallels the env-staged-guard carve-out).                                                                                                                                                                                                           |
| **Markdown validator set**                                                             | Per-file formatting/tool lint in lint-staged; cross-file links in the repo-wide gate                                                                                              | Identical authored-file safeguards; no runtime or corpus-wide test check runs pre-commit.                                                                                                                                                                                                                              |
| **BDD coverage set (PR gate)**                                                         | Every applicable static `test:coverage:*` through affected `test:quick`; spec links via repo-wide validation                                                                      | Coverage validators never execute tests; repeated primary keywords are valid for a coherent journey.                                                                                                                                                                                                                   |
| **pre-push scoped validator set**                                                      | Union including `governance:vendor-audit-validation`                                                                                                                              | Included.                                                                                                                                                                                                                                                                                                              |
| **Hook/gate step order**                                                               | See [Lifecycle Stages](#lifecycle-stages)                                                                                                                                         | The registry-backed hook and PR-gate sequence is restated in the Lifecycle Stages section of this document; the registry is normative.                                                                                                                                                                                 |
| **CRON pipeline shape**                                                                | `*-test-local-deploy-{stag,prod}.yml` + paired `*-test-{stag}.yml` calling shared `_reusable-*` workflows                                                                         | Reusable-workflow factoring keeps the CRON pipeline shape in one place.                                                                                                                                                                                                                                                |
| **Rhino source identity** (`src/` — including `src/tests/`, `project.json`, `LICENSE`) | Historical: the former in-tree source was held byte-identical with another repository, retired 2026-09-19                                                                         | The in-tree source and its parity machinery no longer exist; RHINO's source lives only upstream.                                                                                                                                                                                                                       |
| **`repo-config.yml` schema validation**                                                | `Rhino repo-config validate` — strict-deserialize schema check (deny-unknown-fields + required/enum checks), wired at pre-commit (staged-gated fast path) and the PR quality gate | Converts the `repo-config.yml` schema boundary from prose review into an enforced, automated gate.                                                                                                                                                                                                                     |

## Divergence Policy

Historical: the 2026-07 plan held the standardization layer identical across two repositories, with
the only sanctioned variation being what each repository actually ships (its project/app set) and the
data that follows from it. No such invariant binds any repository now.

### Rhino Byte-Identity Boundary

Historical: this boundary applied to the former in-tree Rhino source, retired 2026-09-19 (PR #549).
RHINO's source now lives only upstream, so no in-tree byte-identity boundary remains, and no repository
holds another's source tree, command surface, or `repo-config.yml` key set identical. The archived
2026-07 technical record preserves the former synthesis approach and acceptance criteria.

### Allowed Divergence

The following variations are not flagged as drift:

- **App set and per-app deploy CRONs** — `ose-public` ships content/web apps (`ose-www`,
  `ayokoding-www`, `organiclever-www`, `*-app-web`, `*-be`). It keeps only the deploy CRON workflows
  for apps it actually ships, and those deploy CRONs push to real Vercel/self-hosted environments.
- **Language gate jobs** — the PR gate's per-language jobs (golang, jvm, dotnet, python, rust, elixir,
  clojure, dart, typescript) exist only for languages present in this repository.
- **lint-staged formatter entries** — only for languages present (for example `*.go`, `*.{ex,exs}`
  exist where that language ships). The common entries are `*.md`, `*.json`, `*.{yml,yaml}`,
  `*.{css,scss}`, `*.rs`, `*.fs`.
- **Gate-entry data** — the repository declares only the formatter and language entries supported by
  its tracked files, but every declared hook or CI command must be an entry in its own gate registry.

### Drift

The 2026-07 plan listed these items to converge; they are history, not a current requirement:

- Workflow **filenames** for the shared gates (PR gate, markdown, env).
- The **validator set** inside the markdown workflow and the specs-gate.
- The **invocation mechanism** for shell/docker/actions lint (inline shell vs. lint-staged file-type
  entry).
- The **pre-push scoped validator set** (governance vendor audit presence).
- The **job skeleton/names** in the PR gate (detect, markdown, naming, env, specs-gate, quality-gate
  sentinel; formatting is lint-staged at commit, not a gate job).
- The **placement** of env validation (standalone workflow vs. folded into the PR gate).
- The **Nx target names** invoked by hooks/CI, and the Rhino target set itself: `fmt`/`format:check`
  targets (removed — formatting via lint-staged), shell/docker/actions tool-lint (folded into
  lint-staged, not Nx targets), the env/governance/binding validators run as direct `./rhino` calls
  in gates (not `nx run Rhino:` targets).

## Verification Snapshot (2026-07-01)

> **Scope note (2026-08-16)**: this snapshot is a historical record; no row below obligates work
> against any repository.

Verified 2026-07-01 in `ose-public` by directly running the acceptance command for every mechanics
row (not by inspecting config alone). ✅ = verified; ⚠️ = tracked, non-blocking divergence with a
linked follow-up; allowed-divergence rows (app set, language gates, lint-staged formatter entries)
are excluded per [Divergence Policy](#divergence-policy).

| Mechanics row                                                                                         | Status | Note                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-gate / markdown / env workflow filenames                                                           | ✅     | `pr-quality-gate.yml`, `validate-env.yml`; no standalone markdown workflow anywhere.                                                                                                                                                              |
| Markdown validator set (per-file + repo-wide)                                                         | ✅     | markdownlint-cli2 + mermaid + heading-hierarchy + naming + frontmatter (lint-staged; heading-hierarchy and naming delegate to the pinned RHINO, and mermaid hands it each diagram file); `md internal-link validate` (repo-wide gate).            |
| lint-staged deterministic formatter/tool-linter set                                                   | ✅     | Entries in `package.json` follow the allowed language formatter divergence.                                                                                                                                                                       |
| Repo-wide cross-file pre-push gates (md-links, readme-index, harness-duplication, convention-license) | ✅     | All 4 present as direct `cargo run` calls in `.husky/pre-push` and the CI gate, accurate as of this row's 2026-07-01 verification pass (see the 2026-08-09 dispatch-mechanism note below the table for the current state).                        |
| static BDD coverage set (`test:coverage:*`)                                                           | ✅     | Applicable validators run through quick without runtime execution.                                                                                                                                                                                |
| Lint invocation mechanism (lint-staged, no bare tool-lint Nx targets)                                 | ✅     | Confirmed.                                                                                                                                                                                                                                        |
| Pre-push governance-vendor presence                                                                   | ✅     | Path-gated.                                                                                                                                                                                                                                       |
| Hook/gate step order                                                                                  | ✅     | Canonical 4-step pre-commit order (env-guard→lint-staged→bindings-generate→lockfile-sync) and pre-push order match [Lifecycle Stages](#lifecycle-stages).                                                                                         |
| Rhino target-key set                                                                                  | ✅     | 21 sorted keys in the then in-tree Rhino `project.json` (verified via `jq -r '.targets\|keys[]'\|sort`).                                                                                                                                          |
| Rhino command set, verb-last                                                                          | ✅     | `specs counts validate` and the `behaviour-coverage`/`domain-coverage` verbs exist; the former standalone `bc`/`ul` leaves (already-duplicate logic vs. `structure validate`) were removed.                                                       |
| `repo-config.yml` section schema                                                                      | ✅     | 6 top-level sections (`harness`, `coverage`, `specs`, `instruction-size`, `env-contract`, `env-injection`), accurate as of this row's 2026-07-01 verification pass (see the 2026-08-13 schema-rename note below the table for the current state). |
| Role-applicable targets on every project                                                              | ✅     | Every behaviour owner exposes `test:unit`; `test:integration` and `test:e2e` exist only where their real boundaries apply, with no no-op placeholders. Dedicated adapter projects expose only their owned runtime layer.                          |
| `test:quick` composition (types/lint → Unit → all applicable static coverage)                         | ✅     | Serial, closed composition; Integration/E2E runtime is unreachable.                                                                                                                                                                               |
| Native Unit-runtime coverage ≥99% line, no runtime `test:coverage` target, no Codecov                 | ✅     | Native coverage is enforced by every behaviour-owning source project's `test:unit`, while `test:coverage:*` remains static. Dedicated E2E projects do not own a Unit threshold and do not exempt their source owner.                              |
| `format` via file-type lint-staged, no per-project `format` target                                    | ✅     | Confirmed.                                                                                                                                                                                                                                        |
| pre-push ≡ PR quality gate runs only `test:quick`                                                     | ✅     | `test:integration`/`test:e2e` never appear in any gate surface; run manually for impacted scope and completely on schedule.                                                                                                                       |
| Per-adapter static coverage (`test:coverage:*`)                                                       | ✅     | Project-native validators require Unit plus every applicable adapter or valid higher-layer exemption; no central registry, `@covers`, `@wip`, or echo placeholder remains.                                                                        |
| Canonical CI workflow names present                                                                   | ✅     | `pr-quality-gate.yml` and `validate-env.yml` present; CI matrix entries derive from the gate registry.                                                                                                                                            |
| Worktree-agnostic guardrails                                                                          | ✅     | Verified from both the primary checkout and a linked worktree.                                                                                                                                                                                    |
| specs/ C4 structure (every app + every lib)                                                           | ✅     | Every spec area has its role-appropriate architecture artifacts and one recursive `behaviours/` corpus — including all app-level libs that were missing this structure entirely before this pass.                                                 |

All CI runs for the final commit on `main` are green (a transient jar-download flake on
one `ose-public` run was confirmed via a clean re-run with zero code changes).

**Dispatch-mechanism note (2026-08-09, not part of the 2026-07-01 verification pass above)**: the
release-build `cargo run` dispatch (via `the upstream Rhino repository/Cargo.toml`) cited by the
"Repo-wide cross-file pre-push gates" row was superseded in `ose-public` by the
`./rhino` resolver shim created in this repo's `optimize-cis` PR
(`./rhino`, added 2026-08-09). This note records the mechanism change
without re-dating the table above, which remains a historical snapshot of the 2026-07-01 run.

**Language-port note (2026-08-30, also not part of the 2026-07-01 verification pass above)**:
`Rhino` was ported from Rust to F# (`rewrite-Rhino-to-fsharp` plan), so the `cargo run`
dispatch above and the `env staged-guard validate` "Rust command" phrasing in the "Hook/gate step
order" row both describe a mechanism that no longer exists — both then ran the F# binary via the
then-current resolver described in the dispatch-mechanism note above. The in-tree F# CLI was itself
retired on 2026-09-19 (PR #549); `./rhino` now bootstraps the independently released RHINO executable
pinned in `rhino.lock`. The table itself is left as the historical 2026-07-01 snapshot rather than rewritten in place.

**Schema-rename note (2026-08-13, not part of the 2026-07-01 verification pass above)**: the
`repo-config.yml` `instruction-size:` top-level section cited by the "`repo-config.yml` section
schema" row was renamed to `governance-word-budget:` in `ose-public` by this repo's
`optimize-governance-md` plan (Phase 1b). This note records the rename without re-dating the table
above, which remains a historical snapshot of the 2026-07-01 run and is accurate for that date.

**Gate-output-semantics note (2026-08-30, not part of the 2026-07-01 verification pass above)**: a
single check's own verbose output text (e.g. `governance readme-index validate` printing
`FAILED: N finding(s)`) is **not** the same signal as that check's PASS/FAIL status on `gate run`'s
own summary line. The then in-tree `Rhino`'s `format_text`/`format_json` reporters computed a check's own
"FAILED"/`status` text purely from whether its finding list is non-empty, independent of the
registry's `fail-kinds` filtering — which is what actually decides whether that non-empty finding
list fails the gate's exit code. `gate run` always executes every declared check regardless of
individual outcome and prints each one's real PASS/FAIL verdict on its own summary line; a check's
mid-stream "FAILED" text is informational, not that verdict. Discovered during
`rewrite-Rhino-to-fsharp`'s Phase 9c follow-up, where a real `parity-manifest` gate failure was
mistaken for a `governance-readme-index` failure because of pre-existing, already-deferred
"unannotated" findings printing "FAILED" text on a check whose actual summary line read `PASS`. When
debugging a current gate failure, run `./rhino gate run --surface <surface>` and read its final
per-check summary line, not any individual check's own verbose mid-stream text.
