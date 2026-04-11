---
name: plan-creating-project-plans
description: Comprehensive project planning standards for plans/ directory including folder structure (ideas.md, backlog/, in-progress/, done/), naming convention (YYYY-MM-DD__identifier/), file organization (README.md for small plans, multi-file for large), and Gherkin acceptance criteria. Essential for creating structured, executable project plans.
---

# Creating Project Plans

## Purpose

This Skill provides comprehensive guidance for creating **structured project plans** in the plans/ directory. Plans follow standardized organization, naming conventions, and acceptance criteria patterns for executable, traceable project work.

**When to use this Skill:**

- Creating new project plans
- Organizing backlog items
- Converting ideas to structured plans
- Writing Gherkin acceptance criteria
- Structuring multi-phase projects
- Moving plans through workflow stages

## Plans Folder Structure

```
plans/
├── ideas.md                              # 1-3 line ideas (brainstorming)
├── backlog/                              # Future work
│   └── YYYY-MM-DD__project-name/        # Planned but not started
├── in-progress/                          # Active work
│   └── YYYY-MM-DD__project-name/        # Currently executing
└── done/                                 # Completed work
    └── YYYY-MM-DD__project-name/        # Archived completed plans
```

## Plan Naming Convention

**Format**: `YYYY-MM-DD__project-identifier/`

**Examples**:

- `2025-11-25__user-auth/`
- `2026-01-02__rules-consolidation/`
- `2025-12-10__api-refactor/`

**Rules**:

- Date: Plan creation date (YYYY-MM-DD)
- Separator: Double underscore (`__`)
- Identifier: Lowercase, hyphen-separated, descriptive
- Trailing slash indicates directory

## Single-File vs Multi-File Plans

### Single-File Structure (≤1000 lines)

**For small to medium plans:**

```
plans/in-progress/2025-11-25__simple-feature/
└── README.md                 # All content in one file
```

**README.md contains**:

- Overview (status, goals, git workflow)
- Requirements (objectives, user stories, acceptance criteria)
- Technical Documentation (architecture, design decisions)
- Delivery Plan (implementation steps, validation, completion status)

### Multi-File Structure (>1000 lines)

**For large, complex plans:**

```
plans/in-progress/2025-11-25__complex-feature/
├── README.md                 # Overview only
├── requirements.md           # Goals, user stories, acceptance criteria
├── tech-docs.md              # Architecture, design decisions
└── delivery.md               # Implementation phases, validation
```

**Benefits**: Better organization, easier navigation, reduced file size.

## Gherkin Acceptance Criteria

**All plans must have Gherkin-format acceptance criteria:**

```gherkin
Given [precondition]
When [action]
Then [expected outcome]
And [additional outcome]
```

**Example**:

```gherkin
Given the user is logged out
When they submit valid credentials
Then they are redirected to the dashboard
And their session is created with correct permissions
```

**Best Practices**:

- Use concrete, testable conditions
- Focus on behavior, not implementation
- One scenario per user story
- Make scenarios independent
- Use consistent language

## Git Workflow in Plans

**Trunk Based Development (Default)**:

- Work on `main` branch directly
- Small, frequent commits
- No feature branches (99% of plans)

**Branch-Based (Exceptional)**:

- Only for experiments, compliance, external contributions
- Must justify in Git Workflow section
- Requires explicit user approval

## Plan Lifecycle

### 1. Ideation (ideas.md)

**Format**: One-liner to 3-line description

**Example**:

```markdown
- **Rules Consolidation**: Fix Skills naming to gerund form, add References sections, create 7 new Skills for complete agent coverage
```

### 2. Planning (backlog/)

**Actions**:

- Create folder with date\_\_identifier
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

**Actions**:

- Validate all acceptance criteria met
- Update status to "Completed"
- Move from in-progress/ to done/
- Archive for future reference

**Status**: Completed

## Delivery Plan Structure

### Implementation Steps

Use checkbox format:

```markdown
- [ ] Step 1: Description
  - [ ] Substep 1.1
  - [ ] Substep 1.2
- [ ] Step 2: Description
```

**Update after completion**:

```markdown
- [x] Step 1: Description
  - [x] Substep 1.1
  - [x] Substep 1.2
  - **Implementation Notes**: What was done, decisions made
  - **Date**: 2026-01-02
  - **Status**: Completed
  - **Files Changed**: List of modified files
```

### Validation Checklist

After implementation steps, add validation:

```markdown
### Validation Checklist

- [ ] All tests pass
- [ ] Code meets quality standards
- [ ] Documentation updated
- [ ] Acceptance criteria verified
```

## Operational Readiness (Mandatory Delivery Sections)

Every delivery plan MUST include these operational readiness sections. Plans missing them are considered incomplete regardless of other quality.

### Local Quality Gates (Before Push)

Every plan must include steps for running affected quality checks locally before pushing:

```markdown
### Local Quality Gates (Before Push)

- [ ] Run affected typecheck: `nx affected -t typecheck`
- [ ] Run affected linting: `nx affected -t lint`
- [ ] Run affected quick tests: `nx affected -t test:quick`
- [ ] Run affected spec coverage: `nx affected -t spec-coverage`
- [ ] Fix ALL failures found — including preexisting issues not caused by your changes
- [ ] Verify all checks pass before pushing
```

