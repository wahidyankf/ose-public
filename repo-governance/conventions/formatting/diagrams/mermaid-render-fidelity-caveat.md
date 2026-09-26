---
description: "Warns that a syntactically source-correct Mermaid diagram can still render incorrectly, with guidance on catching this."
when_to_use: "Use when a Mermaid diagram passes syntax validation but still renders wrong, to understand why and how to check."
---

# Render-Fidelity Caveat: Source-Correct Can Still Be Render-Wrong

The character limits above are a **proxy**, not a guarantee. `stateDiagram-v2` edge labels can
**clip in GitHub's renderer** — the diagram is syntactically valid, passes every text-based
validator, and is still silently wrong as displayed to the reader. **No text-based validator can
see this**, because the defect exists only in the rendered output.

Two consequences bind any author or checker working on state diagrams:

1. **Visually confirm state diagrams in the GitHub renderer** (or an equivalent Mermaid preview)
   before treating them as correct. A green `md mermaid validate` is necessary, not sufficient.
2. **Character count does not predict clipping.** Observed in this repository: labels clipped at
   **30** and **33** characters while a **40**-character label rendered fine. Clipping depends on
   glyph widths and diagram layout, not raw length. Any future validator rule MUST therefore derive
   its threshold **empirically** from rendered output, never assume a simple character count.
3. **A repo-wide rule on state-diagram edge labels must WARN, never FAIL.** Measured blast radius
   across this repo's `stateDiagram` edge labels: **31** labels over 40 chars, **202** in the
   31–40 band, **983** in the 26–30 band, and roughly **11,800** at or under 25. A repo-wide
   failing gate on a heuristic threshold would block on a defect it cannot actually detect, across
   a corpus this large.

   This does not exempt flowchart labels, where the 20-character limit is
   [Rule 3](./common-syntax-errors-label-constraints-rule-3-line-length.md), not a heuristic. The
   `md-mermaid` gate FAILs any node or edge label segment above 20 graphemes: single-line labels
   of 26 and 29 graphemes were observed clipped on GitHub, and a false positive costs only a
   `<br/>`. That limit is necessary, not sufficient, so consequence 1 still applies.

A candidate `Rhino` WARN-level rule is tracked as a two-pager idea brief at
[`plans/ideas/mermaid-state-label-render-clipping-warn.md`](../../../../plans/ideas/q2-not-urgent-important/mermaid-state-label-render-clipping-warn.md).
