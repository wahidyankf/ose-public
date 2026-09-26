# Reconcile the command names governance docs cite against the ones that exist

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: governance tables, agent files, and npm scripts all name commands that do not
exist — Nx targets that were never implemented, a `rhino-cli` subcommand that was removed — so a
reader following any of them runs something that exits non-zero. The retired Rhino commands that
approved backlog plans cited were corrected in PR #591.

> Surfaced 2026-08-17 during `optimize-gov` PR review.
> Merged specs-checker-phantom-nx-targets.md into this brief on 2026-08-19 by plan-ideas-grooming:
> same underlying defect, and that brief's open "isolated or systemic?" question is answered here.
> Extended 2026-09-26 by a cross-repository verification pass: added `harness:bindings-validation`,
> and corrected the claims that it and the `sync:*` scripts exist in ose-public — PR #549 removed both.
> Extended again 2026-09-26, found during a cross-repository standards adoption: added the retired
> `./rhino plan validate` and its five backlog-plan citations (the fourth drift below).
> Extended a third time 2026-09-26, found during the same adoption: added the retired
> `./rhino md links validate`, cited by the same five backlog plans and one reference doc.
> Resolved the fourth drift 2026-09-26 in PR #591, with owner authorization to edit the approved
> plans: every live citation of a Rhino form pinned v0.6.0 rejects was replaced.

## Problem / context

Four drifts of one shape, each found while fixing something else; the fourth is resolved:

**Docs citing absent commands.** Five names appear in the naming-scheme tables of both repos as
though they were live gates:

- `cross-vendor:parity-validation` — the gate was merged into `harness adapters validate` and the
  backing `validate-cross-vendor-parity.sh` was deleted.
