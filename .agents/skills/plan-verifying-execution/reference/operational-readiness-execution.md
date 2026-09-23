# Operational Readiness Execution Verification (Step 5b)

## 1. Verify Operational Readiness Execution (Step 5b — MANDATORY)

After assessing code quality (Step 5), verify that the executor followed ALL operational readiness
protocols. These are CRITICAL findings if missing.

### What to Validate

1. **Local Quality Gates Were Executed**
   - Check git log for evidence that quality gates were run before each push
   - Verify no lint, typecheck, or test failures remain in the affected projects
   - Run `./rhino gate run --surface pre-push` (the same registry-declared
     gate set `.husky/pre-push` runs after its public-safety screen; includes `nx affected -t test:quick`) and confirm zero
     failures
   - If ANY failure exists, report as CRITICAL finding

2. **Post-Push CI Passed**
   - Check if every GitHub Actions workflow triggered by the latest commits passed on the plan's
     delivery target — the PR branch under `*-to-pr` modes, `main` under the direct-push modes
     (resolve the mode first; do not assume `main`)
   - If CI status is not all-green, report as CRITICAL finding
   - This includes workflows that may have been failing before the plan execution

3. **Preexisting Issues Were Fixed**
   - Review git log for fix commits addressing preexisting issues (e.g., `fix(lint): resolve
preexisting ...`)
   - Run quality gates to confirm no preexisting failures remain
   - If preexisting failures still exist in affected projects, report as HIGH finding
   - The root cause orientation principle requires proactive fixing of encountered issues

4. **Delivery.md Was Updated Progressively**
   - Verify ALL delivery checklist items are ticked (`- [x]`)
   - Verify each ticked item has implementation notes (Date, Status, Files Changed)
   - Verify items were ticked in sequential order (not batch-ticked at the end)
   - Check git history: delivery.md should have been committed progressively, not in one final
     commit
   - Missing implementation notes: MEDIUM finding per item
   - Unticked items: CRITICAL finding per item

5. **Thematic Commits Were Made**
   - Review git log for the plan execution period
   - Verify commits follow Conventional Commits format
   - Verify each commit has one coherent purpose, is build-valid and independently revertible, and
     includes its required tests/docs/specs/references/migrations/generated mirrors
   - Verify independent concerns are separate without categorical splitting by file type or domain
   - Monolithic independent concerns or incomplete intermediate commits: HIGH finding
   - Missing conventional commit format: MEDIUM finding

6. **Environment Setup Was Performed**
   - Verify the plan included environment setup steps and they were completed
   - Check that `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` and then
     `rtk npm run doctor` ran at the selected worktree root before any work, with
     `./rhino toolchain provision --apply` and a repeat `rtk npm run doctor` wherever it reported
     drift; another checkout or inferred equivalent does not count
   - Missing setup evidence: MEDIUM finding

7. **Cross-Repository Resource Schedule Was Followed**
   - Applies only when the plan spans repositories
   - Read each compute node's HIPPO guard/class and every declared dependency, shared-output,
     byte-identity, transactional, or correctness serialization edge in `## Parallelization Model`
   - Verify implementation notes, execution logs, and timestamps show admitted or deferred HIPPO
     execution and preserve every declared serial edge; independent nodes may overlap when admitted
   - Missing execution evidence or evidence contradicting guarded admission or a declared serial
     edge: HIGH finding; do not claim live capacity or overlap facts without authenticated evidence

### Finding Severity

- Quality gates not run / still failing: **CRITICAL**
- CI not passing: **CRITICAL**
- Delivery items not ticked: **CRITICAL**
- Preexisting issues not fixed: **HIGH**
- Monolithic independent concerns or incomplete intermediate commits: **HIGH**
- Missing implementation notes: **MEDIUM**
- Missing setup evidence: **MEDIUM**
- Missing or contradictory HIPPO admission or correctness-edge evidence: **HIGH**
