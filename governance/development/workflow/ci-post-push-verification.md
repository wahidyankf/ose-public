---
title: "CI Post-Push Verification Convention"
description: After pushing to origin main, manually trigger all related GitHub CI workflows and verify they pass before considering the work complete
category: explanation
subcategory: development
tags:
  - ci
  - github-actions
  - verification
  - quality-gates
  - workflow
---

# CI Post-Push Verification Convention

After pushing to `origin main`, you MUST manually trigger all related GitHub CI workflows and verify they pass before declaring the work done. A green pre-push hook is a necessary condition, not a sufficient one — it cannot run integration tests, end-to-end tests, or deployment workflows.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: The GitHub CI workflows exist to catch what the pre-push hook cannot — integration failures, E2E regressions, and deployment breakage. This convention ensures those automated checks are actively invoked rather than passively awaited.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: A failing CI workflow after a push is not "CI's problem." It is a sign that the work is incomplete. This convention treats CI failure as an unresolved root cause, not a background concern to defer.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Verification must be explicit. Assuming CI will pass, or that a scheduled run will catch issues, substitutes an implicit hope for a deliberate check. This convention requires the verification step to be performed, not assumed.

## Conventions Implemented/Respected

This practice implements/respects the following development practices:

- **[CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md)**: When a CI workflow fails after push, the failure is treated as a CI blocker. Investigate the root cause and fix it properly per that convention. Never defer or bypass.

- **[Trunk Based Development Convention](./trunk-based-development.md)**: TBD requires that `main` is always in a releasable state. A push that breaks CI leaves `main` in an unreleasable state. This convention closes that gap by mandating verification after every push to `main`.

- **[Git Push Default Convention](./git-push-default.md)**: The default push is direct to `origin main`. Because there is no PR review buffer, CI post-push verification is the mechanism that catches what the pre-push hook missed.

## The Rule

After pushing app or library code to `origin main`, you MUST:

1. **Identify which apps and libs were changed.** Use `git diff HEAD~1 --name-only` or `nx affected --base=HEAD~1` to determine the blast radius.
2. **Trigger the relevant CI workflows.** Use `gh workflow run` for each workflow that covers the changed apps or libs.
3. **Monitor until completion.** Use `gh run list` to find the run ID, then `gh run watch <run-id>` to follow it to completion.
4. **If any workflow fails**, investigate the root cause and fix it per the [CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md). Do not declare the work done until all relevant workflows pass.

## Workflow Mapping

| App(s) Changed                                              | Workflow to Trigger                                |
| ----------------------------------------------------------- | -------------------------------------------------- |
| `apps/ayokoding-web/`                                       | `test-and-deploy-ayokoding-web.yml`                |
| `apps/oseplatform-web/`                                     | `test-and-deploy-oseplatform-web.yml`              |
| `apps/organiclever-web/`, `apps/organiclever-be/`           | `test-and-deploy-organiclever-web-development.yml` |
| `apps/wahidyankf-web/`                                      | `test-and-deploy-wahidyankf-web.yml`               |
| `libs/`, shared infrastructure, or cross-cutting governance | All workflows for apps in blast radius             |

When a change touches shared code (a lib, a shared type, a contract), trigger every workflow for every app that imports that code — not just the app most obviously related to the change.

## Monitoring Without Rate-Limiting

The required tool for watching a run to completion is `gh run watch <run-id>`. It uses GitHub's streaming API and issues far fewer requests than a manual poll loop. Tight-loop polling of `gh run view` without a sleep interval is **forbidden** — it exhausts the GitHub API rate limit (5,000 req/hour) within minutes and blocks all `gh` commands for up to an hour.

See [CI Monitoring Convention](./ci-monitoring.md) for:

- Full rate limit budget facts and window behavior
- Required tool selection (`gh run watch` as default)
- Minimum poll intervals when manual polling is unavoidable (30 seconds)
- Trigger discipline (never trigger the same workflow more than once every 10 minutes)
- Recovery procedure when rate-limited (HTTP 403): scheduled wait, not retry loop

## Commands

```bash
# Identify blast radius
git diff HEAD~1 --name-only

# Trigger a specific workflow on main
gh workflow run test-and-deploy-ayokoding-web.yml

# List recent runs for a workflow to find the run ID
gh run list --workflow=test-and-deploy-ayokoding-web.yml --limit=5

# Watch a specific run until it completes (required tool — do not use a poll loop)
gh run watch <run-id>

# View logs for a failed run
gh run view <run-id> --log-failed

# Quick overall status check
gh run list --limit=10
```

## When This Convention Applies

