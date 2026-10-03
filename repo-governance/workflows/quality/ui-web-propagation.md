---
name: ui-web-propagation
description: >-
  Repairs the rows of a frozen ui-web-quality ledger in the interface's source, tests, and specification, each repair
  landing with a reproducing test; the ui-web family's sole writer.
when_to_use: >-
  Use when the UI Web Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to repair.
---

# UI Web Propagation

## Contract

This is the `ui-web` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The web interface's source, its tests, and its behaviour specification. The HTTP interface behind it belongs to
[API HTTP Propagation](api-http-propagation.md), and the design system it consumes changes only through its own owner.

## Executor

`swe-developer`, in its Apply Findings mode, loading the `developing-frontend-ui` skill.

## Row Verification

A row closes when its reproducing test fails before the repair and passes after it, per
[Regression Tests](../../development/quality/regression-test-mandate.md), and, when the
interface runs as a service, it was rebuilt and redeployed before the next audit. A build or deployment error marks the
row `not-resolved`. Each ledger row ends `resolved`, `not-resolved`, `not-applicable`, or `needs-decision`, with
evidence.

## Family Rules

### Entry

The [UI Web Quality Gate](ui-web-quality-gate.md) hands over a frozen ledger of findings its judge, `swe-web-tester`,
raised, or an explicit request names its rows.

- `findings` (`file`, required): the frozen ledger, each row with its reproduction steps.

### Sequence

1. **Reproduce first.** Replay each row's reproduction steps against the running interface, with data isolated per
   Test Data Isolation. A row that no longer reproduces is
   `not-applicable`, with the replay as evidence.
2. **Write the failing test, then repair** the component or interaction the row names.
3. **Specify what is correct but unspecified.** Behaviour that is right but absent from the specification gains
   scenarios there, rather than a code change.
4. **Leave design and behaviour choices to their owner.** A repair that changes the design system, or changes behaviour
   the specification does not settle, is `needs-decision`.
5. **Rebuild and redeploy** a served interface, then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status,
test, and evidence. The caller commits the repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run ui-web-propagation with the ledger the ui-web quality gate froze for the staging checkout.
```

## Related Workflows

- [UI Web Quality Gate](ui-web-quality-gate.md) judges the running interface and hands its blocking rows here.
- [Red, Green, Refactor](../../development/workflow/test-driven-development.md) is the test-first cycle each repair follows.
