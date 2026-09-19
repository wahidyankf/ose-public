---
title: SDLC Gate Standard
description: Target standard for gate mechanics across ose-public and the private sibling — identical check set, order, and invocation mechanism; only project/app set diverges
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
current executable contract: Rhino is now an external, checksum-pinned v0.4 artifact and the
repository no longer contains an in-tree Rhino application. The dated analyses below remain useful
as history only.

## Current stable v0.4 operating contract

`repo-config.yml` and its checksum-pinned `./rhino` binary are the authoritative contract. Run
`./rhino gate list --output text` to inspect every declared surface; the current registry has
`pre-commit`, `commit-msg`, `pre-push`, and `pull-request` only. It has no `ci` surface and `gate
list` does not filter by surface. Run a declared surface with `./rhino gate run --surface <name>`.

The supported repository-level checks include `./rhino repo-config validate`, `./rhino gate
validate`, `./rhino harness adapters generate`, `./rhino harness adapters validate`, `./rhino env
validate`, `./rhino governance vendor validate`, `./rhino governance word-budget validate`, and
`./rhino md internal-link validate`. Generated adapters are routes to canonical `AGENTS.md`,
`.agents/agents/`, and `.agents/skills/`; never hand-edit a generated adapter.

The remainder is a historical record, not a source of commands or current ownership claims.

## Lifecycle Stages

This historical section records the former target mechanics. For current commands, use the stable
contract above and the registry directly.

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

Every command carries exactly one of four controlled scope values:

- **affected file-type** — files matching a glob, limited to the changed set (staged at pre-commit;
  `--diff` at PR). For example: lint-staged formatters, tool-lint, per-file markdown validators.
- **all file-type** — files matching a glob across the whole repository. For example: `md links
validate` and `env validate`.
- **affected projects** — the touched Nx project graph (`nx affected`); per affected project only. For
  example: `test:quick`, structural specs at pre-push and PR.
- **other** — not file-type or project scoped: the commit-message text, binding regeneration from the
  whole `.claude/` tree, the path-gated governance validators, and the `detect`/`quality-gate` CI
  plumbing.

The same check moves only along this scope axis between local and CI surfaces. For example,
file-scoped checks are staged locally and recomputed from the PR or push change set in CI.

### Gate Composition Rule

One identity, one formatter verification rule, and one exclusion govern every stage:

1. **`(pre-commit ∪ pre-push) == PR gate`** — this was the former parity objective. The current
   registry is normative; inspect it with `./rhino gate list --output json`.

2. **Every formatter mutation has one CI verifier.** The local mutation auto-fixes where permitted;
   the linked `format-verify-*` check independently fails on unformatted pushed code.

3. **Heavy/uncacheable tiers never run in any hook or PR/main gate.**
   Run impacted `test:integration` and `test:e2e` targets manually during development/review and
   complete suites on schedule. `deps:audit` remains scheduled; none belongs to a gate surface.

**Gate rule summary**: `(pre-commit ∪ pre-push) == PR gate` — the registry-defined check set reaches
the PR and push-to-main gate. `test:integration` and `test:e2e` run only through manual impacted or
scheduled/manually dispatched full-quality workflows; `deps:audit` remains scheduled. None runs in
a gate.

Independent checks run in parallel within every stage: CI gates run as parallel GitHub Actions jobs;
local hooks run the per-project `nx affected` leg concurrently with the repo-wide validators
(`md links validate`, `env validate`, governance). Ordering only matters where a real data dependency
exists.

### Stage 1: pre-commit

`.husky/pre-commit`, in this exact order; stops at first failure:

| #   | Command                             | Scope              | What it does                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `the public-safety tree check`      | affected file-type | Aborts the commit if any real `.env*` file is staged (the one exception is `.env.example`).                                                                                                                                                                                                                                            |
| 2   | `lint-staged`                       | affected file-type | Dispatches formatters and deterministic file-type linters over staged files. It never runs Unit, Integration, E2E, `test:quick`, or static cross-corpus coverage. **`md links validate`, `md readme-index validate`, and `harness duplication validate` are not here** — they are cross-file validators (pre-push/PR/main, repo-wide). |
| 3   | `./rhino harness adapters generate` | other              | Historical projection step. Current generation routes from the declared canonical `.agents/` source and is an explicit transaction; it does not author adapters by hand.                                                                                                                                                               |
| 4   | (lockfile-sync hook step)           | affected file-type | Regenerates and re-stages `package-lock.json` for any app whose `package.json` is staged (reproducible-envs guardrail).                                                                                                                                                                                                                |

