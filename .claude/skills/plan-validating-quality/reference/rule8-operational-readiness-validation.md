# Rule 8: Operational Readiness Validation

## 8. Operational Readiness Validation (Step 5b — MANDATORY)

After delivery-checklist structure (Step 5), verify **operational readiness** items — CRITICAL when
entirely missing, since plans lacking them are incomplete regardless of other quality.

**What to validate**:

1. **Local Quality Gates Before Push** — steps run affected tests/checks locally before pushing,
   referencing `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push` (the registry-declared
   gate set `.husky/pre-push` runs after its public-safety screen, including `nx affected -t test:quick`); mentions blast radius
   (affected projects only); specifies unit/integration/e2e as applicable; includes lint and typecheck.
2. **Post-Push CI/CD Verification** — steps manually verify related GitHub Actions pass after push,
   against the plan's declared delivery target (the PR's check run under `*-to-pr`; `origin main`
   under direct-push modes — hardcoding `main` while declaring `*-to-pr` is itself a finding);
   specifies which workflows to monitor; instructs watching for and fixing failures.
3. **Development Environment Setup** — before any work in every selected worktree, new or existing,
   steps run `rtk ./hippo run --class ephemeral --disk-path . -- npm install` at its root and then
   `rtk npm run doctor -- --fix`; only then cover env vars, database, and guarded dev-server setup.
   Instructions are specific enough for a newcomer.
4. **Fix-All-Issues Instruction** — instructs fixing ALL issues found during quality gates, even
   unrelated to current changes (root-cause orientation), explicitly: "Fix all failures, not just
   those caused by your changes."
5. **Thematic Commit Guidance** — preserves explicit authorization for a named change set, then
   selects the fewest build-valid, independently reviewable/revertible commits; keeps required
   completion artifacts with their change, splits independent concerns, references Conventional
   Commits, and forbids exceeding authorized scope.

**Finding severity**: missing ALL items: **CRITICAL**. Missing an individual item (1-5): **HIGH**
per missing item. Present but vague/incomplete: **MEDIUM**.
