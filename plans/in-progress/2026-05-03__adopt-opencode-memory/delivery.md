# Delivery Checklist

## TDD-Shaped Implementation Steps

Implementation follows Red → Green → Refactor for each code item.

---

## Phase 1: Environment Setup

### Environment Setup

- [ ] Verify Node.js is available: `node --version` (v24.13.1 expected)
- [ ] Verify npm is available: `npm --version` (v11.10.1 expected)
- [ ] Verify OpenCode is installed: `opencode --version` or equivalent
- [ ] Verify existing RTK installation: `rtk --version` or `which rtk`
- [ ] Run `npm run doctor` to verify toolchain convergence
- [ ] Note any preexisting failures for fixing during execution

---

## Phase 2: caveman Installation

### Install caveman for OpenCode

- [ ] **Red**: Run the install command and verify it completes without error
- [ ] **Green**: Verify installation completes without error
- [ ] **Refactor**: Document installation path in tech-docs.md

### Verify /caveman Command Available

- [ ] **Red**: Start OpenCode session and type `/caveman`
- [ ] **Green**: Help text returns with available modes (lite/full/ultra/wenyan)
- [ ] **Refactor**: Note expected output format for future verification

### Run Baseline Token Measurement

- [ ] **Red**: Run a representative OpenCode session without caveman
- [ ] **Green**: Record approximate token usage from session metadata
- [ ] **Refactor**: Document baseline measurement for comparison

---

## Phase 3: Configure Compression

### Configure Default Compression Mode

- [ ] **Red**: Enable `/caveman full` in OpenCode session
- [ ] **Green**: Mode change is acknowledged and active
- [ ] **Refactor**: Document configuration in `.claude/` (auto-synced to `.opencode/`)

### Test Different Compression Modes

- [ ] **Red**: Test `/caveman lite`, `/caveman ultra` in session
- [ ] **Green**: Each mode activates and affects output verbosity
- [ ] **Refactor**: Update tech-docs.md with mode verification results

### Verify Code/URL/Path Byte-for-Byte Preservation

- [ ] **Red**: Send test message with code block, URL, and file path
- [ ] **Green**: All technical content preserved exactly (no truncation, no alteration)
- [ ] **Refactor**: Document preservation verification in tech-docs.md

---

## Phase 4: Measure Token Savings

### Measure Post-Adoption Token Savings

- [ ] **Red**: Run comparable OpenCode session with caveman enabled
- [ ] **Green**: Run `/caveman-stats` to see token reduction
- [ ] **Refactor**: Document savings percentage and compare to ~75% target

### Verify Token Savings ≥75%

- [ ] **Red**: Compare baseline vs post-adoption token counts
- [ ] **Green**: Token reduction is ≥75% (or documented justification if not)
- [ ] **Refactor**: Update brd.md success metrics with actual measurements

---

## Phase 5: Documentation Updates

> **Note**: Phase 5 is documentation-only with no code implementation. These steps use standard checklist format (not TDD) because documentation exists by nature of being written — there are no failing tests to drive documentation creation.

### Update AGENTS.md with Usage Documentation

- [ ] Draft AGENTS.md section for caveman usage
- [ ] Include: installation, commands, modes, verification
- [ ] Review for clarity and completeness

### Update CLAUDE.md with OpenCode-Specific Notes

- [ ] Draft CLAUDE.md section for OpenCode + caveman integration
- [ ] Include: RTK + caveman stacking, cross-agent context
- [ ] Review for accuracy and accessibility

### Verify Documentation Quality

- [ ] Run `npm run lint:md` on updated files
- [ ] Fix any markdown linting violations
- [ ] Verify all links are valid

---

## Phase 6: cavemem Evaluation (Deferred)

### Evaluate cavemem Readiness

- [ ] Assess cavemem v0.1.3 stability for production use
- [ ] If stable: install and test cross-agent memory
- [ ] If unstable: defer to separate plan and document rationale

### Test Cross-Agent Memory (If Deferred)

- [ ] **Red**: Store observation in Claude Code, search from OpenCode
- [ ] **Green**: Observation returned from shared store
- [ ] **Refactor**: Document findings and recommendation

---

## Local Quality Gates

Before any commit, run the following and fix ALL failures (including preexisting issues):

```bash
# Markdown linting
npm run lint:md

# Markdown formatting check
npm run format:md:check

# TypeScript type check (if any TS files modified)
npx nx affected -t typecheck

# Lint (if any project files modified)
npx nx affected -t lint
```

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes. This follows the root cause orientation principle — proactively fix preexisting errors encountered during work. Do not defer or skip existing issues. Commit preexisting fixes separately with appropriate conventional commit messages.

### Post-Push CI/CD Verification

- [ ] Push changes to `main`
- [ ] Monitor GitHub Actions for AGENTS.md and CLAUDE.md validation workflows
- [ ] Verify all CI checks pass (markdown linting, link validation)
- [ ] If any CI check fails, fix immediately before proceeding
- [ ] Do NOT proceed to next phase until CI is green

### Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Split different domains/concerns into separate commits
- [ ] Preexisting fixes get their own commits, separate from plan work
- [ ] Do NOT bundle unrelated changes into a single commit

Suggested commit structure:

1. `feat(opencode): install and configure caveman for token compression`
2. `docs(agents): add caveman usage documentation to AGENTS.md`
3. `docs(claude): add OpenCode-specific notes to CLAUDE.md`
4. `chore(plans): add adopt-opencode-memory plan`

---

## Manual Behavioral Verification

### OpenCode End-to-End Session Verification

- [ ] Start an OpenCode session: `opencode` (or equivalent)
- [ ] Verify `/caveman` command returns help text with modes listed
- [ ] Verify `/caveman full` activates compression mode
- [ ] Verify `/caveman-stats` shows token savings
- [ ] Test `/caveman lite` and `/caveman ultra` mode switching
- [ ] Test `/caveman-commit` with staged git changes
- [ ] Document actual output of each command for record

---

## Plan Archival

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Verify ALL manual assertions pass
- [ ] Move plan folder from `plans/in-progress/` to `plans/done/` via `git mv`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
- [ ] Commit the archival: `chore(plans): move adopt-opencode-memory to done`
