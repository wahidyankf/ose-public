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

**Direct Orchestration** — the calling context (the top-level assistant session that received the "Execute plan …" request) is the orchestrator. It reads this workflow, parses the plan's delivery checklist, manages the live Task list via `TaskCreate` / `TaskUpdate`, performs the Atomic Sync Ritual against `delivery.md`, and delegates each checklist item to the appropriate specialized agent via the Agent tool (see Agent Selection below).

The calling context invokes `plan-execution-checker` as an Agent-delegated subagent for independent validation (Step 3 and Step 6 below). Validation must run in an isolated context so the checker's judgment is not biased by the orchestrator's execution memory.

There is no dedicated `plan-executor` subagent. Executor logic lives in this workflow document; the calling context follows it directly. This keeps the live Task list visible to the user in real time (a subagent's tasks are isolated to its own context) and eliminates a redundant router hop.

**How to Execute**:

```
User: "Execute plan plans/in-progress/2025-01-15__new-feature/plan.md"
```

The calling context will:

1. Read the delivery checklist from the plan's `delivery.md` to understand all items
2. Create granular tasks using `TaskCreate` — one per remaining checkbox (including nested sub-bullets)
3. For each item: mark `in_progress`, analyze it, delegate to the appropriate specialized agent (or execute directly for trivial edits), verify the result
4. Perform the Atomic Sync Ritual after each item — tick `- [ ]` → `- [x]` in `delivery.md`, add implementation notes, `TaskUpdate completed`
5. Invoke `plan-execution-checker` via the Agent tool to validate the implementation
6. Iterate execution and validation until zero findings achieved
7. Move plan folder to plans/done/ using git mv
8. Show git status with modified files
9. Wait for user commit approval

## Orchestration Model

The **calling context** (top-level assistant session) acts as the orchestrator, following this workflow as its procedure. It reads the delivery checklist, determines which specialized agent is best suited for each item, delegates implementation to that agent via the Agent tool, verifies completion, and performs the Atomic Sync Ritual.

The orchestrator never implements code or documentation in bulk by itself — it routes each non-trivial item to the domain expert agent and collects results. Trivial text edits (e.g., a single-line update to a governance doc) MAY be executed directly via `Edit` without delegating, when delegation would add overhead without adding value.

### Agent Selection

The orchestrator selects the best agent for each delivery checklist item using these rules, applied in priority order:

1. **Match by project/app name**: If the checklist item names a specific app (e.g., `organiclever-be`), use the agent for that app's language (e.g., `swe-fsharp-dev`). Refer to [CLAUDE.md](../../../CLAUDE.md) for the full app list and their tech stacks.

2. **Match by file extension**: If the item references files with a recognizable extension (`.ts`, `.java`, `.py`, `.go`, `.kt`, `.fs`, `.cs`, `.clj`, `.ex`, `.rs`, `.dart`), use the corresponding `swe-{language}-dev` agent.

3. **Match by content type**: If the item involves documentation (`docs/`, `README.md`), governance (`governance/`), specs (`specs/`), or E2E tests (`*-e2e`, Playwright), use the appropriate content agent (`docs-maker`, `repo-rules-maker`, `readme-maker`, `specs-maker`, `swe-e2e-dev`).

4. **Match by framework/tool keywords**: If the item mentions a framework (Spring Boot, Ktor, FastAPI, Gin, Phoenix, Giraffe, Axum, Pedestal, Hugo, Next.js, Flutter), use the agent for that framework's language.

5. **Fallback (direct execution)**: If no specialized agent cleanly matches — e.g., a one-line edit to a governance doc, a grep or file-move operation, an `npm` command — the orchestrator executes the item directly via `Edit` / `Bash` without delegating. Direct execution is only for trivial, context-bounded work; substantive changes always route through an agent.

**The above are heuristics, not a closed list.** As new agents or apps are added to the repository, the orchestrator adapts automatically by reading the available agent list from `.claude/agents/` and matching based on the agent's description and the checklist item's content. The orchestrator should always check what agents are currently available rather than relying on a static table.

**Multi-concern items**: When a delivery checklist item spans multiple task types (e.g., a
TypeScript backend change that also requires a README update), delegate each concern separately
to its appropriate agent. Execute the implementation agent first, then the documentation agent.

## Task-Checklist Synchronization

The live Task list (`TaskCreate` / `TaskUpdate`) and the on-disk delivery checklist (`delivery.md`) are two views of the same state. They MUST agree at every moment of execution. Disagreement is a bug the orchestrator MUST detect and fix immediately.

- **Task list** — ephemeral, in-conversation. Its role is **real-time progress visibility for the user**. A reader watching the Task list is watching execution happen.
- **Delivery checklist** — persistent, on-disk. Its role is **survival across conversations**. It is the source of truth for plan completion state.

### 1:1 Mapping (strict)

Every checkbox on disk has exactly ONE matching task in the live list. Every task has exactly ONE matching checkbox on disk. This includes nested `- [ ]` sub-bullets — each sub-bullet is its own task, not rolled into its parent. Task titles short-form the checkbox text so reader sees consistent wording in both views.

Forbidden: coarse tasks ("Execute Phase 2", "Update all agents"), bulk creation ("one task for every phase"), silent completion ("ticked three boxes in one Edit, one `TaskUpdate` at the end"). Each of these breaks the user's monitoring view.

### Atomic Sync Ritual

For each checklist item, the following three steps happen together, in this order, without interleaving other items' work:

1. **Tick the checkbox**: `Edit` delivery.md to change `- [ ]` → `- [x]` for THIS one item (context-unique `old_string`, never `replace_all` on the whole file).
2. **Persist implementation notes** under the ticked checkbox in the same or an immediately-following `Edit` call — Date, Status, Files Changed, brief notes on what was done.
3. **`TaskUpdate completed`** the matching task. The live list now matches disk truth.

If any step fails, roll back the other two: untick the checkbox, remove the notes, leave the task in `in_progress`. The item is treated as incomplete.

### Resume Reconciliation (disk is truth)

When execution begins (or re-begins in a new conversation), disk state wins:

1. Read delivery.md top-to-bottom FIRST.
2. For every `- [x]` — skip, count as done.
3. For every `- [ ]` — `TaskCreate` one task in reading order.
4. If stale tasks from a prior run disagree with disk (e.g., task `completed` but checkbox `- [ ]`), delete the stale list and rebuild from current delivery.md.
5. Flag any `- [x]` lacking implementation notes — possible silent batch-tick; the user may want to audit before continuing.

### Divergence handling

If a task is `completed` but the checkbox is `- [ ]`, OR a checkbox is `- [x]` but the matching task is not `completed`, state is inconsistent. Stop, reconcile disk vs list (disk wins), then resume.

## Iron Rules (Non-Negotiable)

These rules govern ALL execution steps. No exception. No shortcut.

1. **Granular Task Tracking (1:1 with delivery.md)**: One `TaskCreate` per delivery checklist item, including every nested `- [ ]` sub-bullet (never rolled into its parent). Task titles short-form the checkbox text. At most ONE task in `in_progress` at any time. Mark `in_progress` BEFORE any tool call advancing that item. Mark `completed` ONLY after the checkbox is ticked on disk AND implementation notes are persisted. NEVER create coarse tasks ("Execute Phase 2"). NEVER batch-complete. NEVER complete speculatively.
2. **Never Stop Before All Done**: Execute ALL items from first to last without stopping. No pauses between phases. No skipping items. The only acceptable stop is a hard technical blocker.
3. **Fix ALL Issues — Including Preexisting**: When ANY test, lint, typecheck, or quality gate fails — fix it. Even if it existed before your changes. Do NOT defer. Do NOT skip. Commit preexisting fixes separately.
4. **Delivery.md Is Sacred — Atomic Sync Ritual**: After each item's work is done, run the three-step ritual before touching the next item: (a) `Edit` checkbox `- [ ]` → `- [x]` for THIS one item (no `replace_all`), (b) `Edit` implementation-notes block under the ticked checkbox (Date, Status, Files Changed, brief notes), (c) `TaskUpdate completed`. All three MUST land before moving on. If any step fails, roll back the others and leave the task in `in_progress`. Ticking multiple checkboxes in one Edit or deferring notes to end-of-phase is forbidden.
5. **Local Quality Gates Before Push**: Run `npx nx affected -t typecheck lint test:quick spec-coverage` before every push. Fix ALL failures. Do NOT push with any failing check.
6. **Post-Push CI Verification**: After every push, monitor ALL GitHub Actions workflows. Fix ALL failures (including preexisting). Do NOT proceed until CI is fully green.
7. **Thematic Commits**: Group related changes. Split different concerns. Follow Conventional Commits. Preexisting fixes get their own commits.
8. **Manual Behavioral Assertions**: After quality gates pass, use Playwright MCP for web UI verification and curl for API verification. Fix any broken behavior before proceeding.
9. **Progress Streaming (Observability)**: The live Task list is the user's monitoring window — keep it fresh in real time. Never run silent for more than one checkbox. After each phase completes, emit a one-line user-visible status: phase name, items ticked / total, files changed, any preexisting fixes.
10. **Resume Reconciliation (Disk Is Truth)**: When starting or re-entering execution, read delivery.md first. Rebuild the Task list from disk state. If in-memory tasks disagree with disk checkboxes, delete them and rebuild. Never trust in-memory state over disk.

## Steps

### 1. Load Delivery Checklist and Materialize Task List (Sequential)

Read the plan in full, reconcile against any prior run's state, and build the live Task list to mirror disk truth — before any implementation work begins.

**Orchestrator action**:

- Read the plan at `{input.plan-path}` — all five docs if present (`README.md`, `brd.md`, `prd.md`, `tech-docs.md`, `delivery.md`) or the legacy four-doc layout (`requirements.md` in place of `brd.md` + `prd.md`).
- Locate the delivery checklist — typically `delivery.md` adjacent to the plan, or embedded in a single-file plan's `README.md`.
- **Resume Reconciliation (Iron Rule 10)**: parse every checkbox top-to-bottom. For each `- [x]`, count it as done and skip it. For each `- [ ]`, queue it for task creation in reading order. If a stale Task list from a prior run disagrees with disk, delete it and rebuild.
- **Full granularity parsing (Iron Rule 1)**: identify every `- [ ]` AND every nested `- [ ]` sub-bullet. Nested sub-bullets are NOT rolled into their parent — each gets its own task.
- **`TaskCreate` one task per remaining checkbox**, in reading order. Task titles short-form the checkbox text for monitoring parity.
- **Verify 1:1 mapping** before moving on: `count(remaining - [ ] in delivery.md) == count(newly-created tasks)`. Diverging counts indicate a parsing bug — stop and reconcile.
- Do NOT call `TaskUpdate in_progress` yet; that happens at Step 2 when the loop actually begins on an item.

**Output**: Live Task list mirrors delivery.md remaining items 1:1, plan context loaded.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Tasks map 1:1 to checkboxes, including nested sub-bullets — NEVER group multiple items into one task, NEVER roll sub-bullets into their parent.
- Tasks must be granular — one concrete action per task.
- Preserve the exact phase and item ordering from delivery.md in the Task list.
- Already-ticked items are skipped — the plan is resumable across conversations; disk is truth.

### 1b. Environment Setup (Sequential)

Before implementing anything, ensure the development environment is ready.

**Orchestrator action**:

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

**Orchestrator**: calling context (top-level assistant session)

**Execution loop** — single-item, strictly sequential. Rule 1 (granularity) and Rule 4 (atomic sync ritual) are enforced in this loop:

For each checklist item in reading order (phase by phase, item by item, including nested sub-bullets):

1. **`TaskUpdate in_progress`** on the matching task. At most ONE `in_progress` at a time.
2. **Analyze the item** to determine whether to delegate to a specialized agent (see Agent Selection) or execute directly. If the checklist text is ambiguous, the orchestrator MAY consult the plan's `brd.md` / `prd.md` / `tech-docs.md` for additional context — business intent lives in `brd.md`, product scope and Gherkin acceptance criteria in `prd.md`, architecture decisions in `tech-docs.md`.
3. **Execute the item** — delegate to that agent via the Agent tool, or perform the edit/command directly. Only for THIS one checkbox.
4. **Verify the work succeeded** — read the produced file, run the command, check the agent's output.
5. **Atomic Sync Ritual** — all three steps before any next-item work:
   a. `Edit` delivery.md to change `- [ ]` → `- [x]` for THIS one item (context-unique `old_string`; never `replace_all`; never tick multiple items in one Edit call).
   b. `Edit` delivery.md to add the implementation-notes block (Date, Status, Files Changed, brief notes) under the ticked checkbox.
   c. `TaskUpdate completed` on the matching task.
6. Proceed IMMEDIATELY to the next item — no pausing, no waiting for approval, no deferring notes.

Nested sub-checkboxes iterate the same loop. A parent `- [ ]` can only be ticked after all its sub-`- [ ]` items have each completed steps 1–5 of the loop.

**Progress streaming**: keep the live Task list fresh by executing the ritual after every item. Never queue up two or three item's worth of `completed` updates. After each phase boundary, emit a one-line user-visible status (phase, items ticked / total, files changed, preexisting fixes).

**Output**: `{execution-started}` — all delivery checklist items completed, checklist updated, Task list shows disk truth.

**Success criteria**: Every `- [ ]` that started the phase is now `- [x]` with implementation notes; every matching task is `completed`.

**On failure**: If a delegated agent fails and cannot resolve the issue, terminate with status `fail`. If the failure is recoverable, retry once before escalating. If the ritual partially lands (checkbox ticked but notes missing, or task marked completed but checkbox still `- [ ]`), roll back and treat the item as incomplete.

**Stopping rules**:

- Stop ONLY if a task fails and CANNOT be resolved after retry.
- Stop ONLY if a critical decision requires user input that cannot be inferred.
- Stop ONLY when ALL items are complete.
- NEVER stop between phases.
- NEVER batch-tick checkboxes, batch-complete tasks, or defer implementation notes.
- NEVER skip an item — if genuinely not applicable, add a note explaining why and tick it.

### 2b. Per-Phase Quality Gate (Sequential, After Each Phase)

After completing all items in a delivery phase, run quality gates before proceeding.

**Orchestrator action**:

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

**Monitoring tool**: The required default for standard CI jobs (10–35 min) is `ScheduleWakeup` + a single `gh run view` call on wakeup (2 API calls total per run). Use `gh run watch <run-id>` only if the job is expected to complete in under 5 minutes — `gh run watch` polls every ~3 s and exhausts the GitHub API rate limit (5,000 req/hour) on any job longer than ~5 min. Manual tight-loop polling of `gh run view` without a sleep interval is also **forbidden**. See [CI Monitoring Convention](../../development/workflow/ci-monitoring.md) for required tooling, minimum poll intervals, trigger discipline, and rate-limit recovery procedures.

**Orchestrator action**:

1. Identify which GitHub Actions workflows were triggered by the push
2. Find the run ID: `gh run list --workflow=<workflow-file> --limit=3`
3. Monitor to completion using the correct approach for the job duration:
   - **Standard jobs (10–35 min, required default)**: `ScheduleWakeup(delaySeconds=180)` (3 min), check with one `gh run view <run-id> --json conclusion,status,jobs`, repeat every 3-5 min until complete
   - **Short jobs (<5 min only)**: `gh run watch <run-id>` — do NOT use for 20–35 min CI jobs
   - Never use `gh run watch` on jobs expected to take 20–35 min — it polls every ~3s and exhausts API quota
4. If ANY workflow fails:
   - Pull failure logs and diagnose the root cause: `gh run view <run-id> --log-failed`
   - Fix locally (including preexisting CI failures — Iron Rule 3)
   - Run local quality gates again (Step 2b)
   - Push fix commit
   - Monitor CI again with `ScheduleWakeup` + single `gh run view` (or `gh run watch` if <5 min)
5. Repeat until ALL GitHub Actions workflows pass with zero failures
6. Do NOT proceed to the next delivery phase until CI is fully green
7. If rate-limited (HTTP 403 from `gh`): stop all `gh` calls immediately, use `ScheduleWakeup(delaySeconds=2100)` (35 min) to resume after the rolling window clears — do NOT spin in a retry loop

**Output**: All CI workflows passing

**On failure**: Keep fixing and pushing until CI is green. If stuck after 3 attempts on the same failure, escalate to user.

### 2d. Manual Behavioral Assertions (Sequential, After Each Phase)

After CI is green, manually verify actual application behavior using Playwright MCP and curl.

**Orchestrator action**:

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
- Generates progressive report with all findings (CRITICAL, HIGH, MEDIUM, LOW)

### 4. Check for Findings (Sequential)

Analyze validation report to determine if further execution is needed.

**Condition Check**: Count ALL findings (CRITICAL, HIGH, MEDIUM, and LOW) in `{step3.outputs.audit-report-1}`

- If findings > 0: Proceed to step 5 (Continue Execution)
- If findings = 0: Skip to step 8 (Finalization - Success)

**Depends on**: Step 3 completion

**Notes**:

- Includes all finding levels — missing requirements, incomplete deliverables, quality issues
- Zero findings required for success (perfect quality standard)
- Reports which requirements still need work

### 5. Continue Execution (Sequential, Conditional)

Address findings and continue implementation by delegating to appropriate specialized agents.

**Orchestrator**: calling context (top-level assistant session)

- **Inputs**: `{plan: {input.plan-path}, focus: {findings-from-latest-report}}`
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

**Success criteria**: The orchestrator addresses all findings without stopping between them.

**On failure**: Log errors, proceed to step 6 for verification.

**Notes**:

- Orchestrator focuses on addressing specific findings while continuing overall plan execution
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

- Count ALL findings in `{step6.outputs.audit-report-N}` (CRITICAL, HIGH, MEDIUM, LOW)
- If findings = 0: Proceed to step 8 (Finalization - Success)
- If findings > 0 AND iterations < max-iterations: Loop back to step 5 with new report
- If findings > 0 AND iterations >= max-iterations: Proceed to step 8 (Finalization - Partial)

**Depends on**: Step 6 completion

**Notes**:

- Prevents infinite loops with max-iterations limit
- Continues until ZERO findings of any criticality level
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

The orchestrator MUST follow these task management rules throughout execution:

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

Every delivery checklist item must be executed in order. The orchestrator may not skip an item
because it seems redundant or out of scope. If an item is genuinely irrelevant, mark it
with a note explaining why it was skipped rather than silently omitting it.

## Termination Criteria

- PASS: **Success** (`pass`): Zero findings of ANY criticality level (CRITICAL, HIGH, MEDIUM, LOW) in final validation, all deliverables complete, plan archived to `plans/done/`
- **Partial** (`partial`): Findings remain after max-iterations cycles, plan requires manual intervention
- FAIL: **Failure** (`fail`): Orchestrator or checker encountered technical errors preventing completion

## Example Usage

### Execute Plan with Default Settings

```
User: "Execute plan plans/in-progress/2025-01-15__new-feature/plan.md"
```

The calling context orchestrates directly and invokes specialized agents via the Agent tool (default max 10 iterations):

- Read delivery checklist and materialize 1:1 Task list in the calling context
- Delegate each item to the appropriate specialized agent (e.g., `swe-typescript-dev`)
- Tick checkboxes progressively as each item completes (Atomic Sync Ritual)
- Validate implementation by invoking `plan-execution-checker` subagent
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

- **Orchestrator model**: calling context (top-level assistant session) coordinates specialized agents per the rules in this workflow, never implementing substantive changes directly
- **Semi-automated**: calling context may request user input for critical decisions, but execution continues autonomously otherwise
- **Idempotent**: Safe to re-run on partially completed plans, won't duplicate work
- **Progressive**: Each iteration builds on previous work, continuously updating checklists and task status
- **Observable**: Generates validation reports for every validation cycle; task status visible in real time
- **Bounded**: Max-iterations prevents runaway execution
- **Archival**: Automatically moves successfully completed plans to done/ folder
- **History-preserving**: Uses git mv to maintain commit history when archiving

**Key Differences from plan-quality-gate**:

1. **Execution-focused**: Orchestrated directly by the calling context (which delegates per-item work to specialized agents) instead of by `plan-fixer` (which edits plan documents)
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