Adapt targets to the plan's affected projects (add `test:integration`, `test:e2e` if applicable).

### Post-Push CI/CD Verification

Every plan must include steps to verify CI after pushing:

```markdown
### Post-Push Verification

- [ ] Push changes to `main`
- [ ] Monitor GitHub Actions workflows for the push
- [ ] Verify all CI checks pass
- [ ] If any CI check fails, fix immediately and push a follow-up commit
- [ ] Do NOT proceed to next delivery phase until CI is green
```

### Development Environment Setup

Every plan must start with environment setup steps:

```markdown
### Environment Setup

- [ ] Install dependencies in the root worktree: `npm install`
- [ ] Converge the full polyglot toolchain in the root worktree: `npm run doctor -- --fix` (required — the `postinstall` hook runs `doctor || true` and silently tolerates drift; see [Worktree Toolchain Initialization](../../../governance/development/workflow/worktree-setup.md))
- [ ] [Add project-specific setup: env vars, DB, Docker, etc.]
- [ ] Verify dev server starts: `nx dev [project-name]`
- [ ] Verify existing tests pass before making changes
```

### Fix-All-Issues Instruction

Every plan must include this instruction in quality gate sections:

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

### Thematic Commit Guidance

Every plan must include commit guidance:

```markdown
### Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Split different domains/concerns into separate commits
- [ ] Do NOT bundle unrelated fixes into a single commit
```

## Manual Behavioral Assertions (Conditional — UI/API Plans)

When the plan touches web UI or API code, delivery plans MUST include manual assertion sections.

### For Web UI Plans — Playwright MCP

```markdown
### Manual UI Verification (Playwright MCP)

- [ ] Start dev server: `nx dev [project-name]`
- [ ] Navigate to affected pages via `browser_navigate`
- [ ] Inspect DOM via `browser_snapshot` — verify correct rendering
- [ ] Test interactive flows via `browser_click` / `browser_fill_form`
- [ ] Check for JS errors via `browser_console_messages` — must be zero errors
- [ ] Verify API integration via `browser_network_requests`
- [ ] Take screenshots via `browser_take_screenshot` for visual verification
```

### For API Plans — curl

```markdown
### Manual API Verification (curl)

- [ ] Start backend server: `nx dev [project-name]`
- [ ] Verify health endpoint: `curl -s http://localhost:[port]/api/health | jq .`
- [ ] Verify affected endpoints return expected responses
- [ ] Test error cases with invalid payloads
```

### For Full-Stack Plans — Both + End-to-End

Include both sections above plus an end-to-end flow verification step.

**Not applicable** for plans touching only documentation, governance, or non-code files.

## Plan Archival (Mandatory Final Section)

Every delivery plan MUST end with a plan archival section:

```markdown
### Plan Archival

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder from `plans/in-progress/` to `plans/done/` via `git mv`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
- [ ] Update any other READMEs that reference this plan
- [ ] Commit: `chore(plans): move [plan-name] to done`
```

## Common Mistakes

### ❌ Mistake 1: Missing acceptance criteria

**Wrong**: Plan without Gherkin scenarios
**Right**: Every plan has concrete acceptance criteria

### ❌ Mistake 2: Vague requirements

**Wrong**: "Improve system performance"
**Right**: "Reduce API response time to <200ms for 95th percentile"

### ❌ Mistake 3: No progress tracking

**Wrong**: Never updating delivery checklist
**Right**: Mark items complete with implementation notes

### ❌ Mistake 4: Wrong folder placement

**Wrong**: Active work in backlog/
**Right**: Move to in-progress/ when starting work

## References

**Primary Convention**: [Plans Organization Convention](../../../governance/conventions/structure/plans.md)

**Related Conventions**:

- [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md) - Git workflow (main = direct push; worktree = feature branch + draft PR targeting `main`, flipped to ready when complete)
- [PR Merge Protocol](../../../governance/development/workflow/pr-merge-protocol.md) - Explicit approval required, all quality gates must pass
- [Feature Change Completeness](../../../governance/development/quality/feature-change-completeness.md) - Specs, contracts, and tests must update with every feature change
- [Manual Behavioral Verification](../../../governance/development/quality/manual-behavioral-verification.md) - Playwright MCP for UI, curl for API
- [CI Blocker Resolution](../../../governance/development/quality/ci-blocker-resolution.md) - Preexisting CI failures must be fixed, never bypassed
- [Acceptance Criteria Convention](../../../governance/development/infra/acceptance-criteria.md) - Gherkin format details
- [File Naming Convention](../../../governance/conventions/structure/file-naming.md) - Naming standards

**Related Skills**:

- `plan-writing-gherkin-criteria` - Detailed Gherkin guidance
- `repo-practicing-trunk-based-development` - Git workflow
- `docs-applying-content-quality` - Universal content standards

---

This Skill packages project planning standards for creating structured, executable plans with clear acceptance criteria. For comprehensive details, consult the primary convention document.
