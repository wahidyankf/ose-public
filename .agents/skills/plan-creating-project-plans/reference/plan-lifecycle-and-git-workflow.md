# Plan Lifecycle and Git Workflow

## Plan Lifecycle

### 1. Ideation (ideas/)

**Format**: A two-pager idea brief — one `plans/ideas/<slug>.md` per idea, ~8 short sections
(problem, why-now, prior art, direction sketch, scope & non-goals, risks & open questions, success/promotion),
≤ ~2 pages. Not a full plan. See the [Ideas Folder (Two-Pagers) convention](../../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers).
Scan `plans/ideas/` first and fold into an existing brief rather than duplicating.

**Example**: `plans/ideas/rules-consolidation.md` — a brief pitching Skills-naming fixes, References
sections, and new Skills for agent coverage, with its open questions and promotion signal.

### 2. Planning (backlog/)

**Gate**: The root resolves only material design decisions that repository evidence cannot answer
before the specialist writes plan content. A specialist returns `## User Decisions Required` and
stops when such a branch is open. See [Decision Grilling](mandatory-grilling.md).

**Actions**:

- Provision the worktree FIRST (`claude --worktree <slug>`), then author every plan
  document inside it — the worktree precedes the plan, never follows it
- Create folder with the slug identifier (no date prefix)
- Write requirements and acceptance criteria
- Define technical approach
- Outline delivery phases

**Status**: Not Started

### 3. Execution (in-progress/)

**Actions**:

- Move from backlog/ to in-progress/
- Update status to "In Progress"
- Execute delivery plan sequentially
- Update checklist with progress

**Status**: In Progress

### 4. Completion (done/)

**Gate**: The root validates and stress-tests the finished plan through the mandatory post-write
grill before archiving. Reuse repository and plan evidence, avoid editorial-history questions, and
escalate any newly exposed material decision through the canonical envelope. See
[Decision Grilling](mandatory-grilling.md).

**Actions**:

- Validate all acceptance criteria met
- Update status to "Completed"
- Move from in-progress/ to done/
- Archive for future reference

**Status**: Completed

## Git Workflow in Plans

**`worktree-to-pr` (Default)**:

- Short-lived plan branch in a disposable worktree
- Draft PR against `main`; exact-current-head/base PR CI and applicable surface gates before merge
- Small, frequent commits; merge `[AI]` once the hardened preconditions hold

**Direct-push modes (`worktree-to-origin-main`, `main-to-origin-main`) — private-sibling infrastructure-as-code plans only**:

- Not available in `ose-public` (branch-protected `main`, including for admins) — see
  the Per-Repository Delivery Mode Restrictions HARD RULE in
  [delivery-mode.md](delivery-mode.md)
- Reachable only for a genuinely infrastructure-as-code plan in the private sibling
- For small, obviously-safe changes where a PR adds no review value, in that one repo
- Declare the mode explicitly in `## Delivery Mode` — never assume it
- No separate approval gate: declaring the mode IS the decision
