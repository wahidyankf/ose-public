# Decide whether one shared cargo target directory is still the right trade

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: `doctor --fix` points every worktree's `apps/<crate>/target` at one physical
directory, which reclaims real disk but serializes concurrent builds behind cargo's exclusive
build-directory lock — a 65 s stall was observed, and both effects scale with the same parameter.

> Surfaced 2026-08-06 during `optimize-cis` execution.

## Problem / context

`doctor --fix` symlinks each worktree's per-crate `target/` into a single shared
`~/.cache/ose-cargo-target/<repo>/<crate>`. Phase 9 of `optimize-cis` widened this so one
`doctor --fix` covers every worktree rather than only the checkout it was invoked from, reclaiming
221 MB immediately because the main checkout's `apps/rhino-cli/target` was still an unshared 221 MB
directory.

The saving is real. It is also not free:

- **Measured 2026-08-06**, first `cargo run` of a session in a fresh worktree: **65.05 s wall at
  0.31 s user / 0.50 s sys**. Pure lock wait, zero compilation, with the waiting build reporting
  `Blocking waiting for file lock on build directory`.
- Cargo takes an **exclusive** lock on the target directory, so two worktrees building the same
  crate no longer proceed in parallel — one blocks for the other's entire build.

The two effects scale together, which is what makes this a design question rather than a tuning
knob. Disk saving scales with worktree count (N copies collapse to 1); contention scales with the
same N (N builders queue on 1 lock). **There is no N at which one wins and the other stops
mattering.** Widening the sharing widened the contention: before Phase 9 only worktrees that had
individually run `doctor --fix` contended; after it, every worktree does.

This sits directly against two standing repo assumptions: `worktree-to-pr` is the mandatory delivery
mode, and the environment assumes concurrent agents on one disk. Shared mutable build state under
those assumptions is a standing tension, not a one-off.

## Why now

Nothing is broken and nothing is blocked — a stalled build eventually proceeds. The cost is that the
stall is **indistinguishable from a hung build** to whoever meets it, and it arrives exactly when
parallelism is highest, which is when it is least welcome and most likely to be misdiagnosed.

Against acting: `optimize-cis` deliberately did **not** fix this, because reversing the trade means
per-worktree target directories plus a shared _cache_ layer (`sccache` or equivalent), which carries
its own rollback story and operational surface. That was correctly judged out of scope for a plan
about gate topology. It is still the open question.

The trigger to revisit is worktree count. At one or two concurrent worktrees the contention is
mostly theoretical; the repo's own orchestration model defaults to N=3 background agents and permits
more.

## Prior art / precedents

- **`optimize-cis`** — where both the widening and the 65 s measurement happened; its `learnings.md`
  records the trade explicitly as deliberately unfixed, and its M8 row shows `ose-cargo-target`
  growing 15.37 → 21.47 GiB over the plan, so the disk side is not obviously being won either.
- **Nx cross-worktree selection** — a separately tracked sibling concern about what `nx affected`
  selects across worktrees, unlike shared-target lock contention.
- **`sccache`** — the standard answer to "share compilation results without sharing a build
  directory". Content-addressed, no exclusive lock, works across worktrees by construction. Not
  currently used anywhere in this repo.
- **[Parallel-by-Default](../../../repo-governance/development/practice/parallel-by-default.md)** —
  the practice this contends with directly: it mandates fanning out independent work, and a shared
  build lock silently serializes exactly that.

## Proposed direction (sketch)

Measure the real cost before redesigning anything — one observed 65 s stall is an anecdote, not a
distribution.

- **Step 0 — quantify.** Instrument or sample how often a build actually blocks and for how long,
  across a normal multi-worktree session. If lock waits are rare, the current trade is fine and this
  closes as accepted.
- **Compare against the disk it saves.** The M8 measurements already show the shared directory
  reaching 21.47 GiB on its own, so "shared saves disk" deserves re-checking rather than assuming —
  a shared directory holding N worktrees' worth of artifacts for N feature branches is not obviously
  smaller than N pruned per-worktree directories.
- **If the cost is real, evaluate `sccache`** as the replacement: per-worktree `target/` (no lock
  contention) plus a shared content-addressed cache (retains the dedup). Cost is an extra daemon and
  a new failure mode.
- **Whichever way it lands, document the stall.** The single highest-value cheap fix is that someone
  meeting a 65 s no-op build knows it is designed-in and not hung.

## Rough scope & non-goals

**In scope**: quantify lock-wait frequency and duration; re-verify the disk saving actually claimed;
decide between keeping the shared directory, adopting `sccache`, or reverting to per-worktree
targets; document the stall regardless of outcome.

**Out of scope**:

- Nx's own caching (`.nx/cache`) — different layer, different mechanism, not lock-bound.
- The GitHub Actions cache ceiling — see
  [`actions-cache-eviction-policy`](./actions-cache-eviction-policy.md); that is remote-cache
  accumulation, this is local build-directory locking.
- Any change to `worktree-to-pr` or the worktree cap. Those are the constraints this operates under,
  not variables.

## Risks & open questions

- How often does a build actually block, and for how long? One 65 s observation is the entire
  dataset. **(open)**
- Is the shared directory even winning on disk? `ose-cargo-target` measured 21.47 GiB while holding
  artifacts for several concurrent branches. **(open)**
- Would `sccache` help here at all? Its benefit is across _clean_ builds with matching inputs; if the
  worktrees are building genuinely different code, there may be little to share and the daemon is
  pure overhead. **(open)**
- Does reverting to per-worktree targets simply re-create the disk problem `optimize-cis` M8 already
  failed to solve? Plausibly yes, which is why `sccache` rather than plain reversion is the
  interesting branch. **(open)**
- Rabbit hole: it is tempting to treat the 65 s stall as the problem. The stall is a symptom of a
  deliberate trade; the question is whether the trade is right at this repo's concurrency level, not
  how to make one lock faster.

## What success looks like + promotion signal

Success: a stated, measured decision — either "shared target directory retained, lock waits measured
at X and accepted" or "moved to per-worktree targets plus `sccache`, contention eliminated, disk
held flat" — with the 65 s stall documented either way so nobody diagnoses it as a hang again.

**Promotion signal**: the Step 0 lock-wait distribution. If waits are rare, this closes as an
accepted trade plus a documentation line and never becomes a plan. If they are common, the `sccache`
evaluation is a real design exercise worth promoting to `backlog/`.
