---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [version-control-and-git](/en/learn/courses/version-control-and-git/learning/overview) for the branches, tags, and pull requests every workflow here reacts to, [cicd-and-release-engineering](/en/learn/courses/cicd-and-release-engineering/learning/overview) for the pipeline strategy this course implements in one vendor, and [just-enough-bash](/en/learn/courses/just-enough-bash/learning/overview) because every gh command taught here runs from a shell. Comfort with Git branching, YAML indentation, and reading a shell script is assumed throughout.

## Why this exists -- the big idea

**The problem before the solution**: teams copy workflow files between repositories without understanding triggers, matrices, or credential scoping, so pipelines fail silently, bill unexpectedly, and leak secrets through logs. The gh CLI meanwhile stays a mystery, and every release becomes a sequence of website clicks instead of a reviewable script. **Keep this if you forget everything else**: a workflow file is validated and simulated offline before it is trusted against a real repository.

## Tensions and trade-offs -- when NOT to reach for this

- **Automation versus comprehension**: a green check on a file nobody understands is a liability that bills monthly. Every example here teaches the mechanism, not just the YAML, so you can predict what the runner will do.
- **Convenience versus credential lifetime**: stored secrets are easy and permanent, which is exactly why they are dangerous. Prefer short-lived federated tokens wherever the provider supports them.
- **When NOT**: one-off local scripts that will never run twice belong in a shell history, not in a workflow file. GitHub Actions earns its place when the work repeats, gates a merge, or publishes something others consume.

## Lineage -- where this tool sits

GitHub Actions grew out of the repository itself: code, pipeline, and release notes live in one place, triggered by the same events developers already produce. The gh CLI extends that idea to the terminal, scripting issues, pull requests, releases, and workflow runs through one authenticated binary. This course teaches the mechanics of both surfaces; the strategy of when to gate, stage, and release lives in cicd-and-release-engineering, and the Git vocabulary lives in version-control-and-git.

## How this course is organized

