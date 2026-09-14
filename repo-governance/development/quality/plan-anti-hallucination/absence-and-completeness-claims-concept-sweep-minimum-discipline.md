---
description: "The six-point minimum discipline for a concept sweep."
when_to_use: "Use when designing a concept sweep."
---

# Absence and Completeness Claims (HARD): A Concept Sweep Validated by Its Own Regex Measures Phrasing, Never Coverage (part 2)

**Minimum discipline for a concept sweep** (all six; the last two are the ones that actually work):

1. Search **both term orders** — `A.*B` and `B.*A`.
2. Search each term **alone**, unbracketed and case-insensitively, accepting the noise.
3. Grep the **worked examples and code comments** specifically — a stale `PASS:` example teaches the
   wrong rule more forcefully than stale prose states it.
4. **Read the hits; never count them.** A count is not a signal here: correctly-framed opt-in
   sentences added by the fix legitimately make the count **rise**, so neither a falling nor a rising
   count proves anything.
5. **Enumerate every copy of the rule and treat them as one atomic edit** — the convention plus its
   `*-maker` / `*-checker` / `*-fixer` copies plus any skill that summarizes it. Fixing only the
   "generative source" leaves a checker that flags correct new work as defective and a fixer that
   silently rewrites it. A stale **fixer** copy is strictly worse than a stale convention copy:
   prose misleads a reader, a fixer recipe rewrites the repo unattended at HIGH confidence.
6. **Sweep by inbound link, not by phrasing** — enumerate every file that links to the changed
   document and re-read each referring sentence regardless of its wording. Link targets are stable
   where phrasing is not; this is the only instrument that finds paraphrases.
