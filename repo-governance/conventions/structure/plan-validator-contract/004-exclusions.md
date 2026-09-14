---
description: >-
  States what plan-structure validation deliberately does not judge, and why leaving those questions to review is the
  correct boundary.
when_to_use: >-
  Use when deciding whether a proposed check belongs in the validator or in review.
---

# Exclusions

The validator checks structure. It does not judge the plan.

## Not Validated

| Not checked                                      | Why                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| whether the writing is clear                     | no mechanical proxy for clarity survives contact with a determined author                                                                  |
| whether the approach is sound                    | this is the judgement the plan exists to record, not a property of its shape                                                               |
| whether acceptance criteria are the right ones   | correctness against intent is not visible in the text                                                                                      |
| whether the work is worth doing                  | settled by grooming and the pre-write gate, before validation applies                                                                      |
| whether a checklist item is granular enough      | the boundary is a judgement about the work, not about the line                                                                             |
| whether a companion set genuinely needs ordering | declaring an order is a choice; only the resulting names are checkable                                                                     |
| whether a filename is semantically odd           | word shapes do not prove meaning                                                                                                           |
| a plan root's `evidence/` and `assets/` folders  | artifact folders beside the documents, which [Additional File Purposes](../plans/multi-file-structure-additional-file-purposes.md) permits |

## Why the Boundary Matters in Both Directions

A structural rule left to human review gets applied inconsistently, and inconsistently is the same as not at all for
anyone relying on it.

A judgement call encoded as a rule gets enforced in cases nobody considered. It will be correct most of the time and
confidently wrong the rest, and the author will work around it rather than argue — which quietly makes the plan worse in
order to satisfy a check.

## The Filename Case

This contract checks that a companion name is lowercase and hyphen-separated after its ordinal. That is a shape.

It does not check whether the name is a good one. A separate general filename rule may reject a closed, stated set of
mechanical continuation patterns — a `-part-2` suffix, a `-continued` suffix — but that rule is not part of plan
validation, and no rule here decides that a name looks multi-topic or fragmentary. A validator making that call would be
pretending that word shapes prove meaning.

## Excluded Trees

Archived plans under `done/` are validated for lifecycle and slug form only. Their contents are history, and rewriting
history to satisfy a rule introduced later would destroy the record the root exists to keep.
