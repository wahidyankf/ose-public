---
description: Specifies the eight required sections of a two-pager idea brief, in order, with the content each section must contain.
when_to_use: Use when writing or reviewing the section structure of a plans/ideas/<slug>.md file.
---

# Two-Pager Template

Each `plans/ideas/<slug>.md` has an H1 title plus ~8 short sections, targeting ≤ ~2 printed pages:

1. **`# <Idea title>` + one-line summary** — one sentence a stranger understands, telling a reader
   whether reading on is worth it (the "abstract test"). When the idea originated from a plan, add a
   provenance note: `> Surfaced YYYY-MM-DD during <plan-slug> execution.` or, for a standalone idea,
   `> Idea, added YYYY-MM-DD.`
2. **Problem / context** — a single specific example of why the status quo doesn't work, plus what
   prompted it — not an abstract pain point. **Ground it in concrete data points** where they exist:
   counts, sizes, measurements (e.g. "83 missing step definitions", "AGENTS.md at 29,983 B against a
   30,000 B limit", "4 files drifted"). A data-pointed problem is promotable; a vague one is not.
3. **Why now** — the urgency, dependency, or opportunity window that makes this timely.
4. **Prior art / precedents** — a short survey of who has already tackled this and how: two to five
   named precedents (a tool, pattern, standard, or prior plan), each with a link. _Nothing new under
   the sun_ — most substantial ideas have precedent, and naming it kills reinvention and sharpens
   _Why now_. Keep it **lightweight at capture**: author-supplied links and a clause each, not a
   research report — the deep [`web-researcher`](../../../development/agents/ai-agents.md) prior-art
   study is deferred to promotion (see [Promoting a Two-Pager](./promoting-ideas-and-worked-examples.md#promoting-a-two-pager-to-a-full-plan)).
   Zero prior art on a substantial idea is a smell: you probably haven't looked.
5. **Proposed direction (sketch)** — the core elements at a level a reader _immediately_ grasps; cap
   to roughly three elements. **Explicitly NOT** wireframes, file paths, API signatures, or Gherkin —
   that detail is the backlog plan's job (Shape Up: _"we don't want to over-specify the design with
   wireframes or high-fidelity mocks"_).
6. **Rough scope & non-goals** — in-scope bullets, plus an explicit **Out of scope (for now)** list.
   Non-goals name things a reader would _reasonably expect_ in scope and deliberately exclude them
   ("ACID compliance", not "the system shouldn't crash").
7. **Risks & open questions** — rabbit holes worth flagging now, plus named unknowns that block
   promotion. Zero open questions is a smell: the idea is either over-specified or under-thought.
8. **What success looks like + promotion signal** — the condition that would make the idea worth
   having pursued (observable fact / cited+dated number / explicitly worded expectation — **never a
   fabricated KPI**), and what "ready to become a `backlog/` plan" means for _this_ idea.
