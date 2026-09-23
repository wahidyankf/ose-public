# Operational Readiness (Mandatory Delivery Sections)

Every delivery plan MUST include these sections; otherwise it is incomplete.

## Local Quality Gates (Before Push)

Every plan must include steps for running affected quality checks locally before pushing:

```markdown
### Local Quality Gates (Before Push)

- [ ] Run affected typecheck: `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t typecheck`
- [ ] Run affected linting: `rtk npm run affected:lint`
- [ ] Run affected quick tests: `rtk npm run affected:test`
- [ ] Run affected spec coverage: `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- affected -t test:coverage:behaviour`
- [ ] Fix ALL failures found — including preexisting issues not caused by your changes
- [ ] Verify all checks pass before pushing
```

Adapt targets to the plan's affected projects (add `test:integration`, `test:e2e` if applicable).

## Post-Push CI/CD Verification

Every plan must include steps to verify CI after pushing:

```markdown
### Post-Push Verification

- [ ] Push changes to the delivery target for the declared Delivery Mode (the PR branch under `worktree-to-pr` / `main-to-pr`; `origin main` under the direct-push modes)
- [ ] Monitor GitHub Actions workflows for that push — the PR's check run under `*-to-pr`
- [ ] Verify all CI checks pass
- [ ] If any CI check fails, fix immediately and push a follow-up commit
- [ ] Do NOT proceed to next delivery phase until CI is green
```

## Development Environment Setup

Every plan must start with environment setup steps:

```markdown
### Environment Setup

- [ ] Enter the resolved work location: for a worktree mode, provision/enter
      `worktrees/<plan-identifier>/`; for a main mode, use the synced primary checkout
- [ ] At that repository root, install dependencies and hooks, then validate tooling:
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install`, then
      `rtk npm run doctor`; only if it reports drift, run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply`
      and `rtk npm run doctor` again (see [Worktree Toolchain Initialization](../../../../repo-governance/development/workflow/worktree-setup.md))
- [ ] [Add project-specific setup: env vars, DB, Docker, etc.]
- [ ] Verify dev server starts: `rtk ./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev [project-name]`
- [ ] Verify existing tests pass before making changes
```

> **Note**: When the mode provisions one, the worktree path is `worktrees/<name>/` in the repo root.
> Main modes provision no worktree.

## Fix-All-Issues Instruction

Every plan must include this instruction in quality gate sections:

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

## Thematic Commit Guidance

Every plan must include commit guidance:

```markdown
### Commit Guidelines

- [ ] Do not stage or commit until the user explicitly authorizes the named change set
- [ ] Once authorized, use the fewest build-valid, independently reviewable and revertible commits,
      one coherent purpose each; no extra boundary prompt unless the user prescribed one
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Keep required tests, docs, specs, references, migrations/rollback, and generated mirrors with
      the change they complete; split independent concerns
- [ ] Do not extend a commit beyond the user-authorized change set
```
