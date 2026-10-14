# Delivery Mode Verification (Step 5i continued): Phase 0 and Delivery Boundaries

1. **No PR was opened for Phase 0** — under **every** mode, Phase 0 is Environment Setup and Baseline
   and must not have produced a pull request. Enumerate the plan's PRs and confirm none corresponds to
   Phase 0 — no `…/phase-0` branch, no PR whose title or body scopes it to Phase 0, and no PR whose
   diff contains only baseline evidence artifacts. A PR actually opened for Phase 0: **HIGH**. Also
   confirm the plan's Phase 0 checklist has no ticked PR/push/merge checkbox — a ticked one is the
   same finding with on-disk evidence. See
   [Plans Organization Convention §Phase 0 Opens No PR](../../../../repo-governance/conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).
2. **Mode-specific integrations match the declared delivery boundaries** — integration happens at
   a **delivery boundary**, not at every phase. Read the plan's `### Delivery Boundaries` table. For
   a `*-to-pr` mode, enumerate the PRs and confirm: (a) each PR corresponds to a declared unit — a
   PR scoped to an intermediate phase is **HIGH**; (b) every declared unit has a PR that merged — an
   unmerged unit is **HIGH**; and (c) the PR count does not exceed the boundary count. For a direct
   mode, enumerate its permitted direct-push checkpoints and confirm every declared unit integrated
   exactly once, with no intermediate-phase integration. If the plan predates this rule and carries
   no table, record that as a grandfathering note rather than a finding, and check only that no work
   was left unintegrated. See
   [Plans Organization Convention §PRs Open at Delivery Boundaries](../../../../repo-governance/conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).
   Also confirm each landed unit matches a natural cohesive seam, contains all artifacts needed for
   internal consistency, and left `main` safe to deploy to production immediately. For incomplete behaviour,
   verify the temporary production-disabled flag, both path tests, and rollout/rollback/removal.
   A LOC- or file-count-derived boundary is **HIGH**.

### Finding Severity

- A PR was opened, reviewed, or merged for the plan's Phase 0 (any mode): **HIGH**
- A PR was opened for a phase the plan does not declare a delivery boundary: **HIGH**
- `*-to-pr` mode: a declared delivery unit whose PR never merged: **HIGH**
- Direct mode: a declared delivery unit whose direct-push checkpoint never landed: **HIGH**
- `*-to-pr` mode: PR missing: **CRITICAL**
- `*-to-pr` mode: exact-current-head/base `Quality gate` not green: **CRITICAL**
- `*-to-pr` mode: current-head leak-review pass verdict missing: **CRITICAL**
- `*-to-pr` mode: no semantic-review evidence when none was requested: **not a finding**
- `*-to-pr` mode: semantic-review step without a direct user request: **HIGH**
- `*-to-pr` mode: applicable finite surface gate missing or failed: **CRITICAL**
- `*-to-pr` mode: unresolved thread with no reply and no `[HUMAN]` escalation note: **HIGH**
- `*-to-pr` mode: archival-in-PR missing or deferred post-merge (where applicable): **HIGH**
- Filing a finding solely because a `*-to-pr` PR remains unmerged: **not a finding** (false positive
  to avoid — flag the CHECK itself as wrong if this occurs)
