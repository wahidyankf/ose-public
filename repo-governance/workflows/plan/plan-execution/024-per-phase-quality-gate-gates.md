---
description: Defines the Phase N Gate barrier check and the local pre-push and integration/e2e quality gates run after each delivery phase.
when_to_use: Use when verifying a phase's own gate, or running local and integration/e2e quality gates after a phase completes.
---

# Per-Phase Quality Gate — Gates

After completing all items in a delivery phase, verify the phase's authored gate and run quality gates before proceeding.

**Orchestrator action**:

0. **Verify the phase's `### Phase N Gate` (barrier)**: run every check listed under the phase's `### Phase N Gate` heading and confirm each passes its stated acceptance. A phase is **not complete until its gate is green** — do NOT start phase N+1 while any gate check is failing; fix it within the current phase first. If the gate carries a **Pause Safety** note, the post-gate state is a sanctioned safe-to-stop point. (Gate checks assert on patterns/placeholders, never a real secret literal.) See [Plans Organization Convention §Phases as Natural Pauses With Clear Gates](../../../conventions/structure/plans/phases-as-natural-pauses.md#phases-as-natural-pauses-with-clear-gates-hard-rule).
1. Run local quality gates:

   ```bash
   ./rhino gate run --surface pre-push
   ```

   (the same registry-declared gate set `.husky/pre-push` invokes; includes `nx affected -t test:quick`)

2. If the plan involves integration or e2e tests, also run:

   ```bash
   ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:integration
   ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:e2e
   ```

   **Transient contention flakes on a many-project affected run**: when `test:e2e` (or `build`) runs
   across a large affected set on one shared local machine, expect occasional non-deterministic
   failures unrelated to the plan's own diff — an evicted/stale build artifact under
   allocation-driven concurrent builds, or a request timing out in a test that fires many concurrent
   HTTP calls. Before
   treating any such failure as a regression, rebuild the affected project fresh and re-run just that
   failing target in isolation; a clean pass there confirms contention, not a real defect.
