---
name: plan-execution
goal: Execute a project plan, validate its completion and quality, then iteratively continue until all requirements are met and archive to plans/done/
termination: Zero findings remain after validation and plan moved to done/
inputs:
  - name: plan-path
    type: string
    description: Path to the plan file to execute (e.g., "plans/in-progress/2025-01-15__new-feature/plan.md")
    required: true
  - name: max-iterations
    type: number
    description: Maximum number of execute-check cycles to prevent infinite loops
    required: false
    default: 10
  - name: max-concurrency
    type: number
    description: Maximum number of agents/tasks that can run concurrently during workflow execution
    required: false
    default: 2
outputs:
  - name: final-status
    type: enum
    values: [pass, partial, fail]
    description: Final execution and validation status
  - name: iterations-completed
    type: number
    description: Number of execute-check cycles performed
  - name: final-report
    type: file
    pattern: generated-reports/plan-execution__*__validation.md
    description: Final validation report from plan-execution-checker
---

# Plan Execution Workflow

**Purpose**: Automatically execute a project plan, validate its completion and quality, then iteratively continue execution until all requirements are met. Upon success, move the plan to `plans/done/`.

**When to use**:

- When you want to execute a plan from start to finish with automated quality validation
- After creating a new plan and want immediate implementation
- For plans that require iterative refinement to meet all requirements
- When you need automated archival of completed plans to done/ folder
- For systematic plan completion with zero-findings quality standard

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `plan-executor` and `plan-execution-checker`
via the Agent tool with `subagent_type`
(see [Workflow Execution Modes Convention](../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

The Agent tool runs subagents that persist file changes to the actual filesystem, making it
the preferred approach when these agents exist as defined subagent types.

**How to Execute**:

```
User: "Execute plan plans/in-progress/2025-01-15__new-feature/plan.md"
```

The AI will:

1. Read the delivery checklist from the plan's `delivery.md` to understand all items
2. Create granular tasks using `TaskCreate` for each delivery checklist item
3. Analyze each item and delegate to the appropriate specialized agent
4. Tick completed checklist items (`- [ ]` → `- [x]`) in `delivery.md` progressively
5. Invoke `plan-execution-checker` via the Agent tool to validate the implementation
6. Iterate execution and validation until zero findings achieved
7. Move plan folder to plans/done/ using git mv
8. Show git status with modified files
9. Wait for user commit approval

**Fallback (Manual Mode)**:

```
User: "Execute plan plans/in-progress/2025-01-15__new-feature/plan.md in manual mode"
```

The AI executes plan-executor and plan-execution-checker logic directly using Read/Write/Edit
tools in the main context — use this when agent delegation is unavailable.

## Orchestration Model

`plan-executor` acts as an **orchestrator**, not an implementer. It reads the delivery
checklist, determines which specialized agent is best suited for each item, delegates
implementation to that agent, verifies completion, and ticks the checkbox.

The executor never implements code or documentation directly. It routes each item to the
domain expert agent and collects results.

### Agent Selection

The executor selects the best agent for each delivery checklist item using these rules, applied
in priority order:

1. **Match by project/app name**: If the checklist item names a specific app (e.g.,
   `a-demo-be-java-vertx`), use the agent for that app's language (e.g., `swe-java-dev`).
   Refer to [CLAUDE.md](../../../CLAUDE.md) for the full app list and their tech stacks.

2. **Match by file extension**: If the item references files with a recognizable extension (`.ts`,
   `.java`, `.py`, `.go`, `.kt`, `.fs`, `.cs`, `.clj`, `.ex`, `.rs`, `.dart`), use the
   corresponding `swe-{language}-dev` agent.

3. **Match by content type**: If the item involves documentation (`docs/`, `README.md`),
   governance (`governance/`), specs (`specs/`), or E2E tests (`*-e2e`, Playwright), use the
   appropriate content agent (`docs-maker`, `repo-rules-maker`, `readme-maker`,
   `specs-maker`, `swe-e2e-dev`).

4. **Match by framework/tool keywords**: If the item mentions a framework (Spring Boot, Ktor,
   FastAPI, Gin, Phoenix, Giraffe, Axum, Pedestal, Hugo, Next.js, Flutter), use the agent for
   that framework's language.

5. **Fallback**: If none of the above match, use `plan-executor` (general-purpose) for the item.

**The above are heuristics, not a closed list.** As new agents or apps are added to the
repository, the executor adapts automatically by reading the available agent list from
`.claude/agents/` and matching based on the agent's description and the checklist item's content.
The executor should always check what agents are currently available rather than relying on a
static table.

**Multi-concern items**: When a delivery checklist item spans multiple task types (e.g., a
TypeScript backend change that also requires a README update), delegate each concern separately
to its appropriate agent. Execute the implementation agent first, then the documentation agent.

## Task-Checklist Synchronization

The Task list (in-memory via `TaskCreate`/`TaskUpdate`) and the delivery checklist (on-disk in
`delivery.md`) MUST always be in sync. They are two views of the same state:

- **Task list**: Ephemeral, in-conversation tracking. Provides progress visibility during
  execution. Lost when the conversation ends.
- **Delivery checklist**: Persistent, on-disk record. Survives across conversations. Source of
  truth for plan completion.

**Sync rules**:

1. **Create together**: When a task is created via `TaskCreate`, the corresponding `- [ ]` item
   MUST already exist in `delivery.md` (it was written during planning).
2. **Update together**: When a task is marked `completed` via `TaskUpdate`, the corresponding
   `- [ ]` in `delivery.md` MUST be ticked to `- [x]` in the same step — never one without the
   other.
3. **Resume from checklist**: When resuming a plan in a new conversation, read `delivery.md` to
   determine which items are already `- [x]` (done) and which are `- [ ]` (remaining). Create
   tasks only for remaining items.
4. **Never diverge**: If a task is completed but the checklist is not ticked (or vice versa), the
   state is inconsistent. The executor must detect and fix this immediately.

## Iron Rules (Non-Negotiable)

These rules govern ALL execution steps. No exception. No shortcut.

1. **Granular Task Tracking**: One `TaskCreate` per delivery checklist item. Mark `in_progress` before starting. Mark `completed` only after work is done AND checkbox is ticked. NEVER batch-complete.
2. **Never Stop Before All Done**: Execute ALL items from first to last without stopping. No pauses between phases. No skipping items. The only acceptable stop is a hard technical blocker.
3. **Fix ALL Issues — Including Preexisting**: When ANY test, lint, typecheck, or quality gate fails — fix it. Even if it existed before your changes. Do NOT defer. Do NOT skip. Commit preexisting fixes separately.
4. **Delivery.md Is Sacred**: Tick checkboxes IMMEDIATELY after each item. Add implementation notes. NEVER move to next item without ticking current. Progress must be visible at ALL times.
5. **Local Quality Gates Before Push**: Run `npx nx affected -t typecheck lint test:quick spec-coverage` before every push. Fix ALL failures. Do NOT push with any failing check.
6. **Post-Push CI Verification**: After every push, monitor ALL GitHub Actions workflows. Fix ALL failures (including preexisting). Do NOT proceed until CI is fully green.
7. **Thematic Commits**: Group related changes. Split different concerns. Follow Conventional Commits. Preexisting fixes get their own commits.
8. **Manual Behavioral Assertions**: After quality gates pass, use Playwright MCP for web UI verification and curl for API verification. Fix any broken behavior before proceeding.

## Steps

### 1. Load Delivery Checklist (Sequential)

Read the plan and its delivery document to understand all work items before execution begins.

**Executor action**:

- Read the plan file at `{input.plan-path}`
- Locate the delivery checklist, typically in a `delivery.md` file adjacent to the plan or
  embedded within the plan itself
- Parse all checklist items in sequential phase and item order
- Identify already-completed items (`- [x]`) — skip these (plan may be partially complete from a
  prior conversation)
- Use `TaskCreate` to create one task per REMAINING (`- [ ]`) checklist item — one task per item, no grouping
- Use `TaskUpdate` (`in_progress`) on each task as it begins

**Output**: Full task list created for remaining items, delivery document loaded

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Tasks map 1:1 to delivery checklist items — NEVER group multiple items into one task
- Tasks must be granular — one concrete action per task
- Preserve the phase and sequential ordering from the delivery checklist
- Already-ticked items are skipped — the plan is resumable across conversations

### 1b. Environment Setup (Sequential)

Before implementing anything, ensure the development environment is ready.

**Executor action**:

- Run `npm install` to ensure dependencies are current
- Run `npm run doctor` to verify all tooling is installed
- Set up project-specific requirements (env vars, DB, Docker, etc.) as specified in the plan
- Verify dev server starts for affected projects
- Run existing quality gates to establish a baseline: `npx nx affected -t typecheck lint test:quick`
- Note any preexisting failures — these MUST be fixed during execution (Iron Rule 3)

**Output**: Environment ready, baseline failures identified

**On failure**: If environment cannot be set up, terminate with status `fail`.

### 2. Initial Execution (Sequential, Continuous)

Execute all delivery checklist items sequentially, delegating each to the appropriate specialized agent.

**Agent**: `plan-executor` (as orchestrator)

**Execution loop**:

For each checklist item in sequential order (phase by phase, item by item):

1. Mark the corresponding task `in_progress` via `TaskUpdate`
2. Analyze the item to determine the correct specialized agent (see Agent Selection above)
3. Delegate the item to that agent via the Agent tool
4. Verify the agent completed the work successfully
5. **Atomic sync**: Update BOTH in the same step:
   - Tick the delivery checklist: `- [ ]` → `- [x]` in `delivery.md` (Edit tool)
   - Add implementation notes (Date, Status, Files Changed) under the ticked item
   - Mark the task `completed` via `TaskUpdate`
6. Proceed IMMEDIATELY to the next item — no pausing, no waiting for approval

**Output**: `{execution-started}` — all delivery checklist items completed, checklist updated

**Success criteria**: All checklist items ticked and all delegated agents completed without
technical errors.

**On failure**: If a delegated agent fails and cannot resolve the issue, terminate with
status `fail`. If the failure is recoverable, retry once before escalating.

**Stopping rules**:

- Stop ONLY if a task fails and CANNOT be resolved after retry
- Stop ONLY if a critical decision requires user input that cannot be inferred
- Stop ONLY when ALL items are complete
- NEVER stop between phases
- NEVER batch-complete items without actually delegating and verifying each one
- NEVER skip an item — if genuinely not applicable, add a note and tick it

### 2b. Per-Phase Quality Gate (Sequential, After Each Phase)

After completing all items in a delivery phase, run quality gates before proceeding.

**Executor action**:

1. Run local quality gates:

   ```bash
   npx nx affected -t typecheck
   npx nx affected -t lint
   npx nx affected -t test:quick
   npx nx affected -t spec-coverage
   ```

2. If the plan involves integration or e2e tests, also run:

   ```bash
   npx nx affected -t test:integration
   npx nx affected -t test:e2e
   ```

3. **Fix ALL failures** — including preexisting ones (Iron Rule 3)
4. Re-run failing checks to confirm resolution
5. Commit thematically (Iron Rule 7) — separate plan work from preexisting fixes
6. Push to `main` only after ALL local quality gates pass (Iron Rule 5)

**Output**: All quality gates passing, changes pushed

**On failure**: Fix failures and retry. Do NOT proceed to next phase with failures.

### 2c. Post-Push CI Verification (Sequential, After Each Push)

After every push to `main`, verify GitHub Actions.

**Executor action**:

1. Identify which GitHub Actions workflows were triggered by the push
2. Monitor their status until ALL complete
3. If ANY workflow fails:
   - Pull failure logs and diagnose the root cause
   - Fix locally (including preexisting CI failures — Iron Rule 3)
   - Run local quality gates again (Step 2b)
   - Push fix commit
   - Monitor CI again
4. Repeat until ALL GitHub Actions workflows pass with zero failures
5. Do NOT proceed to the next delivery phase until CI is fully green

**Output**: All CI workflows passing

**On failure**: Keep fixing and pushing until CI is green. If stuck after 3 attempts on the same failure, escalate to user.

### 2d. Manual Behavioral Assertions (Sequential, After Each Phase)

After CI is green, manually verify actual application behavior using Playwright MCP and curl.

**Executor action**:

1. **For Web UI changes** — use Playwright MCP tools:
   - Start dev server: `nx dev [project-name]`
   - `browser_navigate` to affected pages
   - `browser_snapshot` to inspect rendered DOM
   - `browser_click`, `browser_fill_form` to test interactive flows
   - `browser_console_messages` to check for JS errors
   - `browser_network_requests` to verify API calls
   - `browser_take_screenshot` for visual verification
2. **For API changes** — use curl via Bash:
   - Start backend server: `nx dev [project-name]`
   - Hit affected endpoints with curl and verify response status, shape, and data
   - Test error cases with invalid payloads
3. **For full-stack changes** — run BOTH Playwright MCP and curl:
   - Verify UI renders correctly
   - Verify API responds correctly
   - Verify the full flow (UI action → API call → response → UI update)
4. **Fix any broken behavior** — including preexisting issues (Iron Rule 3)
5. **Document assertions** in delivery.md under the relevant items

**Output**: All manual assertions pass, application behavior verified

**On failure**: Fix broken behavior, re-run assertions. Do NOT proceed to next phase with broken UI or API.

**Notes**:

- This step is MANDATORY when the plan touches web UI or API code
- Skip ONLY if the plan touches no UI and no API (e.g., pure documentation or governance changes)
- Playwright MCP provides real browser interaction — use it to catch rendering, JS, and integration issues that automated tests may miss
- curl provides direct HTTP verification — use it to catch response format, status code, and data issues

### 3. Validation (Sequential)

Validate the implementation against plan requirements.

**Agent**: `plan-execution-checker`

- **Args**: `plan: {input.plan-path}`
- **Output**: `{audit-report-1}` — Initial validation report in `generated-reports/`
- **Depends on**: Step 2 completion

**Success criteria**: Checker completes and generates validation report.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Validates implementation against plan requirements
- Checks all deliverables meet quality standards
- Verifies delivery checklist completion
- Generates progressive report with all findings (HIGH, MEDIUM, MINOR)

### 4. Check for Findings (Sequential)

Analyze validation report to determine if further execution is needed.

**Condition Check**: Count ALL findings (HIGH, MEDIUM, and MINOR) in `{step3.outputs.audit-report-1}`

- If findings > 0: Proceed to step 5 (Continue Execution)
- If findings = 0: Skip to step 8 (Finalization - Success)

**Depends on**: Step 3 completion

**Notes**:

- Includes all finding levels — missing requirements, incomplete deliverables, quality issues
- Zero findings required for success (perfect quality standard)
- Reports which requirements still need work

### 5. Continue Execution (Sequential, Conditional)

Address findings and continue implementation by delegating to appropriate specialized agents.

**Agent**: `plan-executor` (as orchestrator)

- **Args**: `plan: {input.plan-path}, focus: {findings-from-latest-report}`
- **Output**: `{additional-work-completed}` — More checklist items completed, findings addressed
- **Condition**: Findings exist from step 4 or step 7
- **Depends on**: Step 4 completion (first iteration) or Step 7 completion (subsequent iterations)

**Execution loop** (same rules as Step 2):

For each finding from the latest validation report:

1. Analyze the finding to determine the correct specialized agent
2. Delegate the remediation to that agent via the Agent tool
3. Verify the agent resolved the finding successfully
4. **Atomic sync**: If the finding corresponds to an unchecked item, tick BOTH the delivery
   checklist (`- [x]`) and the task (`completed`) in the same step
5. Proceed immediately to the next finding

**Success criteria**: Executor addresses all findings without stopping between them.

**On failure**: Log errors, proceed to step 6 for verification.

**Notes**:

- Executor focuses on addressing specific findings while continuing overall plan execution
- Updates delivery checklist with resolved items
- May delegate to new requirements or fix quality issues
- Continues from previous work, does not restart from scratch

### 6. Re-validate (Sequential)

Run validation again to verify findings resolved and no new issues introduced.

**Agent**: `plan-execution-checker`

- **Args**: `plan: {input.plan-path}`
- **Output**: `{audit-report-N}` — Verification validation report
- **Depends on**: Step 5 completion

**Success criteria**: Checker completes validation.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Verifies all findings from previous report are resolved
- Checks no new issues were introduced during fixes
- Generates fresh validation report with current status

### 7. Iteration Control (Sequential)

Determine whether to continue execution or terminate.

**Logic**:

- Count ALL findings in `{step6.outputs.audit-report-N}` (HIGH, MEDIUM, MINOR)
- If findings = 0: Proceed to step 8 (Finalization - Success)
- If findings > 0 AND iterations < max-iterations: Loop back to step 5 with new report
- If findings > 0 AND iterations >= max-iterations: Proceed to step 8 (Finalization - Partial)

**Depends on**: Step 6 completion

**Notes**:

- Prevents infinite loops with max-iterations limit
- Continues until ZERO findings of any confidence level
- Each iteration uses the latest validation report
- Tracks iteration count for observability

### 8. Finalization and Archival (Sequential)

Report final status, archive plan if successful, and update all related READMEs.

**Logic**:

- If status is `pass` (zero findings):
  1. Move entire plan folder from current location to `plans/done/`:

     ```bash
     git mv plans/in-progress/YYYY-MM-DD__plan-name/ plans/done/YYYY-MM-DD__plan-name/
     ```

  2. **Update `plans/in-progress/README.md`** — remove the plan entry from the list
  3. **Update `plans/done/README.md`** — add the plan entry with completion date and brief summary:

     ```markdown
     - [Plan Name](./YYYY-MM-DD__plan-name/) — Brief description. Completed YYYY-MM-DD.
     ```

  4. **Update any other READMEs** that reference this plan (e.g., `plans/README.md`, project READMEs that link to the plan)
  5. **Search for orphaned references** to the old `plans/in-progress/[plan-name]` path and fix them
  6. **Commit the archival**:

     ```
     chore(plans): move [plan-identifier] to done
     ```

- If status is `partial` or `fail`: Leave plan in current location, do NOT archive

**Output**: `{final-status}`, `{iterations-completed}`, `{final-report}`

**Status determination**:

- PASS: **Success** (`pass`): Zero findings after validation, all requirements met, plan moved to `plans/done/`
- **Partial** (`partial`): Findings remain after max-iterations, plan stays in current location
- FAIL: **Failure** (`fail`): Technical errors during execution or checking, plan stays in current location

**Depends on**: Reaching this step from step 4, 6, or 7

## Task Management Rules

The executor MUST follow these task management rules throughout execution:

### Create Tasks Before Starting

Before beginning Step 2 execution, create one task per delivery checklist item using
`TaskCreate`. Tasks must be granular — one concrete action per task. Never bundle multiple
steps behind a single task.

### Update Task Status Progressively

As each item begins, call `TaskUpdate` to set status `in_progress`. When done, call
`TaskUpdate` to set status `completed`. Never mark a task complete without having delegated
it and verified the agent completed the work.

### Tick Checkboxes Immediately

Update `delivery.md` immediately after each item completes — before moving to the next
item. Never batch-update checkboxes at the end of a phase. The delivery checklist must
reflect actual completion state at all times.

### Never Skip Items

Every delivery checklist item must be executed in order. The executor may not skip an item
because it seems redundant or out of scope. If an item is genuinely irrelevant, mark it
with a note explaining why it was skipped rather than silently omitting it.

## Termination Criteria

- PASS: **Success** (`pass`): Zero findings of ANY confidence level (HIGH, MEDIUM, MINOR) in final validation, all deliverables complete, plan archived to `plans/done/`
- **Partial** (`partial`): Findings remain after max-iterations cycles, plan requires manual intervention
- FAIL: **Failure** (`fail`): Executor or checker encountered technical errors preventing completion

## Example Usage

### Execute Plan with Default Settings

```
User: "Execute plan plans/in-progress/2025-01-15__new-feature/plan.md"
```

The AI will invoke specialized agents via the Agent tool (default max 10 iterations):

- Read delivery checklist and create tasks (`plan-executor` as orchestrator)
- Delegate each item to the appropriate specialized agent (e.g., `swe-typescript-dev`)
- Tick checkboxes progressively as each item completes
- Validate implementation (`plan-execution-checker` subagent)
- Iterate until zero findings and all deliverables complete
- Move plan folder to plans/done/ on success

### Execute with Extended Iterations

```
User: "Execute plan plans/in-progress/2025-01-15__complex-migration/plan.md with max-iterations=15"
```

The AI will invoke agents with extended iteration limit:

- Allow up to 15 execute-validate cycles for complex plans
- Suitable for large migrations or multi-phase implementations

### Execute Plan from Backlog

```
User: "Execute plan plans/backlog/2025-02-01__future-feature/plan.md"
```

The AI will invoke agents regardless of folder location:

- Implement plan requirements via orchestrated specialized agents
- Won't move to done until zero findings achieved
- Plan archived to plans/done/ only on complete success

### Quick Validation Only

```
User: "Execute plan plans/in-progress/2025-01-15__new-feature/plan.md with max-iterations=1"
```

The AI will invoke agents for a single cycle:

- Single execute-validate cycle
- Reports findings without further iteration
- Useful for quick validation pass

## Iteration Example

Typical execution flow:

```
Step 1: Load checklist — 12 items across 3 phases, 12 tasks created

Step 2: Execute all items sequentially
  Phase 1 (Infrastructure):
    Item 1 → swe-typescript-dev → checkbox ticked
    Item 2 → swe-typescript-dev → checkbox ticked
    Item 3 → docs-maker              → checkbox ticked
  Phase 2 (Implementation):
    Item 4 → swe-typescript-dev → checkbox ticked
    Item 5 → swe-e2e-dev   → checkbox ticked
    Item 6 → swe-golang-dev     → checkbox ticked
    ...and so on without stopping between phases

Step 3: Validate → 4 findings (quality issues, missing tests)

Step 5: Address findings
  Finding 1 → swe-typescript-dev → resolved
  Finding 2 → swe-e2e-dev   → resolved
  Finding 3 → docs-maker               → resolved
  Finding 4 → swe-typescript-dev → resolved

Step 6: Re-validate → 0 findings

Result: SUCCESS → Plan moved to plans/done/
```

## Safety Features

**Infinite Loop Prevention**:

- Max-iterations parameter (default: 10)
- Workflow terminates with `partial` if limit reached
- Tracks iteration count for monitoring

**Progressive Updates**:

- Delivery checklist items ticked individually throughout execution
- Task status updated in real time via TaskCreate/TaskUpdate
- Each iteration builds on previous work
- Validation history preserved in generated-reports/

**Error Recovery**:

- Continues to verification even if some execution steps encounter issues
- Reports which requirements succeeded/failed
- Generates final report regardless of status

**Plan Preservation**:

- Only moves plan to done/ on complete success (zero findings)
- Partial completion keeps plan in current location for manual review
- Uses git mv to preserve commit history when archiving

## Plan-Specific Validation

The plan-execution-checker validates:

- **Requirements Coverage**: All requirements from plan implemented
- **Deliverables Completeness**: All deliverables created and meet quality standards
- **Checklist Completion**: All delivery checklist items marked as completed with implementation notes
- **Quality Standards**: Implementation follows repository conventions and best practices
- **Testing Requirements**: Tests written and passing as specified in plan
- **Documentation**: Required documentation created and accurate
- **Operational Readiness** (CRITICAL): The checker verifies ALL of the following were executed:
  - **Local quality gates passed**: `nx affected -t typecheck lint test:quick spec-coverage` was run and passed with zero failures before every push
  - **CI/CD fully green**: All GitHub Actions workflows passed after every push — no exceptions
  - **Preexisting issues fixed**: All encountered failures were fixed, including those not caused by the plan's changes (root cause orientation)
  - **Delivery.md updated progressively**: Checkboxes ticked sequentially with implementation notes, not batch-ticked at the end (verified via git history)
  - **Thematic commits**: Changes committed in logically cohesive groups following Conventional Commits, not monolithic dumps
  - **Environment setup performed**: Evidence that dev environment was set up before implementation began
  - **Manual behavioral assertions**: Playwright MCP was used to verify web UI changes (navigation, DOM, console errors, screenshots); curl was used to verify API changes (status codes, response shapes, error cases). Documented in delivery.md.

## Related Workflows

This workflow can be composed with:

- **plan-quality-gate**: Validate plan quality before executing (recommended pre-step)
- Content creation workflows: Execute content-focused plans
- Release workflows: Execute release plans with deployment
- **repo-rules-quality-gate**: Validate repository consistency after plan execution

**Recommended Workflow Sequence**:

```
1. plan-quality-gate → Validate plan completeness and accuracy
2. plan-execution    → Execute validated plan
3. repo-rules-quality-gate → Ensure repository consistency
```

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed for different plan types
- **Success rate**: Percentage of plans reaching zero findings and moving to done/
- **Common finding categories**: What issues appear most often during execution
- **Execution success rate**: Percentage of requirements implemented without errors
- **Archival rate**: Percentage of plans successfully moved to done/
- **Agent delegation accuracy**: How often the correct specialized agent was selected per task type

## Notes

- **Orchestrator model**: plan-executor coordinates specialized agents, never implements directly
- **Semi-automated**: plan-executor may request user input for critical decisions, but execution continues autonomously otherwise
- **Idempotent**: Safe to re-run on partially completed plans, won't duplicate work
- **Progressive**: Each iteration builds on previous work, continuously updating checklists and task status
- **Observable**: Generates validation reports for every validation cycle; task status visible in real time
- **Bounded**: Max-iterations prevents runaway execution
- **Archival**: Automatically moves successfully completed plans to done/ folder
- **History-preserving**: Uses git mv to maintain commit history when archiving

**Key Differences from plan-quality-gate**:

1. **Execution-focused**: Uses plan-executor (orchestrates specialized agents) instead of plan-fixer (fixes plan documents)
2. **End-to-end**: Covers full plan lifecycle from execution through validation to archival
3. **Progressive delivery**: Continuously ticks delivery checklist items and updates task status throughout execution
4. **Archival automation**: Moves completed plans to plans/done/ automatically
5. **Higher default iterations**: Default 10 (vs 5) since implementation is more complex than document fixes
6. **Delegation model**: Routes each item to the domain-appropriate specialized agent

This workflow ensures complete plan execution with validated quality, making it ideal for systematically implementing project plans from start to archive.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, conditions, termination criteria, and agent selection rules clearly defined
- PASS: **Automation Over Manual**: Fully automated execution, validation, and archival with specialized agent delegation
- PASS: **Simplicity Over Complexity**: Clear linear flow with loop control, bounded iterations, and domain-specific agents
- PASS: **Accessibility First**: Generates human-readable validation reports for transparency
- PASS: **Progressive Disclosure**: Configurable iterations and plan paths for different use cases
- PASS: **No Time Estimates**: Focus on quality outcomes and completion criteria, not duration

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow file follows plain name convention for workflows
- **[Linking Convention](../../conventions/formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, proper heading hierarchy, single H1
