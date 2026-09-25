---
description: "Run one explicitly requested semantic PR-review pass and post one consolidated COMMENT review."
when_to_use: "Use only when a user explicitly requests one semantic review pass for an open pull request."
---

# Single-Pass PR Review Workflow

Run one semantic review only when the user explicitly asks. It reviews every change type, including
prose, governance, and plans. It never classifies eligibility, fixes findings, waits for CI,
retries, or decides merge readiness.

[`pr-review-scout-maker`](../../../.agents/agents/pr-review-scout-maker.md) pins base/head,
selects a risk route, and builds shared context. Selected specialists review concurrently;
[`pr-review-synthesis-maker`](../../../.agents/agents/pr-review-synthesis-maker.md)
deduplicates and posts exactly one GitHub `COMMENT` review. A trivial route still gets a generalist
synthesis pass. `pr-review-fixer` never participates.

## Goal and Termination

**Goal**: Review one pinned pull-request head through risk-routed specialists and publish one stale-safe consolidated review

**Termination**: Return after one consolidated review post, or return stale/failed without retrying

## Inputs

- **`pr`** (string, required) — PR number or URL identifying the open pull request
- **`probe-class`** (string, optional, default `general`) — Optional semantic angle supplied by an explicit caller or enclosing cycle
- **`prior-review-state`** (string, optional, default `empty`) — Authenticated settled findings to deduplicate; empty for an independent pass
- **`delegated-gate-ids`** (string, optional, default `empty`) — Exact lifecycle-owned predicates supplied by a caller; empty suppresses nothing
- **`lifecycle-evidence`** (string, optional, default `empty`) — Caller-supplied lifecycle evidence carried unchanged; this workflow never waits for it
- **`leak-review-evidence`** (string, optional, default `pending`) — Authenticated current-head ose-pr-leak-review:v1 evidence, or pending

## Outputs

- **`final-status`** (enum: clean, findings, stale, failed) — Terminal result of this single pass
- **`reviewed-head`** (string) — Pinned head SHA used by every reviewer and line anchor
- **`review-id`** (string) — GitHub review ID, or null when no review was posted
- **`severity-counts`** (string) — Counts for critical, high, medium, and low findings
- **`pass-record`** (string) — Authenticated ose-pr-review-pass:v1 record, or null when posting did not occur

## Contents

- [Execution](./pr-review/execution.md) — Defines pinned-head routing, fan-out, synthesis, and
  posting. Use when running or implementing a single semantic pass.
- [Evidence and Outcomes](./pr-review/evidence-and-outcomes.md) — Defines pass authentication,
  terminal states, and no-retry rules. Use when posting or consuming a pass result.
- [Success Criteria](./pr-review/success-criteria.md) — Defines clean, findings, and stale scenarios.
  Use when validating the workflow's observable behaviour.

`clean` describes this pass only. It is not approval or a merge gate.

## Example Usage

```text
Run one pr-review pass for PR 412.
```

## Related Workflows

- [`pr-review-cycle`](./pr-review-cycle.md) — optional iterative composition with a fixer and CI.
- [`pr-quality-gate.yml`](../../../.github/workflows/pr-quality-gate.yml) — independent default
  automated integration gate.
