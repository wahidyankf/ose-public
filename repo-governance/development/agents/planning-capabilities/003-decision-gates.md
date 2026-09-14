---
description: >-
  Requires two sequential planning decision gates, fixes the protocol both use, and requires each to leave a durable
  decision record.
when_to_use: >-
  Use before authoring a plan, after completing a draft, or when defining how choices are presented to a user.
---

# Decision Gates

Planning has exactly two mandatory gates. They are sequential and they do not merge.

| Gate       | Runs                                          | Resolves                                                |
| ---------- | --------------------------------------------- | ------------------------------------------------------- |
| pre-write  | before any plan document is authored          | approach, scope, constraints, and every material branch |
| post-write | after a complete draft, before quality review | what only became visible once the plan existed          |

## The Pre-Write Gate Blocks Authoring

No plan document is written until the pre-write gate completes. Not a draft README, not a skeleton `delivery.md`.

The reason is not procedural tidiness. A plan written before its choices are resolved has already made them, and the
gate that follows becomes a review of decisions rather than a chance to make them. People defend what they have written;
that is not a character flaw, it is what happens.

## The Post-Write Gate Is Separate

A complete draft reveals things the pre-write gate could not have asked about: a dependency that only appeared once the
phases were ordered, a seam that turned out to be in the wrong place, an acceptance criterion that cannot be tested as
stated.

Folding both gates into one interview means asking those questions before the information needed to answer them exists.
Skipping the second means never asking them.

## The Shared Protocol

Both gates use the same protocol:

1. **Inspect first.** Read the repository before asking. A question the repository already answers spends the user's
   attention on something the gate should have found.
2. **Present mutually exclusive choices.** Options that overlap cannot be chosen between.
3. **Give exactly one recommendation.** Not none — that pushes the judgement back to the person who asked for help. Not
   several — that is the absence of a recommendation, described at greater length.
4. **Always retain an open alternative and a discussion alternative.** The offered options are the ones that were
   thought of, and a gate that cannot accept an unlisted answer will get a bad listed one instead.
5. **Resolve every material branch.** A gate that leaves one open has deferred it to whoever hits it mid-execution, with
   less context and more pressure.

In this repository the [Grilling-With-Options Convention](../../workflow/grilling-with-options.md) owns the question
format, and the `grill-me` skill carries it into both gates.

## Both Gates Leave a Record

The selected choice and the reason for it are traceable from the plan itself, without conversation history.

Conversation is not durable and is not shared. Six months later the question is always the same — was this considered,
or overlooked? — and only a written record answers it.
