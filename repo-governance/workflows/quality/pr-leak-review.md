---
description: "Defines a leak and reviews every commit bound for the remote for one: privately before each push, and as one sanitized record posted for each PR head before merge."
when_to_use: "Use before every push to the remote, and for every open pull request before merge and again whenever its head changes."
---

# PR Leak Review Workflow

A **leak** is anything in outbound history that a reader of the remote could use to reach an
environment or identify the machine it came from. [Scope and Exclusions](./pr-leak-review/001-scope-and-exclusions.md)
defines the three classes and what is not one. History is the subject, not the final tree: a value
one commit adds and a later commit deletes is still in every clone. The review binds from adoption
onward; history published before it is out of scope.

It performs no broad security or semantic review, fixer pass, CI wait, retry, or
consecutive-clean confirmation. Run [`pr-review-security-checker`](../../../.agents/agents/pr-review-security-checker.md)
in **exact leak-only mode**; its ordinary security charter is disabled for this invocation.

## Entry

Two entry points share one judgement:

- **Push.** Before any push to the remote, review the outgoing range privately per
  [Push Review](./pr-leak-review/002-push-review.md). Nothing is posted; a finding blocks the push.
- **Merge.** A pull request is open and no `pass` record posted by the repository owner exists for
  its current head. Run [Execution](./pr-leak-review/003-execution.md), then
  [Evidence and Outcomes](./pr-leak-review/004-evidence-and-outcomes.md).

## Goal and Termination

**Goal**: Detect real sensitive values, protected environment properties, and machine-specific values in every outbound commit without broad semantic review

**Termination**: Push entry: push or remediate. Merge entry: return pass/findings after one authenticated current-head review, or stale/failed without retrying inside the run

## Inputs

- **`pr`** (string, required for the merge entry) — Open PR number or URL
- **`range`** (string, required for the push entry) — The outgoing range of each ref the push updates

## Outputs

- **`final-status`** (enum: pass, findings, stale, failed) — Leak-review result for the pinned head
- **`reviewed-head`** (string) — Exact PR head SHA reviewed
- **`review-id`** (string) — Authenticated GitHub review ID, or null before posting
- **`finding-counts`** (string) — Sanitized counts by leak class
- **`evidence`** (string) — Authenticated `ose-pr-leak-review:v1` current-head evidence

## Contents

Read in order; the [module index](./pr-leak-review/README.md) carries it.

- [Scope and Exclusions](./pr-leak-review/001-scope-and-exclusions.md) — the three leak classes, what
  is not a leak, and why history is the subject.
- [Push Review](./pr-leak-review/002-push-review.md) — the private review of each outgoing range, and
  remediation before and after a push.
- [Execution](./pr-leak-review/003-execution.md) — pinning the head, reading every commit, and
  producing the sanitized review.
- [Evidence and Outcomes](./pr-leak-review/004-evidence-and-outcomes.md) — the posted record, its
  read-back, and the terminal states.
- [Enforcement](./pr-leak-review/005-enforcement.md) — the history screen, hosted checks, the required
  `leak-review` status, and this repository's adopter decisions.

Merge requires one authenticated `ose-pr-leak-review:v1` `pass` whose repository, base, and head
equal the PR's exact current coordinates, published as the `leak-review` commit status. A moved head
needs one new pass, never a clean streak.

## Example Usage

```text
Run pr-leak-review for the exact current head of PR 412.
Run the push leak review for the commits this branch is about to push.
```

## Related Workflows

- [`pr-review`](./pr-review.md) — optional broad pass that delegates these exact predicates.
- [`pr-review-quality-gate`](./pr-review-quality-gate.md) — optional iterative workflow that consumes the same
  evidence without duplicating the scan.

## Success Criteria

```gherkin
Scenario: Current head contains no leak
  Given an open pull request at a pinned head
  When exact leak-only review of every commit finds no real leak
  Then it posts one sanitized COMMENT review
  And authenticated current-head ose-pr-leak-review:v1 evidence reports pass
  And the leak-review commit status on that head is success

Scenario: A commit adds a value a later commit deletes
  Given an outgoing range whose final files are clean
  And one commit in it added a real machine-specific absolute path
  When the push review runs
  Then the push is blocked
  And the unpushed history is rewritten so no commit carries the value

Scenario: Current head contains a protected value
  Given a commit in the PR adds a real production credential
  When exact leak-only review reports it
  Then the finding names only class, commit, location, and remediation
  And no output repeats or transforms the credential

Scenario: Head moves during review
  Given review began from a pinned head
  When the PR head changes before or after posting
  Then final-status is stale
  And no evidence authorizes the new head
```