Pre-commit is the fast stage — it does not run `test:quick`. Per-project `typecheck`/`lint`/`test:unit`
run at pre-push via `test:quick`, never here.

The tool-linters (`shellcheck`/`hadolint`/`actionlint`) are pure file-type dispatch — exactly what
lint-staged already does for formatters — so they are lint-staged entries, not `nx run` targets. They
stay tool-gated (skip-with-hint when the linter is absent locally — CI is the hard gate).

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

`.husky/commit-msg`. Identical in both bound repos:

| #   | Command                              | Scope | What it does                                                                                                                          |
| --- | ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `npx --no -- commitlint --edit "$1"` | other | Validates the commit message against Conventional Commits (`@commitlint/config-conventional`) — scope is the message text, not files. |

### Stage 3: pre-push

`.husky/pre-push`, in this exact order; stops at first failure:

| #   | Command                                   | Scope              | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `nx affected -t test:quick --parallel=1`  | affected projects  | Runs types/lint, Unit runtime for behaviour owners, and every applicable static `test:coverage:*` validator. No Integration/E2E runtime is reachable.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2   | `./rhino md internal-link validate`       | all file-type      | The cross-file markdown validator — relative paths and `#fragment` anchors resolve repo-wide. Repo-wide (not lint-staged) because adding, deleting, or renaming any markdown file can break links in untouched files.                                                                                                                                                                                                                                                                                                                                                                                   |
| 3   | `./rhino env validate`                    | all file-type      | Validates each app's `.env.example` against the repo env contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | `./rhino governance vendor validate`      | other (path-gated) | Governance docs and the canonical root instruction surface stay vendor-neutral, no vendor leakage. Two gate entries, one path each (the validator takes a single positional path). **Trigger:** `repo-governance/**.md`; `AGENTS.md`. `CLAUDE.md` is exempt by design — its Platform Binding Examples heading covers the whole body.                                                                                                                                                                                                                                                                    |
| 5   | `./rhino harness adapters validate`       | other (path-gated) | Split: `./rhino harness adapters validate` checks the instruction pair first; then all-harness binding parity across every harness listed in `repo-config.yml` `harness:`: generated-tier byte-parity (`.claude/` → `.opencode/`, `.codex/`, `.agents/`), catalog coverage, and color/tier translation-map coverage (absorbed from the former `cross-vendor:parity-validation` gate). **Trigger:** binding or parity surfaces — agents, `AGENTS.md`, `CLAUDE.md`, `repo-governance/**.md`, native-tier shadow files.                                                                                    |
| 6   | `./rhino governance word-budget validate` | other (path-gated) | Auto-loaded instruction files stay within their word budgets. Per-surface budgets run first in the pinned RHINO, from `repo-config.yml` top-level `governance-word-budget.surfaces` (no registry-merge): `repo-governance/**/*.md`, `AGENTS.md`, `CLAUDE.md`, `**/README.md`, and one glob per harness binding directory declared in `harness:`. The F# remainder then checks only the resolved `@`-import tree (`extensions.Rhino.governance-word-budget.resolved_tree`). Registered in the `gates:` registry and armed at pre-push and in CI. **Trigger:** any covered surface, or `repo-config.yml`. |

Each governance validator (rows 4–6) is path-gated — invoked only when its trigger path is in the
changed set. Row 6 is registered in the `gates:` registry and blocks pre-push and CI like the rest;
it also runs on demand and inside `repo-governance audit`.

Project BDD coverage runs inside `test:quick` through static targets:

| Nx target                 | Validates                                                                        | Applies to              |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| `test:coverage:<layer>`   | Exactly-one implementation or valid higher-layer exemption per expanded scenario | Each applicable adapter |
| `test:coverage:behaviour` | Recursive corpus, explicit When/Then, bindings, adapters, and exemption syntax   | Every owner/E2E project |

