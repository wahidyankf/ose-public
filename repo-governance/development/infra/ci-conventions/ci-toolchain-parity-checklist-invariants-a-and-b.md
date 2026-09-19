---
description: Requirement tables for CI Workflow Shape and Git Hook Lifecycle.
when_to_use: Use when auditing a workflow's shape or a hook's steps.
---

# Parity Checklist — Invariants A and B

Seven workstream invariants define the converged toolchain across all repositories. Any deviation
must be recorded here with a justification; undocumented deviations are always bugs.

## Invariant A — CI Workflow Shape

| Requirement                                                                                                                                                 | Enforced by                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| All `checkout` steps use `actions/checkout@v6`                                                                                                              | `actionlint` + PR quality gate                                      |
| Workflow filenames follow the `{domain}-{action-chain}.yml` grammar (see [GitHub Actions Workflow Naming Convention](../github-actions-workflow-naming.md)) | `actionlint` syntax check; code review                              |
| Non-TypeScript projects use `nx affected` (not `run-many`) in PR gate                                                                                       | `pr-quality-gate.yml` structure                                     |
| Per-variant test workflows call reusable workflows (thin callers, ≤40 lines each)                                                                           | Code review; reusable workflow structure                            |
| All entry-point workflows carry a `concurrency` block: `${{ github.workflow }}-${{ github.ref }}`                                                           | `actionlint`; PR quality gate                                       |
| CI lint jobs named after the tool they run: `shellcheck`, `hadolint`, `actionlint`                                                                          | `pr-quality-gate.yml` job keys                                      |
| Affected quick runs every applicable `test:coverage:*`; spec-file links remain covered by `links:validation`                                                | `pr-quality-gate.yml` affected quick job                            |
| Full quality gate runs on every PR event (`opened`/`synchronize`/`reopened`) **and** on every push to `main`                                                | `pr-quality-gate.yml` `on.push` trigger                             |
| App-tier scheduled workflows use staggered 2× WIB cadence: `*-app-test-local-deploy-stag` at 03:00/15:00, `*-app-test-stag` at 05:30/17:30 (+2.5 h)         | `*-app-test-local-deploy-stag.yml` and `*-app-test-stag-*.yml` CRON |
| www-tier scheduled workflows run at 06:00/18:00 WIB (23:00/11:00 UTC)                                                                                       | `*-www-test-local-deploy-prod.yml` CRON expressions                 |

Note: the `Rhino:naming:workflows-validation` Nx target, which once validated
`repo-governance/workflows/*.md` naming, was withdrawn — see
[repo-governance/workflows/README.md](../../../workflows/README.md) for the withdrawal record. No
current gate validates `.github/workflows/` filenames either; workflow-file naming is enforced by
code review only.

## Invariant B — Git Hook Lifecycle

Three Husky hooks, each with a fixed shape:

| Hook         | Required steps (in order)                                                                                                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `commit-msg` | `commitlint --edit "$1"` — enforces Conventional Commits format                                                                                                                                                                                                                      |
| `pre-commit` | `./rhino gate run --surface pre-commit`: the public-safety screen, then the registry (validate configs, format staged, validate links, lint markdown, shellcheck/hadolint/actionlint)                                                                                                |
| `pre-push`   | `./rhino gate run --surface pre-push` — the public-safety screen, then every registry-declared `pre-push`-surface gate, in declaration order; see [Git Hook Lifecycle](../../workflow/git-hook-lifecycle.md) and discover the live set with `gate list` rather than a hardcoded list |
