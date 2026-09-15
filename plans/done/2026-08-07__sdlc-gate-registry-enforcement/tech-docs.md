---
title: "Tech Docs — SDLC Gate Registry Enforcement"
description: Registry schema, rhino-cli gate command surface, conformance matrix, CI matrix wiring, and document amendments
category: explanation
subcategory: plans
tags:
  - ci-cd
  - rhino-cli
  - architecture
  - parity
created: 2026-08-02
---

# Tech Docs — SDLC Gate Registry Enforcement

> **Scope Amendment (2026-08-07)**: the byte-identity design below describes the original four-repo
> boundary; it is narrowed to **`ose-public` + the private sibling** — see
> [delivery.md §Scope Amendment](./delivery.md#scope-amendment-2026-08-07). `beaver-nest` (§2.8) is
> **cancelled**, not executed — `beaver-nest` is slated for future deprecation/merge into
> `ose-public`. `ose-primer` already fulfilled its one-time propagation and is now periodic/manual,
> outside continuous enforcement. The design below is left as originally authored — historical
> record of what was built and why — except where explicitly marked cancelled/superseded inline.
>
> **Planned-path annotation**: `apps/rhino-cli/parity-manifest.sha256`,
> `.github/workflows/dependency-vulnerability-audit.yml`,
> `.github/workflows/rhino-cli-parity-audit.yml`, `apps/rhino-cli/tests/gate_dispatch.rs`,
> `apps/rhino-cli/tests/gate_emit.rs`, `apps/rhino-cli/tests/gate_validate.rs`, and the gate Gherkin
> feature files are **new files**. Named selectors designed by this plan are **new tests** unless
> explicitly identified as current baseline tests.

## 1. Audit Baseline — What Actually Runs Today

Captured 2026-08-02 across all four repos. This table is the conformance baseline the plan closes.
`lint-staged` is listed separately from `pre-commit` because it is the file-type dispatch mechanism
the pre-commit hook delegates to, and it is where most of the drift hides.

`[Repo-grounded]` — every verdict in the table below was captured by reading each repo's actual
`.husky/*`, `package.json` `lint-staged` block, and `.github/workflows/*` files against
`docs/reference/sdlc-gate-standard.md`'s ratified rules on the audit date above; Phase 0 re-verifies
the table against current `main` before Phase 1 begins.

| Check                                                     | lint-staged     | pre-push         | PR gate                       | main-ci   | Verdict                                                                                                              |
| --------------------------------------------------------- | --------------- | ---------------- | ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| `md naming validate`                                      | yes             | —                | —                             | —         | Violates rule — never reaches CI                                                                                     |
| `md frontmatter validate`                                 | yes             | —                | —                             | —         | Violates rule — never reaches CI                                                                                     |
| `convention emoji validate`                               | yes             | —                | —                             | —         | Violates rule — never reaches CI                                                                                     |
| `docker compose config`                                   | yes             | —                | —                             | —         | Violates rule — never reaches CI                                                                                     |
| Formatters (prettier, rustfmt, gofmt, shfmt, fantomas, …) | write           | —                | auto-commit                   | —         | Never verified anywhere                                                                                              |
| `env staged-guard validate`                               | — (hook step 1) | —                | —                             | —         | Staged-only — reads the git index; no CI counterpart can exist. Declare with `carve-out: staged-only`                |
| `harness bindings generate`                               | — (hook step 3) | —                | —                             | —         | Mutation, not a check. Declare as `type: mutation`                                                                   |
| lockfile sync                                             | — (hook step 4) | —                | —                             | —         | Mutation, inline shell. Extract to `git lockfile sync`, declare as `type: mutation`                                  |
| `commitlint`                                              | — (commit-msg)  | —                | —                             | —         | Message-text scope; no file surface. Declare on the `commit-msg` surface                                             |
| `harness bindings validate`                               | —               | path-gated       | —                             | —         | Violates rule — never reaches CI                                                                                     |
| `harness sync validate` / `validate:sync`                 | —               | —                | —                             | —         | Declared in `package.json`, invoked nowhere                                                                          |
| `md mermaid validate`                                     | yes             | —                | —                             | all files | Violates rule — absent from PR gate                                                                                  |
| `md heading-hierarchy validate`                           | yes             | —                | —                             | all files | Violates rule — absent from PR gate                                                                                  |
| `specs:structure-validation`                              | —               | via `test:quick` | pinned `--projects=rhino-cli` | `--all`   | Pinned scope, not affected scope                                                                                     |
| `markdownlint-cli2`                                       | yes             | —                | via `npm run lint:md`         | all files | Conforms                                                                                                             |
| `md links validate`                                       | —               | repo-wide        | repo-wide                     | repo-wide | Conforms                                                                                                             |
| `md readme-index validate`                                | —               | repo-wide        | repo-wide                     | repo-wide | Conforms; absent from the standard's tables                                                                          |
| `harness duplication validate`                            | —               | repo-wide        | repo-wide                     | repo-wide | Conforms; absent from the standard's tables                                                                          |
| `convention license validate`                             | —               | path-gated       | always                        | always    | Conforms; absent from the standard's tables                                                                          |
| `env validate`                                            | —               | repo-wide        | `validate-env.yml`            | repo-wide | Conforms via the standalone workflow                                                                                 |
| `deps:audit`                                              | —               | —                | —                             | —         | Correctly outside every gate (ratified rule 3). Stays out of the registry; gets its own descriptively-named workflow |

Two further structural findings:

- **The PR gate's `format` job carries `if: github.event_name == 'pull_request'`**, so on a direct
  push to `main` the entire `lint-staged` pass is skipped. Every per-file validator is therefore
  absent from the `main` path even where it is present on the PR path.
- **`main-ci.yml` has no `push` trigger** in any repo — `schedule` plus `workflow_dispatch` only. It
  cannot block a merge. The surface the ratified standard calls the "main quality gate" does not gate.

Per-repo variation on the above is small and does not change any verdict:

- The private sibling alone already runs `markdown-per-file` (mermaid, heading-hierarchy) in its PR gate,
  and its pre-push additionally runs `specs structure validate` and `npm run lint:md`. It also adds an
  `iac-lint` gate (terraform, yamllint) the other three do not have.
- `ose-primer` adds per-language gates for its polyglot demo apps and names its audit workflow
  `Nightly Dependency Audit` where the other three use `deps-audit`.
- `beaver-nest` is near-identical to `ose-public` and today carries a **fork** of `rhino-cli`. §2.8
  shows that fork is almost entirely `ose-public`'s app names hardcoded into shared source, and this
  plan ends it.

### 1.1 Readiness refresh — 2026-08-04

`[Repo-grounded]` Re-verified against current `main` at `f60b711f3` (`ose-public`), `0b67746b2` (`ose-primer`),
`346209fc4` (the private sibling), and `cd2ec0e4d` (`beaver-nest`). The hook captures still match all twelve
live hooks; every target `package.json` now matches its live file outside `lint-staged`; the live
`lint-staged` blocks are unchanged; and none of the gate workflow files in the audit table changed
after the final 2026-08-02 audit. The table's gate-surface verdicts therefore remain current.

`beaver-nest` did change in load-bearing ways after that audit, all now reflected in this plan:

- its non-gate `repo-config.yml` data changed with the backend readiness work, so the authored target
  file was refreshed rather than allowed to overwrite those values; the later Vite migration also
  removed the frontend environment-contract and injection entries;
- its complete target `package.json` now preserves the latest development script, dependency pins,
  optional dependencies, and security overrides while changing only `lint-staged` during execution;
- its `rhino-cli` fork gained upstream-worthy F# environment scanning and Git-fixture isolation
  changes, which Phase 11 must absorb before Phase 5 copies canonical down; and
- its repository root is intentionally bare, so Phase 0 and post-merge verification must use an
  attached baseline worktree or ref-level commands rather than root-worktree commands.

`[Repo-grounded]` The latest six-commit advance from `90ba918df` to `cd2ec0e4d` did not touch `apps/rhino-cli`, its
Gherkin tree, or the Husky hooks. It did increase the tracked Shell and F# counts, refresh the two
complete-file targets above, and leave the five-formatter decision unchanged.

`[Repo-grounded]` Current branch-protection observations are also asymmetric: `ose-public` requires the single
`Quality gate` context; `ose-primer` and `beaver-nest` report an unprotected branch (HTTP 404); and
GitHub reports branch protection unavailable for the private repo at its current plan (HTTP 403).
Execution preserves these conditions; changing repository settings is not part of this plan.

## File-Impact Analysis

The tree below is root-relative in each affected repository. A bounded pattern is used only where
the exact set is discovered with `git ls-files` before editing; Phase 0 records that expansion in
the file-touch ledger. `[E]` means edit, `[N]` new, `[D]` delete, and `[G]` generated from the named
canonical source rather than hand-edited. Phases 3–5 apply the same listed root-relative targets in
`ose-primer`, the private sibling, and `beaver-nest` after the canonical `ose-public` changes merge.

```text
.
├── [E] AGENTS.md
├── [E] package.json
├── [E] repo-config.yml
├── [E] scripts/format-elixir.sh
├── .claude/
│   ├── [E] agents/README.md
│   └── [E] skills/README.md
├── .amazonq/
│   └── [G] rules/** and cli-agents/** from AGENTS.md and .claude/**
├── .cursor/
│   └── [G] agents/** from .claude/agents/**
├── .opencode/
│   └── [G] agents/** from .claude/agents/**
├── .husky/
│   ├── [E] commit-msg
│   ├── [E] pre-commit
│   └── [E] pre-push
├── .github/workflows/
│   ├── [E] README.md
│   ├── [E] pr-quality-gate.yml
│   ├── [D] main-ci.yml
│   ├── [D] deps-audit.yml
│   ├── [N] dependency-vulnerability-audit.yml
│   └── [N] rhino-cli-parity-audit.yml
├── [E] apps/crane-cli/project.json
├── [E] apps/ose-be/project.json
├── [E] apps/organiclever-be/project.json
├── [E] libs/fsharp-crane-core/project.json
├── apps/rhino-cli/
│   ├── [E] Cargo.toml
│   ├── [E] Cargo.lock
│   ├── [E] project.json
│   ├── [N] parity-manifest.sha256
│   ├── src/
│   │   ├── [E] cli.rs
│   │   ├── [E] commands.rs
│   │   ├── [D] commands/git_pre_commit.rs
│   │   ├── [D] application/git/pre_commit.rs
│   │   ├── [D] domain/git/staged_files.rs
│   │   ├── [E] internal/git.rs
│   │   ├── [E] infrastructure/git/mod.rs
│   │   ├── [E] application/fs/mock.rs
│   │   ├── [E] application/agents/{bindings.rs,sync_validator.rs}
│   │   ├── [E] application/repo_governance/frontmatter_audit.rs
│   │   ├── [E] application/{domain_coverage/mod.rs,doctor/tools.rs,docs/naming.rs,env/validate.rs}
│   │   └── [E] commands/{specs_validate_counts.rs,specs_coverage.rs}
│   ├── tests/
│   │   ├── [N] gate_dispatch.rs
│   │   ├── [N] gate_emit.rs
│   │   ├── [N] gate_validate.rs
│   │   ├── [N] fsharp_tool_invocation.rs
│   │   ├── [E] agents.rs
│   │   ├── [E] cargo_target_share.rs
│   │   ├── [E] docs.rs
│   │   ├── [E] env.rs
│   │   └── [E] repo_config_data_driven.rs
│   └── [E] tests/** and src/** discovered by
│       `git ls-files apps/rhino-cli/tests apps/rhino-cli/src`
├── specs/apps/rhino/behavior/rhino-cli/gherkin/
│   ├── [N] gate/*.feature
│   └── [E] env/**, harness/**, md/**, and system/{README.md,fsharp-tool-invocation.feature}
├── docs/reference/
│   ├── [E] sdlc-gate-standard.md
│   ├── [E] related-repositories.md
│   ├── [E] platform-bindings.md
│   └── [E] system-architecture/ci-cd.md
├── repo-governance/
│   ├── [E] development/infra/{nx-targets.md,github-actions-workflow-naming.md}
│   ├── [E] development/workflow/git-hook-lifecycle.md
│   └── [E] workflows/plan/{multi-plans-execution.md,plan-multi-repo-parity-planning.md,plan-multi-repo-parity-planning-and-execution.md}
├── plans/ideas/
│   └── [D] tri-repo-rhino-cli-byte-identity-gate.md
└── plans/in-progress/sdlc-gate-registry-enforcement/
    ├── [E] README.md, brd.md, prd.md, tech-docs.md, delivery.md, and learnings.md
    ├── [E] repo-configs/**, husky-hooks/**, and package-json/** target artifacts
    └── [E] execution tick marks before archival
```

`dependency-vulnerability-audit.yml`, `rhino-cli-parity-audit.yml`,
`parity-manifest.sha256`, the three gate integration tests, and gate Gherkin files are all **new
files**. Every other bounded-pattern expansion must resolve to tracked files before it can enter an
edit ledger.

## 2. Design

### 2.1 Why a registry rather than a linter over the existing files

The alternative considered was a validator that parses `.husky/*` shell and `pr-quality-gate.yml`
and diffs the extracted command sets. It was rejected: extracting a check set from arbitrary shell
requires understanding conditionals, variable expansion, and `lint-staged` glob dispatch. The
validator would be a shell interpreter with a permanent false-positive tail.

Declaring the check set once and _deriving_ both surfaces from it inverts the problem — there is
nothing to extract, because there is nothing hand-written to drift. This is the same shape the repo
already runs for harness bindings: one hand-authored source, generated consumers, and a validator
that fails on divergence.

### 2.2 Registry location and shape

The registry is a new `gates:` section in the existing root `repo-config.yml`, joining the sections
already there (`harness`, `coverage`, `specs`, `instruction-size`, `env-contract`, `env-injection`).
It is read by the existing strict-deserialize path, so an unknown key or a bad enum fails
`rhino-cli repo-config validate` at the schema-parity gate that already runs.

**The block below is an excerpt, not the registry.** It carries exactly one entry per distinct
_shape_ the schema must express — a repo-wide rhino-cli check, a per-file rhino-cli check, a
path-gated check, an external per-file check, a hand-wired Nx check, a staged-only carve-out, a
`commit-msg` check, a re-staging mutation, and a CI-only verify. The shipped registry is far larger:
`ose-public`'s `lint-staged` block alone holds **26 glob keys driving 14 formatter commands and 12
per-file checks**, every one of which becomes an entry. The full per-repo inventory is
[§2.2.4](#224-the-full-formatter-and-per-file-inventory); Phase 1's acceptance criterion is that the
emitted `lint-staged` block round-trips the existing one, not that it matches this excerpt.

```yaml
gates:
  - id: md-links
    command: "md links validate"
    kind: rhino-cli
    args:
      exclude:
        - plans/done
        - apps/ayokoding-www/content
        - apps/ose-www/content
    surfaces:
      pre-push: { scope: all-file-type }
      ci: { scope: all-file-type }

  - id: md-mermaid
    command: "md mermaid validate"
    kind: rhino-cli
    args:
      exclude:
        - apps/rhino-cli/tests/fixtures
        - plans/done
        - apps/ayokoding-www/content
    surfaces:
      pre-commit: { scope: affected-file-type, glob: "*.md" }
      ci: { scope: all-file-type }

  - id: harness-bindings
    type: check
    command: "harness bindings validate"
    kind: rhino-cli
    surfaces:
      pre-push:
        scope: path-gated
        trigger:
          - ".amazonq/"
          - ".claude/"
          - ".opencode/"
          - ".cursor/"
          - "AGENTS.md"
          - "CLAUDE.md"
      ci: { scope: other }

  - id: shellcheck
    type: check
    command: "shellcheck --severity=warning"
    kind: external
    surfaces:
      pre-commit: { scope: affected-file-type, glob: "*.sh" }
      ci: { scope: affected-file-type, glob: "*.sh" }

  - id: test-quick
    type: check
    command: "test:quick"
    kind: nx
    wiring: hand-wired
    surfaces:
      pre-push: { scope: affected-projects }
      ci: { scope: affected-projects }

  - id: parity-manifest
    type: check
    command: "parity manifest validate"
    kind: rhino-cli
    surfaces:
      pre-push: { scope: other }
      ci: { scope: other }

  - id: env-staged-guard
    type: check
    command: "env staged-guard validate"
    kind: rhino-cli
    carve-out: staged-only
    surfaces:
      pre-commit: { scope: other }

  - id: commitlint
    type: check
    command: 'npx --no -- commitlint --edit "$1"'
    kind: external
    surfaces:
      commit-msg: { scope: other }

  - id: format-prettier
    type: mutation
    category: formatter
    command: "prettier --write"
    kind: external
    restages: true
    surfaces:
      pre-commit: { scope: affected-file-type, glob: "*.{md,json,yml,yaml,css,scss,html,sql,ts,tsx,js,jsx,mjs,cjs}" }

  - id: format-verify-prettier
    type: check
    command: "prettier --check"
    kind: external
    verifies: format-prettier
    surfaces:
      ci: { scope: affected-file-type, glob: "*.{md,json,yml,yaml,css,scss,html,sql,ts,tsx,js,jsx,mjs,cjs}" }

  - id: format-verify-rustfmt
    type: check
    command: "rustfmt --edition 2024 --check"
    kind: external
    verifies: format-rustfmt
    surfaces:
      ci: { scope: affected-file-type, glob: "*.rs" }

  - id: harness-bindings-generate
    type: mutation
    command: "harness bindings generate"
    kind: rhino-cli
    restages: true
    surfaces:
      pre-commit: { scope: other }

  - id: lockfile-sync
    type: mutation
    command: "git lockfile sync"
    kind: rhino-cli
    restages: true
    surfaces:
      pre-commit: { scope: affected-file-type, glob: "apps/*/package.json" }
```

`deps:audit` is deliberately **absent** — see [§2.2.3](#223-what-is-deliberately-outside-the-registry).

**The complete target state for every repo is authored in this plan, not described.** Three sibling
folders hold the actual post-change files, one per repo:

| Folder                                      | Contents                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`repo-configs/`](./repo-configs/README.md) | `repo-config-{repo}.yml` — the full registry plus every existing section                          |
| [`husky-hooks/`](./husky-hooks/README.md)   | `{hook}-{repo}.sh` — the post-rewire shims, plus `current/` holding the twelve hooks they replace |
| [`package-json/`](./package-json/README.md) | `package-{repo}.json` — the full post-change file; `lint-staged-{repo}.json` — the emitted block  |

Execution copies from these rather than re-deriving each surface per repo. Every artifact is a
**complete file**, never an excerpt — the whole `repo-config.yml`, the whole `package.json`, the
whole hook — so a reviewer reads what will exist rather than reconstructing it from a delta. Four
things follow. The entry sets are reviewable **as a set** before any repo is touched. The per-repo
divergences in [§2.2.4](#224-the-full-formatter-and-per-file-inventory) and
[§2.3](#23-why-gate-sets-may-differ-per-repo-but-the-schema-may-not) are visible side by side instead
of asserted in prose. `husky-hooks/current/` makes the before-state auditable too, and measuring it
proves the drift this plan exists to stop: `pre-push` currently differs from `ose-public`'s copy in
**all three** downstream repos (`ose-primer` 4 lines, `beaver-nest` 2, private sibling 56), and nothing
detects it. And the `lint-staged` artifacts are a **falsifiable target**: Phase 1's emitter is correct
when its output is byte-identical to the committed `package-json/lint-staged-{repo}.json`, which is a
diff, not a judgement.

Field contract:

| Field               | Required       | Meaning                                                                                                                                                                                                    |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | yes            | Stable, unique, kebab-case. The job name in CI and the label in `gate run` output.                                                                                                                         |
| `type`              | yes            | `check` (can fail; subject to the composition rule) or `mutation` (rewrites files; cannot fail on style; exempt from the rule).                                                                            |
| `command`           | yes            | Leaf command. Interpretation depends on `kind`.                                                                                                                                                            |
| `kind`              | yes            | `rhino-cli` (invoked through the local binary), `external` (a tool on `PATH`), or `nx` (an Nx target).                                                                                                     |
| `wiring`            | no (checks)    | `matrix` (default — CI emits one job per gate) or `hand-wired` (the workflow declares an executable, non-disabled job itself; validation requires its direct `quality-gate` aggregate dependency).         |
| `restages`          | no (mutations) | `true` when the mutation's output must be `git add`-ed back, so generated files commit in lockstep.                                                                                                        |
| `args`              | no             | Command-shaped data that legitimately differs per repo — chiefly `exclude` lists.                                                                                                                          |
| `surfaces`          | yes            | Map of surface name to scope descriptor. At least one entry.                                                                                                                                               |
| `glob` / `globs`    | no             | On an `affected-file-type` surface: one glob, or a **list** of globs when one command must be dispatched across several `lint-staged` keys (prettier). See §2.2.2.                                         |
| `lint-staged-shell` | no             | On a pre-commit affected-file-type surface only: a shell body emitted as `bash -c '<body>' --`; `{{command}}` expands once to the kind-derived command, or a body may handle each lint-staged file itself. |
| `carve-out`         | no (checks)    | `staged-only` — the check reads the git index, so no CI counterpart can exist. Exempts it from the composition rule.                                                                                       |
| `verifies`          | no (checks)    | The id of the `type: mutation` gate this check is the read-only counterpart of. Drives the every-mutation-is-verified rule (§2.2.4).                                                                       |
| `category`          | no (mutations) | `formatter` marks a mutation that rewrites source to a canonical form, so `gate validate` demands a `verifies`-linked check for it.                                                                        |

Surface names are `commit-msg`, `pre-commit`, `pre-push`, and `ci` — **the four gate surfaces, and
only those**. Scope values are the five already ratified in the SDLC Gate Standard —
`affected-file-type`, `all-file-type`, `affected-projects`, `all-projects`, `other` — plus
`path-gated`, which is the qualifier the standard already applies in prose to the governance
validators. The standard amendment in Phase 2 makes that qualifier a sixth controlled value; this is
a vocabulary normalization, not a new execution semantic.

**Declaration order is execution order.** `gate run` executes a surface's entries top to bottom, so
the registry preserves the ordering the hooks have today: the staged guard first, then the
per-file pass, then the mutations that regenerate and re-stage.

### 2.2.1 Why mutations are in the registry

Mutations are not checks — `prettier --write`, `harness bindings generate`, and the lockfile sync
rewrite files rather than failing. Declaring them anyway is what makes the registry a **complete**
source of truth: after this change, anything a surface does is in `gates:`, and anything absent from
`gates:` is not run by any surface. There is no third category living in prose.

Three consequences:

1. **The composition rule applies to `type: check` only.** A mutation at pre-commit does not demand
   a CI counterpart, because auto-fixing on a server that then has to commit back is a different
   operation, not the same check at a different scope.
2. **`carve-out: formatter` is no longer needed** and is removed from the schema. It existed to stop
   the rule from demanding a pre-commit `prettier --check` alongside the auto-fix. With formatters
   declared as `type: mutation`, the rule never reaches them. The `format-verify-*` gates are
   ordinary `type: check` entries declared on `ci` only — and a CI-only check was never a violation,
   since the rule runs pre-commit/pre-push ⇒ ci, not the reverse. A second rule covers the direction
   the composition rule cannot: **every formatter mutation needs a verifying check** (§2.2.4).
3. **`lockfile-sync` must become a real command.** It is inline shell in `.husky/pre-commit` today.
   To be declarable it moves into `rhino-cli` as `git lockfile sync`. This adds one command to
   Phase 1 that the original draft did not carry.

### 2.2.2 lint-staged is generated, not replaced

The per-file entries above (formatters, tool-linters, per-file validators) are exactly what
`lint-staged` dispatches today. `gate run --surface=pre-commit` does **not** reimplement that
dispatch — it invokes `npx lint-staged`, and the `lint-staged` block in `package.json` becomes a
**generated artifact** emitted from the registry by `rhino-cli gate emit --surface=pre-commit`.

This reuses the machinery the repo already trusts: hand-authored source, generated consumer,
validator that fails on divergence — the same shape as `harness bindings generate` plus
`harness bindings validate`. `[Web-cited]` It also preserves `lint-staged`'s default stash backup
and error restore, documented in its official [README](https://github.com/lint-staged/lint-staged)
(accessed 2026-08-04: it creates a stash backup by default and reverts task changes after failure).

The emitter writes marker-first: it checks for the already-applied marker **before** locating the
anchor, so a re-run replaces the block rather than appending a second copy.

Most entries emit their kind-derived command directly. A pre-commit affected-file-type scope may
instead declare `lint-staged-shell`: the emitter wraps its body as `bash -c '<body>' --` so lint-staged
does not append its file list to commands that must either ignore it (`repo-config validate`) or loop
over it with a different argument position (Docker Compose). `{{command}}` is a one-time placeholder
for the normal kind-derived command; a shell body without that placeholder owns its file loop.

**Why prettier declares `globs`, plural.** `lint-staged` runs the commands within one glob key
**sequentially** but runs different glob keys **concurrently**. Today `*.md` is an ordered chain —
`prettier --write`, then `markdownlint-cli2`, then the four `md * validate` commands — so markdown is
always formatted before it is linted. Collapsing prettier into a single consolidated key
(`*.{md,json,yml,...}`) would silently break that: markdownlint could then run against unformatted
markdown. So `format-prettier` declares the same list of globs the current block uses, and the
emitter writes it into each. Declaration order does the rest — `format-prettier` precedes
`markdownlint` in the registry, so it lands first in the `*.md` chain.

This was caught by diffing a generated block against the live one rather than by review, which is the
argument for authoring the target artifacts in
[`package-json/`](./package-json/README.md) at all.

### 2.2.3 What is deliberately outside the registry

The registry's completeness claim is scoped precisely: **it covers the four gate surfaces**
(`commit-msg`, `pre-commit`, `pre-push`, `ci`). Anything one of those surfaces does is declared;
anything absent from `gates:` is not run by any of them.

Scheduled, non-gating pipelines are **outside** that boundary by design. They are not gate surfaces,
they block nothing, and modelling them as one would make `gate validate` responsible for enforcing
composition rules over things the composition rule does not govern.

| Outside the registry           | Why                                                                                                                                                                                         | Where it lives                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `deps:audit`                   | Non-hermetic — reads a remote advisory database that moves independently of the code, so a green commit can turn red with no repository change. Ratified rule 3 keeps it out of every gate. | Its own dedicated workflow (below)                                                                       |
| `test:integration`, `test:e2e` | Uncacheable and heavy; ratified rule 3 keeps them out of every gate.                                                                                                                        | The per-app deploy pipelines (`*-test-local-deploy-*.yml`)                                               |
| Cross-repo `rhino-cli` parity  | Non-hermetic — needs another repository's moving `HEAD` over the network. Its hermetic half, `parity manifest validate`, **is** a registry gate; only the cross-repo comparison is outside. | `rhino-cli-parity-audit.yml` — see [§2.8.4](#284-enforcement--a-hermetic-gate-plus-a-non-hermetic-audit) |

An earlier draft of this plan modelled `deps:audit` as a fifth `cron` surface inside the registry.
That was dropped: a "surface" that no composition rule applies to, that emits no CI matrix row, and
that no hook invokes is not a surface — it is a scheduled job wearing the word. Declaring it bought
visibility at the price of blurring what the registry means. It now gets visibility the honest way,
through a workflow whose name says what it does.

#### The dependency-audit workflow

`deps-audit.yml` is replaced by a new, descriptively-named workflow in all four repos:

|          | Value                                             |
| -------- | ------------------------------------------------- |
| Filename | `dependency-vulnerability-audit.yml`              |
| `name:`  | `Dependency Vulnerability Audit`                  |
| Trigger  | `schedule` (unchanged cron) + `workflow_dispatch` |
| Runs     | `nx run-many --all -t deps:audit`                 |

The name is chosen to satisfy the mechanical derivation the naming convention requires:
`Dependency Vulnerability Audit` → lowercase → spaces to hyphens → `dependency-vulnerability-audit`
→ append `.yml`. It also states what the job actually does — scan dependencies for known
vulnerabilities — rather than restating its own filename, which is what `name: deps-audit` does
today.

**This requires amending the naming convention**, and that amendment is in scope:

1. `dependency` is not in the convention's cross-cutting `{domain}` list
   (`commons`, `markdown`, `docs`, or a `{cli-name}`).
2. `audit` is not in the fixed verb-and-qualifier vocabulary.
3. The Cross-cutting workflows table lists only `pr-quality-gate.yml` and `validate-env.yml` —
   neither `deps-audit.yml` nor `main-ci.yml` was ever registered there, so the current file set is
   already out of agreement with its own convention.

Related finding surfaced while checking this: `ose-primer` ships `name: Nightly Dependency Audit`
inside a file named `deps-audit.yml`. That violates the `name:`-mirrors-filename rule outright. The
rename fixes it as a side effect.

### 2.2.4 The full formatter and per-file inventory

**`prettier` is one of fourteen formatters.** A design that verifies only prettier closes about a
fourteenth of the gap [R-7](./prd.md#r-7--formatting-is-verified-not-silently-rewritten) claims to
close, so every formatter mutation gets a `verifies`-linked check on the `ci` surface.

Two independent audits on 2026-08-02 produced the table below: what each repo's `lint-staged` block
**declares**, and — via `git ls-files` — what each repo's tracked sources **need**. They disagree
badly in both directions.

`[Web-cited]` — every verify command and exit-code claim below was checked against each formatter's
own upstream documentation/CLI `--help` output on 2026-08-02, with excerpt and URL per claim:

- `fantomas --check` exits 99 on a formatting failure and reserves 1 for internal errors, per
  [the fantomas Formatting Check docs](https://fsprojects.github.io/fantomas/docs/end-users/FormattingCheck.html)
  ("If the file does not require any formatting, exit code 0 is returned... [an unformatted file
  returns] exit code 99").
- `buildifier --mode=check` exits 4 on a formatting failure, per
  [buildifier's own source](https://github.com/bazelbuild/buildtools/blob/main/buildifier/buildifier.go)
  ("4: check mode failed (reformat is needed)").
- `gofmt -l` always exits 0 and never fails on its own, per
  [the `cmd/gofmt` package docs](https://pkg.go.dev/cmd/gofmt) (`-l` only lists files whose
  formatting differs from gofmt's; it defines no distinct non-zero exit status for that case — see
  the still-open [golang/go#76405](https://github.com/golang/go/issues/76405) proposal to add one,
  which would be moot if `-l` already failed).
- `dart format -o none --set-exit-if-changed` is the non-mutating check-mode invocation, per
  [the `dart format` docs](https://dart.dev/tools/dart-format) ("To make dart format return an exit
  code when formatting changes occur, add the `--set-exit-if-changed` flag" — combined with `-o none`
  this returns exit code 1 when changes would occur, 0 otherwise).
- `csharpier check` and `mix format --check-formatted` each ship an opt-out flag,
  `--unformatted-as-warnings` and `--no-exit` respectively, that forces a 0 exit and must not appear,
  per [the CSharpier CLI docs](https://csharpier.com/docs/CLI) ("`--unformatted-as-warnings`...
  treats unformatted files as a warning instead of an error... the process will return an exit code
  of 0") and [the `mix format` docs](https://hexdocs.pm/mix/Mix.Tasks.Format.html) ("`--no-exit` —
  ...if you don't want the Mix task to fail (and return a non-zero exit code), but still want to
  check for format errors and print them to the console").

Exit-code behaviour is called out because a formatter that prints diagnostics and exits 0 is useless
as a gate.

| Formatter (mutation)       | Verify command (check)                      | Exit on unformatted           | public   | primer  | private  | beaver-nest |
| -------------------------- | ------------------------------------------- | ----------------------------- | -------- | ------- | -------- | ----------- |
| `prettier --write`         | `prettier --check`                          | 1                             | keep     | keep    | keep     | keep        |
| `rustfmt --edition 2024`   | `rustfmt --edition 2024 --check`            | 1                             | keep     | keep    | keep     | keep        |
| `shfmt -w`                 | `shfmt -d`                                  | non-zero, prints a diff       | keep     | **add** | **add**  | keep        |
| `fantomas`                 | `fantomas --check`                          | **99** (1 = internal error)   | keep     | keep    | **drop** | keep        |
| `ruff format`              | `ruff format --check`                       | non-zero                      | keep     | keep    | **drop** | keep        |
| `gofmt -w`                 | `test -z "$(gofmt -l .)"`                   | **always 0 unwrapped**        | keep     | keep    | —        | **drop**    |
| `scripts/format-elixir.sh` | `mix format --check-formatted`              | non-zero (unless `--no-exit`) | keep     | keep    | —        | **drop**    |
| `dotnet csharpier format`  | `dotnet csharpier check`                    | 1                             | keep     | keep    | **drop** | **drop**    |
| `cljfmt fix`               | `cljfmt check`                              | non-zero                      | **drop** | keep    | **drop** | **drop**    |
| `dart format`              | `dart format -o none --set-exit-if-changed` | 1                             | keep     | keep    | **drop** | **drop**    |
| `tofu fmt`                 | `tofu fmt -check`                           | non-zero                      | keep     | —       | **add**  | **drop**    |
| `stylua`                   | `stylua --check`                            | 1                             | keep     | —       | —        | **drop**    |
| `clang-format -i`          | `clang-format --dry-run --Werror`           | non-zero                      | keep     | —       | —        | **drop**    |
| `buildifier`               | `buildifier --mode=check`                   | **4**                         | keep     | —       | —        | **drop**    |

Five of these carry a trap that a naive implementation walks into:

1. **`gofmt` cannot fail.** `-l` prints offending paths and exits 0 regardless; two upstream feature
   requests asking for a failing mode are still open. The `test -z` wrapper is mandatory, not
   stylistic.
2. **`fantomas` exits 99**, not 1 — 1 means an internal error. A gate testing `[ $? -eq 1 ]` passes
   silently on unformatted F#. Test for any non-zero.
3. **`buildifier` exits 4.** Same class. It already fails without an extra flag, correcting an earlier
   assumption in this plan that one was needed.
4. **`mix format --check-formatted` and `dotnet csharpier check` each have an opt-out flag**
   (`--no-exit`, `--unformatted-as-warnings`) that forces exit 0. Neither may appear.
5. **`dart format` rewrites files unless given `-o none`**, so a verify pass without it mutates the
   working tree before failing.

`[Web-cited]` Two invocation caveats are `ose-primer`-only after pruning. Fantomas's official
[Getting Started](https://fsprojects.github.io/fantomas/docs/end-users/GettingStarted.html)
(accessed 2026-08-04) documents local and global .NET-tool installs and usage as `dotnet fantomas`.
cljfmt's official [README](https://github.com/weavejester/cljfmt) (accessed 2026-08-04) distinguishes
standalone `cljfmt check` from `clj -Tcljfmt check` and `lein cljfmt check`. Bare invocations
therefore require globally invocable tool forms; Phase 0 confirms their availability.

`keep` = declared and needed. `drop` = **declared but the repo has zero tracked files of that type**.
`add` = files exist with no formatter declared. `—` = correctly absent — note the private sibling never
declares a `*.go` or `*.{ex,exs}` `lint-staged` key at all, so its `gofmt`/`format-elixir.sh` cells
read `—` rather than `drop`, the same way `ose-primer`/the private sibling's `stylua`/`clang-format`/
`buildifier` cells do.

`[Repo-grounded]` — measured tracked-file counts behind each verdict, via `git ls-files` by
extension in each repo on 2026-08-02; Phase 0 re-verifies these before Phase 1 begins:

| Language  | public | primer | private | beaver-nest |
| --------- | ------ | ------ | ------- | ----------- |
| Rust      | 273    | 284    | 234     | 217         |
| Shell     | 392    | 8      | 13      | 36          |
| F#        | 152    | 43     | **0**   | 36          |
| Python    | 3636   | 74     | **0**   | 14          |
| Go        | 230    | 75     | **0**   | **0**       |
| Elixir    | 188    | 154    | **0**   | **0**       |
| C#        | 199    | 74     | **0**   | **0**       |
| Clojure   | **0**  | 57     | **0**   | **0**       |
| Dart      | 4      | 44     | **0**   | **0**       |
| Terraform | 17     | **0**  | 3       | **0**       |
| Lua       | 318    | **0**  | **0**   | **0**       |
| C         | 94     | **0**  | **0**   | **0**       |
| Bazel     | 2      | **0**  | **0**   | **0**       |

The first 2026-08-04 refresh changed `beaver-nest`'s Shell (10 → 13) and F# (15 → 34) counts. After
`beaver-nest` advanced again to `cd2ec0e4`, the current counts are Shell 36 and F# 36. The public
refresh also found tracked Go, Elixir, C#, and Dart files, all under `apps/ayokoding-www/content/`.
Those are publishable course artifacts and its existing `lint-staged` entries already format them, so
the public target retains the four formatter/verifier pairs rather than treating the content tree as
out of scope. No zero-file formatter is retained for public.

**Eleven declared formatter entries across the four repos run against zero files.** `beaver-nest`
alone carries nine, plus a `*.sql` prettier glob matching nothing. They are not harmless: each one is a `lint-staged` key a maintainer reads as
"this repo formats Dart", a tool `npm run doctor` may install, and — under this plan — a formatter
that would demand a `verifies`-linked CI job for a language the repo does not have.

Three `add` verdicts are the mirror-image defect: `ose-primer` and the private sibling `shellcheck` shell
scripts they never format, and the private sibling has 3 tracked `.tf` files handled by a hand-written
`.husky/pre-commit` block instead of `lint-staged`.

Also surfaced: `ose-primer` tracks 46 `.sql` and 3 `.html` files with no prettier glob covering
either, while `ose-public` and `beaver-nest` declare `*.sql` / `*.html` keys. The prettier globs are
themselves per-repo and get the same treatment.

#### A judgement call worth stating

`ose-public`'s Python, Lua, C, Bazel, SQL, and most HTML files are **not application source** — they
are code examples inside `apps/ayokoding-www/content/`, tutorial material for readers. Formatting
them is the current behaviour (staging one runs `ruff format` today), so keeping those four
formatters preserves what happens now rather than changing it.

The alternative — excluding the content tree so those formatters drop out of `ose-public` entirely —
is defensible if any example is deliberately mis-formatted for teaching. Nothing in the audit
suggests that, and the repo already has the mechanism if it turns out to be wanted: an
`args.exclude` on the formatter gate, the same field `md links validate` already uses for that tree.
**Recorded as an assumption**, not a silent decision: this plan keeps them.

One formatter needs work beyond a flag, and after the pruning it is **`ose-primer`-only**, which is
the whole of that work's blast radius: **`scripts/format-elixir.sh`** is a repo-local script with no
check mode at all. Phase 3 adds a `--check` flag to it, or the gate calls
`mix format --check-formatted` directly.

#### The pruning rule

A formatter is declared in a repo's `gates:` **if and only if that repo has at least one tracked file
matching its glob.** Not "if the language is plausible", not "if the canonical set has it" — tracked
files, verifiable by `git ls-files`.

This does **not** breach byte-identity. The engine that reads the registry is identical everywhere;
the entry set is data, exactly like the private sibling's `iac-lint` pair
([§2.3](#23-why-gate-sets-may-differ-per-repo-but-the-schema-may-not)). It also removes an unwanted
side effect of the union-surface principle: without pruning, `gate validate`'s new pairing check
would demand a `format-verify-dart` CI job in three repos that have no Dart.

The rule is deliberately not automated into a validator. A repo legitimately adds its first `.go`
file before any Go formatter exists, and a gate that failed on that would block the commit
introducing the language. Adding the formatter is a conscious step in adopting a language, and
[§2.2.4](#224-the-full-formatter-and-per-file-inventory)'s counts are how a reviewer audits it.

The twelve non-formatter per-file checks are `markdownlint-cli2`, `md mermaid validate`,
`md heading-hierarchy validate`, `md naming validate`, `md frontmatter validate`, `actionlint`,
`shellcheck --severity=warning`, `hadolint --failure-threshold warning`,
`convention emoji validate`, `specs gherkin-cardinality validate`, `repo-config validate`, and
`docker compose config`. All four repos carry all twelve.

**`gate validate` gains a sixth check**: every `type: mutation` gate carrying `category: formatter`
must be named by exactly one `type: check` gate's `verifies` field. This is what stops the
prettier-only outcome from recurring — a fifteenth formatter added to `lint-staged` without a verify
counterpart fails validation.

`category: formatter` is what makes that check mechanical. The other mutations
(`harness-bindings-generate`, `lockfile-sync`) are **not** formatters: their outputs are already
guarded by `harness bindings validate` and by the lockfile's own presence in the diff, so they carry
no `category` and the rule does not reach them.

#### Divergences the registry must accommodate

These are entry-set differences, not schema differences, and are legitimate per [§2.3](#23-why-gate-sets-may-differ-per-repo-but-the-schema-may-not):

| Divergence                                                      | Repos               | Note                                                                                |
| --------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `shfmt -w` absent                                               | primer, private     | Shell is `shellcheck`-ed but never formatted — a real gap, not a deliberate carve   |
| `*.tf` → `tofu fmt` absent from `lint-staged`                   | private             | The IaC repo runs `terraform fmt` inline in `.husky/pre-commit` instead — see below |
| Polyglot formatters (go, elixir, csharp, clojure, dart) present | primer only         | Only `ose-primer` tracks those languages; the other three prune them                |
| `*.lua`, `*.{c,h}`, `{BUILD,BUILD.bazel,*.bzl}` present         | public only         | Only `ose-public` tracks those, all inside `apps/ayokoding-www/content/`            |
| `*.sql`, `*.html` prettier globs                                | varies              | `ose-primer` tracks 46 `.sql` and 3 `.html` with no glob covering them              |
| `*.go` → `gofmt -w` absent                                      | private             | No Go sources                                                                       |
| `md naming validate --exempt "*__linkedin__*.md"`               | public, beaver-nest | `args` difference                                                                   |
| `md mermaid validate --exclude apps/ayokoding-www/content`      | public              | `args` difference                                                                   |

**The private-sibling terraform case needs explicit handling in Phase 4.** Its IaC formatting runs as a
hand-written block inside `.husky/pre-commit`, not through `lint-staged`, so `gate emit` reading the
per-file registry would not reproduce it. It must be declared as an ordinary
`scope: affected-file-type, glob: "*.tf"` mutation like every other formatter, and the inline hook
block deleted — otherwise the registry's completeness claim is false in that repo on day one.

`[Repo-grounded]` **This deliberately substitutes `tofu` for `terraform`.** The private sibling's current
`.husky/pre-commit` invokes the HashiCorp `terraform` binary (`terraform fmt -check -recursive
infra/on-premise/terraform/`), not OpenTofu. Phase 4 declares the new `lint-staged`/registry mutation
as `tofu fmt` / `tofu fmt -check` instead, matching `ose-public`'s existing choice and the `tofu`
Doctor tool declared for the formatter gates in every repo (confirmed in Phase 0). `[Web-cited]`
OpenTofu's official [migration overview](https://opentofu.org/docs/intro/migration/)
(accessed 2026-08-04) says it aims to maintain Terraform-configuration compatibility and most code
works unchanged, while still requiring migration verification. Phase 4 therefore runs both format
checks and treats any difference as blocking; this is not an unsupported blanket "drop-in" claim.

### 2.3 Why gate sets may differ per repo but the schema may not

The `apps/rhino-cli` byte-identity boundary requires the engine to be identical across `ose-public`,
`ose-primer`, and the private sibling. The registry is data, and the boundary explicitly permits per-repo
data divergence — the existing `repo-config.yml` already differs per repo in `specs.domain-areas`,
`env-contract` scan paths, and the harness lists.

This plan states the rule for `gates:` explicitly, because it is a list rather than a fixed key set:

- **The schema is identical** — every entry in every repo conforms to the same field contract and the
  same enums. `rhino-cli repo-config validate` enforces this and already runs at pre-commit, the PR
  gate, and the schema-parity gate.
- **The entry set may differ**, because it follows the repo's actual app and tool set. The private sibling
  declaring an `iac-lint` gate is sanctioned divergence of the same kind as it shipping Terraform at
  all. This is recorded under
  [Allowed Divergence](../../../docs/reference/sdlc-gate-standard.md#allowed-divergence).

CI consumes another identical-schema registry field, `doctor-tools`: it is an ordered list of only
the external Doctor prerequisites for that gate. The format job derives a de-duplicated union from
**every** pre-commit gate's `doctor-tools`, because the emitted `lint-staged` batch runs both formatter
mutations and per-file checks. Each matrix row passes only its own list to `doctor --fix --tools`; an
empty list does not invoke Doctor. The local worktree setup remains the deliberately full
`doctor --fix` toolchain convergence step. The workflow never carries a second gate or tool inventory.

### 2.4 Command surface

Four new leaf commands under a `gate` domain, following the ratified verb-last naming
(`{domain} {sub-domain} {verb}`), plus one supporting command extracted from the pre-commit hook:

| Command                                                      | Purpose                                                                                                                                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rhino-cli gate list --surface=<name> [--format=json\|text]` | Enumerate the gates declared on one surface. JSON feeds the CI matrix.                                                                                                                              |
| `rhino-cli gate run --surface=<name> [--only=<id>]`          | Execute every gate on that surface in declaration order, stopping at first failure. Path-gated entries are skipped when their triggers miss the changed set.                                        |
| `rhino-cli gate emit --surface=pre-commit`                   | Regenerate the `lint-staged` block in `package.json` from the registry, marker-first. The generate half of the generate-and-validate pair.                                                          |
| `rhino-cli gate validate`                                    | The conformance gate. Fails on composition-rule violations and on surface files that no longer agree with the registry.                                                                             |
| `rhino-cli git lockfile sync`                                | The lockfile-sync step, extracted from inline shell so it can be declared as a `type: mutation` gate.                                                                                               |
| `rhino-cli parity manifest generate`                         | Write `apps/rhino-cli/parity-manifest.sha256` from the boundary file set. **Explicit only** — never auto-run at pre-commit ([§2.8.4](#284-enforcement--a-hermetic-gate-plus-a-non-hermetic-audit)). |
| `rhino-cli parity manifest validate`                         | Recompute the boundary hashes and compare against the committed manifest. Declared as an ordinary `type: check` gate on `pre-push` and `ci`.                                                        |

#### Deterministic `gate run` dispatch contract

The dispatcher uses one algorithm on every surface; pre-commit batching is a defined branch of
that algorithm, not a second owner of the same entries.

1. Deserialize and validate the registry before invoking any leaf. Reject an unknown surface,
   unknown `--only` id, duplicate id, inapplicable field, or malformed glob with a non-zero exit.
2. Derive the candidate set once: staged index paths for `pre-commit`; merge-base-to-`HEAD` paths
   for `pre-push` and `ci`; tracked paths for `all-file-type`; Nx's affected graph for
   `affected-projects`; Nx's complete graph for `all-projects`; no path/project arguments for
   `other`; and trigger-intersection once for `path-gated`.
3. Apply `glob` or every item in `globs`, then `args.exclude`, using repository-root-relative paths.
   A file/project-scoped entry with an empty result is reported as skipped and succeeds without
   invoking its leaf. `other` invokes once. `path-gated` invokes once only on intersection.
4. Iterate entries in declaration order and stop at the first non-zero leaf. On `pre-commit`
   without `--only`, the first batch-eligible entry runs exactly one
   `npx --no -- lint-staged` process containing every `affected-file-type` check and every
   `category: formatter` mutation in their declared order; all later batch entries are marked
   consumed. Non-formatter mutations are never emitted into that batch, so staged guard remains
   before it and `harness-bindings-generate` plus `lockfile-sync` remain direct mutations after it.
5. `--only=<id>` selects exactly one entry, bypasses the aggregate batch, and invokes that leaf
   directly with only its derived files/projects. It cannot run or restage an unrelated entry.
6. For `restages: true`, snapshot the index before invocation, require a zero leaf exit, determine
   only that leaf's generated/modified paths, and run `git add -- <exact paths>`. A restage failure
   is a leaf failure; pre-existing unrelated worktree changes are neither staged nor rewritten.

Kind-specific argv construction is equally strict:

- `rhino-cli`: invoke the current repository's built `rhino-cli` executable, tokenize `command`
  into subcommand argv, append fixed `args`, then append derived path arguments.
- `external`: POSIX-shell-tokenize `command`, resolve argv[0] on `PATH`, preserve fixed argv, and
  append derived paths. `commit-msg` passes the hook's message-file path as one argv item rather
  than re-expanding `$1` through a shell.
- `nx`: invoke `npm exec nx -- affected -t <target>` for `affected-projects` and
  `npm exec nx -- run-many --all -t <target>` for `all-projects`; propagate Nx's exit code. Nx with
  a file scope, and non-Nx kinds with a project scope, are schema errors.

This contract fixes the apparent declaration-order/batch contradiction: declaration order owns the
single batch position, while `lint-staged` owns file-to-command fan-out only inside that position.
The emitted `lint-staged` artifacts therefore exclude `lockfile-sync`; its registry entry remains a
direct, post-batch mutation.

`gate validate` performs six checks:

1. **Composition rule** — every gate with `type: check` declaring `pre-commit` or `pre-push` must
   also declare `ci`, unless it carries `carve-out: staged-only`. Gates with `type: mutation` are
   not subject to this check.
2. **Surface-shim integrity** — `.husky/pre-commit` and `.husky/pre-push` invoke
   `gate run --surface=…` for every surface with declared gates.
3. **CI derivation** — for gates with `wiring: matrix` (the default), `pr-quality-gate.yml` builds
   its job matrix from `gate list` and runs no check command the registry does not declare. Gates
   with `wiring: hand-wired` are exempt from matrix derivation, but validation requires an
   **executable, non-disabled** command invocation in the workflow and requires that job to be a
   direct `quality-gate` aggregate dependency. This is what lets the per-language `test:quick` jobs
   keep their own `setup-dotnet` / `setup-rust` steps while remaining declared and validated.
4. **No orphan surfaces** — no surface file invokes a gate id the registry does not carry.
5. **Emitted-artifact freshness** — the `lint-staged` block in `package.json` matches what
   `gate emit --surface=pre-commit` would write. Fails if someone hand-edits the generated block.
6. **Formatter verification pairing** — every `type: mutation` gate carrying `category: formatter`
   is named by exactly one `type: check` gate's `verifies` field
   ([§2.2.4](#224-the-full-formatter-and-per-file-inventory)).

Checks 2 through 5 are deliberately narrow: they assert _that the surface derives from the registry_,
not _what the surface runs_. That is what makes them robust — there is no shell to interpret.

Note the division of labour with `parity manifest validate`: `gate validate` asserts the registry and
the surfaces agree **within** a repo; the parity manifest asserts `apps/rhino-cli` itself is identical
**across** repos. Neither substitutes for the other, and both are hermetic.

### 2.5 CI wiring — matrix, not a single job

`gate run --surface=ci` is **not** used by CI. Running every check inside one job would serialize
work that is currently parallel and would lose the per-language toolchain setup actions. Instead the
workflow derives a matrix:

```yaml
jobs:
  enumerate:
    outputs:
      gates: ${{ steps.list.outputs.gates }}
    steps:
      - id: list
        run: echo "gates=$(rhino-cli gate list --surface=ci --format=json)" >> "$GITHUB_OUTPUT"

  gate:
    needs: enumerate
    strategy:
      fail-fast: false
      matrix:
        gate: ${{ fromJson(needs.enumerate.outputs.gates) }}
    name: ${{ matrix.gate.id }}
    steps:
      - run: rhino-cli gate run --surface=ci --only=${{ matrix.gate.id }}
```

The matrix carries only `wiring: matrix` gates — `gate list` filters `hand-wired` entries out of the
`--format=json` projection used above, so they never produce a matrix row. One gate, one job, same
parallelism as today, and the job list can no longer drift from the registry because it is computed
from it.

The per-language `test:quick` jobs stay hand-written for their toolchain setup. They are declared as
`wiring: hand-wired` gates, so `gate validate` check 3 requires their executable, non-disabled command
and direct `quality-gate` aggregation without demanding matrix emission. That is the reconciliation
the first draft of this document was missing: it claimed CI "runs no check command the registry does
not declare" while simultaneously leaving those jobs undeclared.

### 2.6 Formatting verification

Ratified rule 2 exempts formatters from being pass/fail checks at pre-commit, where they rewrite in
place. This plan keeps that exactly, expressed structurally: the formatters are declared
`type: mutation`, and the composition rule applies only to `type: check`. No carve-out is needed —
`carve-out: formatter` is removed from the schema, since with formatters modelled as mutations the
rule never reaches them.

The `format-verify-*` gates are ordinary `type: check` entries declared on `ci` only. A CI-only check
was never a composition-rule violation, because the rule runs pre-commit/pre-push ⇒ ci, not the
reverse.

**There is one verify gate per formatter, not one overall.** The four repos run up to fourteen
formatters; a single `prettier --check` would leave the other thirteen languages unverified and
would satisfy R-7 only for prettier-owned file types. Each verify gate names its mutation through
`verifies`, and `gate validate` fails when a formatter mutation has no verifying check — see
[§2.2.4](#224-the-full-formatter-and-per-file-inventory) for the full table and the two formatters
(`gofmt`, the Elixir script) whose check mode needs building rather than a flag.

Net effect: unformatted code is still silently normalized when you commit locally, and can no longer
reach `main` through a hook-bypassed or web-UI push — in any of the fourteen languages, not just the
prettier-owned ones.

### 2.7 `main-ci.yml` retirement sequence

Order matters and is enforced by the phase gates:

1. Declare `md-mermaid`, `md-heading-hierarchy`, and the structural specs validator on the `ci`
   surface in the registry.
2. Verify they appear in `gate list --surface=ci --format=json` and produce matrix jobs.
3. Unpin the specs job from `--projects=rhino-cli`.
4. Only then delete `.github/workflows/main-ci.yml`.
5. Scrub every reference — `docs/reference/sdlc-gate-standard.md`,
   `repo-governance/development/infra/nx-targets.md`,
   `docs/reference/system-architecture/ci-cd.md`.

### 2.8 `rhino-cli` byte-identity — the same problem, one layer down

The
[rhino-cli Byte-Identity Boundary](../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary)
declares `apps/rhino-cli`'s `src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, and the
gherkin behavior tree byte-identical across `ose-public`, `ose-primer`, and the private sibling, with
**zero carve-outs**. `beaver-nest` is excluded as a declared fork.

That rule has the identical defect as the Gate Composition Rule: it is ratified prose that nothing
enforces. An audit on 2026-08-02 diffed all four repos; the `beaver-nest` side was refreshed against
current `main` on 2026-08-04 after its backend-readiness work changed the fork.

#### 2.8.1 Audit result

**The three-repo boundary is already violated.**
`src/application/agents/sync_validator.rs` line 676 carries `opencode-go/wrong` in `ose-public` and
`zai-coding-plan/wrong` in both `ose-primer` and the private sibling. It is the model-mismatch negative
fixture in `validate_agent_equivalence_fails_on_model_mismatch`; both strings exercise the same
branch, so no behaviour differs. That is precisely why it survived — a zero-carve-out rule was broken
by a one-line test fixture and **no surface in any repo could have noticed**, because byte-identity
is a cross-repo property and every gate runs inside a single repo.

Everything else in the three-repo set matches: no `Only in` files, `Cargo.toml`/`Cargo.lock`/
`project.json`/`LICENSE` identical, gherkin tree identical, `tests/` identical.

`beaver-nest` now diverges in 10 source files, 3 Gherkin files, and 4 integration-test files, plus
`project.json`. Crucially, **eight of the ten source divergences are repo-specific data hardcoded
into shared source**, not behaviour the fork chose:

| File                                               | Divergence                                                                                                                                                                                                                      | Class                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `application/agents/bindings.rs`                   | canonical hardcodes `.amazonq/cli-agents/ose-default.json` and the embedded agent-definition JSON name — `beaver-nest`'s copy hardcodes `beaver-nest-default.json` / `"beaver-nest-default"` instead                            | Repo-name data                  |
| `application/repo_governance/frontmatter_audit.rs` | canonical hardcodes `WEBSITE_APP_PREFIXES` as `apps/ayokoding-www/`, `apps/ose-www/`, `apps/organiclever-app-web/`, `apps/wahidyankf-www/` — `beaver-nest`'s copy carries an empty list instead                                 | Gate exclusion data             |
| `domain/git/staged_files.rs`                       | canonical hardcodes `STAGED_SKIP_PREFIXES` as `apps/ayokoding-www/content`, `apps/ose-www/content` plus two entries shared with `beaver-nest` — `beaver-nest`'s copy carries only `plans/done`, `apps/rhino-cli/tests/fixtures` | Gate exclusion data             |
| `application/git/pre_commit.rs`                    | a `step4_stage_ayokoding` step running `git add apps/ayokoding-www/content/`, plus skip-path literals                                                                                                                           | Gate data in **dead code**      |
| `application/domain_coverage/mod.rs`               | test fixtures named `organiclever-be`, `ose-be`                                                                                                                                                                                 | Test fixture data               |
| `commands/specs_validate_counts.rs`                | test fixtures named `organiclever`, `ose`                                                                                                                                                                                       | Test fixture data               |
| `commands/specs_coverage.rs`                       | an integration test pinned to `ose-be` being present in `specs.domain-areas`                                                                                                                                                    | Test fixture data               |
| `application/doctor/tools.rs`                      | a doc comment naming `apps/ose-be/global.json`                                                                                                                                                                                  | Doc comment                     |
| `application/docs/naming.rs`                       | **beaver-nest adds `ROADMAP.md` and `SECURITY.md`** to the always-exempt basenames                                                                                                                                              | **Capability, upstream-worthy** |
| `application/env/validate.rs`                      | **beaver-nest detects F# keys read through a pure `readEnvironment` wrapper and excludes the framework-owned `DOTNET_RUNNING_IN_CONTAINER` signal**                                                                             | **Capability, upstream-worthy** |

The four differing integration-test files are `tests/agents.rs`, `tests/cargo_target_share.rs`,
`tests/docs.rs`, and `tests/env.rs`. The three differing Gherkin files are
`env/env-validate-app-drift.feature`, `harness/agents-bindings.feature`, and
`md/repo-governance-frontmatter-audit.feature`. `project.json` additionally clears inherited
`GIT_DIR`, `GIT_WORK_TREE`, and `GIT_COMMON_DIR` for the Rust test and coverage targets so temporary
Git fixtures are isolated from the caller's worktree. The F# scanner and Git isolation are
upstream-worthy bug fixes; copying canonical without absorbing them would reintroduce defects.

The fork is therefore mostly an artefact of the canonical source hard-coding `ose-public`'s app
names. Extract that data and the fork mostly dissolves — which is why this belongs in this plan
rather than a separate one: `repo-config.yml` gaining a `gates:` section with per-repo `args.exclude`
lists is already the mechanism two of these sites need.

`naming.rs` and `env/validate.rs` are the source exceptions and run the other way. `ROADMAP.md` and
`SECURITY.md` are
ecosystem-standard root filenames, exempt for the same reason `CONTRIBUTING.md` already is. That is a
capability the canonical source lacks, and copying canonical over `beaver-nest` would delete it and
immediately break `md naming validate` there. The environment scanner's wrapper detection and
framework-owned-key exclusion are equally general: they belong in canonical before convergence,
along with the test-target Git isolation from `project.json`.

#### 2.8.2 The dead pre-commit pipeline

`application/git/pre_commit.rs` is reachable only from `commands/git_pre_commit.rs`, which is
declared `pub mod` in `commands.rs` but wired to **no CLI subcommand** — a leftover of the Go-to-Rust
port. The whole pipeline is unreachable from the binary's command surface, yet it is replicated
byte-for-byte into `ose-primer` and the private sibling, and it is the single largest hardcoded-`ose`-paths
site. It also owns the only consumers of `STAGED_SKIP_PREFIXES`, `staged_md_files`, and `has_match`.

Deleting it is **not** a one-file removal. Blast radius, all of which the plan must handle:

| Site                            | Action                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| `application/git/pre_commit.rs` | Delete                                                             |
| `commands/git_pre_commit.rs`    | Delete                                                             |
| `commands.rs`                   | Remove the `pub mod git_pre_commit;` declaration                   |
| `internal/git.rs`               | Remove `pub use crate::application::git::pre_commit::{Deps, run};` |
| `infrastructure/git/mod.rs`     | Implements `Deps` — remove or re-home the implementation           |
| `domain/git/staged_files.rs`    | Fully orphaned once the pipeline is gone — delete with it          |
| `application/fs/mock.rs`        | Doc comment references the pipeline — update the reference         |

The verification that this is genuinely dead, not merely unreferenced-by-grep, is that
`cargo build --release` and the full test suite pass unchanged after removal, and `rhino-cli --help`
lists the identical command set before and after.

#### 2.8.3 Boundary file set

`apps/rhino-cli/tests/` **joins the boundary**, alongside the already-ratified set. Integration tests
are source: excluding them lets divergence hide in exactly the place that proves behaviour, and
`beaver-nest` already differs in `tests/agents.rs`, `tests/cargo_target_share.rs`, `tests/docs.rs`,
and `tests/env.rs`.

The manifest is built from `git ls-files`, so untracked files cannot enter it. This matters
concretely: `ose-public`'s working tree carries two untracked `.env` files under
`tests/fixtures/env-injection/` which are **not** tracked in git (`git ls-files` returns none) and
must never appear in a manifest or a diff report.

#### 2.8.4 Enforcement — a hermetic gate plus a non-hermetic audit

Byte-identity is a cross-repo invariant and every gate runs inside one repo, so no single mechanism
covers it. The plan uses two, split on exactly the hermeticity line
[§2.2.3](#223-what-is-deliberately-outside-the-registry) already draws. This design fulfills
`plans/ideas/tri-repo-rhino-cli-byte-identity-gate.md` (since deleted; see git history)
(surfaced 2026-07-17), answering its open questions on run location (hermetic gate: locally, in
`pre-push` and `ci`; audit: scheduled workflow), cadence (audit runs on a schedule, not per-commit),
and the private-sibling auth model (the audit is unauthenticated-fetch, per B below). The idea brief is
retired in Phase 6.

**A. `parity manifest validate` — an ordinary registry gate (hermetic, blocking).**
`apps/rhino-cli/parity-manifest.sha256` is a committed file listing every boundary path and its
SHA-256, sorted, generated by `parity manifest generate`. The check recomputes and compares. It is
declared in `gates:` on `pre-push` and `ci` like any other check, needs no network, and catches the
failure mode actually observed: a local edit to shared source that nobody meant to make repo-specific.

**The generator is deliberately NOT a pre-commit mutation.** Unlike `harness bindings generate`, it
does not auto-run and auto-restage. If it did, every drift would silently self-heal locally and only
the scheduled audit would ever see it. When a boundary change is intentional, the maintainer must run
`rhino-cli parity manifest generate`, stage `apps/rhino-cli/parity-manifest.sha256`, then run
`rhino-cli parity manifest validate`. Validation evaluates the prospective index, so staging the
generated manifest is a prerequisite: it proves the exact manifest that would be committed matches
the boundary files. Making regeneration an explicit, deliberate act means the gate fails loudly the
moment someone edits byte-identical source, and the failure message says what that means:

```text
apps/rhino-cli/src/application/docs/naming.rs no longer matches parity-manifest.sha256.

This file is byte-identical across ose-public, ose-primer, <private-sibling>, and beaver-nest.
Changing it here obligates propagating the identical change to the other three repos.
If that is intended, run: rhino-cli parity manifest generate
```

That friction is the point. It converts an invisible edit into an acknowledged one.

**B. `rhino-cli-parity-audit.yml` — a scheduled workflow (non-hermetic, non-blocking).**
The local gate cannot catch coordinated drift — a repo that edits source _and_ regenerates its
manifest passes its own gate. Detecting that needs a reference, which means the network, which means
it is not a gate. So it takes the same shape as the dependency audit: `schedule` plus
`workflow_dispatch`, no `push` trigger, **outside** `gates:`, listed in
[§2.2.3](#223-what-is-deliberately-outside-the-registry)'s boundary table.

It fetches `ose-public`'s canonical `parity-manifest.sha256` and compares. `ose-public` is a public
repository, so `ose-primer`, the private sibling, and `beaver-nest` can all fetch it unauthenticated —
including the private sibling, whose own contents stay private because the data flows one way, downstream.

Filename and `name:` follow the convention amendment already in scope: domain `rhino-cli` (the
`{cli-name}` form the convention permits) and the verb `audit` being added for the dependency
workflow. `name: Rhino CLI Parity Audit` derives mechanically to `rhino-cli-parity-audit.yml`.

#### 2.8.5 Convergence sequence — upstream before downstream

Order is load-bearing. Copying canonical over `beaver-nest` before upstreaming its improvements
destroys them, and extracting the data after the copies means doing it four times.

1. **Preserve current canonical fixes while composing the upstreamed changes** — retain public's
   scope-correct non-discovery Git-state handling, `CwdLock` around repo-config reads, and serialized
   Git-sensitive unit-test layout. The inherited-Git-variable prefix from `beaver-nest` composes with
   the serialized commands; it must not replace them. Regression coverage proves each behavior before
   downstream copying.
2. **De-fork the canonical source in `ose-public`** — delete the dead pipeline (§2.8.2), extract the
   eight data sites into `repo-config.yml` (`WEBSITE_APP_PREFIXES` and the surviving skip prefixes
   become `args.exclude` on their gates; the Amazon Q agent name joins the existing `harness`
   section; test fixtures switch to synthetic names that name no real repo's apps).
3. **Upstream `beaver-nest`'s improvements** — the `ROADMAP.md`/`SECURITY.md` naming exemptions,
   corrected frontmatter-audit test, F# environment-wrapper detection with framework-owned-key
   exclusion, and inherited-Git-state isolation for Rust test targets — into canonical, each with a
   regression test.
4. **Resolve the live three-repo violation** — adopt `zai-coding-plan/wrong` in `sync_validator.rs`.
   Two of three repos already carry it and it matches the primary provider documented in `CLAUDE.md`;
   both strings exercise the same branch, so this is a naming convergence, not a behaviour change.
5. **Generate the manifest** in `ose-public` and declare its gate.
6. **Copy down** to all three downstream repos. Only now is the copy a dumb, verifiable operation:
   after it, `diff -r` over the boundary set is empty and each repo's `parity manifest validate`
   passes against the identical manifest.

Steps 1–4 must complete before any downstream copy. This reorders the existing phase plan: Phases 3
and 4 currently say "copy `apps/rhino-cli` from the merged `ose-public` Phase 1 result", which is
only safe once canonical is de-forked.

#### 2.8.6 The governance change this requires

Extending the boundary from three repos to four is an **amendment, not a clarification**. Today
`docs/reference/related-repositories.md:118` and the SDLC Gate Standard both state that `beaver-nest`
"carries a **fork** of that shared tool which is explicitly **not** bound by the byte-identity rule",
and `AGENTS.md` states the boundary "spans `ose-public`, `ose-primer`, the private sibling with zero
carve-outs".

All three statements become false and must change in all four repos. The consequence is real and
should be stated plainly rather than buried: **`beaver-nest` gives up the right to diverge.** After
this, a `rhino-cli` change it needs must land in `ose-public` first and propagate, exactly as for the
other two downstream repos. The audit is what makes that a defensible trade — the fork was not buying
`beaver-nest` any capability it wanted, only absorbing `ose-public`'s hardcoded app names.

The same amendment adds the bounded propagation transaction before the first canonical merge. An
opening merge records all four locked baselines and blocks unrelated boundary edits; canonical
Phases 1–2 and downstream Phases 3–5 are the only permitted window nodes. Intermediate PRs are
reversible, controlled pause-safe checkpoints only when their four refs and next node are recorded;
they are never invariant-restored states and never permit unrelated boundary work. The window closes
only when all four merged manifests and bounded diffs agree; inability to integrate a downstream
copy requires reverting the canonical transaction. This is a bounded protocol, not a permanent
carve-out.

## 3. Document Amendments

| Document                                                                          | Change                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/reference/sdlc-gate-standard.md`                                            | Composition rule becomes `(pre-commit ∪ pre-push) == PR gate`. Stage table drops stage 5. Stage 5 section removed. Stage 3 and 4 tables corrected to include `md readme-index validate`, `harness duplication validate`, `convention license validate`. Registry described as the normative mechanism. Allowed Divergence gains the gate-entry-set rule.                                |
| `repo-governance/development/workflow/git-hook-lifecycle.md`                      | Rewritten. Currently describes a pre-push that no longer exists, cites the non-existent target `specs:coverage`, and (in `ose-primer`) cites the non-existent workflow `validate-markdown.yml`. Its CI-parity table is replaced by a pointer to `gate list`, so it cannot restale. Created fresh in the private sibling, which lacks it.                                                |
| `repo-governance/development/infra/nx-targets.md`                                 | Drops `main-ci` references.                                                                                                                                                                                                                                                                                                                                                             |
| `docs/reference/system-architecture/ci-cd.md`                                     | Drops `main-ci` references; documents the matrix derivation.                                                                                                                                                                                                                                                                                                                            |
| `AGENTS.md`                                                                       | Git Hooks section updated to describe the shim form. Watch the instruction-size budget — this section should shrink, not grow.                                                                                                                                                                                                                                                          |
| `repo-governance/development/infra/github-actions-workflow-naming.md`             | Adds `dependency` to the cross-cutting `{domain}` list and `audit` to the verb vocabulary, so `dependency-vulnerability-audit.yml` is legal. Registers it, `pr-quality-gate.yml`, and `validate-env.yml` in the Cross-cutting workflows table; removes `main-ci.yml`. See [§2.2.3](#223-what-is-deliberately-outside-the-registry).                                                     |
| `.github/workflows/README.md`                                                     | Row for `deps-audit.yml` replaced by `dependency-vulnerability-audit.yml`; `main-ci.yml` row removed; row added for `rhino-cli-parity-audit.yml`.                                                                                                                                                                                                                                       |
| `docs/reference/related-repositories.md`                                          | Line 118's "`beaver-nest` carries a **fork** ... explicitly **not** bound by the byte-identity rule" is deleted. The byte-identity boundary becomes four repos. The two-boundary framing stays — content parity is still `ose-public` ↔ `ose-primer` only — but the byte-identity boundary now matches the four-repo set. See [§2.8.6](#286-the-governance-change-this-requires).       |
| `AGENTS.md` (Related Repositories)                                                | "`apps/rhino-cli` byte-identity spans `ose-public`, `ose-primer`, the private sibling" becomes all four; "`beaver-nest` ... carries a **fork** of `rhino-cli`" is removed. The sentence distinguishing the two boundaries must be rewritten, not merely edited — the current wording's whole point is that the sets differ.                                                             |
| `docs/reference/sdlc-gate-standard.md` (byte-identity section)                    | Boundary extended to four repos; `tests/` added to the file set; the manifest gate and the cross-repo audit documented as the enforcement, replacing "second-pass target" prose.                                                                                                                                                                                                        |
| `repo-governance/workflows/plan/multi-plans-execution.md`                         | The scheduling rule's "byte-identical propagation across `ose-public`/`ose-primer`/the private sibling" is extended to name all four bound repos, so the multi-plan scheduler serializes a `beaver-nest`-touching plan against a concurrent `apps/rhino-cli` edit elsewhere too.                                                                                                        |
| `repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution.md` | "`apps/rhino-cli` byte-identity across all three repos" is extended to "all four bound repos", matching [§2.8.6](#286-the-governance-change-this-requires).                                                                                                                                                                                                                             |
| `repo-governance/workflows/plan/plan-multi-repo-parity-planning.md`               | The "byte-identical across all three repos" language is extended to four repos; the literal `git -C ose-public ls-files ... across all three repos` manual `md5`-diff snippet is replaced with a pointer to `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- parity manifest validate`, so it cannot silently diverge from the mechanism this plan introduces. |

### 3.1 Security Waiver — OpenTofu 1.12.3

**Path C approval:** Pin `tofu` to OpenTofu 1.12.3, released 2026-06-18. No CVE-clean version
meets the 2026-06-06 Path B cutoff. The Low [GHSA-22w5-2fxg-vrwx](https://github.com/advisories/GHSA-22w5-2fxg-vrwx)
concerns upstream Go CVEs CVE-2026-42504 and CVE-2026-27145; neither has a matching CISA KEV entry,
and each EPSS score is below 0.5. The separate High [GHSA-q7j3-v8qv-22vq](https://github.com/advisories/GHSA-q7j3-v8qv-22vq)
concerns arbitrary file read during certain git operations; it does not assert a CVE mapping to those
upstream Go CVEs. The exact 1.12.3 macOS/Linux guarantee is implemented through a verified immutable
official release archive: Doctor downloads the pinned archive, verifies its committed SHA-256 checksum,
and installs only after verification. The [security-waiver register](../../../docs/reference/security-waivers.md)
holds the durable entry. **AI sign-off: Codex.**

## 4. Risks and Mitigations

| Risk                                                                                             | Severity | Mitigation                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cross-PR interaction breakage no longer swept                                                    | Accepted | Documented in [brd.md §Accepted Risk](./brd.md#accepted-risk) with the reopening trigger and the named remedy                                                                                                                                                            |
| Registry becomes a second source of truth beside the standard doc                                | Medium   | The standard doc stops enumerating commands and points at `gate list`; `gate validate` is the enforcement, prose is the explanation                                                                                                                                      |
| Byte-identity window while the engine lands in `ose-public` before the other repos               | Medium   | Phase 2 finalizes the copy source and governance documents; Phases 3, 4, and 5 then run in parallel, and all-four convergence is a Phase 6 precondition                                                                                                                  |
| `beaver-nest`'s fork diverges from the engine                                                    | Medium   | Phase 5 copies only after its listed capabilities are upstreamed and verified; `gate validate` exiting zero in `beaver-nest` is a phase-gate condition                                                                                                                   |
| Copying canonical over `beaver-nest` deletes its naming, F# env-scanning, or Git-isolation fixes | High     | Sequencing, not vigilance: every listed improvement is upstreamed into canonical with regression coverage in Phase 11 **before** any downstream copy ([§2.8.5](#285-convergence-sequence--upstream-before-downstream))                                                   |
| Deleting the dead pre-commit pipeline breaks something grep did not reveal                       | Medium   | The blast-radius table in [§2.8.2](#282-the-dead-pre-commit-pipeline) enumerates all seven sites; acceptance is a clean build, an unchanged full test suite, and byte-identical `rhino-cli --help` output before and after                                               |
| The manifest gate self-heals drift instead of reporting it                                       | Medium   | `parity manifest generate` is deliberately excluded from the pre-commit mutation set, so it never auto-runs; regeneration is an explicit act and the gate fails loudly until someone performs it ([§2.8.4](#284-enforcement--a-hermetic-gate-plus-a-non-hermetic-audit)) |
| Coordinated drift (source **and** manifest edited together) passes every gate                    | Accepted | Undetectable hermetically, by construction. The scheduled `rhino-cli-parity-audit.yml` is the only detector, and it is non-blocking — drift is reported, not prevented                                                                                                   |
| `beaver-nest` loses the ability to make a local `rhino-cli` change                               | Accepted | The deliberate cost of joining the boundary, stated in [§2.8.6](#286-the-governance-change-this-requires). Its changes now route through `ose-public` like the other two downstream repos                                                                                |
| Matrix job names change, breaking required-status-check configuration                            | Low      | The required `Quality gate` join-job name is preserved byte-for-byte; Phase 6 verifies accessible branch-protection state and makes no settings change when it still resolves                                                                                            |
| A re-runnable registry-emitting step duplicates on re-run                                        | Low      | Any generated block is written marker-first: check the applied marker before the anchor                                                                                                                                                                                  |

## 5. Delivery DAG

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Gray #808080
graph TD
    P0["Phase 0<br/>Baseline convergence<br/>(no PR)"]
    P1["Phase 1<br/>Gate engine<br/>ose-public"]
    P1B["Phase 11<br/>De-fork canonical source<br/>+ parity manifest<br/>ose-public"]
    P2["Phase 2<br/>Rewire + retire main-ci<br/>ose-public"]
    P3["Phase 3<br/>Propagate + rewire<br/>ose-primer"]
    P4["Phase 4<br/>Propagate + rewire<br/>private sibling"]
    P5["Phase 5<br/>Join boundary + rewire<br/>beaver-nest"]
    P6["Phase 6<br/>Knowledge capture"]

    P0 --> P1
    P1 --> P1B
    P1B --> P2
    P2 --> P3
    P2 --> P4
    P2 --> P5
    P3 --> P6
    P4 --> P6
    P5 --> P6

    style P0 fill:#808080,stroke:#000000,color:#FFFFFF
    style P1 fill:#0173B2,stroke:#000000,color:#FFFFFF
    style P1B fill:#0173B2,stroke:#000000,color:#FFFFFF
    style P2 fill:#DE8F05,stroke:#000000,color:#000000
    style P3 fill:#DE8F05,stroke:#000000,color:#000000
    style P4 fill:#DE8F05,stroke:#000000,color:#000000
    style P5 fill:#DE8F05,stroke:#000000,color:#000000
    style P6 fill:#029E73,stroke:#000000,color:#FFFFFF
```

**Phase 11 is a new blocking node, and it is where the byte-identity work concentrates.** The engine
must be final before any repo copies it, and — added by the byte-identity scope — the canonical source
must be **de-forked** before any repo copies it too. Copying a canonical that still hardcodes
`ose-public`'s app names into `beaver-nest` would either recreate the fork or delete `beaver-nest`'s
`ROADMAP.md`/`SECURITY.md` exemptions, so §2.8.5's steps 1 through 4 all land here.

Phase 2 serializes after Phase 11 because it finalizes governance files the downstream nodes copy.
Phases 3 through 5 then become mutually independent and fan out up to N=3. Phase 6 is the terminal
knowledge-capture and archival node; prompted cleanup follows it as the final DAG node.

## 6. Rollback

Rollback is cheap here for one structural reason: **every phase lands as its own PR, and no phase
writes state outside the repo it touches.** There is no migration, no data conversion, and no
external system to unwind — the whole change is source files plus CI configuration. Reverting a
phase's landed commit restores the prior gate behaviour exactly, because the prior gate behaviour
_is_ the prior content of `.husky/`, `package.json`, and `.github/workflows/`.

### The revert command depends on how the PR was merged

Both `allow_merge_commit` and `allow_squash_merge` are enabled on these repos, and recent history
shows **most merged PRs land as single-parent squash commits**. `git revert -m 1` works only against
a true two-parent merge commit and hard-fails on a squash commit with
`error: mainline was specified but commit ... is not a merge`. Resolve the exact landed commit from
the exact delivery branch, prove that it belongs to `origin/main`, and determine its shape before
reverting it. Select the literal repository path and branch from the table below; do not infer
either from the current checkout.

| Phase | Repository worktree                                                                | Delivery branch                            |
| ----- | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| 1     | `~/ose-projects/ose-public/worktrees/sdlc-gate-registry-enforcement`               | `sdlc-gate-registry-enforcement`           |
| 11    | `~/ose-projects/ose-public/worktrees/sdlc-gate-registry-enforcement-defork`        | `sdlc-gate-registry-enforcement-defork`    |
| 2     | `~/ose-projects/ose-public/worktrees/sdlc-gate-registry-enforcement-rewire-public` | `sdlc-gate-registry-enforcement-rewire`    |
| 3     | `~/ose-projects/ose-primer/worktrees/sdlc-gate-registry-enforcement`               | `sdlc-gate-registry-enforcement`           |
| 4     | `~/ose-projects/<sibling>/worktrees/sdlc-gate-registry-enforcement`                | `sdlc-gate-registry-enforcement`           |
| 5     | `~/ose-projects/beaver-nest/worktrees/sdlc-gate-registry-enforcement`              | `sdlc-gate-registry-enforcement`           |
| 6     | `~/ose-projects/ose-public/worktrees/sdlc-gate-registry-enforcement-knowledge`     | `sdlc-gate-registry-enforcement-knowledge` |

For example, Phase 1 uses the first two assignments below. For any other phase, replace both
assignments with the literal values from its row before running the remainder unchanged:

```sh
ROLLBACK_REPO=$HOME/ose-projects/ose-public/worktrees/sdlc-gate-registry-enforcement
ROLLBACK_BRANCH=sdlc-gate-registry-enforcement
test -d "$ROLLBACK_REPO"
git -C "$ROLLBACK_REPO" fetch origin main
PHASE_PR=$(cd "$ROLLBACK_REPO" && gh pr list --state merged --base main \
  --head "$ROLLBACK_BRANCH" --limit 1 --json number --jq '.[0].number')
test -n "$PHASE_PR"
PHASE_SHA=$(cd "$ROLLBACK_REPO" && gh pr view "$PHASE_PR" \
  --json mergeCommit --jq '.mergeCommit.oid')
test -n "$PHASE_SHA"
git -C "$ROLLBACK_REPO" merge-base --is-ancestor "$PHASE_SHA" origin/main
PARENT_WORDS=$(git -C "$ROLLBACK_REPO" rev-list --parents -n 1 "$PHASE_SHA" | wc -w | tr -d ' ')
case "$PARENT_WORDS" in
  3) git -C "$ROLLBACK_REPO" revert -m 1 "$PHASE_SHA" ;;
  2) git -C "$ROLLBACK_REPO" revert "$PHASE_SHA" ;;
  *) printf '%s\n' "Unexpected parent-word count: $PARENT_WORDS" >&2; exit 1 ;;
esac
```

The procedure uses the merge-parent option only when the parent-word count is 3 (SHA plus two
parents) and plain `git revert` when it is 2. Never resolve this by trying `-m 1` and reacting to
the error — check first, because a failed revert mid-rollback leaves a dirty tree that another
actor may be sharing. `[Repo-grounded]` — the 3-vs-2 mapping was
independently re-verified against this repo's live history on 2026-08-02: `git rev-list --parents -n 1`
on an actual two-parent merge commit (`3ac60d2e8`) returned `3`, and on an actual single-parent
commit (`7d3034a76`) returned `2`.

### Per-phase rollback

| Phase   | Rollback action                                                                         | What returns                                                                                  | Residue                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0       | None needed — no PR, no merge                                                           | n/a                                                                                           | Baseline notes in the plan folder only                                                                                              |
| 1       | Run the resolution-and-revert procedure with the Phase 1 row                            | The `gate` subcommand disappears; hooks were not yet rewired, so nothing depended on it       | None                                                                                                                                |
| 11      | Run the resolution-and-revert procedure with the Phase 11 row                           | Canonical returns to the forked state and the parity manifest is deleted                      | The byte-identity window **stays open** — see below                                                                                 |
| 2       | Run the resolution-and-revert procedure with the Phase 2 row                            | Hand-written hooks and `main-ci.yml` return verbatim; the registry stays but nothing reads it | Branch protection still names `"Quality gate"`, which is correct in both states                                                     |
| 3, 4, 5 | Run the procedure with that phase's literal repository and branch row                   | That repo's hooks and workflows return; the other repos are unaffected                        | `apps/rhino-cli` in that repo now diverges from canonical — the parity gate fails there until re-propagated or `ose-public` reverts |
| 6       | Run the procedure with the Phase 6 row, then move the plan back to `plans/in-progress/` | Plan-folder-only change; no executable surface                                                | None                                                                                                                                |

The procedure locates a phase's landed SHA with its exact delivery branch and then uses
`git merge-base --is-ancestor` only to prove that the resolved SHA is on `origin/main`.
`[Web-cited]` — `mergeCommit` is a valid `gh pr list --json` field per
[the official `gh pr list` manual](https://cli.github.com/manual/gh_pr_list), checked 2026-08-02,
which lists the accepted `--json` field names including `mergeCommit` (locally,
`gh pr list --json` with no value also prints the identical accepted field names).
`[Repo-grounded]` — the squash-merge false-negative on `git merge-base --is-ancestor`
was independently reproduced against this repo's own merged-PR history on 2026-08-02.

### The one asymmetry worth stating

Reverting Phase 11 **after** Phases 3, 4, or 5 have merged does not restore a consistent world: those
repos now hold the de-forked canonical while `ose-public` holds the forked one, so
`parity manifest validate` fails everywhere. The correct rollback in that situation is to revert the
downstream phases **first**, then 1b — the reverse of the DAG edge order in §5. This is the same
sequencing constraint that made Phase 11 blocking in the first place, applied backwards.

### What rollback does not need to undo

- **No secret, credential, or environment value is created, moved, or read by any phase.** The
  registry declares command names and globs; the workflows it emits read the same repository
  variables the current workflows already read.
- **No git history rewrite is used anywhere in this plan.** Rollback is `git revert`, never
  `reset --hard`, `push --force`, or a branch deletion — per
  [No Destructive Git Operations](../../../repo-governance/development/workflow/no-destructive-git-operations.md).
- **The retired `deps-audit.yml` is renamed, not deleted.** Reverting Phase 2 restores the original
  filename and `name:` field together, so a scheduled run that fires mid-rollback finds one workflow
  under one name in either state.