Repeated primary keywords are valid for one continuous journey. The repository-wide Markdown link
gate continues to cover `specs/**.md`.

### Stage 4: PR Quality Gate

`pr-quality-gate.yml`. Job skeleton identical across repos (only language-gate jobs and infra-only IaC
jobs differ). `$P` = `$(($(nproc)-1))`.

| Job                                                               | Exact command(s) CI runs                                                                                                                                       | Scope              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| detect                                                            | `nx show projects --affected --base=origin/main --head=HEAD --json` — derives the affected-language set that drives the `<lang>` matrix. Runs no test.         | other              |
| lint-staged                                                       | `lint-staged --diff="origin/main...HEAD"` — deterministic changed-file formatting and file-type linting; no runtime tests                                      | affected file-type |
| `<lang>` gate (one job per affected language)                     | `nx affected -t test:quick --base=origin/main --head=HEAD --parallel=1` — types/lint, Unit runtime, and applicable static coverage; no Integration/E2E runtime | affected projects  |
| md-links                                                          | `./rhino md internal-link validate` — repo-wide (NOT `--diff`: a deleted/renamed file breaks links in untouched files)                                         | all file-type      |
| env                                                               | `./rhino env validate`                                                                                                                                         | all file-type      |
| governance (each runs only if its trigger path is in the PR diff) | `./rhino harness adapters validate` · `./rhino governance vendor validate` · `./rhino governance word-budget validate`                                         | other (path-gated) |
| quality-gate                                                      | Sentinel join — `needs: [detect, lint-staged, <lang>…, md-links, env, governance]`; green only when every required job is green. Runs no command.              | other              |

All jobs run in parallel (matrix + independent jobs); `quality-gate` is the join point. No
`test:integration`/`test:e2e` — same fast set as pre-push, recomputed server-side and widened to cover
everything the two local hooks run.

## Target Standard

The gate-check standard is synthesized by picking the strongest wiring per surface, even where that
means changing `ose-public`. The named winner per surface:

> **An aggregate audit is not an enforcement path.** Gates invoke validators directly by `command:`;
> nothing invokes an umbrella command such as a retired harness aggregate. Wiring a new validator into
> an aggregate therefore gives it coverage when someone types the aggregate, and **no CI
> enforcement**. A validator is enforced only once it is a `gates:` entry with a declared surface —
> observed during `update-harness-support` Phase 10, where the catalog drift guard needed its own
> path-gated entry to deliver the claim its plan made.

