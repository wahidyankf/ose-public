---
name: api-http-propagation
description: >-
  Repairs the rows of a frozen api-http-quality ledger in the service's source, tests, contract, and specification, each
  repair landing with a reproducing test; the api-http family's sole writer.
when_to_use: >-
  Use when the API HTTP Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to repair.
---

# API HTTP Propagation

## Contract

This is the `api-http` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The HTTP service's source, its tests, its published contract, and its behaviour specification. A web interface that
consumes the service belongs to [UI Web Propagation](ui-web-propagation.md).

## Executor

`swe-developer`, in its Apply Findings mode, loading the `developing-applications` skill.

## Row Verification

A row closes when its reproducing test fails before the repair and passes after it, per
[Regression Tests](../../development/quality/regression-test-mandate.md), and, when the
interface runs as a service, it was rebuilt and redeployed before the next audit. A build or deployment error marks the
row `not-resolved`. Each ledger row ends `resolved`, `not-resolved`, `not-applicable`, or `needs-decision`, with
evidence.

## Family Rules

### Entry

The [API HTTP Quality Gate](api-http-quality-gate.md) hands over a frozen ledger of findings its judge,
`swe-api-tester`, raised, or an explicit request names its rows.

- `findings` (`file`, required): the frozen ledger, each row with its request and response.

### Sequence

1. **Reproduce first.** Replay each row's request against the running service, with data isolated per
   Test Data Isolation. A row that no longer reproduces is
   `not-applicable`, with the replay as evidence.
2. **Write the failing test, then repair** the handler, validation, or authorization the row names.
3. **Specify what is correct but unspecified.** Behaviour that is right but absent from the specification gains
   scenarios there, rather than a code change.
4. **Leave breaking changes to their owner.** A repair that changes the published contract in a way existing callers
   would notice, or widens what a role may reach, is `needs-decision`.
5. **Rebuild and redeploy** the service, then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status,
test, and evidence. Recorded requests and responses carry no secret or personal data. The caller commits the repairs. A
rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run api-http-propagation with the ledger the api-http quality gate froze for the staging address.
```

## Related Workflows

- [API HTTP Quality Gate](api-http-quality-gate.md) judges the running service and hands its blocking rows here.
- [Red, Green, Refactor](../../development/workflow/test-driven-development.md) is the test-first cycle each repair follows.
