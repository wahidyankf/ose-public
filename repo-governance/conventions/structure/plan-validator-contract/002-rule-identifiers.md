---
description: >-
  Freezes the twenty plan-structure rule identifiers and the exact message each one emits.
when_to_use: >-
  Use when implementing a rule, matching on a diagnostic, or proposing a new rule.
---

# Rule Identifiers and Messages

Identifiers are stable. A rule whose meaning changes gets a new identifier rather than a new definition.

## Lifecycle

| Rule                 | Message                                                     |
| -------------------- | ----------------------------------------------------------- |
| `PLAN-LIFECYCLE-001` | `plan root is not one of ideas, backlog, in-progress, done` |
| `PLAN-LIFECYCLE-002` | `live plan slug carries a date`                             |
| `PLAN-LIFECYCLE-003` | `done plan slug has no YYYY-MM-DD__ prefix`                 |
| `PLAN-LIFECYCLE-004` | `plan slug is not lowercase hyphen-separated`               |
| `PLAN-LIFECYCLE-005` | `plan slug occupies more than one lifecycle root`           |

## Documents

| Rule                | Message                              |
| ------------------- | ------------------------------------ |
| `PLAN-DOCUMENT-001` | `required plan document is missing`  |
| `PLAN-DOCUMENT-002` | `plan carries both technical shapes` |
| `PLAN-DOCUMENT-003` | `plan carries no technical shape`    |

## Companions

| Rule                 | Message                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `PLAN-COMPANION-001` | `companion ordinal is not exactly three digits`                      |
| `PLAN-COMPANION-002` | `companion ordinals are not contiguous from 001`                     |
| `PLAN-COMPANION-003` | `companion ordinal is used more than once`                           |
| `PLAN-COMPANION-004` | `companion name after its ordinal is not lowercase hyphen-separated` |
| `PLAN-COMPANION-005` | `companion exists but the entrypoint does not list it`               |
| `PLAN-COMPANION-006` | `entrypoint lists a companion that does not exist`                   |

## Acceptance Criteria

| Rule                 | Message                                                  |
| -------------------- | -------------------------------------------------------- |
| `PLAN-CRITERION-001` | `acceptance identifier is defined more than once`        |
| `PLAN-CRITERION-002` | `delivery item cites an undefined acceptance identifier` |

## Delivery

| Rule                | Message                                            |
| ------------------- | -------------------------------------------------- |
| `PLAN-DELIVERY-001` | `checklist item carries no executor label`         |
| `PLAN-DELIVERY-002` | `executor label is not AI or HUMAN`                |
| `PLAN-DELIVERY-003` | `delivery phase heading carries no phase number`   |
| `PLAN-DELIVERY-004` | `archival items appear before a substantive phase` |

## What a Delivery Item Is

The three delivery rules above all turn on one question, so the answer is frozen here rather than left to each
implementation. A bullet is a checklist item when it carries a task marker -- `- [ ]` or `- [x]` -- or when it opens
with a bare executor label, `- [AI] ...`. The label may be code-formatted once a marker has already made the bullet an
item, so ``- [x] `[AI]` ...`` is an item; a quoted label with no marker is a plan explaining its own notation and is
not. A bullet opening with a markdown link is never an item.

A second-level heading is a delivery phase only when it holds items. `## Execution Checkout`, `## Delivery Boundaries`
and a trailing `## Related Documents` are therefore read as the structure they are, not as unnumbered phases.

An implementation that infers this instead of reading it reports a plan's own prose as a defect.

## Suppression Within a Family

Rules in a family are evaluated in identifier order. A rule that cannot be meaningfully evaluated, because an earlier
rule in the same family already failed for the same subject, is not reported.

`PLAN-COMPANION-002` is not reported for a set whose ordinals already failed `PLAN-COMPANION-001`: contiguity of a
malformed ordinal has no meaning, and reporting both would make one defect look like two.

Suppression never crosses families. A plan can fail a lifecycle rule and a delivery rule at once, and both are reported,
because neither depends on the other.

## Message Discipline

A message states what is wrong. It does not state what to do, because the remedy depends on which of two correct things
the author meant, and a validator does not know.

`PLAN-DOCUMENT-002` says the plan carries both shapes. It does not say to delete one, because which one to delete is the
decision the author has to make.

## Adding a Rule

A new rule needs a new identifier in the right family, a message in this table, at least one rejecting fixture, and — if
its boundary is subtle — an accepting fixture that comes close to tripping it and correctly does not.

A rule with no fixture is a claim about behaviour that nothing checks.
