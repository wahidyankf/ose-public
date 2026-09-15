---
title: "BRD: BeaverNest Repository Consolidation"
description: Business rationale, current-state baseline, success metrics, and risks for folding beaver-nest into ose-public
category: explanation
subcategory: plans
tags:
  - governance
  - cross-repo
  - consolidation
created: 2026-08-06
---

# Business Requirements Document: BeaverNest Repository Consolidation

## Business Goal and Rationale

Reduce the OSE family from four independently-maintained public/private repositories to three, by
folding the BeaverNest product into `ose-public` and archiving
[`beaver-nest`](https://github.com/wahidyankf/beaver-nest).

The maintainer's stated reason is maintenance burden: four open repositories cost more attention
than the work inside them justifies, and three is enough. That judgment is supported by the baseline
below — `beaver-nest` holds roughly 1,300 lines of product source with **no shipped user-facing
capability**, while obliging every governance change to be authored, propagated, verified, and
CI-gated a fourth time.

The consolidation also collapses a structural awkwardness. Today the family is "four repos, of which
three form a parity loop." After this plan the family **is** the parity loop — one set, one meaning,
no carve-out to explain. Every governance sentence that currently has to distinguish "all four repos"
from "the three parity repos" loses a special case.

## Current-State Baseline (Mechanically Verified, 2026-08-06; Re-Verified 2026-08-10)

All figures below were measured directly against `main` in both working trees on 2026-08-06, and
re-measured the same way on 2026-08-10 [Repo-grounded]. Where the two differ, the table shows
`2026-08-06 → 2026-08-10`.

| Measure                                        | Value                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared root commit                             | `8257d1ff44007d1d425944e3952cb94aca919f42` — identical in both repos                                                                                                                                                                                                                                                                                            |
| Commits on `main`                              | `beaver-nest` 5,340 → 5,349 · `ose-public` 5,464 → 5,529                                                                                                                                                                                                                                                                                                        |
| Commits since fork `32ec0270f`                 | `ose-public` 317 · `beaver-nest` 137 (measured fresh 2026-08-10)                                                                                                                                                                                                                                                                                                |
| Tracked files                                  | `beaver-nest` 1,969 → 1,936 · `ose-public` 14,866 → 14,921                                                                                                                                                                                                                                                                                                      |
| `beaver-nest` working tree                     | dirty, 11 files → **clean, 0 files** — [D9](./tech-docs.md#design-decisions) is currently moot                                                                                                                                                                                                                                                                  |
| `repo-governance/` files                       | 202 vs 208 → 203 vs 212; **200 shared → 201 shared, of which 118 (59%) → 141 (70%) have diverged**                                                                                                                                                                                                                                                              |
| `plans/ideas/` two-pagers                      | 43 in `beaver-nest`, 35 duplicates → **8 in `beaver-nest`, 0 duplicates** (all 8 now unique)                                                                                                                                                                                                                                                                    |
| `beaver-nest`-unique ideas                     | 8 (4 product-specific, 4 generic-governance) — split unchanged though totals moved                                                                                                                                                                                                                                                                              |
| `apps/rhino-cli` divergence                    | genuine fork — 58 → **95** differing/upstream-only paths (widened post-`optimize-cis`); `parity.rs`, `commands/gate/`, `commands/git/`, `parity-manifest.sha256` remain upstream-only                                                                                                                                                                           |
| 3-repo `parity-manifest.sha256`                | **open** as of 2026-08-10 — `ose-public`/`ose-primer`/the private sibling carry three different contents; `optimize-cis`'s own AC-15 records this accepted-with-reason, not closed                                                                                                                                                                              |
| `beaver-nest-be` implemented endpoints         | **2** — `GET /api/v1/health`, `GET /api/v1/readiness`                                                                                                                                                                                                                                                                                                           |
| `beaver-nest-be` source                        | 858 → 980 lines F#+SQL; sole DB migration is still an empty-journal script, zero domain tables                                                                                                                                                                                                                                                                  |
| `beaver-nest-fe` source                        | 211 lines; single-screen Vite/React SPA whose own copy reads "No workspace features yet" [methodology: `find src -type f -not -path 'src/generated-contracts/*' -not -path 'src/test/*' -not -name '*.test.*' -not -name '*.spec.*' \| xargs wc -l`, run from `apps/beaver-nest-fe`, excluding tests and the generated OpenAPI client]                          |
| `beaver-nest` deploy branches                  | **none** — `git branch -r` shows only `origin/main` plus one stale PR-source branch, unchanged                                                                                                                                                                                                                                                                  |
| `beaver-nest` open PRs                         | 0, unchanged                                                                                                                                                                                                                                                                                                                                                    |
| `beaver-nest`-specific CI                      | 1 workflow of 8 → **1 of 9** (`beaver-nest-app-test-local-deploy-stag.yml`); the rest are shared harness                                                                                                                                                                                                                                                        |
| Ports in use                                   | 19300 / 19310 / 19320 — **no collision** with `ose-public`'s 3100-3300, 8202, 8302, unchanged                                                                                                                                                                                                                                                                   |
| Governance gaps where `beaver-nest` was behind | 2026-08-06: Type-soundness PR discipline, gate-registry git-hook model, Build-Artifact Sweeper convention, `main-to-origin-main` restriction. 2026-08-10: **three of four closed**; the gate-registry git-hook gap **widened** — `beaver-nest`'s `.husky/pre-push` is still ~30 hand-written lines vs. `ose-public`'s post-`optimize-cis` 2-line generated shim |

Three findings from this baseline drive the plan's shape:

1. **The divergence is overwhelmingly rename churn, not rule difference.** Of the 141 differing
   governance files (re-measured 2026-08-10, up from 118), the dominant class is mechanical
   substitution of app names in prose and command examples. A second class is roster softening. Only
   a third, small class is genuine rule divergence, and it has **narrowed** since the 2026-08-06
   baseline: `beaver-nest` has since caught up on the Type-soundness PR-review discipline and the
   Build-Artifact Sweeper convention, and now carries the `main-to-origin-main` selection-signal
   restriction text too. The one item still missing — and now the **largest single gap**, not one of
   four — is the gate-registry git-hook model: `beaver-nest`'s `.husky/pre-push` is still ~30 lines of
   hand-written `cargo run` invocations, unchanged since before `optimize-cis` collapsed
   `ose-public`'s own pre-push hook to a 2-line generated shim. This is why the plan discards
   `beaver-nest`'s governance tree wholesale rather than reconciling it: a rename-driven merge would
   silently resurrect superseded rules.
2. **The product is genuinely small and genuinely inert.** Porting it is a bounded, low-risk file
   move, not a system integration.
3. **A governance contradiction exists, though `optimize-cis` already resolved half of it.** At the
   2026-08-06 baseline both `docs/reference/sdlc-gate-standard.md:186` and
   `apps/rhino-cli/src/application/parity.rs:557` asserted `apps/rhino-cli` is byte-identical across
   "all four bound repos". Re-verified 2026-08-10: `parity.rs` (now around line 560) **already emits
   the three-repo message** — `"byte-identical across ose-public, ose-primer, and <private-sibling>"`, with
   an explicit test asserting the string never contains `beaver-nest` — landed by `optimize-cis`'s own
   Phase 7 (commit `c182c543a`, 2026-08-09) as a side effect of resolving a contradiction _that plan_
   tripped over. `docs/reference/sdlc-gate-standard.md` was **not** part of that fix and still says
   "four OSE repositories" / "four bound repos" and names `beaver-nest` explicitly (lines 18-19, 113,
   186, 191, 202). So the contradiction survives, just inverted: the runtime code now agrees with this
   plan's target state, and the standard document is what still needs the sweep. This plan's Phase 5
   TDD cycle must be re-derived at Phase 0 against this — the RED step ("`parity.rs` still emits the
   four-repo string") will no longer fail, so that sub-step is done; the GREEN step's actual remaining
   work is `sdlc-gate-standard.md` and the rest of the documentation sweep — while
   [`docs/reference/related-repositories.md`](../../../docs/reference/related-repositories.md)
   states `beaver-nest` carries an unbound **fork** and sits in neither cross-repo boundary. The
   measured 95-path fork (re-verified 2026-08-10) confirms `related-repositories.md` is the accurate
   one. Retiring the fourth repo removes the contradiction at its source.

## Prior Art and Precedent

Surveyed via `web-researcher` on 2026-08-06. Sources are cited with the substantive claim, not URLs
alone, per the plan success-metric rule.

**Consolidation as a response to duplicated maintenance** — the closest published analog is Block,
Inc. (Cash App + Square) consolidating roughly 450 JVM repositories into one monorepo, reported by
[InfoQ, 2026-06-19](https://www.infoq.com/news/2026/06/block-450-jvm-monorepo-migration/) [Web-cited,
accessed 2026-08-06]. The stated motive matches this plan's almost exactly: _"dependency version
drift, duplicated upgrade efforts, and an increased risk of runtime incompatibilities across JVM
services."_ Block engineer Yissachar Radcliffe is quoted directly: _"Dependency management in the
polyrepo had become unmanageable."_

**The canonical monorepo rationale** — Potvin & Levenberg, _"Why Google Stores Billions of Lines of
Code in a Single Repository"_,
[Communications of the ACM 59 (2016), pp. 78-87](https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/)
[Web-cited, accessed 2026-08-06] names the benefits of a single repository as _"unified versioning,
extensive code sharing, simplified dependency management, atomic changes, large-scale refactoring,
collaboration across teams, flexible code ownership, and code visibility."_ The first four apply
directly here. _Note: the researcher confirmed this benefit list across three independent secondary
sources but could not retrieve the full PDF; treat the quotation as corroborated rather than
first-hand._

**The duplicated-maintenance cost, stated by this repo's own toolchain** — Nx's
[Monorepo vs Polyrepo knowledge-base page](https://nx.dev/docs/kb/monorepo-vs-polyrepo) [Web-cited,
accessed 2026-08-06] puts it plainly: _"every maintenance task, from dependency upgrades to CI
changes, has to be repeated across all the repositories in the organization."_ The same page notes
that even a multiple-monorepo arrangement _"adds overhead: multiple CI pipelines and repeated tooling
maintenance"_ — which is the honest framing of this plan, since it goes from four repos to three, not
to one.

**Archiving semantics** — [GitHub Docs, "Archiving repositories"](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)
[Web-cited, accessed 2026-08-06] confirms the properties D4 relies on: archiving makes _"issues, pull
requests, code, labels, milestones, projects, wiki, releases, commits, tags, branches, reactions,
code scanning alerts, comments and permissions … read-only"_, the repository stays cloneable and
browsable, forking and starring still work, and the action is **reversible** (_"To make changes in an
archived repository, you must unarchive the repository first"_). GitHub also _"recommends that you
close all issues and pull requests, as well as update the README file and description, before you
archive a repository"_ — folded into this plan's final phase as explicit steps.

**Why not a history merge** — Git's own documentation for `git merge` states that
`--allow-unrelated-histories` exists to _"override this safety when merging histories of two projects
that started their lives independently"_, and that _"As that is a very rare occasion, no configuration
variable to enable this by default exists or will be added"_ [Web-cited,
[git-scm.com/docs/git-merge](https://git-scm.com/docs/git-merge), accessed 2026-08-06]. Nx's own
[`nx import` documentation](https://nx.dev/docs/guides/adopting-nx/import-project) [Web-cited,
accessed 2026-08-06] — the tool-native alternative — does preserve filtered history, but explicitly
leaves the operator to _"Manage any dependency conflicts between the two code bases"_ and to
_"Migrate over code outside the source project's root folder that the source project depends on"_,
warning that _"most real migrations have workspace-specific quirks."_ Both paths would import
~5,340 commits of predominantly-renamed scaffolding to preserve blame on ~1,300 lines of inert product
code. D1 rejects both on that basis.

**Counter-evidence** — the case against is real and belongs on the record.
[Aviator, "Monorepo vs Polyrepo", 2025-03-26](https://www.aviator.co/blog/monorepo-vs-polyrepo/)
[Web-cited, accessed 2026-08-06] notes monorepos _"can lead to complex CI/CD and scaling issues
without specialized tools"_, carry _"access control challenges"_, and concentrate blast radius, while
polyrepos give _"team autonomy, faster builds, and independent deployments."_ Two of those three
downsides are weak here: `ose-public` already runs Nx with `affected`-scoped targets, and the family
is a single maintainer, so team autonomy and access isolation buy nothing. **Blast radius is the one
that genuinely applies** and is carried into the risk table below.

## Business Impact

**Pain points removed**

- A fourth propagation target for every governance change, each requiring its own worktree, PR,
  review cycle, and CI run.
- A duplicated idea backlog: the 2026-08-06 baseline measured 35 of 43 briefs shadowing
  `ose-public`'s own, 16 of those already diverged from their upstream twin. This has since
  self-resolved via unrelated cross-repo grooming — the baseline table above now records 0
  duplicates as of 2026-08-10 — so it is historical context for why this plan discards
  `beaver-nest`'s idea backlog wholesale (D2), not a live pain point this plan itself fixes.
- A `rhino-cli` fork drifting further from the tri-repo byte-identity boundary with every upstream
  CLI change.
- A standing governance contradiction about whether the byte-identity boundary spans three repos or
  four.

**Benefits gained**

- "All the OSE repos" and "the parity loop" become the same three-member set — one definition
  instead of two plus a carve-out.
- BeaverNest's product work inherits `ose-public`'s current governance, agent fleet, and CI harness
  automatically instead of by manual propagation.
- The four product ideas already filed against BeaverNest become actionable in the same backlog as
  everything else.

**Costs accepted**

- `ose-public` grows by two apps, two E2E suites, a specs tree, a compose stack, and a CI caller,
  widening its `nx affected` graph and its CI surface.
- Per-file `git blame` for the ported product points at one import commit, not the original authoring
  commits. The originals remain readable in the archived repository.

## Affected Roles

Hats the single maintainer wears, and the agents that consume this plan:

- **Repo steward** — owns the four→three terminology sweep and the governance-contradiction fix.
- **Product maintainer (BeaverNest)** — owns the ported apps once they live in `ose-public`.
- **Release/infra** — owns the CI caller, compose stack, and the archive flip.
- **Consuming agents** — `plan-checker` / `plan-fixer` (this plan's quality gate);
  `repo-rules-checker` (post-sweep consistency); `swe-fsharp-dev`, `swe-typescript-dev`, `swe-e2e-dev`
  (the port); `pr-review-*` specialists (each PR); `social-linkedin-post-maker` (its four-repo commit
  sweep must become three).

## Business-Level Success Metrics

All four are observable checks, verifiable on demand — no fabricated baselines.

1. **The family is three repositories.**
   `grep -rn "beaver-nest" AGENTS.md README.md docs/reference/ repo-governance/ .claude/ apps/rhino-cli/src` returns
   zero hits in each of `ose-public`, `ose-primer`, and the private sibling, except where the string appears
   inside `plans/done/**` (an immutable archive) or as a historical reference explicitly marked as
   such. [Observable fact]
2. **The product is present and green in `ose-public`.**
   `nx run-many -t test:quick -p beavernest-be,beavernest-app-web,beavernest-be-e2e,beavernest-app-web-e2e`
   exits 0. [Observable fact]
3. **The governance contradiction is gone.**
   `grep -rn "<private-sibling>, and beaver-nest" apps/rhino-cli/src` returns zero hits, and
   `docs/reference/sdlc-gate-standard.md` and `docs/reference/related-repositories.md` agree on a
   three-repo byte-identity boundary. [Observable fact]
4. **The repository is archived, not deleted.**
   `gh repo view wahidyankf/beaver-nest --json isArchived,visibility` reports
   `{"isArchived": true, "visibility": "PUBLIC"}`, and the URL still resolves. [Observable fact]

_Judgment call: the maintenance-effort reduction is the actual motive, but no per-repo effort
baseline was ever measured, so this plan makes no numeric claim about time saved. The structural
claim — one fewer propagation target for every future governance change — is what is being asserted._

## Business-Scope Non-Goals

- **Not** building any BeaverNest product capability. The walking skeleton lands exactly as-is.
- **Not** deploying BeaverNest. No `prod-*` or `stag-*` branch, no Vercel project, no hosting.
- **Not** reconciling `beaver-nest`'s governance tree, `rhino-cli` fork, or `libs/web-ui` copy —
  all three are discarded in favour of `ose-public`'s.
- **Not** preserving `beaver-nest`'s commit history inside `ose-public`.
- **Not** changing the `ose-public` ↔ `ose-primer` content-parity boundary or the three-repo
  `rhino-cli` byte-identity boundary. Both keep their current membership; only the count of repos
  _outside_ them changes, from one to zero.
- **Not** deleting the GitHub repository.

## Business Risks and Mitigations

| Risk                                                                                                                                                                                    | Severity | Mitigation                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archiving strands the `beaver-nest` track of the in-progress `sdlc-gate-registry-enforcement` plan, which is scoped to all four repos                                                   | HIGH     | Hard `blockedBy` on that plan (D5). This plan does not start until it completes. Confirmed as the chosen sequencing after weighing a rescope and a partial-unblock alternative.                                                                                                              |
| The four→three sweep collides with concurrent edits to the same governance files                                                                                                        | HIGH     | Same `blockedBy`. `sdlc-gate-registry-enforcement`'s File-Impact tree edits `related-repositories.md`, `sdlc-gate-standard.md`, `AGENTS.md`, `repo-config.yml`, all three `workflows/plan/*` files, and `apps/rhino-cli/**` — every sweep target. Serializing removes the conflict entirely. |
| The `rhino-cli` string change breaks the byte-identity boundary if it lands in only one repo                                                                                            | HIGH     | Unit 3 lands the identical `parity.rs` / `gate_specs.rs` edit in all three repos, serialized, with `rhino-cli parity manifest generate` re-run and the parity audit green before any merge.                                                                                                  |
| The ported frontend fails against `ose-public`'s `libs/web-ui`, which is behind `beaver-nest`'s copy (Storybook 10.2.10 vs 10.5.5, `@storybook/nextjs-vite` vs `@storybook/react-vite`) | MEDIUM   | Treated as expected integration work inside Unit 1, not a surprise. The port consumes `ose-public`'s `web-ui`; any incompatibility is fixed in the app, not by importing the divergent lib copy. A documented fallback is to pin the app's own Vite/Storybook deps.                          |
| Silently resurrecting a superseded governance rule by copying a `beaver-nest` governance file                                                                                           | MEDIUM   | D2 discards the governance tree entirely. Only two `beaver-nest`-unique governance files exist, and only the vision doc is carried; the other is explicitly evaluated, not auto-ported.                                                                                                      |
| Growing `ose-public`'s CI blast radius — the one counter-evidence risk that genuinely applies here                                                                                      | MEDIUM   | The two new apps are `affected`-scoped like every other app, and the added CI caller is schedule-triggered, not per-commit. Net per-PR CI cost is unchanged for PRs that do not touch `apps/beavernest-*`.                                                                                   |
| Inbound links to `github.com/wahidyankf/beaver-nest` break                                                                                                                              | LOW      | D4 archives rather than deletes; GitHub Docs confirms archived repos stay browsable and cloneable at the same URL. Past LinkedIn posts and `plans/done/**` references keep resolving.                                                                                                        |
| The stale `beaver-nest-app-setup` in-progress plan (72.5% complete, with a documented unsatisfiable Unit 3) is lost                                                                     | LOW      | Its disposition is an explicit Unit 2 step: it is carried into `ose-public` and closed as delivered-as-descoped, with its remaining real work already represented by the four ported product ideas.                                                                                          |

## Related Documentation

- [README.md](./README.md) — context, scope, resolved design decisions
- [prd.md](./prd.md) — user stories and Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — architecture, file-impact analysis, rollback
- [delivery.md](./delivery.md) — phased delivery checklist
- [Related Repositories](../../../docs/reference/related-repositories.md)
- [SDLC Gate Standard](../../../docs/reference/sdlc-gate-standard.md)
- [Multi-Plans Execution workflow](../../../repo-governance/workflows/plan/multi-plans-execution.md)
