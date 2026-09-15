# Business Requirements — Optimize CIs

## Business Goal

Reduce the fixed overhead of the repository's quality-gate lifecycle — pre-commit, pre-push, and the
PR quality gate — without removing, weakening, or skipping a single check.

The gates exist to keep a pre-alpha, multi-language, four-repo platform coherent while most of the
work is done by AI agents. They earn their keep. What they should not cost is **77.2 % overhead**:
of the 10,945 runner-seconds a PR quality gate consumes in `ose-public`, only 2,492 s is work that
checks anything.

## Why This Matters

**The gates are on the critical path of every change.** Every commit pays pre-commit, every push pays
pre-push, and every PR pays the quality gate three times over — the
[PR-Review Maker→Fixer Cycle](../../../repo-governance/workflows/pr/pr-review-quality-gate.md) runs
three CI-gated cycles before merge. Overhead is therefore multiplied by roughly 3× per delivery unit,
on top of a plan structure that opens PRs at delivery boundaries across four repos.

**Slow gates corrupt behaviour, not just throughput.** A 194 s pre-push and a 3.5 s wait to commit a
markdown fix create standing pressure to batch commits, to reach for `--no-verify`, and to defer
pushes. The
[CI Blocker Resolution](../../../repo-governance/development/quality/ci-blocker-resolution.md)
convention forbids bypassing gates; making them fast removes the temptation rather than policing it.

**The measured alternative was a rewrite.** The maintainer was, in their own words, "on the verge of"
rewriting `rhino-cli` in Go. That would be weeks of work, a full re-validation of every validator's
behaviour, and a fresh parity-manifest boundary across three repos — to address costs that
measurement shows the language does not cause. This plan exists partly to make that decision on
evidence instead of on feel.

## Affected Roles

| Role                          | Current pain                                                                                                                | After                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Maintainer (solo)**         | 3.5 s to commit a doc fix; 194 s to push a `rhino-cli` change; PR gate wall-clock dominated by setup                        | Sub-second commits; ~90 s pushes; PR gate cost cut ~3×         |
| **AI agents executing plans** | Every agent commit pays the same tax, multiplied by parallel fan-out (N=3 default) and by 3 review cycles                   | Proportional reduction across every agent-driven commit        |
| **CI runner budget**          | `ose-public` burns 10,945 runner-s/run on `ubuntu-latest`; the private sibling queues p50 18:42 on a small self-hosted pool | Fewer jobs contending for the shared four-repo pool            |
| **Local disk**                | 28 GB attributable; `local-temp` alone 12.31 GB and unbounded                                                               | ~16 GB reclaimable, with hygiene encoded so it does not regrow |

## Success Metrics

Every metric is measured against the Phase 0 baseline captured in this worktree. Each has an exact
measurement command so the result is falsifiable in both directions — a target that cannot fail is
not a target.

### M1 — pre-commit wall time, markdown-only commit

- **Baseline**: 3,047 ms — hook shim 388 ms + `lint-staged` 2,659 ms `[Repo-grounded]`
- **Target**: **≤ 900 ms**
- **Measure**: stage 10 markdown files, then time the `lint-staged` run:
  `bash -c 'time npx lint-staged --no-stash'` — recorded as the mean of 3 runs.
- **Falsifiable both ways**: a run at 401 ms fails; a run at 399 ms passes.

### M2 — pre-push wall time, `rhino-cli` affected

- **Baseline**: 194 s for `nx run rhino-cli:test:quick` `[Repo-grounded]`
- **Target**: **≤ 90 s**
- **Measure**: `bash -c 'time npx nx run rhino-cli:test:quick --skip-nx-cache'`, cold Nx cache,
  mean of 2 runs.
- **Guard**: the same command must still report every test that ran at baseline. Phase gate diffs the
  test-name list, so a speedup achieved by running fewer tests fails.

### M3 — PR quality gate, runner-seconds per run

- **Baseline**: 10,945 s across 45 jobs `[Repo-grounded]`
- **Target**: **≤ 3,500 s**
- **Measure**: for 5 completed post-change runs,
  `gh api repos/wahidyankf/ose-public/actions/runs/<id>/jobs` summed over
  `completed_at - started_at`; report the median.