| Surface                                                                                | Standard (winner)                                                                                                                                                                 | Rationale                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **commit-msg**                                                                         | `npx --no -- commitlint --edit "$1"` + `@commitlint/config-conventional`                                                                                                          | Already identical in both — lock it.                                                                                                                                                                                                                                                                                   |
| **Tool-lint (file-type, via lint-staged)**                                             | shellcheck/hadolint/actionlint as lint-staged entries (both bound repos), run at commit (staged) + CI (`--diff`)                                                                  | Tool-linting is pure file-type dispatch — lint-staged already does this for formatters, so one mechanism covers both; no per-project Nx graph, and changed-files-only avoids the whole-repo glob tripping on stray `local-tmp/*.sh`; standalone `shell:lint`/`dockerfiles:lint`/`actions:lint` Nx targets are dropped. |
| **PR quality-gate filename**                                                           | `pr-quality-gate.yml`                                                                                                                                                             | Both repos already use it; "pr" is clearer than "commons" for the gate's role.                                                                                                                                                                                                                                         |
| **Markdown workflow filename**                                                         | None — deleted in all 3                                                                                                                                                           | Markdown validation is folded into the gates (per-file md validators in the lint-staged job; `md links validate` as the `md-links` gate job) — `validate-markdown.yml`/`markdown-validate.yml` is removed everywhere.                                                                                                  |
| **Env workflow filename**                                                              | `validate-env.yml` (standalone)                                                                                                                                                   | Infra style; the one check that keeps a standalone workflow (secrets-adjacent, parallels the env-staged-guard carve-out).                                                                                                                                                                                              |
| **Markdown validator set**                                                             | Per-file formatting/tool lint in lint-staged; cross-file links in the repo-wide gate                                                                                              | Identical authored-file safeguards; no runtime or corpus-wide test check runs pre-commit.                                                                                                                                                                                                                              |
| **BDD coverage set (PR gate)**                                                         | Every applicable static `test:coverage:*` through affected `test:quick`; spec links via repo-wide validation                                                                      | Coverage validators never execute tests; repeated primary keywords are valid for a coherent journey.                                                                                                                                                                                                                   |
| **pre-push scoped validator set**                                                      | Union including `governance:vendor-audit-validation`                                                                                                                              | Both bound repos include it.                                                                                                                                                                                                                                                                                           |
| **Hook/gate step order**                                                               | See [Lifecycle Stages](#lifecycle-stages)                                                                                                                                         | The normative registry-backed hook and PR-gate sequence is defined in the Lifecycle Stages section of this document.                                                                                                                                                                                                   |
| **CRON pipeline shape**                                                                | `*-test-local-deploy-{stag,prod}.yml` + paired `*-test-{stag}.yml` calling shared `_reusable-*` workflows                                                                         | Public's reusable-workflow factoring is cleanest; infra keeps its own app set but adopts the naming and reusable-call shape.                                                                                                                                                                                           |
| **Rhino source identity** (`src/` — including `src/tests/`, `project.json`, `LICENSE`) | Byte-identical across both bound repos — zero carve-outs, canonical source carries the union command surface (repo-inapplicable verbs dormant, not absent)                        | A committed manifest gate enforces the hermetic boundary and the scheduled parity audit detects cross-repository drift.                                                                                                                                                                                                |
| **`repo-config.yml` schema parity**                                                    | `Rhino repo-config validate` — strict-deserialize schema check (deny-unknown-fields + required/enum checks), wired at pre-commit (staged-gated fast path) and the PR quality gate | Converts the "identical key set across `repo-config.yml`" boundary from prose review into an enforced, automated gate.                                                                                                                                                                                                 |

## Divergence Policy

Per the identical-result invariant, the standardization layer is identical across both bound repos. The
only sanctioned variation is what each repo actually ships (its project/app set) and the data that
follows from it. Everything in "Drift" below must converge to one form.

### Rhino Byte-Identity Boundary

`the upstream Rhino repository` is held to a stricter, second-pass target beyond the gate mechanics above: **zero
carve-outs**. `the upstream Rhino repository`'s `src/` (including `src/tests/`), `project.json`, and `LICENSE`, plus
the Gherkin behaviour tree at `the upstream Rhino specification corpus**` (every `.feature` file and
every `README.md`), are byte-identical across `ose-public` and the private sibling. The
canonical source carries the
**union command surface** — every repo's `Rhino` binary exposes the full command superset, and a
command with no applicable projects in a given repo (for example, `java` in `ose-public`) is
**dormant, not absent**, rather than removed from the binary. A **schema-parity gate**
(`Rhino repo-config validate`, run at pre-commit (staged-gated) and the PR quality gate in every
repo) enforces
that each repo's `repo-config.yml` carries an **identical key set** — values may differ per repo, but
no repo may add an unknown key or omit a required one, so the byte-identical source can never
silently drift out of sync with the data it reads.

Within `the upstream Rhino repository` itself, the only sanctioned divergence anywhere is:

1. **Each repo's app/language set** — the data `repo-config.yml` carries per repo (coverage
   registry, env-validation scan paths) differs, driving which of the union's dormant commands are
   actually exercised in that repo.
