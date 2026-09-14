---
description: >-
  Makes AI execution the default for delivery items, closes the exception set to four cases, and rules out significance
  as a reason.
when_to_use: >-
  Use when assigning an executor label to a checklist item, or when an item is proposed for human ownership.
---

# Executor Authority

Every delivery item carries an executor label. The default is `[AI]`.

## The Closed Exception Set

`[HUMAN]` applies in exactly four cases:

| Case                             | Why it cannot be delegated                           |
| -------------------------------- | ---------------------------------------------------- |
| unavailable credential or access | the executor cannot obtain it                        |
| physical action                  | it happens outside any system the executor can reach |
| external authority               | someone else's approval or action is required        |
| genuinely unavailable decision   | the information needed to decide does not exist yet  |

The set is closed. A fifth case is not a new exception; it is one of these four, or it is not an exception.

## Significance Is Not a Reason

A change being consequential, irreversible, expensive, or public-facing does **not** transfer it to a human. If it falls
within granted authority and inside the repository's safety boundaries, it stays `[AI]`.

This is the rule most often violated, and it is violated with good intentions. Marking the important items `[HUMAN]`
feels careful. What it actually does is convert a plan into a request for supervision — and supervision is not a
verification. A human who ticks an item because it looked right has added a signature, not evidence.

What consequence genuinely calls for is different, and stronger:

- **evidence** proportionate to the stakes, recorded rather than asserted;
- **reversibility** — a stated rollback that has been thought through before the item runs; and
- **authorization**, granted once, explicitly, and recorded, rather than requested repeatedly at each step.

An item that has those is safe to execute. An item that lacks them is not made safe by a human label; it is made
untraceable, because the reasoning moves out of the plan and into somebody's memory.

## Uncertainty Becomes a Bounded Checkpoint

Where the outcome is genuinely uncertain, the item does not become `[HUMAN]`. It becomes a checkpoint with a predeclared
fallback: what is attempted, how many attempts, and what happens at the ceiling.

The fallback is decided when the plan is written. Deciding it at the ceiling means deciding it under exactly the
conditions that produce bad decisions — partial information, sunk effort, and pressure to continue.
