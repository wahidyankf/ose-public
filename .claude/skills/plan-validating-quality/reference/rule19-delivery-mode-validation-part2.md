# Rule 19: Delivery Mode Validation, Part 2 (Step 5m — MANDATORY)

Continues Part 1's numbered list as items 8-9 (renumbered 1-2 here to satisfy list-numbering lint;
cross-references elsewhere cite them as "rule 19 item 8"/"item 9").

1. **PR steps appear only in declared delivery boundaries** — run the two detection commands from
   `reference/06-pr-boundary-detection-and-consistency-validation.md` and confirm integration-step
   phases are a subset of `### Delivery Boundaries`; confirm every change-producing phase appears in
   exactly one table row and the last change-producing phase is a boundary.
2. **Per-repository delivery mode restriction** (enforces
   [Per-Repository Delivery Mode Restrictions](../../../../repo-governance/conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule))
   — determine the repository (`git remote get-url origin` or `repo-config.yml`); check the resolved
   mode against it:
   - **`ose-public`**: any resolved mode other than `worktree-to-pr`: **HIGH**. Direct-push modes
     have no executable path, and `main-to-pr` violates the repository's no-exception designated
     worktree rule. An invocation branch cannot bypass this restriction.
   - **The private sibling**: same modes resolved: **HIGH**, unless the plan is genuinely
     infrastructure-as-code (BRD/PRD or folder scope it to Terraform, Ansible, or equivalent
     state-changing infra work needing the primary checkout's real credentials/state) — read the
     plan's stated scope, don't rely on a bare self-declared label.

**Finding severity**: invalid non-empty value: **HIGH**. `*-to-pr` mode missing exact-current-head/base
`Quality gate` verification or current-head leak-review pass before merge: **HIGH**. A broad
semantic-review step without a direct user
request: **HIGH**. Merge step tagged with anything other than `[AI]`,
`[HUMAN]`, `[AI+HUMAN]`: **HIGH** (a `[HUMAN]` merge step is always valid, never itself a finding).
Completion criteria conflating "done"/"merged" on `*-to-pr`: **MEDIUM**. Missing or post-merge-deferred
archival-in-PR on an applicable `*-to-pr` plan: **HIGH**. Freshly-authored plan missing the Delivery
Mode declaration entirely: **LOW**. Any PR/push/review/merge/CI-verification step inside Phase 0 (any
mode): **HIGH**. Per-Phase Integration Protocol block not scoped to Phase 1 onward: **HIGH**.
PR-creation/semantic-review/merge/CI-verification step in a non-boundary phase: **HIGH**.
Change-producing phase absent from `### Delivery Boundaries`: **HIGH**. Non-boundary final
change-producing phase: **HIGH**. Missing `### Delivery Boundaries` table on a non-trivial plan:
**MEDIUM**. Single end-of-plan boundary on a plan declaring independent parallel nodes: **MEDIUM**.
Resolved non-`worktree-to-pr` mode in `ose-public`: **HIGH**. A restricted direct mode in
the private sibling outside its declared exception: **HIGH**.
