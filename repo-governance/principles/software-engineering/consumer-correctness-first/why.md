---
description: Why ambiguity becomes misuse and why descriptive surfaces fail loudly.
when_to_use: Use when justifying a longer or stricter surface in a design discussion or code review.
---

# Why

## Ambiguity Becomes Misuse

Consumers cannot read maintainer intent. When a surface is ambiguous — a vague error, two names
for one thing, a quietly applied default — each consumer guesses, and some guesses become misuse.
Misuse repeated across consumers becomes incidents.

## Descriptive Surfaces Fail Loudly

A descriptive error moves the cost of a mistake to the point where it happens: the consumer sees
the cause and the fix together, while the context is still fresh. A terse surface moves that
cost downstream, where the cause is gone and only the symptom remains.

## Shorter Is Not Simpler

Cutting words from an error, a name, or a contract rarely cuts complexity; it moves the
complexity into every consumer's head. The longer surface that prevents one misuse is cheaper
than the shorter one that permits ten.
