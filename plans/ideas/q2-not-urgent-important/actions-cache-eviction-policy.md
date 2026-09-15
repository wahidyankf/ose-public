# Give the GitHub Actions cache an eviction policy, not just a stabler key

One-line summary: `ose-public`'s Actions cache sits at 99.29 % of its 10 GiB ceiling because nothing
in the repo ever deletes a cache entry — the only pressure relief is GitHub's own LRU eviction, which
silently discards entries a later run then has to rebuild.

> Surfaced 2026-08-09 during `optimize-cis` Phase 11 execution.

## Problem / context

Measured on **2026-08-09** during the `optimize-cis` Phase 11 rollup, via
`gh api repos/wahidyankf/ose-public/actions/cache/usage`:

- **10,661,620,611 bytes = 9.93 GiB = 99.29 %** of the 10 GiB ceiling, across **40 active caches**.
- The Phase 0 baseline for the same command, on 2026-08-05, was **8,280,363,514 bytes = 77.12 %**.
- `optimize-cis` set a target of **≤ 60 % of ceiling sustained across 10 commits** and delivered one
  mechanism toward it: dropping `github.sha` from the `.nx/cache` restore key, so a cache entry is
  reused across commits instead of a fresh entry being written per commit. That change was real and
  it did reduce churn. Usage still rose 22 percentage points over the plan's lifetime.

The gap between the mechanism and the target is the whole finding: **churn and accumulation are
different problems.** A key that changes less often writes fewer _new_ entries; it does nothing about
the entries already there. Nothing in the repo — no workflow step, no scheduled job, no `gh cache
delete` anywhere — removes an entry. So total usage is monotonically non-decreasing until GitHub
evicts, and GitHub evicts by least-recently-used with no regard for which entry is expensive to
rebuild.

At the ceiling this has a concrete cost: a large, rarely-touched cache (a cold Rust `target/`, say)
is exactly the LRU eviction candidate and exactly the most expensive thing to rebuild. The repo is
currently paying full rebuild cost at unpredictable intervals and attributing it to CI variance.

## Why now

The plan that would most obviously have caught this just closed and recorded it as a FAIL rather than
fixing it, so it is written down but unowned. Meanwhile the condition is not stable — it is pinned at
the ceiling, which means every new cache entry evicts an old one starting immediately. That is the
regime where rebuild cost is highest and least predictable.

Against that: nothing is broken. CI passes; the symptom is latency and runner-seconds, both of which
are noisy enough to hide it. This is exactly the profile of a problem that stays deferred until
someone measures it deliberately — which is what just happened.

## Prior art / precedents

- **`optimize-cis`** (this repo, Phase 7 + Phase 11) — where the key change landed and where M7 was
  recorded as FAIL with the accumulation gap named. Its `results.md` is the source of every figure
  above.
- **Nx cross-worktree selection** — a separately tracked sibling concern about what `nx affected`
  selects across worktrees, unlike Actions cache retention.
- **GitHub's documented behaviour** — repositories get 10 GiB of Actions cache and entries are
  evicted LRU once the ceiling is reached; entries unused for 7 days expire on their own. Both
  mechanisms are time/recency-based and neither is size- or cost-aware.
- **`ci-setup-rust-toolchain-retry`** — a neighbouring CI-robustness brief; useful precedent for how
  small a CI change can be and still be worth a written record.
  [two-pager](./ci-setup-rust-toolchain-retry.md)

## Proposed direction (sketch)

Establish what the cache actually holds before deciding what to delete — the 40-entry breakdown has
never been looked at.

- **Step 0 — inventory.** `gh api repos/wahidyankf/ose-public/actions/caches` and group by key
  prefix, size, and last-accessed. The question to answer first is whether the 9.93 GiB is a few
  large entries or a long tail of small stale ones; the right policy differs sharply between those.
- **Prune the obviously dead.** Entries keyed to branches that no longer exist are pure waste and can
  be deleted unconditionally. This may be most of the problem, in which case stop here.
- **Add an eviction step** only if the inventory shows live-branch accumulation: a scheduled workflow
  that deletes entries by an explicit rule (oldest-beyond-N-per-prefix, or anything not accessed in
  M days) rather than waiting for LRU. Keep the rule stated in one place, not spread across workflow
  steps.
- **Re-measure against the existing target.** The ≤ 60 % target and its exact measurement command are
  already committed in `optimize-cis`'s `brd.md` — reuse them rather than inventing new ones, so the
  before/after is comparable to the readings already recorded.

## Rough scope & non-goals

**In scope**: inventory the 40 cache entries; delete entries for deleted branches; add an explicit
eviction rule if the inventory justifies one; re-measure utilization against the committed ≤ 60 %
target.

**Out of scope**:

- Changing what gets cached, or any `.nx/cache` / cargo cache key composition — the Phase 7 key
  change stays as delivered.
- The sibling repo. The private sibling has its own ceiling and was never measured;
  extending there is a follow-on, not part of this.
- Anything about CI wall-clock or runner-seconds directly. Those are downstream of cache hit rate and
  will move on their own if this works.

## Risks & open questions

- Is the 9.93 GiB a long tail of small stale entries or a handful of large live ones? The whole shape
  of the fix depends on this and it has not been checked. **(open)**
- How much of it is already dead — entries keyed to merged/deleted branches? If that is most of it, a
  one-time prune plus GitHub's own 7-day expiry may be sufficient and no new workflow is needed.
  **(open)**
- Would an aggressive eviction rule cost more than it saves, by deleting an entry that a scheduled
  run rebuilds from cold the next morning? An eviction policy that evicts the wrong things is worse
  than LRU. **(open)**
- Is ≤ 60 % of ceiling still the right target, or was it picked as a round number? It was committed
  in `optimize-cis` without a stated derivation. **(open)**
- Rabbit hole: it is tempting to treat "at the ceiling" as self-evidently bad. LRU eviction at a
  ceiling is the _designed_ behaviour and may be entirely fine here. The finding worth acting on is
  the absence of any deliberate policy, not the utilization number by itself.

## What success looks like + promotion signal

Success: cache utilization measured below the committed ≤ 60 % of ceiling and holding there across
10 consecutive commits, with whatever rule produced that stated explicitly in one place — and with
evidence that CI cache hit rate did not fall in exchange.

**Promotion signal**: the Step 0 inventory. Once the 40 entries are grouped by prefix, size, and
last-accessed, this either collapses into a one-time prune (do it directly, no plan) or resolves into
a real eviction-policy design question (promote to `backlog/`). Until that inventory exists there is
no way to tell which, and that is precisely why this is a two-pager rather than a plan.
