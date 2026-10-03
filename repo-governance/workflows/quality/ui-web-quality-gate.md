---
name: ui-web-quality-gate
description: >-
  Judges a running web user interface against its design, accessibility, and behaviour specifications in at most three
  bounded cycles, and returns one advisory verdict.
when_to_use: >-
  Use when a delivery ships or changes a reachable web user interface, before its change is merged.
---

# UI Web Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to a running web user interface. An HTTP interface has its own gate,
[API HTTP Quality Gate](api-http-quality-gate.md).

## Entry

The gate starts only on an explicit request that names it, or from the surface-conditional tester gates of
[Planning](../plan/plan-planning.md) and [Plan Execution](../plan/plan-execution.md) for a UI-bearing plan. The interface must be reachable, its
specification must resolve, and every interaction in scope must be safe to run against the target's data, per
Test Data Isolation.

## Inputs

| Input        | Type    | Values                                                       | Default  |
| ------------ | ------- | ------------------------------------------------------------ | -------- |
| `subject`    | string  | The running address or component set, with its specification | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`                             | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                                   | 3        |

A subject whose specification does not resolve counts as missing. Any other `max-cycles` value, or a missing subject,
refuses to start.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                     | Owned by                            | This repository runs                 |
| -------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Component behaviour the tests pin            | the unit and component test suites  | `test:quick`                         |
| Scripted journeys pass in a browser          | the end-to-end browser suite        | each `*-fe-e2e` project's `test:e2e` |
| Types, lint, and formatting of the UI source | the type checker, linter, formatter | `typecheck`, `lint`, `format-staged` |

A property no tool of its own owns leaves the table and becomes judgeable. No declared gate runs an accessibility
scanner, so accessibility is judgeable.

## Cycle

Each cycle is one full audit by the judge, `swe-web-tester` under its `spec` charter, and one repair by
[UI Web Propagation](ui-web-propagation.md), run by `swe-developer` in its Apply Findings mode, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The judge
may read findings other passes recorded on the same build, and judges, through the interface's components and
interactions:

- behaviour against the specification's scenarios, including empty, error, and loading states;
- fidelity to the adopted design rules and design system;
- accessibility that no scanner settles: focus order, keyboard paths, names that make sense, and meaning carried by more
  than colour; and
- usability: whether a first-time user can finish each specified task without guessing.

A tester rating on another severity scale maps severity, never priority, onto the criticality levels.

How the writer repairs and verifies each row, with a reproducing test and a redeploy, is in
[UI Web Propagation](ui-web-propagation.md).

## Termination

The contract's
[termination table](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md#termination)
applies unchanged. This gate adds no row.

## Verdict

| Verdict              | The caller                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| `PASS`               | records the verdict and continues                                                   |
| `PASS_WITH_FINDINGS` | records the verdict and the open non-blocking rows, and continues                   |
| `FAIL`               | gives each open blocking row an owner (idea brief, plan item, or issue), continues  |
| `BLOCKED`            | records the cause (tooling, input-changed, or unavailable), then acts as for `FAIL` |

No verdict stops the caller. Merge readiness stays with the repository's deterministic gates and
[Pull Request Merge](../../development/workflow/pr-merge-protocol.md).

## Ledger

`local-tmp/quality/ui-web/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). Each row
keeps its reproduction steps. It is never committed.

## Example Usage

```text
Run ui-web-quality-gate on the staging address and its checkout specification.
```

## Related Workflows

- Exploratory and Usability Review explores a running application for what no
  specification states.
- [API HTTP Quality Gate](api-http-quality-gate.md) judges the HTTP interface behind it.
