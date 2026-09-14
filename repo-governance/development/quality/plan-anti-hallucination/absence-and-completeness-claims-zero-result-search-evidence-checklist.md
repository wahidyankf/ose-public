---
description: "Why absence claims fail differently; the four-point checklist."
when_to_use: "Use before citing a zero-result search as evidence."
---

# Absence and Completeness Claims (HARD): Zero-Result Search Evidence (part 1)

The Repo-Grounding Rule above governs **presence** claims ("this file exists"). The mirror-image
claims — **absence** ("no file does X") and **completeness** ("this doc lists every Y") — fail in a
different and more dangerous way: the verification command returns a clean-looking result while
having verified nothing at all. These rules bind every agent that asserts absence or completeness —
`plan-maker`, `plan-checker`, `plan-execution-checker`, and any checker or fixer agent
reporting "zero occurrences found" or "the list is complete".

## A zero-result search is evidence only if the command could have produced a non-zero result

A search that fails to run reports the same thing as a search that ran and found nothing. Before a
zero result may be cited as evidence of absence, all four of the following MUST hold:

1. **The verbatim command is recorded** — in the plan, the audit report, or the delivery note. A
   zero result without its command is unfalsifiable and carries no evidentiary weight.
2. **stderr is NOT suppressed** — `2>/dev/null` on a search command converts a hard tool failure
   into an indistinguishable clean zero. Never append it to a search whose zero result will be
   cited.
3. **The exit status is inspected** — distinguish "ran, matched nothing" (grep exit 1) from "failed
   to run" (exit 2, or a tool-specific usage error).
4. **A known-positive control probe passes** — run the same command shape against a pattern that
   MUST match, in the same tree, and confirm it returns non-zero. Only then does the real query's
   zero mean absence.
5. **The searcher's own folder is excluded when it documents the token** — a clause greping
   repo-wide for a term the plan's own `prd.md` spells out can never reach zero. Add
   `':!plans/in-progress/<slug>'` at authoring time or it is unsatisfiable by construction.

## No-match clauses contradict name-the-removed-thing tests

A plan instructing "write a regression test proving `<removed>` is rejected" and also "grep
returns no match for `<removed>`" contradicts itself: the test must spell the name. Keep the test,
scope the grep away from it, and catch the pairing while authoring.
