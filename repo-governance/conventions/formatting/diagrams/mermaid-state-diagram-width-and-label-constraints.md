---
description: "Specifies width and label constraints specific to Mermaid state diagrams."
when_to_use: "Use when authoring or fixing a Mermaid state diagram that has wide or long labels."
---

# State Diagram Width and Label Constraints

`stateDiagram-v2` and `stateDiagram` (v1) diagrams are subject to the same width and label rules
as flowcharts. `./rhino md mermaid validate` checks only part of them — see the automated check
below.

**Width rule**: Count the number of distinct state nodes at each depth level
(depth = number of transition steps from the initial pseudostate `[*]`). If any depth level has
more than **4 states**, the diagram is too wide. Pseudostates (`[*]`),
stereotyped states (`<<choice>>`, `<<fork>>`, `<<join>>`), and the nodes inside composite
(nested) states are all counted. The composite state itself is treated as a single node at its
own depth, and its internal sub-states contribute a separate depth count within the composite
scope.

**Label rules**:

- **State display names**: The display name on a state node (e.g., `s1 : My State Name`) is
  subject to the ≤ 20-grapheme limit per line. Labels split with `<br/>` are measured
  per segment.
- **Transition edge labels**: The label on a transition arrow (e.g., `s1 --> s2 : long label`)
  is subject to the ≤ 20-grapheme limit. Long trigger/condition names must be abbreviated
  or split.

**Skipped lines**: Note blocks (`note right of s1` … `end note`), comment lines (`%%`),
and boundary markers (`--`) do not count toward width or label limits.

**Fix strategies**: The same four strategies from the Flowchart Width Violation Fix Strategy
Guide apply (see above). Direction flip does not apply to state diagrams (they have no `LR`/`TD`
directive); use Diagram Splitting or Sequential Chaining when width is exceeded.

**Automated check**: Same gate and location as flowcharts — the `md-mermaid` registry gate
runs at pre-commit (staged `.md` files) and on the pull-request surface in `pr-quality-gate.yml`.
On state diagrams it checks `accTitle`/`accDescr`, the colour palette, and labels declared as
`state "…" as id` against the 20-grapheme limit. It does not measure width, `id : name` display
names, or transition labels, so check those by hand.
