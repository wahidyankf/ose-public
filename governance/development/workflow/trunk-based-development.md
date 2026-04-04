---
title: "Trunk Based Development Convention"
description: Git workflow using Trunk Based Development (TBD) for continuous integration and rapid delivery
category: explanation
subcategory: development
tags:
  - trunk-based-development
  - git
  - workflow
  - development
  - continuous-integration
created: 2025-11-26
updated: 2026-04-04
---

# Trunk Based Development Convention

<!--
  MAINTENANCE NOTE: Master reference for TBD workflow
  This is duplicated (intentionally) in multiple files for different audiences:
  1. governance/development/workflow/trunk-based-development.md (this file - comprehensive reference)
  2. AGENTS.md (summary for AI agents)
  3. .opencode/agent/plan-maker.md (context for plan creation)
  4. .opencode/agent/plan-executor.md (context for plan execution)
  When updating, synchronize all four locations.
-->

This document defines the **Trunk Based Development (TBD)** workflow used in the open-sharia-enterprise project. TBD is a branching strategy where developers commit directly to a single branch (the trunk), enabling continuous integration, rapid feedback, and simplified collaboration.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Single branch (`main`) instead of complex GitFlow with multiple long-lived branches (develop, release, hotfix). Small, frequent commits instead of large, delayed integrations. Flat workflow reduces merge conflicts and coordination overhead.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Every commit to `main` triggers automated CI testing. Integration issues caught immediately by machines, not discovered weeks later through manual testing. Continuous automated validation replaces manual integration phases.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Commit Message Convention](./commit-messages.md)**: TBD workflow requires small, frequent commits with clear conventional commit messages to maintain navigable history.

- **[Code Quality Convention](../quality/code.md)**: Pre-push hooks run affected tests before pushing to main, enforcing quality gates in the TBD workflow.

## What is Trunk Based Development?

**Trunk Based Development** is a source control branching model where developers work primarily on a single branch called the "trunk" (in Git, this is typically the `main` branch). Unlike feature-branch workflows, TBD minimizes long-lived branches and emphasizes frequent integration.

### Core Characteristics

1. **Single source of truth**: All work converges on one branch (`main`)
2. **Short-lived branches** (if any): Branches exist for < 1-2 days maximum
3. **Frequent commits**: Multiple commits per day to `main`
4. **Feature flags**: Hide incomplete work using toggles, not branches
5. **Continuous integration**: Every commit triggers automated testing
6. **Small changes**: Break work into tiny, mergeable increments

### Why We Use TBD

TBD addresses common problems with long-lived feature branches:

| Problem with Feature Branches           | TBD Solution                                      |
| --------------------------------------- | ------------------------------------------------- |
| FAIL: Merge conflicts after weeks       | PASS: Daily integration prevents large conflicts  |
| FAIL: Stale branches diverge from trunk | PASS: Always working on current codebase          |
| FAIL: Integration testing delayed       | PASS: Continuous integration catches issues early |
| FAIL: Code review bottlenecks           | PASS: Small, frequent reviews are faster          |
| FAIL: "Integration hell" before release | PASS: Code is always in releasable state          |
| FAIL: Hard to coordinate teams          | PASS: Everyone sees changes immediately           |
| FAIL: Feature branches hide WIP         | PASS: Feature flags make incompleteness explicit  |
| FAIL: Delayed feedback from CI          | PASS: Immediate CI feedback on every commit       |

