# optimize-cis — Results

Final verdict for each of the nine success metrics committed in
[`brd.md` §Success Metrics](./brd.md), measured against the Phase 0 baseline captured in
[`baseline/measurements.md`](./baseline/measurements.md). Every figure below is the last row for
that metric in [`scoreboard.md`](./scoreboard.md); the **Phase** column links the verdict back to
the phase that produced the final measurement.

`PASS` means the committed target was met as written. `FAIL` means it was not — recorded as a
finding, not restated as a smaller win. Three of nine passed.

## Verdicts

| Metric                        | Target                      | Baseline  | Final            | Δ                   | Phase | Verdict  |
| ----------------------------- | --------------------------- | --------- | ---------------- | ------------------- | ----- | -------- |
| M1 — pre-commit wall time     | ≤ 900 ms                    | 3,898 ms  | 2,396 ms         | −1,502 ms (−38.5%)  | 3     | **FAIL** |
| M2 — pre-push `test:quick`    | ≤ 90 s                      | 124.3 s   | 70.6 s           | −53.7 s (−43.2%)    | 8     | **PASS** |
| M3 — CI runner-seconds        | ≤ 3,500 s                   | 7,103.5 s | 3,644 s          | −3,459.5 s (−48.7%) | 11    | **FAIL** |
| M4 — CI wall-clock p50        | no regression               | 974.5 s   | 1,203 s          | +228.5 s (+23.4%)   | 11    | **FAIL** |
| M5 — gate coverage invariance | byte-identical gate id sets | 76 ids    | 76 ids           | 0 added/removed     | 11    | **PASS** |
| M6 — `target/` footprint      | ≤ 1.2 GB                    | 2,747 MiB | 1,022 MiB        | −1,725 MiB (−62.8%) | 8     | **PASS** |
| M7 — Actions cache use        | ≤ 60% of ceiling            | 77.12%    | 99.29%           | +22.17 pp           | 11    | **FAIL** |
| M8 — reclaimed local disk     | ≥ 10 GB reclaimed           | 26.64 GiB | 41.83 GiB        | +15.19 GiB (+57.0%) | 10    | **FAIL** |
| M9 — Rust version cardinality | exactly one declared value  | forked    | `{1.88, 1.95.0}` | fork narrowed       | 10    | **FAIL** |

Sibling-repo M3 measurements (`M3-primer`, `M3-private`) and the machine-level `M9-machine` row are
recorded in `scoreboard.md` but carry no committed target of their own, so they are reported there
rather than given a verdict here.

## The three passes

- **M5 — the plan's most important metric.** Gate id sets are byte-identical to the Phase 0 capture
  on all four surfaces: 36 ci, 28 pre-commit, 11 pre-push, 1 commit-msg. Zero ids added, removed, or
  renamed. Every speedup below was bought without dropping a check — which was the whole constraint.
- **M2 — 70.6 s against a 90 s target.** Achieved by lifting coverage out of the `test:quick` chain
  into CI (DD-7) and setting `incremental = false`. The Phase 8 gate diffed the test-name list
  against Phase 0 to prove the speedup was not bought by running fewer tests.
- **M6 — 1,022 MiB against a 1.2 GB target.** Three stacked reductions: coverage out of the chain
  (2,747 → 2,032 MiB), `debug = "line-tables-only"` (→ 1,739 MiB), `incremental = false` (→ 1,022 MiB).
- **M3-primer / M3-private**, while untargeted, both roughly halved: −50.8% and −61.7% respectively.

## The six misses

### M1 — 2,396 ms against a 900 ms target (2.66× over)

Pre-commit did get 38.5% faster, and the resolver shim plus `node_modules/.bin` dispatch removed the
`cargo run` compile-check from the hot path. The residual is `lint-staged` itself plus the fixed
per-gate process spawn cost, which the plan never attacked. The 900 ms target assumed those were
reducible; nothing in the delivered work tested that assumption.

**Disposition**: accepted as-is. The remaining cost is structural to running N separate gate
processes per commit, and reducing it means changing what pre-commit does, not how it dispatches —
which is a different plan with a different risk profile.

### M3 — 3,644 s against a 3,500 s target (4.1% over)

