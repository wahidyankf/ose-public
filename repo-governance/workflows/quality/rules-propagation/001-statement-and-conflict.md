---
name: 001-statement-and-conflict
description: >-
  Turns a stated rule into falsifiable statements, tests whether the existing rules already suffice, and settles
  conflict by governance level with every supersession recorded.
when_to_use: >-
  Use during Rules Propagation when writing a rule's statement, deciding a rule needs no change, or settling a
  contradiction with an existing rule.
---

# Statement and Conflict

## One Falsifiable Statement per Obligation

Write each rule as one imperative sentence naming its subject, its obligation, and the condition under which it applies.
The reason goes on its own line, so a gate can quote the rule without its argument. A sentence bundling several
obligations is split, and each part is placed and dispositioned on its own: a bundled rule is how a rule half lands.

A statement passes only when both observations are stated: what shows the rule followed, and what shows it violated. A
clause that can only pass, such as "be careful with migrations", fails. So does one whose violation cannot be seen
without reading someone's intent, and one whose only violation observation is an empty result, because a check aimed at
the wrong thing returns nothing too.

Where a statement fails, offer the owner concrete choices for the violating observation, per
[Decision Gates](../../../development/agents/planning-capabilities/003-decision-gates.md), until it passes or the owner
rules it unfalsifiable by design. An unfalsifiable rule is neither written as guidance nor placed. Its halt and reason
are recorded, and the other rules in the batch continue.

## Sufficiency Before Change

Search three ways: by the subject's term, by the obligation's verb, and by the surfaces the rule would touch, since a
rule restated in other words escapes any single search. Read a list item whole before matching it; a line-by-line search
misses a rule that wraps.

Compare meaning, strength, audience, scope, boundaries, exceptions, and discoverability, not wording or order. When the
effective rules satisfy every one, the rule ends with no change: record the canonical source and the evidence, and write
nothing. A nearby rule, a similar phrase, or an obligation nobody can find is not sufficient.

## Conflict and Overlap

Two compatible rules on one subject are duplication, merged while tidying. Rules conflict only when following one
violates the other, and then the levels in [Governance Layers](../../../repository-governance-architecture.md)
decide:

| Existing rule's level    | Outcome                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| higher than the new rule | the run halts; changing the higher rule is the owner's separate decision           |
| the same level           | the owner decides, and a chosen replacement is recorded as a supersession          |
| lower than the new rule  | the new rule stands, and the lower statement is amended to agree                   |
| unclear                  | treated as the same level, because a guessed level turns a choice into a deduction |

The lower document changes by the narrow edit that removes the disagreement, never a rewrite carrying other opinions. A
higher rule is never edited to fit a lower one.

## Supersession Record

Record each retired statement, the rule replacing it, and where the replacement lives. A rule that disappears without a
record cannot be told apart from one that was never written.
