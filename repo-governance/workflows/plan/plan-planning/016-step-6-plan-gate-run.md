---
description: Invokes the plan quality gate and defines how each verdict is handled.
when_to_use: Use when running the plan-quality-gate workflow as Step 6 of plan-establishment.
---

# Step 6. Quality Gate (Sequential)

Run the [plan-quality-gate](../../quality/plan-quality-gate.md). This step is one of the gate's named callers; no
workflow outside its Entry list may invoke it without the user naming it explicitly.

Follow the workflow with:

- **Input** `subject`: the resolved `<plan-dir>`
- **Input** `mode`: `normal` unless the user names another; `max-cycles`: `3`
- **Output**: `verdict`, `ledger`

**Success criteria**: the gate returns a verdict, and the plan's `delivery.md` records it in one line.

**On `FAIL` or `BLOCKED`**: read the returned ledger and give each open blocking row an owner, as the gate's Verdict
table requires. Verdicts are advisory and the gate never reruns itself: do not re-run it in a loop hoping for a
different verdict. Surface the open rows to the user and name the change or decision each one needs.

## Related Documents

- [Plan Quality Gate](../../quality/plan-quality-gate.md) — the gate this step invokes.
- [Quality Gate Contract](../../../development/workflow/quality-gate-contract.md) — its inputs, cycle ceiling, and
  verdicts.
