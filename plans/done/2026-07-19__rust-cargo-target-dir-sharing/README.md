# Rust `target/` Directory Sharing via `rhino-cli doctor`

> Five-document plan. This README is the navigation hub; substantive content lives in the
> sibling documents.

## Navigation

- [Business Requirements (`brd.md`)](./brd.md) — WHY this exists
- [Product Requirements (`prd.md`)](./prd.md) — WHAT gets built (user stories + Gherkin)
- [Technical Documentation (`tech-docs.md`)](./tech-docs.md) — HOW it is built
- [Delivery Checklist (`delivery.md`)](./delivery.md) — DO (phased, executable)
- [Learnings Log (`learnings.md`)](./learnings.md) — Knowledge Capture running log

## Context

Rust build artifacts under `target/` are large and are **duplicated per git worktree**. Each
worktree of a repo gets its own `apps/<crate>/target/` (and `libs/<crate>/target/`), so the same
crates are recompiled and stored many times over. Observed footprint: roughly ten worktrees at up
to 11 GB each, ~32 GB total, most of it redundant copies of identical debug/release/test/incremental
artifacts. [Judgment call: figures are the maintainer's observed estimate, not an instrumented
measurement.]

The baseline bloat comes from unstripped debug builds, the whole dependency tree compiled to
`.rlib`, debug + release + test artifacts kept side by side, and never-garbage-collected
`target/*/incremental/` caches.

## Scope

**In scope**

- A per-crate `target/` **symlink** into a shared, persistent cache
  (`$HOME/.cache/ose-cargo-target/<repo>/<crate>`), managed by the `rhino-cli doctor` command:
  **check** mode reports any per-crate `target/` missing its shared-cache symlink; **`--fix`** mode
  creates or repairs the symlinks. No new standalone subcommand — it is a doctor check/fix step.
  [Repo-grounded — `apps/rhino-cli/src/commands/doctor.rs` is the doctor entry point.]
- Dynamic, crate-agnostic discovery inside the Rust doctor (walk `apps/*/Cargo.toml` +
  `libs/*/Cargo.toml`), so one identical implementation is correct for all three repos' differing
  crate inventories. [Repo-grounded — sibling `find apps libs -maxdepth 2 -name Cargo.toml`.]
- A hard **CI guard**: the symlink step no-ops under CI (`$CI` / `$GITHUB_ACTIONS`) — first-class
  acceptance criterion + a dedicated unit test and behavior scenario.
- A **worktree-aware GC** in the same doctor (`--prune-cargo-cache`): deletes only shared-cache
  entries no live worktree/checkout references (never a live entry — see the explicit
  "no per-worktree target-delete hook" anti-pattern in [`brd.md`](./brd.md#business-scope-non-goals)),
  honors `--dry-run`, CI-guarded, with optional graceful-degrading `cargo sweep`.
- Companion **Gherkin** under `specs/apps/rhino/behavior/rhino-cli/gherkin/system/` for the new
  doctor behavior (required because `apps/rhino-cli/**` is inside the byte-identity boundary).
- Nx `build.outputs` adjustment for the three ose-public crates that currently cache
  `{projectRoot}/target`. [Repo-grounded — `jq` on their `project.json`.]
- **Byte-identical** multi-repo delivery — the single Rust source change lands byte-identically
  across `ose-public`, `ose-primer`, and `ose-infra` (three peer PRs), verified `diff = 0`.
- Documented cleanup guidance to prevent regrowth (`cargo clean` / `cargo sweep`).
- An **optional, clearly-separated** secondary phase: a `[profile.dev]` debuginfo trim.

**Out of scope**

- A `scripts/` shell helper wired into `package.json` (the previously-rejected mechanism — see
  [`tech-docs.md` RA-1](./tech-docs.md#rejected-alternatives)). The logic now lives entirely inside
  `rhino-cli doctor`.
- Any `package.json` edit — worktree provisioning already runs `npm run doctor -- --fix`
  [Repo-grounded — [Worktree Toolchain Initialization](../../../repo-governance/development/workflow/worktree-setup.md)],
  which reaches the doctor's `--fix` path with no wiring change.
- Wiring `cargo-sweep` installation into `rhino-cli doctor`'s tool list — cleanup stays
  documented/manual.
- Changing CI's build strategy or the self-hosted runner configuration.

## Approach summary

Fold the target-directory sharing into `rhino-cli doctor` as a check/fix step. For every Rust crate
discovered under `apps/` and `libs/`, `doctor --fix` replaces the plain `apps/<crate>/target`
directory with a symlink to `$HOME/.cache/ose-cargo-target/<repo>/<crate>`; plain `check` reports any
crate whose target is not yet symlinked. Because `target/` is gitignored [Repo-grounded —
`.gitignore:114`] and every build's `cp apps/<crate>/target/release/<bin> …/dist/` resolves
**through** the symlink, no tracked `Cargo.toml` or `project.json` build command needs to change.
Worktrees of the same repo+crate then share one physical directory, eliminating cross-worktree
duplication.

Because the doctor command is **inside the `apps/rhino-cli/**`byte-identity boundary**
[Repo-grounded — [SDLC Gate Standard §rhino-cli byte-identity boundary](../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary)],
this is now a **single source of truth**: one Rust implementation, byte-identical across all three
repos, enforced by the byte-identity guard — simpler and more robust than replicating a shell helper
into each repo's`scripts/`. See [`tech-docs.md`](./tech-docs.md) for the full design and rejected
alternatives.

## Delivery mode

`worktree-to-pr` (multi-repo — one peer PR per repo). See
[`delivery.md`](./delivery.md#delivery-mode-worktree-to-pr).

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
