---
title: "BRD — SDLC Gate Registry Enforcement"
description: Business rationale for mechanically enforcing the Gate Composition Rule and retiring main-ci.yml
category: explanation
subcategory: plans
tags:
  - ci-cd
  - governance
  - parity
created: 2026-08-02
---

# BRD — SDLC Gate Registry Enforcement

> **Scope Amendment (2026-08-07)**: the byte-identity boundary is narrowed to **`ose-public` +
> the private sibling** — see [delivery.md §Scope Amendment](./delivery.md#scope-amendment-2026-08-07).
> `beaver-nest` is **cancelled** (slated for future deprecation/merge into `ose-public`); `ose-primer`
> already fulfilled its one-time propagation and is now periodic/manual, outside continuous
> enforcement. The rationale and audit findings below are left as originally authored — historical
> record — except where explicitly marked cancelled/superseded inline.

## Context

The repo operates four quality-gate surfaces: `.husky/pre-commit`, `.husky/pre-push`,
`.github/workflows/pr-quality-gate.yml`, and `.github/workflows/main-ci.yml`. A predecessor plan,
[`standardize-rhino-cli-sdlc-parity`](../../done/2026-07-01__standardize-rhino-cli-sdlc-parity/README.md),
ratified a normative composition rule over those surfaces and wrote it into
[SDLC Gate Standard §Gate Composition Rule](../../../docs/reference/sdlc-gate-standard.md#gate-composition-rule):

> **`(pre-commit ∪ pre-push) == PR gate == main gate`** — the check set is identical; only the scope
> differs. Every check that runs at pre-commit or pre-push also runs in the PR gate and in
> `main-ci.yml`, and neither CI gate runs any check the two local hooks do not.

That rule was expressed as prose plus a set of markdown tables. Prose does not fail a build.

## Problem

An audit on 2026-08-02 compared the four surfaces in all four repos against the ratified rule. The
implementation violates the rule in both directions, and the standard document itself has drifted
away from what the surfaces actually run. `[Repo-grounded]` — see
[tech-docs §1](./tech-docs.md#1-audit-baseline--what-actually-runs-today) for the per-check table
this section summarizes; every claim below traces to a row there.

**Business consequence, stated plainly**: the repo believes it has one quality bar and actually has
four different ones. A contributor reading the standard is misled about what will catch their
mistake. Concretely, today:

- A markdown file with a broken Mermaid diagram or a skipped heading level reaches `main` uncaught if
  the author pushes with `--no-verify`, edits through the GitHub web UI, or the change arrives via a
  bot commit — because those validators exist only in `lint-staged` (staged files, local machine) and
  in a cron sweep that runs up to six hours later and blocks nothing.
- Unsynced harness mirrors (`.opencode/`, `.cursor/`, `.amazonq/`) reach `main` uncaught by any CI
  job, because `harness bindings validate` is pre-push-only in every repo and
  `harness sync validate` runs in no workflow at all.
- A specs-structure break in any project other than `rhino-cli` passes the PR gate, because that job
  is pinned to `--projects=rhino-cli`.
- Unformatted code reaches `main` uncaught in **any of fourteen languages**, because no surface ever
  _verifies_ formatting — the PR job auto-commits fixes and does not run at all on a direct push to
  `main`.
- `apps/rhino-cli` has **already drifted** out of byte-identity between `ose-public` and the two
  other bound repos, under a rule that permits zero carve-outs, and no surface in any repo is capable
  of noticing.
- Every repo advertises formatters for languages it does not have — 19 `lint-staged` entries across
  the four repos match zero tracked files — while two repos lint shell scripts they never format.

None of these are exotic. Each is a routine path.

## The Same Defect, One Layer Down

The audit found the byte-identity boundary has the identical shape of failure as the Gate Composition
Rule: ratified prose, zero enforcement, silent drift.

`src/application/agents/sync_validator.rs` carries `opencode-go/wrong` in `ose-public` and
`zai-coding-plan/wrong` in `ose-primer` and the private sibling. It is a one-line negative test fixture and
nothing behaves differently — which is exactly why it survived a zero-carve-out rule. Byte-identity is
a **cross-repo** property, and every gate in this ecosystem runs inside a **single** repo. The rule was
never enforceable as written, in any repo, by any surface that exists.

The more consequential finding is what `beaver-nest`'s fork actually contains. As refreshed on
2026-08-04, eight of its ten source divergences are `ose-public`'s own app names hardcoded into
supposedly-shared source —
`STAGED_SKIP_PREFIXES` naming `apps/ayokoding-www/content`, `WEBSITE_APP_PREFIXES` naming four `ose`
websites, an Amazon Q agent definition named `ose-default`, and test fixtures asserting on
`organiclever-be`. The other two source divergences are general capabilities worth upstreaming: the
`ROADMAP.md`/`SECURITY.md` naming exemptions and F# environment-wrapper detection. Its
`project.json` also isolates Rust test targets from inherited Git process state. Most of the fork was
absorbing a defect; the remainder must flow upstream before canonical is copied back down.

Roughly 700 lines of that hardcoding sit in `application/git/pre_commit.rs`, a pre-commit pipeline
reachable only from a command wired to **no CLI subcommand** — dead code, replicated byte-for-byte
into two other repos, and the single largest source of the divergence pressure.

This is why the byte-identity work belongs in this plan rather than a successor. The remedy for
"repo-specific data hardcoded in shared source" is "declare it in `repo-config.yml`" — which is the
mechanism this plan is already building for gate exclusion lists. Doing it twice would be the waste.

## Why Now

Three reinforcing reasons:

1. **The drift is silent and compounding.** Every surface is hand-written shell or YAML in four
   repos — twelve files. Each new check multiplies the places a maintainer must remember to edit.
   Nothing detects an omission. The audit found the surfaces have been diverging since the
   standardization plan closed.
2. **The fix is cheap relative to the alternative.** The repo already has the pattern: `.claude/` is
   hand-authored, mirrors are generated by `rhino-cli harness bindings generate`, and
   `harness bindings validate` fails when they drift. Applying that same generate-and-validate shape
   to the gate surfaces reuses proven machinery rather than inventing a mechanism.
3. **`main-ci.yml` is dead weight that hides the problem.** It runs on cron with no `push` trigger,
   so it gates nothing and blocks no merge. Its only real function today is to be the _sole_ home of
   three checks that should have been in the PR gate all along. Retiring it forces those checks into
   a surface that actually blocks.

## Goals

1. Make the Gate Composition Rule **mechanically enforced** — a surface cannot silently drop a check.
2. Reduce the twelve hand-written surface files to a **single declared registry per repo** plus thin
   invocation shims.
3. **Retire `main-ci.yml`** in all four repos after folding its unique checks into the PR gate.
4. Bring the **standard document back into agreement** with the implementation, in both directions.
5. Close the four related findings surfaced by the same audit (bindings-in-CI, format verification,
   the stale lifecycle doc, and the vaguely-named `deps:audit` workflow).
6. Make the **`rhino-cli` byte-identity boundary mechanically enforced** and extend it to all four
   repos, closing the live violation the audit found.

## Non-Goals

- **Changing which checks exist.** This plan re-homes and enforces the existing check set; it does
  not add new categories of validation. Formatter _entries_ are pruned per repo to the languages each
  repo actually tracks, which removes dead declarations rather than removing validation.
- **Changing scope semantics.** The five controlled scope values in the SDLC Gate Standard retain
  their ratified meaning. This plan makes one existing prose qualifier mechanically explicit by
  normalizing `path-gated` as a sixth controlled registry value; it does not invent a new execution
  behavior.
- **Generating the language-gate CI jobs.** Per-language jobs need their own toolchain setup actions
  (`setup-dotnet`, `setup-rust`, …) and stay hand-written. `gate validate` asserts their presence
  rather than emitting them.
- **Moving heavy tiers into gates.** `test:integration`, `test:e2e`, and `deps:audit` remain
  cron-only, and stay outside the registry entirely. See the note on `deps:audit` below.

## Accepted Risk

**Deleting `main-ci.yml` removes the only surface that ever runs `nx run-many --all`.** After this
plan, no surface re-verifies the whole repository.

What that does and does not cover:

- **Still covered** — the change that lands. `pr-quality-gate.yml` carries `push: branches: [main]`
  and computes `NX_BASE` from `github.event.before`, so a merge commit's own contents are gated.
- **No longer covered** — cross-PR interaction. Two PRs that are individually green and mutually
  breaking land on `main` with neither one's affected graph covering the other. Nothing subsequently
  sweeps the full project set to catch it.
- **No longer covered** — drift that is not change-driven at all: a transitive dependency resolving
  differently, an Nx tag edit that silently narrows an affected set, or a test that rots against a
  moving external.

Two mitigations were considered and **declined** in favour of the smaller surface area:

| Mitigation                                                                            | Why declined                                                                                                                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Make `pr-quality-gate.yml` run `nx run-many --all` when `github.event_name == 'push'` | Every merge to `main` pays a full-repo build and test. The cost lands on the critical path of every merge, for a class of breakage the audit found no instance of. |
| Keep a minimal cron that runs only `nx run-many --all -t test:quick`                  | Reintroduces the exact thing this plan retires — a second, non-blocking surface whose check set drifts from the gate.                                              |

**This risk is accepted deliberately.** If cross-PR interaction breakage is observed in practice, the
first mitigation is the documented remedy and should be reopened as a follow-up plan rather than
treated as a defect of this one.

## A Governance Change, Stated Plainly

Extending byte-identity from three repos to four is an **amendment**, not a clarification. Three
documents currently say the opposite and become false:
`docs/reference/related-repositories.md` ("`beaver-nest` carries a **fork** ... explicitly **not**
bound by the byte-identity rule"), `AGENTS.md` ("spans `ose-public`, `ose-primer`, the private sibling"),
and the SDLC Gate Standard's boundary section.

**`beaver-nest` gives up the right to diverge.** After this plan, a `rhino-cli` change it needs lands
in `ose-public` first and propagates, exactly as for the other two downstream repos. That is a real
constraint and should be weighed as one.

It is worth accepting because the audit shows most fork drift is repo-specific data hardcoded in
canonical. The current fork also carries general improvements: `ROADMAP.md`/`SECURITY.md` naming
exemptions, F# environment-wrapper detection with framework-owned-key exclusion, and isolation from
inherited Git state in Rust test targets. The plan upstreams all of them with regression coverage
**before** any repo copies canonical down. The remaining divergence is inherited defect or declared
per-repo data.

A second, smaller acceptance: **coordinated drift stays undetectable by any gate.** A repo that edits
boundary source and regenerates its manifest in the same commit passes its own checks. Only the
scheduled cross-repo audit sees it, and that audit is non-blocking by design, because making it
blocking would put a network fetch and another repository's moving `HEAD` on the critical path of
every merge — the same non-hermeticity this plan cites to keep `deps:audit` out of every gate. Drift
is reported, not prevented.

## A Standing Rule This Plan Upholds

The ratified standard states, as rule 3 of the Gate Composition Rule, that
`test:integration`, `test:e2e`, and `deps:audit` are **CRON-only, never in any gate**, because every
gate check must be Nx-cacheable so hooks stay fast.

That rule is upheld without qualification. `deps:audit` is not added to pre-commit, pre-push, or the
PR gate, and it is not added to the registry either.

The reasoning is that a dependency audit is non-hermetic: the advisory database moves underneath the
code, so a commit that was green can turn red with no change to the repository. Gating on it would
block every push in the repo the morning after an unrelated CVE publication — including the push that
fixes it.

An earlier draft proposed declaring it in the registry under a `cron` surface, to buy visibility
without gating. That was **dropped after review**. A "surface" that no composition rule governs, that
emits no CI matrix row, and that no hook invokes is not a surface — it is a scheduled job wearing the
word, and modelling it as one would blur what the registry means. The registry's claim is precise and
worth keeping precise: **it covers the four gate surfaces, completely**.

`deps:audit` gets visibility the honest way instead — its own workflow, named for what it does:
`dependency-vulnerability-audit.yml` (`name: Dependency Vulnerability Audit`), replacing the
filename-restating `deps-audit.yml` in all four repos. Making that name legal requires a small
amendment to the workflow-naming convention, which is in scope. See
[tech-docs §2.2.3](./tech-docs.md#223-what-is-deliberately-outside-the-registry).

## Success Definition

The plan is done when, in all four repos:

1. `rhino-cli gate validate` exits non-zero if any declared check is missing from a surface it
   declares, and exits zero on the shipped configuration.
2. `.husky/pre-commit` and `.husky/pre-push` contain no hand-maintained check list — they invoke
   `gate run`.
3. `pr-quality-gate.yml` derives its check jobs from `gate list --format=json`.
4. `main-ci.yml` does not exist, and no document **describing current CI** references it — the live
   surfaces under `.github/workflows/`, `docs/reference/`, and `repo-governance/`. Historical and
   narrative references stay: completed plans, backlog and idea notes, the in-progress plans index,
   this plan's own folder, and a published `ose-www` update all describe a world in which the
   workflow existed, and rewriting them would falsify the record rather than complete the migration.
   See [delivery.md §2.4](./delivery.md).
5. `harness bindings validate` runs in CI.
6. A formatting violation fails a surface rather than being silently rewritten.
7. `docs/reference/sdlc-gate-standard.md` and
   `repo-governance/development/workflow/git-hook-lifecycle.md` describe what the surfaces actually
   run, verified by `gate validate` rather than by review.

## Stakeholders

| Role                                                                | Interest                                                                                |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Repo maintainer                                                     | One quality bar, enforced; twelve files collapse to four registries plus shims          |
| Contributing agents                                                 | A single place to answer "what will gate my change, and where"                          |
| Downstream repos (`ose-primer`, the private sibling, `beaver-nest`) | Parity is validated rather than asserted; `beaver-nest`'s fork gains the same guarantee |
