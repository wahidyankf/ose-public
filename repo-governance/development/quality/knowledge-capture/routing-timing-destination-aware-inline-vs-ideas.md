---
description: "Inline routing versus explicitly authorized plans/ideas filing."
when_to_use: "Use when deciding inline fix vs. an explicitly authorized plans/ideas two-pager."
---

# Routing Timing: Destination-Aware (Inline vs. Ideas)

Timing has a hard boundary determined by **destination**, not by convenience:

**Hard boundary:** Knowledge Capture MUST NOT create, move, or write any file or folder under
`plans/backlog/`. Its only permitted new future-work plan artifact is an explicitly authorized
`plans/ideas/<slug>.md` two-pager after the overlap scan. Without literal authorization, use
`Reported without plan authorization`. Promotion from an idea to backlog belongs exclusively to the
idea-promotion workflow.

**The boundary admits no exception.** An instruction to file a learning "straight to backlog"
authorizes the `plans/ideas/` two-pager, not a backlog folder, and a carve-out a plan writes into
its own delivery record does not create one — the plan being carved out of is the very plan whose
gates the carve-out would bypass. A backlog artifact that arrived this way is relocated to
`plans/ideas/`, not retro-justified.

- **Non-code homes** (`docs/`, `repo-governance/`, `.agents/agents/`, `.agents/skills/`,
  `post-mortems/`, and any other non-code home): a **small** edit MAY land **inline** in the current
  plan's own commit/PR. A learning implying **large new work** becomes a tracked
  `plans/ideas/<slug>.md` two-pager only when the user literally authorizes that plan artifact.
  Otherwise report it to the user and record `Reported without plan authorization` with the report
  location or conversation handoff.
- **`plans/ideas/` two-pager** (a non-code home): future work becomes a two-pager only when the user
  literally authorizes that artifact. Fold into an existing two-pager rather than duplicating. Do
  not create, move, or write under `plans/backlog/`; the idea-promotion workflow owns the
  evidence-backed transition to a formal backlog plan and carries the code-routing gates forward.
- **Code homes** (`apps/`, `libs/`, tests): per the code-routing downstream rule above, never inline.
  File a separate `plans/ideas/` two-pager only with literal authorization; otherwise use the
  reported terminal state. Never create, move, or write its backlog folder. The Iron Rule 3
  current-plan-blocker carve-out remains unchanged.
- **Discard**: logged with a one-line reason; no further action.

Archival is **BLOCKED** until every `learnings.md` entry reaches one of four terminal states:

1. **Routed inline** (non-code homes only) — the edit has landed in this plan's own commits.
2. **Filed** as an explicitly authorized `plans/ideas/` two-pager — the entry records its path.
3. **Reported without plan authorization** — the entry records the handoff evidence and no plan is created.
4. **Discarded** with a one-line reason.

Nothing is silently dropped, and nothing sits in an open, undecided state at archival time.