This convention applies after any push to `origin main` that touches:

- App source code under `apps/`
- Library source code under `libs/`
- CI workflow files under `.github/workflows/`
- Contract specs under `specs/` (blast radius extends to all apps consuming the contract)
- Configuration files that affect build or test behavior (`nx.json`, `tsconfig.base.json`, `package.json`, etc.)

## When This Convention Does NOT Apply

This convention does not apply to pushes that exclusively touch:

- `docs/` — documentation only, no app behavior impact
- `governance/` — governance only, no app behavior impact
- `plans/` — planning documents only
- `generated-reports/` — audit reports only
- `generated-socials/` — social content only
- `.claude/agents/`, `.claude/skills/` — agent/skill definitions only, no app code impact

The pre-push hook (typecheck, lint, test:quick, spec-coverage) already validates these changes sufficiently.

## What the Pre-Push Hook Covers vs. What This Convention Covers

| Quality Gate              | Pre-Push Hook | CI Post-Push Verification |
| ------------------------- | ------------- | ------------------------- |
| Typecheck                 | Yes           | Yes (as part of CI)       |
| Lint                      | Yes           | Yes (as part of CI)       |
| Unit tests (`test:quick`) | Yes           | Yes (as part of CI)       |
| Integration tests         | No            | Yes                       |
| E2E tests                 | No            | Yes                       |
| Deployment workflows      | No            | Yes                       |
| Spec coverage             | Yes           | Yes (as part of CI)       |

The pre-push hook is fast and local. CI workflows are comprehensive and environment-representative. Both are required.

## Agent Responsibilities

| Agent / Workflow        | Responsibility                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| All AI agents           | After pushing app or lib code changes to `origin main`, trigger and monitor all relevant CI workflows before declaring work complete. |
| plan-execution workflow | CI post-push verification is a required final step in any delivery that includes app or lib changes. It is not optional.              |
| Developer (human)       | Same requirement as agents — trigger and verify CI workflows before declaring work done.                                              |

## Forbidden Actions

The following actions are explicitly forbidden under this convention:

- Declaring work "done" before all relevant CI workflows pass.
- Skipping CI verification because "the pre-push hook passed."
- Assuming a scheduled CI run will catch issues without performing explicit verification.
- Treating a CI failure discovered after verification as someone else's problem to fix.

## Examples

### PASS: Correct post-push verification

```
Agent: Pushed feat(organiclever-web): update hero section to origin main.

Identifying blast radius: apps/organiclever-web/ changed.

Triggering CI:
  gh workflow run test-and-deploy-organiclever-web-development.yml

Monitoring:
  gh run list --workflow=test-and-deploy-organiclever-web-development.yml --limit=3
  gh run watch 12345678

Result: All steps passed. Work is complete.
```

### FAIL: Declaring done before CI verification

```
Agent: Pushed feat(organiclever-web): update hero section to origin main.

Work is complete.
```

No CI verification was performed. This is wrong — the pre-push hook passing is not sufficient.

### FAIL: Skipping CI because pre-push passed

```
Agent: Pre-push hook passed (typecheck, lint, test:quick, spec-coverage).
       CI verification skipped — local gates passed.

Work is complete.
```

The pre-push hook does not run integration tests, E2E tests, or deployment workflows. Skipping CI verification is wrong.

### PASS: Fixing a CI failure discovered during verification

```
Agent: Pushed feat(organiclever-be): update auth endpoint to origin main.

Triggering CI:
  gh workflow run test-and-deploy-organiclever-web-development.yml

Monitoring: run 12345679 failed — integration test failure in organiclever-be.

Root cause: Database migration step missing from integration test fixture.

Fix:
  git add apps/organiclever-be/tests/fixtures/migration.sql
  git commit -m "fix(organiclever-be): add missing migration fixture for auth integration test"
  git push origin main

Re-triggering CI:
  gh workflow run test-and-deploy-organiclever-web-development.yml

Result: All steps passed. Work is complete.
```

## Related Documentation

- [CI Monitoring Convention](./ci-monitoring.md) — Safe monitoring mechanics: required tooling (`gh run watch`), minimum poll intervals, trigger discipline, and rate-limit recovery procedures.
- [CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md) — How to investigate and fix CI failures found during verification.
- [Trunk Based Development Convention](./trunk-based-development.md) — Why `main` must remain releasable at all times.
- [Git Push Default Convention](./git-push-default.md) — Default push behavior (direct to `origin main`, no PR buffer).
- [Code Quality Convention](../quality/code.md) — Pre-push hook quality gates that this convention extends.
