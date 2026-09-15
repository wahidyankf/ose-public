---
description: "Standards for keeping Actions artifacts, GitHub Packages, and caches within the account's included storage."
when_to_use: "Use when a workflow uploads artifacts, publishes GitHub Packages, writes Actions caches, or changes storage retention."
---

# CI/CD Conventions — GitHub Actions Storage

## Purpose

Keep GitHub-hosted storage reviewable and within the included allowance. GitHub Free provides an
owner-wide **500 MB** pool shared by Actions artifacts and GitHub Packages; Actions caches use a
separate repository allowance. Job logs and job summaries do **not** consume Actions storage.

Apply the budget in both parity repositories.

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

The 2026-09-05 parity audit established this baseline:

| Repository          | Active artifacts                                   | Framework-dependent forecast | Cache data       |
| ------------------- | -------------------------------------------------- | ---------------------------- | ---------------- |
| The private sibling | 437,396,572 bytes; 11 Rhino handoffs near 39.8 MB  | About 35.1 MB at 13 runs/day | 10,836,110,245 B |
| `ose-public`        | 962,885,080 B; 24 Rhino handoffs use 954,191,871 B | About 64.8 MB for 24 copies  | About 11.008 GB  |

Both repositories cap caches at 10 GB for 7 days. The revised workflow restores on non-default
refs, saves on `main`, and skips cloud writes on persistent self-hosted runners. Neither workflow
currently publishes Packages. Refresh these measurements after storage changes.

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
