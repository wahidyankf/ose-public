---
description: "Why one regex is never an acceptance criterion."
when_to_use: "Use before trusting a single regex sweep as proof."
---

# Absence and Completeness Claims (HARD): A Concept Sweep Validated by Its Own Regex Measures Phrasing, Never Coverage (part 1)

## A concept sweep validated by its own regex measures phrasing, never coverage

When a plan changes a **rule** (who merges, what the default is, which cap applies), the sweep that
proves the change landed everywhere is a **concept** sweep, not a string search. One regex is a
single sampling instrument with known blind spots — it is never an acceptance criterion. Inverting
one merge default in this repository took **four** corrective rounds; each round the edits were
right and the search was wrong, in a different way:

| Round | Sweep used                        | Blind spot it could not see                                                              |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| 1     | `\[HUMAN\][^.]*merge`             | Fixed term order — missed `merged by a human` and every markdown **table cell**          |
| 2     | Only the "generative source" file | The identical boilerplate lived in the convention **and** its maker/checker/fixer copies |
| 3     | `\[HUMAN\][^.]{0,40}merge`        | Assumed a bracketed tag and a plural noun — missed unbracketed singular "human merge"    |
| 4     | Any vocabulary-bound pattern      | **Paraphrases** stating the old rule in words the old rule never used                    |

Round 4 is the decisive one: two survivors read
`- [PR Merge Protocol](...) - Explicit user approval required` — containing neither "human" nor
"merge" as the actor phrase. **No regex over the old rule's vocabulary can ever match a paraphrase
of it.**
