---
description: "Index-staleness and competing-convention edge cases."
when_to_use: "Use for the index-staleness edge case."
---

# Absence and Completeness Claims (HARD): A Concept Sweep Validated by Its Own Regex Measures Phrasing, Never Coverage (part 3)

Rule 6 also covers the related **index-staleness** case: a surface inventory is naturally built from
files that _state_ a rule, while parent index READMEs, catalog tables, and "Related Documentation"
blurbs merely _summarize_ it — and go stale identically. Expand every inventory entry `X` with
"every index or README that links to and characterizes `X`", derived mechanically from inbound
links rather than from the author's recall.

**Hardest case — a competing convention**: an entire document whose _thesis_ is the old default
contributes only a couple of matching lines, so by hit-count it looks like a minor sweep target.
Most of its text never contains the swept literal at all. When a delta **inverts** an existing rule,
require an explicit inventory entry for every convention whose H1 or `description:` frontmatter
names that rule — those files need **reading**, not grepping.

**Acceptance-criterion rule (HARD)**: an acceptance criterion whose only evidence is the same regex
the delivery step used to make its edits is invalid. Something other than the editing instrument
MUST confirm convergence.
