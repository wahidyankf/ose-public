---
description: The two tests a sentence must pass before the scaffolding class may delete it, why modal absence is not one of them, and the recall bound that makes both tests necessary.
when_to_use: Use when admitting a scaffolding candidate at Step 3d, or auditing one that was admitted.
---

# Scaffolding Admission

The scaffolding class deletes prose that states no obligation. Because "states no obligation" is
exactly the judgement a reduction is most likely to get wrong, admission needs **every** test below.
None alone is sufficient, and a candidate failing any one is not adjudicated — it is dropped.

## The Form Test

The sentence must match one of these enumerated forms. The enumeration is closed: a sentence that
carries no obligation but matches none of them is still refused, because an open judgement of
"carries nothing" is the failure mode this test exists to prevent.

- **Meta-narration** — announces what the document contains rather than binding anyone. "This
  document describes the remediation steps." "The sections below cover each gate in turn."

That is the whole enumeration. It is deliberately one form.

**Heading restatement was tried and withdrawn.** The 2026-09-07 sweep implemented it as word-overlap
between a line and the heading above it. Its highest-scoring matches were progressive-disclosure
pointers — `See [Colour Palette](...) for the full list` — because a good `See` link necessarily
echoes the heading it sits under. The form's best signal and the repo's most
protected construct are the same string shape, so no threshold separates them. Anything readmitting
it needs a discriminator that is not lexical overlap.

## The Convention Exclusion

A sentence a convention **mandates** is never scaffolding, however non-normative it reads. The
document-structure conventions prescribe lead-in lines verbatim — "This convention
implements/respects the following core principles:" appears inside a required-section template — so
deleting one is a convention violation wearing the costume of a cleanup.

This is the same defect the fragmentation class already guards at 3a, where a frontmatter key no
gate reads may still be convention-mandated. Both sweeps need it, for the same reason: no machine
consumer is not the same fact as no obligation.

## The Inventory Test

Removing the sentence must leave the Step 2 extracted obligation set **byte-identical**. A removal
changing the inventory by even one entry is rejected outright.

This is what makes the class cheap to verify: the proof already exists. The same exact-match diff
that [Step 7](./008-step-7-preservation-verification.md) runs over the whole corpus is, at candidate
scale, the admission test itself. No new instrument is built, and no new judgement is introduced.

## Modal Absence Is Not a Test

Scanning for `must`, `never`, or `required` and treating their absence as evidence would admit real
rules. "Filenames are lowercase kebab-case" binds absolutely and contains no modal; so does "The
instruction surface is a fixed-size cache." A sweep shortcutting to modal-matching produces
retirement candidates mislabelled as scaffolding, which is how an obligation removal escapes Step
5's per-item approval and lands under a low-risk class's blanket one. That misroute is the whole
risk now that every class discovers by default: the approval path, not the class list, is what
stops a removal.

## The Recall Bound

The inventory test proves the extractor found no obligation in the removed text. It does not prove
none was there. That gap is real and does not close, which is why the form test is a closed
enumeration rather than an agent's assessment: the two tests fail independently, so a candidate
surviving both has cleared two unrelated filters rather than one filter twice.

A file whose scaffolding is its only content is a **retirement** candidate, not a scaffolding one.
Route it to [Step 3c](./004-steps-3-4-candidate-discovery-and-ranking.md) and its per-item approval
rather than emptying the file one admitted sentence at a time.

## Related

- [Steps 3-4](./004-steps-3-4-candidate-discovery-and-ranking.md) — the sweep these admit into.
- [Step 7](./008-step-7-preservation-verification.md) — the diff this class reuses as its test.
- [Scope Boundary](./002-scope-boundary-and-non-writing-invariant.md) — why paraphrase stays refused.