- `mermaid:validation` — no such npm script or Nx target.
- `headings:hierarchy-validation` — no such npm script or Nx target.
- `format:check` — the real script is `format:md:check`.
- `harness:bindings-validation` — no such npm script or Nx target in ose-public. PR #549 removed it with
  every other binding script, and `.github/scripts/test-hippo-consumer.sh` asserts it stays absent. The
  real check is `./rhino harness adapters validate`; the private sibling wraps it as
  `validate:harness-bindings`. ose-public cites the phantom name at:
  - `repo-governance/development/infra/ci-conventions/ci-toolchain-parity-checklist-affected-first-pr-gate-principle.md:20`
    (as `npm run harness:bindings-validation`);
  - `repo-governance/development/infra/nx-target-naming/domain-work-scheme.md:37`;
  - `repo-governance/development/infra/nx-targets/domain-work-naming-for-governance-targets.md:26`;
  - `repo-governance/conventions/structure/multi-harness-binding/rules-6-to-7.md:35` (the Rule 6 PASS
    example, which is itself outside Rule 6's `generate:`/`validate:` namespaces).

**Scripts invoking a removed subcommand — in the private sibling only.** There, `npm run sync:agents`,
`sync:dry-run`, and `sync:skills` shell into `./rhino harness sync opencode`. That subcommand no
longer exists — `harness sync` offers only `validate` — and all three exit 2 with
`error: unrecognized subcommand 'opencode'`. **ose-public no longer defines those three scripts:**
PR #549 removed them, and `.github/scripts/test-hippo-consumer.sh` asserts their absence.

**Agent files citing phantom Nx targets.** `.claude/agents/specs-checker.md`'s "Drift Detection"
section instructs the reader to run `validate:specs-adoption`, `validate:specs-tree`,
`validate:specs-counts`, and `validate:specs-links`. None of the four appears in
`apps/rhino-cli/project.json` or any other project's target list. Found 2026-07-31 during the
`baseerah-repo-reset` plan's Phase 3 Gate deleted-app-name sweep and deliberately left unfixed there
as out of that sweep's scope. This is the drift that makes the whole set systemic rather than a
governance-table quirk: the same class of defect reaches `.claude/agents/**` too.

**Approved backlog plans citing retired Rhino commands (resolved in PR #591).** Five plans under `plans/backlog/` tell
their executor to run `rtk ./rhino plan validate`. The pinned Rhino (`rhino.lock`, v0.6.0) has no
`plan` command family: `./rhino --help` lists none, and `./rhino plan validate` exits with
`unrecognized command`. Citations, from `git grep -n "rhino plan validate" -- plans/backlog`:

- `plans/backlog/lms-user/delivery.md:104`, `:175`, and `:1027`;
- `plans/backlog/ose-id-init-02-local-email-account/delivery.md:77`;
- `plans/backlog/ose-id-init-03-company-tenancy-core/delivery.md:77`;
- `plans/backlog/ose-id-init-08-company-admin/delivery.md:97`;
- `plans/backlog/ose-id-init-09-local-scale-and-composition/delivery.md:76`.

There is no drop-in replacement to cite. The
[Plan Validator Contract](../../../repo-governance/conventions/structure/plan-validator-contract.md)
freezes the plan-structure rules but says the catalog ships no validator, and `repo-config.yml`
declares no plan-structure gate: `./rhino gate list` shows only generic Markdown checks (front
matter, heading hierarchy, naming, Mermaid) for plans. The Plans Convention's own Validation sections
assign plan judgement to semantic plan-quality review, which `plan-checker` performs; its "run
structural validation" step names no command. Today, therefore, structural plan validation is
review plus the generic Markdown gates, not a single runnable command.

The same five plans also cite the retired `./rhino md links validate`. Pinned v0.6.0 prints
`rhino: unrecognized command` and exits 2; `./rhino --help` and `./rhino md --help` list
`md internal-link validate` in its place. Citations, from
`git grep -n "md links validate" -- ':!plans/done'`:

- `plans/backlog/lms-user/delivery.md:738` (with seven path arguments) and `:1028` (as
  `md links validate plans`);
- `plans/backlog/ose-id-init-02-local-email-account/delivery.md:77`;
- `plans/backlog/ose-id-init-03-company-tenancy-core/delivery.md:77`;
- `plans/backlog/ose-id-init-08-company-admin/delivery.md:97`;
- `plans/backlog/ose-id-init-09-local-scale-and-composition/delivery.md:76`;
- `docs/reference/sdlc-gate-standard.md:328` (a docs surface).

This one has a replacement, but not a drop-in one: `md internal-link validate` takes no path
arguments (a path argument is itself an `unrecognized command`) and checks the whole surface
`repo-config.yml` declares, whose `exclude-sources` include `plans/done/**`. A plan citation that
scoped the check to an archived plan therefore cannot be translated literally. The remaining hits of
that grep are ideas briefs and the ideas index using the old name as shorthand, not commands to run.

A third retired form sat beside them: `./rhino md mermaid validate <path>`. Pinned v0.6.0 accepts
paths only as repeated `--file <path>` options, and a directory passed as `--file` "cannot be read".
It was cited at `plans/backlog/lms-user/delivery.md:250`, `:281`, and `:1029`,
`ose-id-init-02-local-email-account/delivery.md:225`, and
`ose-id-init-03-company-tenancy-core/delivery.md:227`.

**Resolution (PR #591).** Every citation above, found with
`git grep -nE "rhino (plan validate|md links validate|md mermaid validate [^-])" -- ':!plans/done'`,
was replaced; nothing else in those plans changed. `./rhino plan validate` became a `plan-checker`
structural review against the Plans Convention, since no runnable plan validator exists.
`./rhino md links validate …` became `./rhino md internal-link validate`, which checks the declared
surface. Each positional `md mermaid validate` became
`find <paths> -type f -name '*.md' -exec ./scripts/validate-mermaid-files {} +`: the `md-mermaid`
gate's own executable, which passes each file as `--file` and propagates a failing exit.

Two per-repo claims in this brief went stale in the other direction. It once said
`harness:bindings-validation` exists as a real npm script in ose-public, and that ose-public's
`sync:*` scripts work; PR #549 removed both, so ose-public now has no binding script at all. The
private sibling spells the validation `validate:harness-bindings`, with the verbs inverted. The
`sync:*` claim itself was first written against the private sibling's `package.json` and asserted of
both repos without re-checking.

That is the argument for a full inventory rather than another spot-fix. A name is only stale if you
check `package.json` **and** `apps/rhino-cli/project.json` **in the specific repo** — "not an Nx
target" is not "does not exist", and true-in-one-repo is not true-in-both.

## Why now

Nothing is failing in CI, which is exactly why this persists: the stale names live in prose and in
scripts nobody runs, so no gate catches them. Meanwhile the tables read as authoritative, and the
`sync:*` scripts are the documented way to regenerate OpenCode mirrors — a contributor following
`CLAUDE.md` in the private sibling hits an unrecognized-subcommand error and has no signal about what
replaced it.

Against urgency: the mirrors are in fact regenerated by `./rhino harness adapters generate`, so the broken scripts
are a dead end rather than a data-loss risk.

## Prior art / precedents

- **`optimize-gov`** (this repo, PR #225 / the private sibling #50) — where all of the above was found; its
  review deliberately fixed only the in-scope site and reported the rest rather than half-doing it.
- **[`doc-command-existence-validation`](../../backlog/README.md)** — the naming precedent cited in
  the backlog README for exactly this class: validating that a documented command exists.
- **`baseerah-repo-reset` Phase 3 Gate** — where the `specs-checker.md` phantom targets surfaced,
  recorded rather than fixed because it was orthogonal to that sweep's scope.
- **`rhino-cli-command-triage`** (`docs/reference/rhino-cli-command-triage.md`) — the existing
  migration table mapping old command names to new; the authority a reconciliation would check
  against, and itself a candidate for correction.

## Proposed direction (sketch)

1. Build the actual inventory: every Nx target in `apps/rhino-cli/project.json` and every script in
   `package.json`, per repo.
2. Diff every command name cited in `repo-governance/**` and `docs/**` against that inventory, and
   correct or delete each miss.
3. Decide whether the tables should cite runnable names at all, or point at the registry — a table
   that restates names is a second source of truth that drifts by construction.

## Rough scope & non-goals

In scope: `repo-governance/**`, `docs/**`, and the canonical `.agents/agents/**` in ose-public and the private sibling;
the broken `sync:*` scripts; the triage table's own accuracy. The five approved backlog plans' retired
Rhino steps are already corrected (PR #591), with owner authorization. Agent-file corrections regenerate their
`.opencode/`/`.codex/` mirrors via `./rhino harness adapters generate` in the same commit — the mirrors are
never hand-edited.

> Narrowed by `update-harness-support`: `.cursor/` is gone; the surviving generated mirrors are
> `.opencode/`, `.codex/`, and `.agents/`. The command-name reconciliation this brief proposes is
> unaffected.

**Out of scope (for now)**: adding a gate that enforces command existence (worth doing, but it needs
the inventory to exist first); `plans/done/**`, which records what was true at the time; the
`ayokoding-www` content tree.

## Risks & open questions

- The two repos' stale sets are already known **not** to match — ose-public dropped `sync:*` and every
  binding-validation script; the private sibling keeps both. How far does that divergence go? Nobody
  has diffed the two script sets.
- Should the private sibling's `sync:agents` be repaired or deleted, as ose-public deleted its own?
  Unknown whether a write-path sync is still wanted now that `./rhino harness adapters generate` emits the
  mirrors.
- How many other agent files carry the same phantom-command problem? Only `specs-checker.md` has
  been checked, and one instance is what turned this from a table-accuracy issue into an inventory
  job. A scan of the sibling checker agents is the cheapest way to size it. (open)
- Is the triage table's "name-set/count parity" attribution to `harness naming validate` accurate?
  Reading that command suggests it is a pure name-set check with no count logic.

## What success looks like + promotion signal

Every command name in a governance or docs surface resolves to something runnable in the repo it is
written in, or is gone, and neither repo keeps a broken `sync:agents`. Promotion signal: someone produces the
target/script inventory for both repos and the diff is non-trivial — if the five known table names
are the whole set, this is a small PR, not a plan.
