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
   ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- affected -t test:quick
   ```

   (the first is the registry-declared gate set `.husky/pre-push` invokes, which runs no `test:quick`; the second runs affected `test:quick`)

2. If the plan involves integration or e2e tests, also run them as the phase-end and
   pre-PR-ready safety net: the whole automated suite except full E2E, plus only the
   affected E2E flow:

   ```bash
   ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:integration
   ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:e2e -- <touched-flow spec or case filter>
   ```

   Scope the E2E invocation to the touched flow (its spec path or case filter), never the
   full unfiltered E2E suite. A full E2E run is never a completion condition for a plan
   phase, plan execution, or PR readiness; full E2E is a separately batched set owned by
   scheduled CI (see
   [Execution Surfaces](../../../development/behaviour-driven-development/coverage-exemptions-and-execution.md#execution-surfaces)).

   Followed: the boundary record shows unfiltered non-E2E suites plus a flow-scoped E2E run
   naming the touched flow. Violated: an unfiltered E2E invocation at a phase or pre-PR
   boundary, or phase completion conditioned on a full E2E run.

   **Transient contention flakes on a many-project affected run**: when `test:e2e` (or `build`) runs
   across a large affected set on one shared local machine, expect occasional non-deterministic
   failures unrelated to the plan's own diff — an evicted/stale build artifact under
   allocation-driven concurrent builds, or a request timing out in a test that fires many concurrent
   HTTP calls. Before
   treating any such failure as a regression, rebuild the affected project fresh and re-run just that
   failing target in isolation; a clean pass there confirms contention, not a real defect.