[Beginner](/en/learn/courses/github-actions-and-gh-cli/learning/beginner) (Examples 1-25) declares triggers, orders jobs and steps, and drives the gh CLI for auth, repos, and issues. [Intermediate](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate) (Examples 26-53) fans matrices, warms caches, hands off artifacts, shares reusable workflows and composite actions, and automates pull requests and releases. [Advanced](/en/learn/courses/github-actions-and-gh-cli/learning/advanced) (Examples 54-78) scopes secrets, mints OIDC tokens, guards environments, serializes concurrency, filters monorepos by path, and validates every file shape offline. The [capstone](/en/learn/courses/github-actions-and-gh-cli/learning/capstone/overview) ships a commit-to-release pipeline with a golden validation report, and [drilling](/en/learn/courses/github-actions-and-gh-cli/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Workflow files are YAML and gh scripts are Bash; both are checked by Python 3.14 fixture validators, so just-enough-bash earns its place from the first page. Every example runs `python3 check.py` in the harness against files committed beside it: workflow YAML is schema-checked as an offline subset, and gh responses come from committed JSON fixtures shaped like the live `--json` output. No example calls a real GitHub endpoint, mints a real token, or dispatches a real run. The shell invocations shown in lessons are the real `gh` and `git` commands each validator stands in for; they carry the illustration marker because no live repository exists in the harness. Fixture simplifications are documented where they matter, and every claim was re-verified against the vendor docs on 2026-10-20.

## Examples by Level

### Beginner (Examples 1-25)

- [Example 1: Push Trigger: Run on Every Push](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-1-push-trigger-run-on-every-push)
- [Example 2: Pull Request Trigger: Check Before Merge](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-2-pull-request-trigger-check-before-merge)
- [Example 3: Scheduled Nightly Run: The Cron Trigger](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-3-scheduled-nightly-run-the-cron-trigger)
- [Example 4: Manual Run with Inputs: workflow_dispatch](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-4-manual-run-with-inputs-workflowdispatch)
- [Example 5: Release Tag Push: Ship on v\* Tags](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-5-release-tag-push-ship-on-v-tags)
- [Example 6: Your First Job and Step](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-6-your-first-job-and-step)
- [Example 7: A Job with Ordered Steps](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-7-a-job-with-ordered-steps)
- [Example 8: Pass Outputs Between Steps](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-8-pass-outputs-between-steps)
- [Example 9: Order Jobs with needs](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-9-order-jobs-with-needs)
- [Example 10: Jobs Run in Parallel by Default](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-10-jobs-run-in-parallel-by-default)
- [Example 11: Check Out the Repository](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-11-check-out-the-repository)
- [Example 12: Set Up Python](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-12-set-up-python)
- [Example 13: Read the github Context](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-13-read-the-github-context)
- [Example 14: Scoped Environment Variables](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-14-scoped-environment-variables)
- [Example 15: Conditional Steps with if](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-15-conditional-steps-with-if)
- [Example 16: Defaults: Shell and Working Directory](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-16-defaults-shell-and-working-directory)
- [Example 17: A Failing Step Stops the Job](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-17-a-failing-step-stops-the-job)
- [Example 18: Prove Authentication Works](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-18-prove-authentication-works)
- [Example 19: Inspect a Repository](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-19-inspect-a-repository)
- [Example 20: Clone from the CLI](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-20-clone-from-the-cli)
- [Example 21: List Open Issues](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-21-list-open-issues)
- [Example 22: Read One Issue](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-22-read-one-issue)
- [Example 23: Open an Issue from a Script](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-23-open-an-issue-from-a-script)
- [Example 24: Close an Issue](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-24-close-an-issue)
- [Example 25: Fork Without the Website](/en/learn/courses/github-actions-and-gh-cli/learning/beginner#example-25-fork-without-the-website)

### Intermediate (Examples 26-53)

- [Example 26: One Job, Three Pythons](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-26-one-job-three-pythons)
- [Example 27: Multiply OS by Python](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-27-multiply-os-by-python)
- [Example 28: Include and Exclude Grid Cells](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-28-include-and-exclude-grid-cells)
- [Example 29: Fail Fast or Finish All](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-29-fail-fast-or-finish-all)
- [Example 30: Cache pip Dependencies](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-30-cache-pip-dependencies)
- [Example 31: Cache Keys and Restore Keys](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-31-cache-keys-and-restore-keys)
- [Example 32: Cache Node Modules](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-32-cache-node-modules)
- [Example 33: Upload a Build Artifact](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-33-upload-a-build-artifact)
- [Example 34: Consume the Artifact Downstream](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-34-consume-the-artifact-downstream)
- [Example 35: Call a Reusable Workflow](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-35-call-a-reusable-workflow)
- [Example 36: Inputs and Secrets into Reusable Workflows](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-36-inputs-and-secrets-into-reusable-workflows)
- [Example 37: Return Outputs from Reusable Workflows](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-37-return-outputs-from-reusable-workflows)
- [Example 38: The workflow_call Trigger](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-38-the-workflowcall-trigger)
- [Example 39: Your First Composite Action](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-39-your-first-composite-action)
- [Example 40: Inputs for a Composite Action](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-40-inputs-for-a-composite-action)
- [Example 41: The action.yaml Shape](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-41-the-actionyaml-shape)
- [Example 42: Composite versus JavaScript Action](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-42-composite-versus-javascript-action)
- [Example 43: Pin Third-Party Actions by SHA](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-43-pin-third-party-actions-by-sha)
- [Example 44: Share Actions from a Private Repo](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-44-share-actions-from-a-private-repo)
- [Example 45: Open a Pull Request](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-45-open-a-pull-request)
- [Example 46: Read a PR's Checks](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-46-read-a-prs-checks)
- [Example 47: Watch Checks to Green](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-47-watch-checks-to-green)
- [Example 48: Merge from the CLI](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-48-merge-from-the-cli)
- [Example 49: Approve a Pull Request](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-49-approve-a-pull-request)
- [Example 50: Inspect a Release](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-50-inspect-a-release)
- [Example 51: Cut a Release with Notes](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-51-cut-a-release-with-notes)
- [Example 52: Attach a Build Asset](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-52-attach-a-build-asset)
- [Example 53: Check Out a PR Branch Locally](/en/learn/courses/github-actions-and-gh-cli/learning/intermediate#example-53-check-out-a-pr-branch-locally)

### Advanced (Examples 54-78)

- [Example 54: Use a Stored Secret](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-54-use-a-stored-secret)
- [Example 55: Secrets Never Print](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-55-secrets-never-print)
- [Example 56: Assume an AWS Role via OIDC](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-56-assume-an-aws-role-via-oidc)
- [Example 57: Mint a Federated ID Token](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-57-mint-a-federated-id-token)
- [Example 58: Choose OIDC over a Stored Secret](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-58-choose-oidc-over-a-stored-secret)
- [Example 59: Require Approval Before Deploy](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-59-require-approval-before-deploy)
- [Example 60: Environment-Scoped Secrets](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-60-environment-scoped-secrets)
- [Example 61: Record a Deployment](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-61-record-a-deployment)
- [Example 62: Cancel Superseded Runs](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-62-cancel-superseded-runs)
- [Example 63: Group by Branch and Workflow](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-63-group-by-branch-and-workflow)
- [Example 64: Queue Deploys on main](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-64-queue-deploys-on-main)
- [Example 65: Skip on Docs-Only Changes](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-65-skip-on-docs-only-changes)
- [Example 66: Test Only the Changed Service](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-66-test-only-the-changed-service)
- [Example 67: Fan Out per Changed Package](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-67-fan-out-per-changed-package)
- [Example 68: One Group per Merge Queue](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-68-one-group-per-merge-queue)
- [Example 69: Let the Deploy Finish](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-69-let-the-deploy-finish)
- [Example 70: Default Group for Missing Context](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-70-default-group-for-missing-context)
- [Example 71: Validate a Trigger Block](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-71-validate-a-trigger-block)
- [Example 72: Validate the needs Graph](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-72-validate-the-needs-graph)
- [Example 73: Expand a Matrix Offline](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-73-expand-a-matrix-offline)
- [Example 74: Find Undeclared Secret References](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-74-find-undeclared-secret-references)
- [Example 75: Dry-Run a gh Script](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-75-dry-run-a-gh-script)
- [Example 76: Query Pulls with gh api](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-76-query-pulls-with-gh-api)
- [Example 77: Gate the Merge on a Check](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-77-gate-the-merge-on-a-check)
- [Example 78: Typed Inputs for Manual Runs](/en/learn/courses/github-actions-and-gh-cli/learning/advanced#example-78-typed-inputs-for-manual-runs)

## References

- GitHub Actions documentation (workflows, events, jobs, runners). Accessed 2026-10-20. [Actions docs](https://docs.github.com/en/actions)
- Events that trigger workflows (push, pull_request, schedule, workflow_dispatch). Accessed 2026-10-20. [Trigger events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- Using a matrix for your jobs (axes, include, exclude, fail-fast). Accessed 2026-10-20. [Matrix strategies](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- Caching dependencies to speed up workflows (cache action, keys, restore-keys). Accessed 2026-10-20. [Dependency caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- Reusing workflows (workflow_call, inputs, secrets, outputs). Accessed 2026-10-20. [Reusable workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- Creating a composite action (action.yaml, inputs, outputs, runs.composite). Accessed 2026-10-20. [Composite actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- Using secrets in GitHub Actions (secrets context, masking, environments). Accessed 2026-10-20. [Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- About security hardening with OpenID Connect (id-token, cloud roles). Accessed 2026-10-20. [OIDC hardening](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- Using environments for deployment (reviewers, environment secrets). Accessed 2026-10-20. [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- Evaluate expressions (github context, needs context, functions). Accessed 2026-10-20. [Expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)
- GitHub CLI manual (gh auth, repo, issue, pr, release, api, run). Accessed 2026-10-20. [gh manual](https://cli.github.com/manual/)
- GitHub REST API reference (payloads used by gh api examples). Accessed 2026-10-20. [REST reference](https://docs.github.com/en/rest)