2. **The CI runner label** (for example, the private sibling's `[self-hosted, linux, ose-self-hosted]`) — a
   CI-workflow-YAML concern that lives outside `the upstream Rhino repository` entirely, so it never affects source
   byte-identity.

The archived 2026-07 technical record preserves the former synthesis approach and acceptance criteria.

**Known exception (tracked, not yet reconciled): `doctor/tools.rs` tool-provisioning extensions.**
The private sibling legitimately needs IaC tool provisioning (the same infra-only IaC surface named under
[Allowed Divergence](#allowed-divergence) below) that the other bound repos do not, and its
`doctor/tools.rs` was originally observed to carry extra tool-definition and test entries beyond the
canonical set as a result. **Re-measured 2026-08-07** (see the linked brief's "Live re-measurement"
section): as of that measurement the two files' `fn`-signature sets and `DOCTOR_TOOL_INVENTORY` are
identical, and the file's entire diff is a separately-tracked, unpropagated fix (task #238) — not an
extra-tool-definition surplus. The structural tension this note describes may still be real in
principle, but the specific divergence that motivated writing it down is not currently observable; do
not treat this note alone as evidence of present drift. The "zero carve-outs" target above is stated
as the goal for the whole `src/` tree; this one file has a structural tension with that goal that
predates and is independent of this document's propagation work — the byte-identity boundary either
needs a narrower `BOUNDARY_PATHS` carve-out for this file, or the parity check needs an
accepted-superset comparison mode (canonical subset + declared per-repo extensions) instead of a
literal full-file match. Until one of those lands as a code change, treat drift reports naming only
`doctor/tools.rs`'s known IaC-tooling additions as this tracked exception, not as a new propagation
gap — but still diff the file in full on every byte-identity check, since a new, unrelated drift can
hide alongside the known one. Tracked as a follow-up idea brief:
[`Rhino-tools-superset-carveout`](../../plans/ideas/q2-not-urgent-important/Rhino-tools-superset-carveout.md).

**Third resolution now available (2026-09-08, `lms-init` DU1).** The two fixes named above — a
narrower `BOUNDARY_PATHS` carve-out, or an accepted-superset comparison mode — both work by
loosening the byte-identity check. A third does not: `repo-config.yml` now carries
`doctor.extra-tools`, so a repository declares the tools it alone needs in a file that was never
byte-identical, and `the upstream Rhino repository` stays literally identical with no carve-out and no superset
mode. A per-repo tool no longer requires a per-repo source difference. This records the mechanism;
it does not by itself close the linked brief, which also covers the test-entry surplus and is a
separate decision.

### Allowed Divergence

The following variations are not flagged as drift:

- **App set and per-app deploy CRONs** — `ose-public` ships content/web apps (`ose-www`,
  `ayokoding-www`, `organiclever-www`, `*-app-web`, `*-be`); the private sibling ships
  `coralpolyp`. Each repo keeps only the deploy CRON workflows for apps it actually ships, and both
  repos' deploy CRONs push to real Vercel/self-hosted environments.
- **Language gate jobs** — the PR gate's per-language jobs (golang, jvm, dotnet, python, rust, elixir,
  clojure, dart, typescript) exist only for languages present in that repo.
- **Infra-only IaC gates** — `terraform fmt`/`validate`/`tflint`, `ansible-lint`, `yamllint` exist
  only in the private sibling, in both hooks and the PR gate.
- **Self-hosted runner labels** — the private sibling runs on `[self-hosted, linux, ose-self-hosted]`.
- **lint-staged formatter entries** — only for languages present (for example `*.go`, `*.{ex,exs}`
  exist where that language ships). The common entries (`*.md`, `*.json`, `*.{yml,yaml}`,
  `*.{css,scss}`, `*.rs`, `*.fs`) must match across all repos.
- **Gate-entry data** — each repository declares only the formatter and language entries supported by
  its tracked files, but every declared hook or CI command must be an entry in its own gate registry.

### Drift

The following must converge — this is the work of the standardization plan:

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
  lint-staged, not Nx targets), the env/governance/binding validators run as direct `rhino-bin.sh` calls
  in gates (not `nx run Rhino:` targets).

## Parity Status

> **Scope note (2026-08-16)**: the table below was verified on a run that also covered a repository
> since removed from the bound set — see
> [Related Repositories §Repositories outside the parity set](./related-repositories.md#repositories-outside-the-parity-set).
> Rows have been re-scoped to the surviving pair; no row below obligates work against any other repo.

Verified 2026-07-01 across `ose-public` and the private sibling by directly running the acceptance
command for every mechanics row (not by inspecting config alone; corrected same-day after a follow-up
audit found two rows below were marked ✅ while infra's pre-commit still ran `test:quick` in the wrong
stage via a legacy monolith that bypassed lint-staged — both fixed before this table's final pass). ✅ =
byte/behaviour-identical across both; ⚠️ = tracked, non-blocking divergence with a linked follow-up;
allowed-divergence rows (app set, language gates, infra-only IaC, runner labels, lint-staged formatter
entries) are excluded per [Divergence Policy](#divergence-policy).

| Mechanics row                                                                                         | Status | Note                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-gate / markdown / env workflow filenames                                                           | ✅     | `pr-quality-gate.yml`, `validate-env.yml` in both; no standalone markdown workflow anywhere.                                                                                                                                                                                                                                                                                           |
| Markdown validator set (per-file + repo-wide)                                                         | ✅     | markdownlint-cli2 + mermaid + heading-hierarchy + naming + frontmatter (lint-staged; heading-hierarchy and naming delegate to the pinned RHINO, and mermaid hands it each diagram file); `md links validate` (repo-wide gate).                                                                                                                                                         |
| lint-staged deterministic formatter/tool-linter set                                                   | ✅     | Identical entries in both `package.json` except allowed language formatter divergence.                                                                                                                                                                                                                                                                                                 |
| Repo-wide cross-file pre-push gates (md-links, readme-index, harness-duplication, convention-license) | ✅     | All 4 present as direct `cargo run` calls in both repos' `.husky/pre-push` + both CI gates, accurate as of this row's 2026-07-01 verification pass (see the 2026-08-09 dispatch-mechanism note below the table for the current state).                                                                                                                                                 |
| static BDD coverage set (`test:coverage:*`)                                                           | ✅     | Applicable validators run through quick without runtime execution.                                                                                                                                                                                                                                                                                                                     |
| Lint invocation mechanism (lint-staged, no bare tool-lint Nx targets)                                 | ✅     | Confirmed in both; infra's D9 Terraform/Ansible/YAML lint is a documented allowed IaC-only addition.                                                                                                                                                                                                                                                                                   |
| Pre-push governance-vendor presence                                                                   | ✅     | Path-gated in both.                                                                                                                                                                                                                                                                                                                                                                    |
| Hook/gate step order                                                                                  | ✅     | Canonical 4-step pre-commit order (env-guard→lint-staged→bindings-generate→lockfile-sync) and pre-push order match [Lifecycle Stages](#lifecycle-stages) in both. infra's step-1 env-guard now runs the same `env staged-guard validate` Rust command as public (the former bash-script mechanism divergence and legacy pre-commit-monolith `test:quick` misplacement are both fixed). |
| Rhino target-key set                                                                                  | ✅     | 21 identical sorted keys in both `the upstream Rhino repository/project.json` (verified via `jq -r '.targets\|keys[]'\|sort`, byte-diff clean).                                                                                                                                                                                                                                        |
| Rhino command set, verb-last                                                                          | ✅     | `specs counts validate` and the `behaviour-coverage`/`domain-coverage` verbs are now identical in both; infra's former standalone `bc`/`ul` leaves (already-duplicate logic vs. `structure validate`) are removed.                                                                                                                                                                     |
| `repo-config.yml` section schema                                                                      | ✅     | 6 identical top-level sections (`harness`, `coverage`, `specs`, `instruction-size`, `env-contract`, `env-injection`) in both, accurate as of this row's 2026-07-01 verification pass (see the 2026-08-13 schema-rename note below the table for the current state).                                                                                                                    |
| Role-applicable targets on every project                                                              | ✅     | Every behaviour owner exposes `test:unit`; `test:integration` and `test:e2e` exist only where their real boundaries apply, with no no-op placeholders. Dedicated adapter projects expose only their owned runtime layer.                                                                                                                                                               |
| `test:quick` composition (types/lint → Unit → all applicable static coverage)                         | ✅     | Serial, closed composition; Integration/E2E runtime is unreachable.                                                                                                                                                                                                                                                                                                                    |
| Native Unit-runtime coverage ≥99% line, no runtime `test:coverage` target, no Codecov                 | ✅     | Native coverage is enforced by every behaviour-owning source project's `test:unit`, while `test:coverage:*` remains static. Dedicated E2E projects do not own a Unit threshold and do not exempt their source owner.                                                                                                                                                                   |
| `format` via file-type lint-staged, no per-project `format` target                                    | ✅     | Confirmed in both.                                                                                                                                                                                                                                                                                                                                                                     |
| pre-push ≡ PR quality gate runs only `test:quick`                                                     | ✅     | `test:integration`/`test:e2e` never appear in any gate surface; run manually for impacted scope and completely on schedule.                                                                                                                                                                                                                                                            |
| Per-adapter static coverage (`test:coverage:*`)                                                       | ✅     | Project-native validators require Unit plus every applicable adapter or valid higher-layer exemption; no central registry, `@covers`, `@wip`, or echo placeholder remains.                                                                                                                                                                                                             |
| Canonical CI workflow names present                                                                   | ✅     | `pr-quality-gate.yml` and `validate-env.yml` in every bound repository; CI matrix entries derive from the gate registry.                                                                                                                                                                                                                                                               |
| Worktree-agnostic guardrails                                                                          | ✅     | Verified from both the primary checkout and a linked worktree in both (infra's bare-repo-only layout is the hard case — confirmed via its actual daily worktree execution, not a throwaway check).                                                                                                                                                                                     |
| specs/ C4 structure (every app + every lib)                                                           | ✅     | Every spec area across both repos has its role-appropriate architecture artifacts and one recursive `behaviours/` corpus — including all app-level libs (4 in public, 2 in infra) that were missing this structure entirely before this pass.                                                                                                                                          |

All CI runs for the final commit on each repo's `main` are green (a transient jar-download flake on
one `ose-public` run was confirmed via a clean re-run with zero code changes).

**Dispatch-mechanism note (2026-08-09, not part of the 2026-07-01 verification pass above)**: the
release-build `cargo run` dispatch (via `the upstream Rhino repository/Cargo.toml`) cited by the
"Repo-wide cross-file pre-push gates" row was superseded in `ose-public` by the
`./rhino` resolver shim created in this repo's `optimize-cis` PR
(`./rhino`, added 2026-08-09). This note records the mechanism change
without re-dating the table above, which remains a historical snapshot of the 2026-07-01
cross-repo run; the private sibling's propagation of the shim is tracked separately (see
AC-15 in `plans/done/2026-08-09__optimize-cis/delivery.md`).

**Language-port note (2026-08-30, also not part of the 2026-07-01 verification pass above)**:
`Rhino` was ported from Rust to F# (`rewrite-Rhino-to-fsharp` plan), so the `cargo run`
dispatch above and the `env staged-guard validate` "Rust command" phrasing in the "Hook/gate step
order" row both describe a mechanism that no longer exists — both now run the F# binary via the
`rhino-bin.sh` shim described in the dispatch-mechanism note above. As with that note, the table
itself is left as the historical 2026-07-01 snapshot rather than rewritten in place.

**Schema-rename note (2026-08-13, not part of the 2026-07-01 verification pass above)**: the
`repo-config.yml` `instruction-size:` top-level section cited by the "`repo-config.yml` section
schema" row was renamed to `governance-word-budget:` in `ose-public` by this repo's
`optimize-governance-md` plan (Phase 1b). This note records the rename without re-dating the table
above, which remains a historical snapshot of the 2026-07-01 cross-repo run and is accurate for
that date — `instruction-size:` is still the live section name in the private sibling as of this note. The
rename opens a cross-repo parity obligation (a `repo-config.yml` schema-section rename is exactly the
class of change the [Parity Status](#parity-status) table exists to track); propagation to
the private sibling is not yet scheduled against a specific plan at the time of this note.

**Gate-output-semantics note (2026-08-30, not part of the 2026-07-01 verification pass above)**: a
single check's own verbose output text (e.g. `governance readme-index validate` printing
`FAILED: N finding(s)`) is **not** the same signal as that check's PASS/FAIL status on `gate run`'s
own summary line. `Rhino`'s `format_text`/`format_json` reporters compute a check's own
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
