---
description: "Steps 5-7 of the AI benchmark refresh: deliver the PR and merge it, deploy to production after approval and verify the live page, then clean up."
when_to_use: "Use when landing a verified refresh, releasing it to production, or tearing down the work."
---

# Delivery, Deploy, and Clean-Up

## 5. Deliver (Sequential)

**Procedure**: Commit per [Commit Messages](../../../development/workflow/commit-messages.md), push, and
open the PR as a draft per [Draft PR Lifecycle](../../../development/workflow/pr-merge-protocol/draft-pr-lifecycle.md),
from the [PR template](../../../../.github/pull_request_template.md). The body records the sources checked,
each board's last-updated date, and the Step 4 results, because the working notes are removed at Step 7.
Watch CI per [CI Monitoring](../../../development/workflow/ci-monitoring.md) and resolve failures per
[CI Blocker Resolution](../../../development/quality/ci-blocker-resolution.md).

**Workflow**: `quality/pr-leak-review`

- **Args**: `pr: <the PR number>`, on the PR's exact current head

**Procedure**: Merge per the [PR Merge Protocol](../../../development/workflow/pr-merge-protocol.md), then
confirm the merge commit is on `origin/main`.

- **Depends on**: Step 4
- **Output**: `pr-url`
- **On failure**: a gate that cannot be made green ends the run as `failed`

## 6. Deploy (Conditional, Human Checkpoint)

- **Condition**: `deploy` is `true`; with `deploy=false` the run skips to Step 7 and ends as
  `merged-not-deployed`
- **Depends on**: Step 5

**Procedure**: The deployer pushes the local `main` tip, so it runs from the primary checkout, on a clean
`main` level with `origin/main`. Record that tip's SHA; when it is not the merge commit, another change
landed after Step 5, and the prompt names both.

The deploy force-pushes `main` to `prod-ayokoding-www`, so it needs fresh, per-instance approval under the
[Git Push Safety Convention](../../../development/workflow/git-push-safety/rule.md); invoking this workflow
with `deploy=true` is not that approval.

- **Prompt**: through `AskUserQuestion`, per
  [Human Checkpoints](../../../conventions/structure/workflow-pattern/human-checkpoints.md), state the exact push, the
  `main` tip SHA it will push, and that `prod-ayokoding-www` is overwritten: "Force-push this SHA to
  prod-ayokoding-www?"
- **Options**:
  - Approve → run the deployer for that SHA
  - Decline → skip to Step 7 and end as `merged-not-deployed`
- **Timeout**: none; the workflow waits

**Agent**: `apps-ayokoding-www-deployer`, only while the local `main` tip is still the approved SHA; a
moved tip needs a new approval.

Verify per
[Post-Deploy Verification (Vercel MCP)](../../../../.agents/skills/apps-deploying-vercel-branches/reference/post-deploy-verification-vercel-mcp.md):
the Vercel `ayokoding-www` deployment for the exact pushed SHA reaches READY. Then load
`https://www.ayokoding.com/en/tools/ai-benchmark` and `https://www.ayokoding.com/id/tools/ai-benchmark` in a
real browser and confirm each shows the new last-updated date.

- **Output**: `deployed-sha`
- **On unverified**: READY or the browser check cannot be confirmed; `final-status` is
  `deploy-unverified`
- **On failure**: an ERROR deployment ends the run as `failed`; roll back per
  [Termination and Pitfalls](./001-termination-and-pitfalls.md#termination-criteria)

## 7. Clean-Up (Sequential)

**Workflow**: `dev-artifact-clean-up`, per [Dev Artifact Clean-Up](../dev-artifact-clean-up.md), ending
with the primary checkout's `main` level with `origin/main` per
[Terminal Reconcile](../../../development/workflow/bare-repo-landing-method/terminal-reconcile.md).

- **Depends on**: Step 6, or Step 5 when `deploy=false` or the deploy was declined; also reached directly
  from Step 3 on `no-change`
- **Success criteria**: clean-up PASS; RETAIN is a valid terminal state that maps to Partial
- **On failure**: report the artifacts left behind; the run ends as Partial