**Reference**: [TrunkBasedDevelopment.com](https://trunkbaseddevelopment.com/)

## Our TBD Implementation

### Default Branch: `main`

- **The trunk is `main`**: All development happens on `main` branch
- **No `develop` branch**: We don't use GitFlow or similar multi-branch strategies
- **No release branches**: Releases are tagged commits on `main`
- **No hotfix branches**: Hotfixes commit directly to `main` (or very short-lived branches)

### Working on `main` Directly

**Default workflow**: Commit directly to `main` when:

PASS: **You should commit directly to `main` when**:

- Change is small and well-tested
- You're confident tests will pass
- Change won't break others' work
- Feature flags hide incomplete functionality
- You can commit and push multiple times per day

**Example workflow**:

```bash
# Work on main branch
git checkout main
git pull origin main

# Make small change
# ... edit files ...

# Test locally
npm test

# Commit directly to main
git add .
git commit -m "feat(auth): add email validation helper"
git push origin main

# CI runs automatically
# Change is now visible to entire team
```

### Short-Lived Branches (Rare)

**Only use branches when**:

**Exceptional cases where branches are appropriate**:

- **Code review required**: Your team requires PR reviews (use branch for < 2 days)
- **Experimental work**: Testing a risky approach that may be discarded
- **External contribution**: Outside contributor submitting a PR
- **Regulatory requirement**: Compliance mandates review before merge
- **Pair/mob programming**: Collaborating on a branch before merging

**Branch workflow (when needed)**:

```bash
# Create short-lived branch
git checkout -b feature/user-login
git push -u origin feature/user-login

# Make changes
# ... edit files ...
git commit -m "feat(auth): implement login endpoint"

# Push frequently
git push origin feature/user-login

# Create PR immediately
# Get review within hours (not days)

# Merge within 1-2 days MAX
git checkout main
git merge feature/user-login
git push origin main

# Delete branch immediately
git branch -d feature/user-login
git push origin --delete feature/user-login
```

**Branch lifespan rules**:

- PASS: **< 1 day**: Ideal - merge same day you created it
- **1-2 days**: Acceptable maximum
- FAIL: **> 2 days**: Too long - branch is stale, rebase or abandon

### Feature Flags for Incomplete Work

**Instead of hiding incomplete features in branches, use feature flags (toggles) to hide them in production.**

**Why feature flags?**

- Code is integrated immediately (prevents merge conflicts)
- Incomplete features don't affect production users
- Can toggle features on/off without deployments
- Enables testing in production environments
- Allows gradual rollouts and A/B testing

**Feature flag patterns**:

#### Simple Boolean Flag

```javascript
// config/features.js
const FEATURES = {
  NEW_DASHBOARD: process.env.ENABLE_NEW_DASHBOARD === "true",
  ADVANCED_SEARCH: process.env.ENABLE_ADVANCED_SEARCH === "true",
};

// In code
if (FEATURES.NEW_DASHBOARD) {
  // Show new dashboard (incomplete, under development)
  return renderNewDashboard();
} else {
  // Show old dashboard (production-ready)
  return renderOldDashboard();
}
```

#### Environment-Based Flags

```javascript
// Only enable in development/staging
const FEATURE_ENABLED = ["development", "staging"].includes(process.env.NODE_ENV);

if (FEATURE_ENABLED) {
  // New feature code (not ready for production)
}
```

#### User-Based Flags

```javascript
// Enable for specific users (beta testers)
const betaUsers = ["user1@example.com", "user2@example.com"];

if (betaUsers.includes(currentUser.email)) {
  // Show beta feature
}
```

**Feature flag lifecycle**:

1. **Add flag**: Create flag for new feature
2. **Develop with flag OFF in prod**: Commit to `main`, flag hides feature in production
3. **Test with flag ON in staging**: Verify feature works in non-production
4. **Enable in production**: Flip flag when feature is complete
5. **Remove flag**: After feature is stable, remove flag and old code path

**Important**: Feature flags are temporary. Once a feature is stable, remove the flag and delete the old code path. Don't accumulate flags indefinitely.

### Continuous Integration

**Every commit to `main` triggers CI/CD**:

1. **Automated tests** run on every push
2. **Build verification** ensures code compiles
3. **Linting and formatting** checks pass
4. **Deployment to staging** (optional, project-specific)

**CI failure is a high priority**:

- FAIL: **Never commit code that breaks CI**
- **If CI fails**, fix immediately (highest priority)
- **Broken `main` blocks everyone** - fix or revert

**Pre-push checklist**:

- [ ] All tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Feature flags hide incomplete work
- [ ] Commit message follows [Conventional Commits](./commit-messages.md)

### Small, Incremental Changes

**TBD requires breaking work into small chunks**:

PASS: **Good incremental changes**:

- Add a utility function (commit 1)
- Add tests for the function (commit 2)
- Use function in one component (commit 3)
- Extend function for new use case (commit 4)

FAIL: **Bad large changes**:

- Rewrite entire authentication system in one commit
- Implement 5 features together in one PR
- Refactor + add features in same commit

**Benefits of small changes**:

- **Faster reviews**: Reviewing 50 lines vs 5000 lines
- **Easier to revert**: If something breaks, revert is surgical
- **Clearer history**: Each commit has single, clear purpose
- **Reduced conflicts**: Less time diverged = fewer conflicts
- **Earlier feedback**: Team sees your work immediately

**How to break down work**:

1. **Identify smallest deliverable**: What's the tiniest useful piece?
2. **Commit that piece**: Push to `main`
3. **Repeat**: Build on top of previous work
4. **Use feature flags**: Hide incomplete full features

**Example - "Add user login" broken down**:

```
Commit 1: feat(auth): add User model with email field
Commit 2: feat(auth): add password hashing utility
Commit 3: feat(auth): add login endpoint (feature flag OFF)
Commit 4: feat(auth): add login UI component (feature flag OFF)
Commit 5: feat(auth): connect UI to endpoint (feature flag OFF)
Commit 6: test(auth): add integration tests for login
Commit 7: feat(auth): enable login feature flag in staging
Commit 8: feat(auth): enable login feature flag in production
Commit 9: refactor(auth): remove old login code and feature flag
```

Each commit is small, tested, and doesn't break `main`.

## Main Branch vs Worktree Mode

This section clarifies the two distinct execution modes in this repository and their corresponding git workflows. This distinction is critical for AI agents: the execution mode determines the git workflow.

### Main Branch (Default Mode)

**When working directly on main** -- which is the default for all development in this repository -- the git workflow is:

- **Commit directly to `main`**. No branch. No PR.
- **Push directly to `main`**. No merge request.
- **No review step** (unless explicitly requested by the user).
- Quality gates run via the pre-push hook (typecheck, lint, test:quick, spec-coverage).

This is the standard TBD workflow described throughout this document. It applies to all routine development: features, bug fixes, refactors, documentation, and governance changes.

```bash
# Default workflow -- direct to main
git checkout main
git pull origin main
# ... make changes ...
git add .
git commit -m "feat(auth): add email validation"
git push origin main
```

### Worktree Mode (Branch + PR)

**When using git worktrees** -- specifically when an AI agent uses `isolation: "worktree"` in the Agent tool, or when a developer creates a worktree for isolated work -- the **opposite** workflow applies:

- **Create a new branch** for the work.
- **Use the PR mechanism** for pushing code to the repository.
- **Get approval before merge** -- merging requires explicit user approval (see [PR Merge Protocol](./pr-merge-protocol.md)).
- **Delete the branch** after merge.

Worktree mode exists for situations that benefit from isolation: experimental work, parallel tasks, or changes that need review before integration.

```bash
# Worktree mode -- branch + PR
git worktree add .claude/worktrees/feature-auth feature/auth
cd .claude/worktrees/feature-auth
# ... make changes ...
git add .
git commit -m "feat(auth): add email validation"
git push origin feature/auth
# Create PR, get approval, merge via PR Merge Protocol
```

### Decision Table

| Situation                             | Mode          | Git Workflow                             |
| ------------------------------------- | ------------- | ---------------------------------------- |
| Routine development on main           | Main branch   | Commit and push directly to main         |
| AI agent with default isolation       | Main branch   | Commit and push directly to main         |
| AI agent with `isolation: "worktree"` | Worktree mode | Branch + PR + approval before merge      |
| Developer using `git worktree add`    | Worktree mode | Branch + PR + approval before merge      |
| Experimental/spike work               | Either        | Developer's choice; worktree recommended |
| External contribution                 | Worktree mode | Fork + PR                                |

### Key Principle

The execution mode determines the git workflow:

- **Main branch mode** = direct commit/push to main, no PR
- **Worktree mode** = branch, PR, approval before merge

AI agents must check which mode they are operating in and follow the corresponding workflow. Mixing modes -- creating a branch while on main, or pushing directly to main from a worktree -- is incorrect.

## When Branches Are Appropriate

While TBD emphasizes working on `main`, there are legitimate cases for short-lived branches:

### Code Review Requirement

If your team/organization mandates peer review via Pull Requests:

- PASS: **Create branch** for PR workflow
- PASS: **Get review within 24 hours** (not days)
- PASS: **Merge immediately** after approval
- PASS: **Delete branch** right after merge

**Minimize branch lifespan**: The goal is still rapid integration.

### Experimental/Spike Work

When exploring a new approach with high uncertainty:

- PASS: **Create branch** for experimentation
- PASS: **Set time limit** (e.g., "1 day to spike this approach")
- PASS: **Decision point**: Keep and merge, or discard entirely
- PASS: **Don't let spikes become features**: Decide quickly

### External Contributors

When accepting contributions from outside the team:

- PASS: **Fork + PR workflow** is standard
- PASS: **Review and merge quickly** to reduce staleness
- PASS: **Guide contributor** to make small, focused PRs

### Regulatory/Compliance

If industry regulations require documented review:

- PASS: **Use branches + PRs** for audit trail
- PASS: **Still minimize branch lifespan** (review quickly)
- PASS: **Automate compliance checks** in CI

### Environment/Deployment Branches

**Long-lived environment branches are explicitly allowed in TBD.** These are NOT feature branches.

Environment branches serve deployment purposes, not feature isolation:

- PASS: **Production branches**: Trigger deployment to production environment
- PASS: **Staging branches**: Trigger deployment to staging environment
- PASS: **Environment-specific configuration**: Different settings per environment

**Key distinction**: Environment branches reflect deployment state, not development work.

**Example in this repository: `prod-ayokoding-web`**

The `apps/ayokoding-web/` project uses a production deployment branch:

- **Branch**: `prod-ayokoding-web`
- **Purpose**: Triggers automatic deployment to ayokoding.com via Vercel
- **Location**: Deploys `apps/ayokoding-web/` (Next.js 16 application)
- **Workflow** (automated):
  1. All development happens in `main`
  2. The `test-and-deploy-ayokoding-web.yml` GitHub Actions workflow runs at 6 AM and 6 PM WIB, detects changes in `apps/ayokoding-web/`, builds, then force-pushes `main` to `prod-ayokoding-web`
  3. Push to `prod-ayokoding-web` triggers production deployment via Vercel
- **Important**: Never commit directly to `prod-ayokoding-web` outside the CI automation

**Why this is TBD-compliant**:

- Development still happens on `main` (trunk)
- No feature isolation in branches
- `prod-ayokoding-web` is a deployment trigger, not a development workspace
- Changes flow from `main` to `prod-ayokoding-web`, never the reverse
- Consistent with TBD principles: environment branches are for release management, not feature development

**Reference**: [TrunkBasedDevelopment.com - Branch for Release](https://trunkbaseddevelopment.com/branch-for-release/) explicitly describes release branches as acceptable in TBD.

## What NOT to Do

| FAIL: Anti-Pattern                   | PASS: TBD Approach                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| Long-lived feature branches          | Commit to `main` with feature flags                                                         |
| Branches per developer               | All developers commit to `main`                                                             |
| Delaying integration for weeks       | Integrate multiple times per day                                                            |
| Large, infrequent commits            | Small, frequent commits (see [Commit Granularity](./commit-messages.md#commit-granularity)) |
| Keeping branches "just in case"      | Delete branches immediately after merge                                                     |
| Using branches to hide WIP           | Use feature flags to hide WIP                                                               |
| Merging without CI passing           | CI must be green before merge                                                               |
| Creating branches for every task     | Only branch when truly necessary (rare)                                                     |
| Waiting for "perfect" code to commit | Commit working code, iterate in subsequent commits                                          |
| Feature branches lasting weeks       | Branches (if used) last < 2 days                                                            |

## TBD and Project Planning

### Plans Should Assume `main` Branch

When creating project plans in `plans/` folder:

- PASS: **Default assumption**: Implementation happens on `main`
- PASS: **Don't specify branch**: Unless there's an explicit reason
- **If branch needed**: Document why in plan (e.g., "requires isolated testing")

**Example plan delivery.md**:

```markdown
## Overview

**Git Workflow**: Commit to `main`

All implementation happens directly on the `main` branch using feature flags to hide incomplete work.

**Feature flags**:

- `ENABLE_NEW_PAYMENT_FLOW` - Hides new payment integration until ready

**Phases**:

1. Phase 1: Add payment models (commit to `main`)
2. Phase 2: Add payment API (commit to `main`, flag OFF)
3. Phase 3: Add payment UI (commit to `main`, flag OFF)
4. Phase 4: Integration testing (flag ON in staging)
5. Phase 5: Production rollout (flag ON in production)
```

### When Plans Specify Branches

Only specify a branch in a plan if:

- **Experimental/risky**: Testing unproven technology
- **External integration**: Working with third-party that requires branches
- **Compliance**: Regulatory requirement for review process

**Example plan with branch**:

```markdown
## Overview

**Git Workflow**: Branch (`experiment/blockchain-integration`)

**Justification**: This plan explores blockchain integration, which is highly experimental and may be abandoned. A separate branch allows isolated testing without affecting `main` until viability is proven.

**Decision Point**: After 2 days, decide to merge or discard based on performance results.
```

## TBD Benefits for This Project

### For Solo/Small Team Development

Even with a small team, TBD provides benefits:

- PASS: **Simplified workflow**: No mental overhead of managing multiple branches
- PASS: **No merge conflicts**: Less time diverged = fewer conflicts
- PASS: **Faster feedback**: CI runs on every commit
- PASS: **Clear history**: Linear commit history is easy to understand
- PASS: **No stale code**: Everything is current

### For Scaling the Team

As the team grows, TBD prevents common scaling problems:

- PASS: **Coordination**: Everyone works on same codebase, sees changes immediately
- PASS: **Onboarding**: Simpler workflow for new contributors
- PASS: **Accountability**: Commits are visible, encouraging quality
- PASS: **Release readiness**: `main` is always releasable

### For Continuous Deployment

TBD enables automated deployment:

- PASS: **Deployment from `main`**: Every commit can deploy to staging
- PASS: **Feature flags**: Control production rollouts without branches
- PASS: **Rapid fixes**: Hotfixes commit to `main` and deploy immediately
- PASS: **Rollback**: Revert commit or toggle flag off

## Migration from Feature Branches

If you're used to feature-branch workflows (GitFlow, GitHub Flow), here's how to transition:

### Mindset Shifts

| Feature Branch Mindset              | TBD Mindset                                             |
| ----------------------------------- | ------------------------------------------------------- |
| "I'll merge when feature is done"   | "I'll commit daily, hide with feature flag until done"  |
| "My branch is my workspace"         | "`main` is everyone's workspace"                        |
| "Integration happens at merge time" | "Integration happens continuously"                      |
| "Branches isolate risk"             | "Feature flags and tests manage risk"                   |
| "Review before merge"               | "Review can happen post-commit (or via short-lived PR)" |

### Transition Steps

1. **Start small**: Pick a simple task, commit directly to `main`
2. **Use feature flags**: Hide incomplete work, not branches
3. **Commit frequently**: Push to `main` multiple times per day
4. **Keep CI green**: Fix failures immediately
5. **Review old habits**: Notice when you create unnecessary branches

### Common Concerns Addressed

**"What if I break `main`?"**

- PASS: Tests and CI catch most issues before push
- PASS: Rapid revert if something slips through
- PASS: Feature flags hide incomplete features

**"What if I need to work on multiple things?"**

- PASS: Finish one thing before starting another
- PASS: Use feature flags to work incrementally
- PASS: Commit small pieces, don't wait for "done"

**"What about code review?"**

- PASS: Review can happen post-commit (async)
- PASS: Or use very short-lived PR branches (< 1 day)
- PASS: Pair/mob programming provides real-time review

**"What if I'm not confident in my code?"**

- PASS: Write tests first (TDD)
- PASS: Use feature flags to isolate risk
- PASS: Commit small changes, easier to verify

## Related Practices

TBD works best when combined with:

- **Continuous Integration**: [See CI/CD section in this doc]
- **Feature Flags/Toggles**: [See Feature Flags section in this doc]
- **Automated Testing**: High test coverage enables confident commits
- **Small Commits**: [Conventional Commits](./commit-messages.md)
- **Pair/Mob Programming**: Real-time collaboration and review
- **PR Merge Protocol**: [PR Merge Protocol](./pr-merge-protocol.md) - Required approval workflow for worktree-mode PRs
- **Worktree Setup**: [Worktree Setup](./worktree-setup.md) - npm install requirement after worktree creation

## References and Further Reading

- **[TrunkBasedDevelopment.com](https://trunkbaseddevelopment.com/)** - Official TBD resource with detailed guides
- **Conventional Commits**: [Commit Message Convention](./commit-messages.md)
- **Development Practices**: [Development Index](../README.md)

---

**Last Updated**: 2026-04-04
