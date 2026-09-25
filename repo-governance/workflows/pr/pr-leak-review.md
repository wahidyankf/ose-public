---
description: "Run the mandatory focused leak review once for an exact current PR head."
when_to_use: "Use for every open pull request before merge and again whenever its head changes."
---

# Focused PR Leak Review Workflow

Run one mandatory, narrow review for every PR's exact current head. It detects only real
secrets/private values, protected production or staging properties that belong outside git, and
real machine-specific absolute paths. It performs no broad security or semantic review, fixer
pass, CI wait, retry, or consecutive-clean confirmation.

Run [`pr-review-security-maker`](../../../.agents/agents/pr-review-security-maker.md) in
**exact leak-only mode**. Its ordinary security charter is disabled for this invocation.

## Goal and Termination

**Goal**: Detect real sensitive values, protected environment properties, and machine-specific absolute paths without broad semantic review

**Termination**: Return pass/findings after one authenticated current-head review, or stale/failed without retrying inside the run

## Inputs

- **`pr`** (string, required) — Open PR number or URL

## Outputs

- **`final-status`** (enum: pass, findings, stale, failed) — Focused leak-review result for the pinned head
- **`reviewed-head`** (string) — Exact PR head SHA reviewed
- **`review-id`** (string) — Authenticated GitHub review ID, or null before posting
- **`finding-counts`** (string) — Sanitized counts by leak category
- **`evidence`** (string) — Authenticated ose-pr-leak-review:v1 current-head evidence

## Contents

- [Scope and Exclusions](./pr-leak-review/scope-and-exclusions.md) — Defines the three leak
  categories, exclusions, and canonical rule sources. Use when deciding whether a candidate is a
  real leak.
- [Execution](./pr-leak-review/execution.md) — Defines the pinned-head inspection and sanitized
  review phases. Use when running or implementing the focused review.
- [Evidence and Outcomes](./pr-leak-review/evidence-and-outcomes.md) — Defines authenticated
  current-head evidence and terminal states. Use when posting, authenticating, or consuming a leak
  result.

Merge verification requires one authenticated `ose-pr-leak-review:v1` `pass` whose repository,
base, and head equal the PR's exact current coordinates. A changed head needs one new pass, never a
clean streak.

## Example Usage

```text
Run pr-leak-review for the exact current head of PR 412.
```

## Related Workflows

- [`pr-review`](./pr-review.md) — optional broad pass that delegates these exact predicates.
- [`pr-review-cycle`](./pr-review-cycle.md) — optional iterative workflow that consumes the same
  evidence without duplicating the scan.

## Success Criteria

```gherkin
Scenario: Current head contains no leak
  Given an open pull request at a pinned head
  When exact leak-only review finds no real leak
  Then it posts one sanitized COMMENT review
  And authenticated current-head ose-pr-leak-review:v1 evidence reports pass

Scenario: Current head contains a protected value
  Given a tracked PR hunk contains a real production credential
  When exact leak-only review reports it
  Then the finding names only category, location, and remediation
  And no output repeats or transforms the credential

Scenario: Head moves during review
  Given review began from a pinned head
  When the PR head changes before or after posting
  Then final-status is stale
  And no evidence authorizes the new head
```