The Phase 7 row deferred this verdict to the rollup on the theory that a 6.3% gap at N=3 was noise.
At N=6 the median tightened to 3,644 s and stayed above target, so the shortfall is real and small
rather than sampling error. The grouped matrix still cut runner-seconds ~49% from baseline and ~71%
against pre-topology runs on this same branch.

**Disposition**: accepted as-is. Closing a 144 s gap would mean re-cutting group composition against
the current affected-set profile, which is worth doing when the profile next changes, not now.

### M4 — 1,203 s p50 against a no-regression target (+23.4%)

Recorded as a miss because the target says "no regression" and the number regressed. The confound is
real and independently checkable: the critical path is the `TypeScript quality gate` job, 960 s in
run 31300405108 against that run's 1,185 s wall-clock. The grouped matrix never touched that job, and
its duration alone exceeds the entire 974.5 s Phase 0 p50 — so the wall-clock floor on this branch is
set by the TS gate's affected set, not by the topology change.

**Disposition**: accepted as-is, with the confound recorded rather than used to reclassify the
verdict. The risk the metric was designed to catch — grouping serializing checks behind one runner —
did not occur.

### M7 — 99.29% of ceiling against a ≤60% target, regressed from 77.12%

Dropping `github.sha` from the `.nx/cache` key (Phase 7) removed per-commit cache churn, which was
the delivered mechanism. It was not sufficient: this plan pushed enough commits across three repos
that total usage climbed to the eviction ceiling anyway, now 40 active caches at 9.93 GiB.

The actual missing piece is a cache **eviction** policy — nothing in the plan ever deleted a cache
entry, so the only pressure relief is GitHub's own LRU eviction at the ceiling. A key that churns
less does not shrink a cache that nothing prunes.

**Disposition**: needs a follow-up. See below.

### M8 — 41.83 GiB against a ≥10 GB-reclaimed target, regressed +15.19 GiB

The toolchain prune did land (5.21 GiB from 8.49 GiB, −3.28 GiB). Bucket 3 `ose-cargo-target`
absorbed it and more, growing 15.37 → 21.47 GiB, because this plan ran repeated cold `test:quick`
builds across three repos and their worktrees. The retention rule half of the target was delivered;
the reclamation half was overwhelmed by the plan's own build traffic.

**Disposition**: partially self-correcting. The terminal cleanup node removes the sibling worktrees
and their target shares; the ambient build-artifact sweeper reclaims the rest on its own schedule.
The retention rule that prevents `local-temp/` silently returning to 12 GB is in place and is the
durable half.

### M9 — union `{1.88, 1.95.0}` against a single-value target

`ose-primer` and the private sibling each declare exactly `1.95.0` on merged `main`. `ose-public`'s merged
`main` still carries `rust-version = "1.88"` in four manifests. The fix is already on the open PR
branch, so this becomes true the moment that PR merges — no further edit is required.

**Disposition**: FAIL as measured on merged refs at rollup time, PASS on merge. Recorded this way
rather than pre-declared a pass, because a metric measured on a branch that has not landed is not a
measurement of the repo.

## Follow-ups filed

- **M7 cache eviction** — filed as
  [`plans/ideas/q2-not-urgent-important/actions-cache-eviction-policy.md`](../../ideas/q2-not-urgent-important/actions-cache-eviction-policy.md).
  The delivered key change addressed churn but nothing addressed accumulation, and the repo now sits
  at the eviction ceiling. Filed as a two-pager rather than a `backlog/` plan because
  [`plans/backlog/README.md`](../../backlog/README.md) admits only plans promoted from a two-pager,
  and the promotion signal here — an inventory of the 40 cache entries — has not been gathered.
- **M1, M3, M4, M8** — accepted as-is with the reasoning above; no follow-up filed. Each records a
  measured shortfall against a stated target rather than a silently rescoped one.
- **AC-15 cross-repo parity** — filed as
  [`plans/ideas/q1-urgent-important/rhino-cli-parity-propagation-optimize-cis.md`](../../ideas/q1-urgent-important/rhino-cli-parity-propagation-optimize-cis.md).
  `apps/rhino-cli` byte-identity across `ose-public`, `ose-primer`, and the private sibling does not
  currently hold (see `delivery.md`'s Phase 10 Gate AC-15 annotation and §Delivery Boundaries' 4th
  item for the full file list and reproduction). Filed as a follow-up rather than reopening either
  already-merged sibling PR mid-cycle.
