---
description: "Completeness, concept-sweep, validator-invocation fabrication."
when_to_use: "Use as a checklist for AP-12 - AP-14."
---

# Anti-Pattern Catalog: AP-12 through AP-14

## AP-12: Asserting completeness from a text search

> "Checked — the convention lists every environment branch."

Text search cannot find omissions. A completeness claim requires enumerating ground truth from its
owning authority (which is often not a file on disk — `git branch -r`, `nx show project`, `git
ls-files`) and diffing it against what the document claims. See
[Absence and Completeness Claims](./absence-and-completeness-claims-zero-result-search-evidence-checklist.md).

## AP-13: A concept sweep whose acceptance criterion is its own regex

> "Swept `\[HUMAN\][^.]*merge` — every surviving hit is correct opt-in framing."

The pattern that produced the edits cannot also be the evidence they are complete; it re-confirms
the author's own assumption about what the target text looks like. See
[A concept sweep validated by its own regex](./absence-and-completeness-claims-concept-sweep-why-one-regex-fails.md).
`plan-checker` rejects any acceptance criterion of this shape.

## AP-14: Citing a validator result without checking its real invocation

> "`md mermaid validate` exits 1 — there is a preexisting defect to fix."

Read how CI and the git hooks actually invoke the validator first. A missing flag invents failures;
a no-op target invents passes.