- **Reference point**: `beaver-nest` already achieves 2,226 s for equivalent coverage.

### M4 — PR quality gate, wall-clock p50

- **Baseline**: recorded in Phase 0 from run history
- **Target**: **no regression** — grouping trades parallelism for setup, so wall-clock must be
  watched, not assumed. A group that serializes 10 checks behind one runner could get slower even as
  runner-seconds fall.
- **Measure**: p50 of `updatedAt - startedAt` over 10 completed runs, before and after.

### M5 — gate coverage invariance

- **Baseline**: the full list of gate ids executed per surface, captured in Phase 0
- **Target**: **byte-identical set of gate ids executed**, on every surface, before and after
- **Measure**: `rhino-cli gate list --surface=<s> --format=json` output diffed against the Phase 0
  capture; and for CI, the union of gate ids across all declared groups (`--by-group`) compared to
  the Phase 0 matrix list.
- **This is the plan's most important metric.** A speedup that loses a check is a failure, not a win.

### M6 — `target/` footprint after one `test:quick`

- **Baseline**: 2.7 GB `[Repo-grounded]`
- **Target**: **≤ 1.2 GB**
- **Measure**: `rm -rf` an isolated `CARGO_TARGET_DIR`, run `test:quick`, then `du -sk`.

### M7 — GitHub Actions cache utilization

- **Baseline**: 10,525,641,701 bytes = 98.0 % of the 10 GiB ceiling `[Repo-grounded]`
- **Target**: **≤ 60 %** of ceiling, sustained across 10 consecutive commits
- **Measure**: `gh api repos/wahidyankf/ose-public/actions/caches` summed over `size_in_bytes`.

### M8 — reclaimed local disk

- **Baseline**: 28.00 GB attributable, of which 15.92 GB measured as non-load-bearing `[Repo-grounded]`
- **Target**: **≥ 10 GB reclaimed**, and a retention rule in place so `local-temp/` cannot silently
  return to 12 GB
- **Measure**: `du -sk` over the same bucket list used in Phase 0.

### M9 — Rust version cardinality

- **Baseline**: **3 distinct declared values** across the three in-scope repos — `channel` is `1.95.0`
  at 9 sites and `stable` at 2; `rust-version` is `1.88` at 10 sites and `1.94.0` at 1; `doctor`
  validates against the floor rather than the channel `[Repo-grounded]`
- **Target**: **exactly 1 distinct value** (`1.95.0`) across every `rust-toolchain.toml` `channel`,
  every `Cargo.toml` `rust-version`, and `doctor`'s expected-rustc, in all three repos — and on the
  machine, **no installed toolchain that no repo pins** (baseline: 3 of 6 orphaned, 3.25 GB)
- **Measure**: per repo, `grep -h '^channel' $(find . -name rust-toolchain.toml) | sort -u` and the
  equivalent over `^rust-version` each return exactly one line, and the two lines agree; on the
  machine, every entry of `rustup toolchain list` appears in that set, except `stable` where the
  non-OSE-project predicate in [`tech-docs.md`](./tech-docs.md) §DD-9 retains it.

## Business Scope Non-Goals

- **Reducing what the gates check.** Coverage is invariant; M5 enforces it.
- **Reducing the `TypeScript quality gate`'s 744 s of real `nx affected` work.** That is genuine
  test/typecheck/lint execution and the critical path of the gate. Shrinking it is a testing-strategy
  question — which tests belong on which surface — not a CI-plumbing one, and it deserves its own
  plan rather than being smuggled into this one.
- **Changing the [PR-Review Maker→Fixer Cycle](../../../repo-governance/workflows/pr/pr-review-quality-gate.md)
  governance workflow itself.** This plan makes each cycle cheaper and, for its own three PRs only,
  authors an explicit maintainer-authorized deviation from the workflow's standing fixed-3-cycle,
  escalate-on-exhaustion default — iterate until clean, capped at 10 cycles, merge unconditionally
  at the cap (see [`delivery.md`](./delivery.md) §Delivery Boundaries). It does not change the
  governance document, and no other plan or PR inherits the deviation.
- **A language rewrite.** Explicitly closed by measurement — see
  [`tech-docs.md`](./tech-docs.md) §Why Not A Rewrite.
