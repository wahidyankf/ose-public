---
title: "BeaverNest Repository Consolidation"
description: Fold the beaver-nest product into ose-public, archive the repo, and reduce the OSE family from four repositories to three
category: explanation
subcategory: plans
tags:
  - governance
  - cross-repo
  - consolidation
  - beaver-nest
  - parity
created: 2026-08-06
---

# Plan: Fold BeaverNest Into `ose-public` and Retire the Fourth Repository

## Context

The OSE family is four repositories. Three of them — `ose-public`, `ose-primer`, `ose-private` —
form the **parity loop** whose generic content is deliberately kept aligned. The fourth,
[`beaver-nest`](https://github.com/wahidyankf/beaver-nest), sits outside that loop but is a full
family member, and every governance rule written for "all four repos" must be authored, propagated,
and verified there too.

`beaver-nest` is not an independent codebase. It shares root commit `8257d1ff4` with this repo
[Repo-grounded — `git rev-list --max-parents=0 HEAD` returns the same SHA in both trees, re-verified
2026-08-10], was produced by stripping a full `ose-public` clone down to its engineering harness
([`plans/done/2026-07-31__baseerah-repo-reset`](https://github.com/wahidyankf/beaver-nest) in that
repo), and was then rebranded wholesale. What it carries today is overwhelmingly **this repo's
scaffolding, drifted**:

1. **212 governance files in `ose-public` vs 203 in `beaver-nest`, 201 shared, of which 141 (70%)
   have diverged** [Repo-grounded — file-by-file comparison, re-verified 2026-08-10; up from
   118/200 (59%) at the 2026-08-06 baseline — both trees kept moving]. The overwhelming majority of
   that divergence is still mechanical rename churn (`ayokoding-www`/`ose-www` →
   `beaver-nest-fe`/`-be` in prose, paths, and command examples), not genuine rule difference. The
   genuine-rule-divergence class has **narrowed**: `beaver-nest` has since caught up on the
   Type-soundness PR-review discipline (`pr-review-types-maker.md` now exists there), the
   Build-Artifact Sweeper convention, and this repo's `main-to-origin-main` selection-signal
   restriction. The one gap that remains — and has **widened**, not narrowed — is the gate-registry
   git-hook model: `beaver-nest`'s `.husky/pre-push` is still ~30 lines of hand-written
   `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- <check>` invocations, while
   `ose-public`'s post-`optimize-cis` pre-push shim is two lines
   (`apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`) [Repo-grounded — both hooks
   read directly, 2026-08-10].
2. **8 idea two-pagers, all name-unique against `ose-public`'s own** [Repo-grounded — `comm -12`
   over both `plans/ideas/` listings, re-verified 2026-08-10; down from 43 total / 35 duplicates at
   the 2026-08-06 baseline — both repos' `plans/ideas/` trees have been groomed since, and the
   overlap the earlier baseline measured is now fully resolved]. 4 are product-specific
   (`beaver-nest-be-nullbyte-path-error-envelope`, `beaver-nest-first-deploy`,
   `beaver-nest-first-llm-integration`, `beaver-nest-persistence-layer`) and 4 are
   generic-governance (`orphaned-harness-binding-artifacts`, `unvalidated-cross-repo-citations`,
   `vitest-include-glob-silent-false-pass`, `web-ui-reuse-existing-server-residual`) — the same 4/4
   split as the earlier baseline, even though the total and duplicate counts moved. **This set is
   still volatile** — both repos' `plans/ideas/` trees remain under active cross-repo grooming — so
   Phase 0 re-derives the manifest and the plan triages that, not this number.
3. **A fork of `apps/rhino-cli`** that has fallen further behind: `src/application/parity.rs`,
   `src/commands/gate/`, and `src/commands/git/` exist only upstream, and the differing/upstream-only
   path count has grown to 95 (from 58 at the 2026-08-06 baseline) as `optimize-cis`
   ([`plans/done/2026-08-09__optimize-cis`](../../done/2026-08-09__optimize-cis/README.md)) rewrote
   large parts of the crate in `ose-public` only [Repo-grounded — `diff -rq` across both trees,
   re-verified 2026-08-10]. **Note for Phase 5**: `optimize-cis` also fixed, as a side effect,
   `apps/rhino-cli/src/application/parity.rs`'s runtime message — it already reads
   `"byte-identical across ose-public, ose-primer, and ose-private"` with a test asserting it never
   names `beaver-nest` (commit `c182c543a`, 2026-08-09). `docs/reference/sdlc-gate-standard.md` was
   not part of that fix and still says "four bound repos" / "four OSE repositories" and names
   `beaver-nest`. Phase 5's TDD cycle must be re-derived against this: the RED step will not fail on
   `parity.rs` anymore, so that sub-step is already satisfied — the remaining GREEN-step work is the
   `sdlc-gate-standard.md` sweep and the rest of the documentation targets. Separately, the
   byte-identity boundary among the three **surviving**
   repos is itself not yet closed: `ose-public`, `ose-primer`, and `ose-private` currently carry
   three different `parity-manifest.sha256` contents [Repo-grounded — direct diff, 2026-08-10];
   `optimize-cis` shipped with this open and accepted-with-reason as its own AC-15. This plan's
   Phase 5-7 sweep still assumes a closed boundary as its starting point — Phase 0 must re-confirm
   that before Phase 5 begins, and if it is still open, close it first (it is this plan's own
   `blockedBy` predecessor's unfinished acceptance criterion, not new scope).
4. **A product surface that is a walking skeleton.** `beaver-nest-be` exposes exactly two HTTP
   endpoints (`GET /api/v1/health`, `GET /api/v1/readiness`) over 980 lines of F#+SQL (up from 858 at
   the 2026-08-06 baseline); its single database migration is still literally `SELECT 1;`-equivalent
   (an empty `SchemaVersions` journal) with zero domain tables. `beaver-nest-fe` is unchanged at a
   single-screen Vite/React SPA of 211 lines (excluding tests and the generated OpenAPI client) whose
   own copy still reads "No workspace features yet"
   [Repo-grounded — source inspection, re-verified 2026-08-10]. There is no assistant, no content
   builder, no posting helper — those are roadmap, not built. Its local working tree is also now
   **clean** (0 uncommitted files, vs. 11 at the 2026-08-06 baseline), so [D9](./tech-docs.md#design-decisions)'s
   dirty-tree handling is currently moot — re-check at Phase 0 rather than assume it stays that way.

So the fourth repository costs a full governance-propagation lane, a duplicated CI harness, a
diverging CLI fork, and a duplicated idea backlog, and in exchange holds ~1,300 lines of product
source with no shipped capability. **The maintainer's stated reason for this plan is exactly that
burden: four open repositories are too many to maintain, and three is enough.**

Consolidation also resolves a live governance contradiction, though `optimize-cis` already fixed half
of it. `docs/reference/sdlc-gate-standard.md` still declares `apps/rhino-cli` byte-identical across
"all four bound repos" — `apps/rhino-cli/src/application/parity.rs:560` no longer agrees: it was
fixed, as a side effect of `optimize-cis`'s own Phase 7 (commit `c182c543a`, 2026-08-09), to emit the
three-repo message instead (see finding 3 above), with a test asserting it never names
`beaver-nest`. So the contradiction survives only in `sdlc-gate-standard.md`, not in `parity.rs`.
Separately, [`docs/reference/related-repositories.md`](../../../docs/reference/related-repositories.md)
states that `beaver-nest` carries an unbound fork and sits in neither cross-repo boundary
[Repo-grounded — all three read 2026-08-06]. Removing the fourth repo removes the contradiction
rather than papering over it.

> Requested 2026-08-06. Grilled via `AskUserQuestion` before authoring — see
> [Resolved Design Decisions](#resolved-design-decisions-from-grilling) below. Facts re-verified and
> the ordering constraint re-confirmed 2026-08-10, ahead of moving this plan to
> `plans/in-progress/`.

## Scope

**Repo scope**: three repositories. `ose-public` receives the ported product and hosts this plan
folder; `ose-primer` and `ose-private` receive only the terminology sweep that follows from the
family shrinking to three. `beaver-nest` is the **subject** of the plan, not a target of it — no
change lands there beyond the final archive flip.

**In scope**

- Port the BeaverNest product into `ose-public` under the repo's own naming tiers:
  `apps/beavernest-be`, `apps/beavernest-app-web`, and their two E2E pairs; the
  `specs/apps/beavernest/` tree; `infra/dev/beavernest-app/`; the staging CI caller; the three F#
  projects in `open-sharia-enterprise.sln`; and the `beavernest.css` brand token sheet.
- Port [`repo-governance/vision/beaver-nest.md`](https://github.com/wahidyankf/beaver-nest) as a
  child product vision alongside the existing ecosystem vision, and register it in
  `repo-governance/vision/README.md`.
- Port every `beaver-nest`-unique idea two-pager on the manifest Phase 0 freezes (8 at the
  2026-08-06 baseline; re-derived at execution time), folding each into an existing `ose-public`
  brief where one already covers the same problem, per the Integrate-Before-You-Add rule.
- Sweep the four-repo terminology to three across all three surviving repos — including the
  `apps/rhino-cli` string change, which must land **byte-identically** in all three.
- Archive `github.com/wahidyankf/beaver-nest` on GitHub.

**Out of scope**

- Any git-history merge. Commit history stays in the archived repository (see D1).
- `beaver-nest`'s governance tree, its `apps/rhino-cli` fork, and its duplicate idea two-pagers (35
  at the 2026-08-06 baseline, 0 as of 2026-08-10, per finding 2 above). `ose-public` is upstream and
  authoritative for all three (see D2).
- `libs/web-ui` reconciliation. The ported frontend consumes **this** repo's `web-ui`; the
  `beaver-nest` copy's 43 divergent files are discarded, not merged.
- Building any actual BeaverNest product capability. The walking skeleton lands as-is.
- Deploying BeaverNest anywhere. `beaver-nest` has no `prod-*` or `stag-*` branch today
  [Repo-grounded — `git branch -r` shows only `origin/main` and one PR branch, 2026-08-06], and this
  plan creates none.

## Approach Summary

Four delivery units, executed in order:

1. **Port the product** into `ose-public` behind a rename from the `beaver-nest-fe`/`-be` names to
   the tier-conformant `beavernest-app-web`/`beavernest-be`, wire it into Nx, CI, and the specs
   gates, and prove the gates green. One PR.
2. **Port the narrative surface** — vision doc, unique ideas, docs registration — and record the
   `beaver-nest-app-setup` plan's disposition. One PR.
3. **Sweep four→three** across `ose-public`, then `ose-primer`, then `ose-private`. Three PRs,
   serialized on the `apps/rhino-cli` byte-identity boundary.
4. **Archive** the GitHub repository and reconcile the local checkout.

## Resolved Design Decisions (from grilling)

| ID  | Decision                                                                                                                                                                                                                                                                    | Rationale                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Selective file port, no git-history merge.** Copy `beaver-nest`-unique paths in as new files.                                                                                                                                                                             | The two trees share a root commit but have both rewritten governance heavily since the fork; a real merge conflicts on essentially every governance file for history nobody will read. History stays readable in the archived repo. |
| D2  | **Carry product + vision + unique ideas only.** Discard the governance tree and the `rhino-cli` fork (the duplicate-ideas overlap the 2026-08-06 baseline measured has since resolved itself through cross-repo grooming — see [README.md finding 2](./README.md#context)). | `ose-public` is upstream and authoritative for all three surfaces, and is strictly ahead on each.                                                                                                                                   |
| D3  | **Single-token domain `beavernest`.** Apps become `beavernest-be`, `beavernest-app-web`, plus `-e2e` pairs.                                                                                                                                                                 | `fe` is not a legal type suffix in [`file-naming.md`](../../../repo-governance/conventions/structure/file-naming.md); the single-token domain matches `ayokoding`, `organiclever`, and `wahidyankf`.                                |
| D4  | **Archive the GitHub repo, do not delete it.**                                                                                                                                                                                                                              | Keeps history, issues, and every inbound link resolving; reversible via `gh repo unarchive`. Deleting breaks links already published in this repo's docs and in past LinkedIn posts.                                                |

## Ordering Constraint

This plan is the **last of three**, executed in this order:

```text
sdlc-gate-registry-enforcement  →  optimize-cis  →  beaver-nest-repo-consolidation
```

All three touch `apps/rhino-cli`. **Both predecessors are now archived** — re-verified 2026-08-10:
`test -d plans/done/*__sdlc-gate-registry-enforcement` and `test -d plans/done/*__optimize-cis` both
print `COMPLETE`. This plan is unblocked. The Blocking Preconditions checklist in
[delivery.md](./delivery.md) still runs these checks at Phase 0 — that is the plan's designed
re-verification step, not stale hedging, and is now expected to pass on first try.

### `blockedBy` — `sdlc-gate-registry-enforcement`

[`plans/done/2026-08-07__sdlc-gate-registry-enforcement`](../../done/2026-08-07__sdlc-gate-registry-enforcement/README.md)
originally declared all four repos in scope, so it needed `beaver-nest` to still exist as a live,
writable repository — archiving first would have stranded its fourth track. That plan **amended its
scope on 2026-08-07** to `ose-public` and `ose-private` only, with `beaver-nest`'s Phase 5
cancelled precisely because this consolidation retires it. It is done — the ordering constraint is
now historical context, not a live blocker.

### `blockedBy` — `optimize-cis`

[`plans/done/2026-08-09__optimize-cis`](../../done/2026-08-09__optimize-cis/README.md) — successor to, and
supersedes, the `rhino-cli-optimization` idea this section originally named (deleted 2026-08-08,
absorbed into `optimize-cis`'s scope) — rewrote how `apps/rhino-cli` is built, invoked, and
lint-gated, and archived 2026-08-09. **Correction (re-verified 2026-08-10): its Phase 10 sweep task
did not resolve this doc's citations** — that task is still unchecked in `optimize-cis`'s own
`delivery.md`, and this plan's `delivery.md` still carries 7 occurrences of the old
`cargo run --release --quiet --manifest-path apps/rhino-cli` invocation form — all 7 of them live
executable commands, at `delivery.md:298,594,668,677,699,731,753` — and zero occurrences of
`rhino-bin.sh`. (Verify with
`grep -c 'cargo run --release --quiet --manifest-path apps/rhino-cli' delivery.md`, run from this
plan folder, so this count stops drifting across future review cycles.) This sweep is still owed and
is inherited from `optimize-cis`, not new scope this plan invents. Note also that
`apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=<surface>` is **not** the general replacement
form — it is specifically for declared gate-surface runs (the git-hook context this doc's own bullet
above cites). All 7 of `delivery.md`'s sites invoke direct subcommands (`parity manifest validate`,
`parity manifest generate`, `repo-config validate`), whose
correct post-optimization form is `apps/rhino-cli/scripts/rhino-bin.sh <subcommand>` directly — e.g.
`apps/rhino-cli/scripts/rhino-bin.sh parity manifest validate` — not `gate run --surface=`.

**One item `optimize-cis` did not close, and this plan inherits as a live precondition rather than a
historical note**: its own closing acceptance clause states plainly that "`parity manifest validate`
returning an identical hash in all three repos is **not** part of this acceptance clause as of
2026-08-09 — AC-15 is open, accepted-with-reason." Re-verified 2026-08-10: `ose-public`,
`ose-primer`, and `ose-private` still carry three different `apps/rhino-cli/parity-manifest.sha256`
contents (17 differing entries between `ose-public` and `ose-primer` alone). This plan's Phase 5-7
four→three sweep assumes a **closed** byte-identity boundary as its starting point. Phase 0 must
re-check `parity manifest validate` in all three repos and, if still open, close that boundary first
— it is `optimize-cis`'s unfinished AC-15, not new scope this plan invents, but this plan cannot
proceed past Phase 5 while it is open.

Note this also supersedes an earlier nuance: the predecessor plan (`rhino-cli-optimization`) scoped its
own continuous byte-identity enforcement to only two of the three repos named in `parity.rs`'s
message, with `ose-primer` named but synced manually on a delay rather than continuously enforced.
`optimize-cis`'s design closed that gap in principle — its Phase 10 gate required `parity manifest
validate` to exit 0 with an identical hash in **all three** repos before its PRs merged — but AC-15
above records that the gate's target state was not actually reached by archival time.

## Worktree and Delivery Mode

Worktree path: `worktrees/beaver-nest-repo-consolidation/` (one per repo, at the same relative path
inside each of the three surviving repos plus `beaver-nest` itself — four worktrees total, per
[delivery.md's Worktree table](./delivery.md#worktree); `beaver-nest`'s is used only for Phase 8's
retirement-notice PR). Delivery Mode: **`worktree-to-pr`** — the repo
default, and the only available mode: per
[Per-Repository Delivery Mode Restrictions](../../../repo-governance/conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule),
`ose-public`'s `main` is branch-protected against direct pushes — including for repository admins —
so `worktree-to-origin-main` and `main-to-origin-main` have no path here, regardless of the change
set's file types.

Full declarations in [delivery.md](./delivery.md).

## Related Documentation

- [brd.md](./brd.md) — business rationale, current-state baseline, success metrics, risks
- [prd.md](./prd.md) — user stories and Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — architecture, design decisions, file-impact analysis, rollback
- [delivery.md](./delivery.md) — phased delivery checklist with gates
- [learnings.md](./learnings.md) — Knowledge Capture running log
- [Related Repositories](../../../docs/reference/related-repositories.md) — the four-repo definition this plan rewrites
- [Plans Organization Convention](../../../repo-governance/conventions/structure/plans.md)
- [PR Merge Protocol](../../../repo-governance/development/workflow/pr-merge-protocol.md)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
