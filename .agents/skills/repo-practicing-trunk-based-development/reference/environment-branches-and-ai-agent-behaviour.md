# Trunk-Based Development — Environment Branches and AI Agent Behaviour

## Environment Branches

### What are Environment Branches?

This repository has **environment-specific branches** for deployment:

- `prod-ayokoding-www` - Production deployment for ayokoding.com
- `prod-ose-www` - Production deployment for oseplatform.com

### Critical Rules

**❌ NEVER commit directly to environment branches**

- Environment branches are **deployment targets**, not development branches
- Changes flow: `main` → CI/CD → environment branch (automated)
- Manual commits to environment branches break deployment pipeline

**✅ Only CI/CD writes to environment branches**

- Deployment automation merges from `main`
- Environment-specific configs applied during deployment
- Tags created on environment branches to track releases

**Workflow**:

```
Developer commits to main → CI/CD tests → CI/CD deploys to environment branch
```

### Environment Branch Naming

**Pattern**: `prod-[app-name]`

**Examples**:

- `prod-ayokoding-www`
- `prod-ose-www`

**Rationale**: Clear, explicit, unambiguous naming prevents accidental commits.

## AI Agent Default Behaviour

### Delivery Mode in Plans

**Default assumption**: every plan uses `worktree-to-pr` unless it declares another mode.

**Plan field** (in `delivery.md`, alongside `## Worktree`):

```yaml
delivery-mode: worktree-to-pr # worktree-to-origin-main | main-to-origin-main | main-to-pr
```

**If omitted**: agents resolve by three-tier precedence — invocation argument > plan field >
default `worktree-to-pr`. Never silently coerce an invalid non-empty value; ask instead.

**If a direct-push mode is selected**: `worktree-to-origin-main` remains unavailable.
`main-to-origin-main` is selectable only for a private-sibling plan in exactly two categories:
stateful IaC needing the primary checkout's real secrets/local state, or CI-IaC changing the
repository's own pipeline, runner, or toolchain provisioning where PR self-validation is circular.
State the eligible category and why direct delivery is necessary (see
[When a Direct-Push Mode Is Appropriate](./delivery-modes-direct-push.md#when-a-direct-push-mode-is-appropriate)):

```yaml
delivery-mode: main-to-origin-main
rationale: "<private-sibling> infrastructure-as-code plan updating a single Terraform resource tag;
  needs the primary checkout's local secrets/state access; trivial and well-understood; full gate
  passes locally. Not executable in ose-public (branch-protected main)."
```

### Agent Behaviour Rules

**When creating plans**:

- `plan-maker` defaults to `worktree-to-pr` and emits the worktree, PR, exact-head CI, applicable
  surface-gate, and merge steps; semantic review appears only on explicit user request
- Tags every git-mechanical step `[AI]` — worktree create/remove and the push
- Tags the merge `[AI]` by default; emits a `[HUMAN]` merge step only where the plan opts into that gate

**When executing work**:

- The executor provisions the worktree and works on the plan branch, not on `main`
- Pushes to the PR branch as `[AI]`; opening a draft PR is expected, not exceptional
- Merges once the five hardened preconditions hold, unless the plan declared a `[HUMAN]` gate

**When validating plans**:

- Checkers validate steps against the plan's **declared** Delivery Mode, not against a fixed default
- A PR step under a `*-to-pr` mode is correct; a PR step under a direct-push mode is a finding
- A `[HUMAN]`-tagged merge step is valid where the plan opts in — never "corrected" to `[AI]`
