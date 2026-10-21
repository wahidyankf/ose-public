---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

GitHub Actions and the gh CLI are the two hands of repository automation: workflows react to pushes, pull requests, tags, and clocks with matrices, caches, and artifacts, while gh scripts issues, pull requests, releases, and runs from the terminal. This course teaches both surfaces as 78 small, independently runnable and offline-checkable cases.

## Why this exists -- the big idea

**The problem before the solution**: pipeline strategy courses use GitHub Actions as their example vendor but cover only a fraction of its concrete syntax, leaving learners without a dedicated reference for matrices, caching, OIDC, and the gh commands that drive releases. **Keep this if you forget everything else**: a workflow file is validated and simulated offline before it is trusted against a real repository.

## What you will be able to do

After this course you can write a workflow with triggers, a job matrix, caching, and artifact upload and download; write a reusable workflow and a composite action and pass secrets into them safely; request short-lived OIDC credentials instead of long-lived secrets; drive the gh CLI to manage issues, pull requests, releases, and workflow runs from a script; and validate a workflow file's structure and a gh script's logic without touching a real repository.

## How this course is organized

[Learning](/en/learn/courses/github-actions-and-gh-cli/learning/overview) holds 78 worked examples in three levels: Beginner (Examples 1-25) declares triggers, orders jobs, and starts with the gh CLI; Intermediate (Examples 26-53) scales to matrices, caches, reusable workflows, composite actions, and release automation; Advanced (Examples 54-78) hardens with OIDC, environments, concurrency, and offline validation. The [capstone](/en/learn/courses/github-actions-and-gh-cli/learning/capstone/overview) runs one commit-to-release pipeline end to end with a golden validation report, and [drilling](/en/learn/courses/github-actions-and-gh-cli/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: version-control-and-git for branches, tags, and pull requests; cicd-and-release-engineering for pipeline strategy; just-enough-bash because every example starts from a shell invocation. Assumed knowledge: basic Git and YAML.

## About the examples

Every runnable example validates offline with Python 3.14 fixture validators: workflow YAML is schema-checked as an offline subset and `gh` responses come from committed JSON fixtures shaped like the live `--json` output, never a live call. Shell invocations shown in lessons carry the illustration marker because no live repository or gh binary exists in the harness.

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
