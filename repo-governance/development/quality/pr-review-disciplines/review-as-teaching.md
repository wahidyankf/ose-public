---
description: "Binds review findings and replies to be understandable by someone still learning the codebase, and separates critique of code from judgement of people."
when_to_use: "Use when writing a review finding or a fixer reply."
---

# Review as Teaching — Every Finding Is Legible to a Bootcamp Graduate

A PR review is the most-read technical writing this repo produces, and its thread is permanent.
Someone who has completed a coding bootcamp but has not worked on a professional engineering team
learns more from reading past reviews than from any document written
to be read. That makes legibility a requirement of the finding, not a courtesy — a finding only a
specialist can decode teaches nobody, and the review culture it builds is one where people stop
reading.

## What Every Finding Carries

- **The consequence, in plain terms.** What actually breaks, and for whom. `file:line` and a rule
  citation say _where_ and _which rule_; neither says _why it matters_. One sentence.
- **The rule paraphrased, not merely linked.** A bare path is a lookup task. State what the rule
  requires in the finding itself and link for the detail.
- **Terms of art defined on first use**, or replaced with plain words. Precision survives
  translation; jargon is not precision.
- **Enough context to act without prior knowledge of the discussion.** Never "as discussed."

## What Every Reply Carries

A fixer reply is half the conversation. `Fixed: <what changed>` states the change; the reply also
states **why that change resolves the finding**, the reviewed head, and one four-way disposition.
A rejection explains the evidence and boundary so a reader learns the outcome rather than seeing a
dismissal.

## Critique the Change, Never the Author

Anti-sycophantic framing means stating plainly what is wrong. It does not license contempt.
Address the code and the consequence; never the competence, care, or motive of whoever wrote it.
These are compatible: the clearest findings are blunt about the defect and neutral about the
person.

## Not a Licence to Pad

Teaching is a sentence of consequence, not an essay, and the
[governance word budget](../../../conventions/structure/governance-word-budget.md) still applies.
A finding that lectures fails this rule as surely as one that explains nothing.

## Enforcement

None automated, and a finding failing this rule is **not** dropped. The coordinator rewrites it
where it stands — the defect is real and only the wording is unusable — as
[finding-requirements.md](../../../../.agents/skills/pr-review-synthesis-coordination/reference/finding-requirements.md)
requires; that module governs the outcome and this one does not restate it. The reasonableness
filter drops a finding whose **defect** no reader could act on, which is a different failure from a
real defect explained badly.