- **Bumping Rust to a newer version.** M9 unifies on `1.95.0`, the value the repos already run.
  Latest stable is `1.97.1` (2026-07-14), which at authoring fails the 60-day soak on Path B of the
  [dependency bump policy](../../../repo-governance/development/workflow/dependency-bump-policy.md).
  Unification and bumping are separate changes with separate risks; bundling them would make a CI
  regression ambiguous between the two. The bump is follow-up work under that policy.
- **Retiring the `compat:min-version` gate.** Aligning MSRV to the channel makes it tautological, but
  removing a check collides with M5 and changes a published quality posture. Recorded as follow-up.

## Business Risks

| Risk                                                                                                                                           | Likelihood                    | Impact       | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A check is silently dropped while regrouping.** The worst outcome: gates look green and stop protecting.                                     | Medium                        | **Critical** | M5 makes coverage invariance a measured, phase-gated assertion. `gate validate` is extended to fail when any registry gate belongs to no CI group, so a gate cannot fall out of the matrix by omission.                                                                                                                                                                                                                     |
| **Grouping makes wall-clock worse** even as runner-seconds fall, because 10 serial checks in one job beat 10 parallel jobs on latency.         | Medium                        | Medium       | M4 watches wall-clock explicitly as a no-regression target. Group composition is tuned by measurement, and the slowest single gate (`md links validate`, 1,081 ms) is small enough that no group should serialize meaningfully.                                                                                                                                                                                             |
| **Failure diagnosis gets harder** — one red group instead of one red check.                                                                    | High                          | Low          | Accepted and mitigated, not denied: `gate run --group` prints a per-gate PASS/FAIL summary so the failing gate id stays greppable. This is a real ergonomic cost, consciously traded for a 3× cost reduction.                                                                                                                                                                                                               |
| **The resolver shim mis-resolves after the ambient sweeper deletes `target/`**, making hooks fail confusingly.                                 | High (the sweeper runs often) | Medium       | The shim's build-and-retry fallback is a first-class requirement of DD-1, not an afterthought, and gets its own Gherkin scenario and test.                                                                                                                                                                                                                                                                                  |
| **Cross-repo parity breaks.** `apps/rhino-cli` is byte-identical across three repos with zero carve-outs; any `src/` edit opens an obligation. | High                          | High         | The propagation phase is a required phase, not a follow-up. The parity-manifest gate is part of the phase gate, so the plan cannot be declared done with parity red. **Update (plan close, 2026-08-09/10)**: this materialized — Phase 10 closed with parity red, via the accepted-with-reason mechanism rather than held literally; see `delivery.md`'s Phase 10 Gate AC-15 annotation and §Delivery Boundaries' 4th item. |
| **Coverage enforcement weakens** when `test:coverage` moves off `test:quick`.                                                                  | Low                           | High         | Relocation, not removal. The delivery checklist asserts the CI job still enforces `--fail-under-lines 90`, and M5 covers the surface-level gate list.                                                                                                                                                                                                                                                                       |
| Measurements were taken on one machine and one 22-run CI sample, and may not generalize.                                                       | Low                           | Low          | CI figures come from four independent repos showing the same pattern, and the key intervention is already validated in production in two of them. Local figures are the weaker evidence and are used only for the local targets.                                                                                                                                                                                            |

## Constraints

- **Coverage invariance is absolute.** No check may be removed to hit a number.
- **`repo-config.yml` stays authoritative.** Groups are declared, never derived — consistent with this
  repository's standing preference for explicit central registries over convention-based magic.
- **Generated artifacts are never hand-edited** and land in the same commit as their source.
- **Byte-identity parity** across `ose-public`, `ose-primer`, and the private sibling must hold once
  cross-repo propagation lands (Phase 10) and stay held through plan close. **Update (plan close,
  2026-08-09/10)**: this did not literally hold at close — the gap was closed via the
  accepted-with-reason mechanism rather than held, per `delivery.md`'s Phase 10 Gate AC-15
  annotation and §Delivery Boundaries' 4th item.
- **`worktree-to-pr` is mandatory** in this repo; `main` is branch-protected including for admins.
