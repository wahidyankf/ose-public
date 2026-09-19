---
description: Defines Phase 0's environment-setup responsibilities and the hard rule that Phase 0 opens no PR under any delivery mode.
when_to_use: Use when running or auditing a plan's Phase 0 (environment setup and baseline) before implementation begins.
---

# 1b. Environment Setup (Sequential)

Before implementing anything, ensure the development environment is ready.

**Note**: The first phase of every delivery checklist must be **Phase 0: Environment Setup and
Baseline**, executed by the `repo-setup-manager` agent. Phase 0 covers guarded `npm install`,
transactional `rtk npm run doctor -- --fix`, a baseline test run, and preexisting failure
resolution. If the delivery checklist contains a Phase 0, delegate it to `repo-setup-manager` before
proceeding to Step 2. The steps below are the orchestrator-level mirror of Phase 0 — they describe
what must be true before any plan work begins.

**Phase 0 opens no PR (HARD RULE)**: it ends at its own gate — a recorded clean baseline — and hands straight to Phase 1. No branch push, no `gh pr create`, no PR CI or semantic review, no merge, under **any** delivery mode. The earliest phase that may open a PR is **Phase 1** under `*-to-pr`; Phase 0's evidence artifacts ride the first change-producing unit's mode-specific integration. See [Plans Organization Convention §Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).

**Nor does every later phase integrate**: a **delivery boundary** is the phase after which the
accumulated work follows one natural cohesive seam and is independently safe to deploy. Under
`*-to-pr`, it opens the unit's PR; under a permitted direct mode, it is a direct checkpoint. LOC
and file counts never define the boundary. See
[§PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).

**Orchestrator action**:

- Run `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` **at the selected worktree
  root**, not only the primary checkout. This installs its `node_modules` and activates Husky hooks
  through `prepare`; without it, later Git or Nx work can fail despite another checkout being
  initialized
- Run `rtk npm run doctor -- --fix` to converge all tooling
- Set up project-specific requirements (env vars, DB, Docker, etc.) as specified in the plan
- Verify dev server starts for affected projects
- Run existing quality gates to establish a baseline: `./rhino gate run --surface pre-push` (includes `nx affected -t test:quick`)
- Note any preexisting failures — these MUST be fixed during execution (Iron Rule 3)
- If the plan touches a Vercel-deployed surface, probe Vercel MCP availability and record the outcome
  (see [§Vercel MCP Availability](./vercel-mcp-availability.md)). Where the plan's
  Phase 0 also captures a deployment baseline for later comparison, capture it **now** — some
  measurements cannot be taken retroactively once a platform setting in the same phase disables the
  source.

**Output**: Environment ready, baseline failures identified

**On failure**: If environment cannot be set up, terminate with status `fail`.
