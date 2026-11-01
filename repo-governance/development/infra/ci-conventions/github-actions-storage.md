---
description: "Standards for keeping Actions artifacts, GitHub Packages, and caches within the account's included storage."
when_to_use: "Use when a workflow uploads artifacts, publishes GitHub Packages, writes Actions caches, or changes storage retention."
---

# CI/CD Conventions — GitHub Actions Storage

## Purpose

Keep GitHub-hosted storage reviewable and within the included allowance. GitHub Free provides an
owner-wide **500 MB** pool shared by Actions artifacts and GitHub Packages; Actions caches use a
separate repository allowance. Job logs and job summaries do **not** consume Actions storage.

Apply the budget in this repository.

## Standards

### Artifacts and packages

Every `actions/upload-artifact` step must declare a literal `retention-days` value:

| Artifact role                             | Required retention                                |
| ----------------------------------------- | ------------------------------------------------- |
| Intra-run handoff consumed by another job | `1`                                               |
| Report or trace retained for triage       | `1` through `7`                                   |
| Longer-lived output                       | More than `7`, with an adjacent reason and expiry |

Keep repository artifact/log retention at or below seven days as a backstop; per-upload retention
remains the primary control.

Keep handoffs to the files the consumer needs. Every GitHub Packages publisher must reference its
cleanup lifecycle and record a steady-state repository estimate. Reconcile the estimate with all
other owner resources before merge.

Calculate the artifact estimate as:

```text
sum(compressed bytes per run x maximum runs per day x retention days)
```

Add retained package-version bytes and recorded usage from other owner resources in the same units.
The result must not exceed 500 MB.

### Caches

Keep the cache limit at or below **10 GB** and retention at or below **7 days**. Forecast use as
`entry bytes x simultaneously active cache-writing refs`. When ref churn could exceed 10 GB,
non-default and pull-request refs may restore but must not save caches. Save from the default branch.
Persistent self-hosted runners may use local tool caches instead of cloud round-trips.

### Account guardrail

The personal-account owner must configure an Actions budget of **$0**; user-level budgets always
hard-stop automatically and do not offer a stop-usage toggle. Organization owners using this rule
must also enable **Stop usage when budget limit is reached**. Repository files cannot prove either
setting, so external verification is required.

## Recorded Baseline

A 2026-11-01 audit summed live artifact bytes across every owner repository:

| Scope             | Artifacts        |
| ----------------- | ---------------- |
| `ose-public`      | 105.8 MB (15)    |
| Other owner repos | 185.9 MB         |
| Owner total       | 291.7 MB (58.3%) |

Most `ose-public` artifacts are older staging reports that expire within 7 days. Its Actions cache
holds 0 B. This repository caps caches at 10 GB for 7 days, restores them on non-default refs, and
saves on `main`. It publishes no Packages. Refresh these measurements after storage changes.

### Current Settings and Lesson

Repository retention is 2 days; GitHub silently caps longer uploads at 2 days. Playwright staging
reports upload only on failure and keep 1 day.

On 2026-10-30, 7-day staging reports from this repository (about 46-51 MB per run, about two runs a
day) filled the owner-wide pool. Deploys in another owner repository then failed with "Failed to CreateArtifact:
Artifact storage quota has been hit", though that repository held almost nothing. A quota failure
can come from another repository, so sum every owner repository's live artifacts before trusting
one estimate.

## Validation and Enforcement

| Control                         | Pass                                                 | Violation                                                   |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Artifact retention              | Repo default `<=7`; role-appropriate upload value    | Higher default, wrong window, or unjustified `>7`           |
| Artifact and Packages allowance | Owner-wide calculation is at or below 500 MB         | Missing lifecycle/estimate or calculation exceeds 500 MB    |
| Cache allowance                 | Settings are `<=10 GB`/`<=7 days`; forecast fits     | Higher settings or write-enabled ref churn exceeds forecast |
| Paid-usage guardrail            | Verified $0 personal budget; org stop toggle enabled | Absent, nonzero, soft, or unverified budget                 |

The `artifact-retention` gate in `scripts/verify-artifact-retention.sh` enforces only presence of
`retention-days`; it does not validate values, roles, reasons, Packages, caches, or budgets.
`actionlint` validates workflow syntax. Reviewers verify remaining repository evidence, and an
owner verifies the external budget. The repository records that budget control as unenforced by
code.

## References

- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Dependency caching reference](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- [Budgets and alerts](https://docs.github.com/en/billing/concepts/budgets-and-alerts)
