---
description: "Semantically reviews every applicable Gherkin scenario adapter instead of trusting static binding counts"
when_to_use: "Use after adding or materially changing a canonical feature, adapter, exemption, or static behaviour-coverage mechanism."
---

# Gherkin Implementation Review

Prove scenario implementation substance that static binding coverage cannot establish. Run after a
material feature, adapter, exemption, or behaviour-coverage change. Use `full` for a baseline audit.

## Goal and Termination

**Goal**: Prove that each reviewed Given–When–Then path invokes production behaviour and observes independent evidence at the declared boundary.

**Termination**: PASS when every required row passes or carries a valid exemption and all impacted runtime targets pass; FAIL on any missing, partial, placeholder, unsafe, or invalidly exempt row.

## Inputs

- **`scope`** (enum: changed, full, optional, default `changed`) — Review changed scenarios and adapters, or the recursively discovered complete corpus.
- **`owners`** (string, optional, default ``) — Comma-separated Nx behaviour-owner projects; empty means derive owners from the changed scope.

## Outputs

- **`review-report`** (file, pattern `local-tmp/gherkin-implementation-review/gherkin-implementation-review__*.md`) — Non-authoritative row ledger, findings, exemption inventory, commands, and results.
- **`final-status`** (enum: pass, fail) — Semantic review result.

## Steps

### 1. Build the review matrix (Sequential)

**Agent**: [`swe-code-checker`](../../.agents/agents/swe-code-checker.md)

Recursively discover each owner's canonical corpus and expand every Scenario Outline example. Apply
the project-role matrix from the
[BDD standard](../development/behaviour-driven-development.md#project-roles-and-applicable-adapters).
Create one row per expanded scenario and applicable adapter. Record owner, feature, scenario,
adapter, implementation locations, exemption evidence, and `PASS`, `EXEMPT`, or `FAIL`.

**Success criteria**: The expected row count equals expanded scenarios multiplied by their
applicable adapters, with no row subtracted for exemptions.

**On failure**: Record missing ownership, ambiguity, or incomplete applicability as `FAIL`.

### 2. Inspect implementation substance (Sequential)

**Agent**: [`swe-code-checker`](../../.agents/agents/swe-code-checker.md)

Trace each non-exempt path end to end. Given must establish the stated precondition through a
boundary-valid fixture or injected double. When must invoke the production subject or public
boundary named by the scenario. Then must read independently observable evidence caused by that
invocation. Fixtures and cleanup must remain synthetic, isolated, and fail-closed.

Mark `FAIL` for no-op steps, success sentinels, expected-outcome lookup tables, copied expected
values, unrelated assertions, fake operations, or production-data fallback.

A Unit row whose subject is a shell script or harness plugin file passes only under
[Script-Subject Unit Proof](../development/behaviour-driven-development/script-subject-unit-proof.md).
Record the fake behind each collaborator, the private home, the deadline, and the contract the Then
observes. Mark it `FAIL` when any of the five conditions is unmet, when the subject's runner could
load it in process, or when the subject is missing from `test:unit` inputs.

**Success criteria**: Every non-exempt row shows production invocation and independent boundary
evidence. Never convert implementation debt into an exemption.

### 3. Validate exemptions independently (Sequential)

**Agent**: [`swe-code-checker`](../../.agents/agents/swe-code-checker.md)

For each exemption, verify scenario-level placement and its own immediately preceding
`# Exemption(layer): <boundary mismatch>; alternative-proof: <Nx target> / <scenario>` comment.
Require a genuine boundary mismatch and substantive proof from the named unexempted target/scenario.
Review Integration and E2E independently when both annotate one scenario. Confirm Unit proof.

**On failure**: Mark `FAIL`; difficulty, runtime, speed, flakiness, cost, expense, `TODO`, missing
implementation, or unfinished work cannot justify exemption.

### 4. Execute impacted runtime proof (Sequential)

**Agent**: [`swe-code-checker`](../../.agents/agents/swe-code-checker.md)

Run affected `test:unit`, then manually select impacted `test:integration` and `test:e2e` scenarios.
For `full`, run complete applicable suites. Never route Integration/E2E through hooks, PR,
`test:quick`, or `test:coverage:*`.

**Success criteria**: Every selected runtime target exits zero and the report records its exact Nx
command and result.

### 5. Finalize evidence (Sequential)

**Agent**: [`swe-code-checker`](../../.agents/agents/swe-code-checker.md)

Store the report under `local-tmp/`. Record totals, every row, findings, exemptions, commands,
results, and final status. PR evidence may summarize but not replace this ledger.

**Success criteria**: No `FAIL`, missing row, unresolved `PARTIAL`, invalid exemption, or failing
runtime target remains.

## Termination Criteria

- **PASS**: Every required row is `PASS` or valid `EXEMPT`, and impacted runtime targets pass.
- **FAIL**: Any row or runtime target fails, or the matrix cannot prove completeness.

## Example Usage

```text
Run gherkin-implementation-review with scope=changed owners=organiclever-app-web
```

Use `scope=full` without owners for a repository-wide baseline.

## Related Workflows

- [Specs quality gate](./specs/specs-quality-gate.md) validates Gherkin structure, not adapter
  semantics.
- [Rules propagation](./rules/rules-propagation.md) applies when this workflow changes a standing
  repository obligation.
