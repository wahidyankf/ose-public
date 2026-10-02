---
description: "Runs web-usability-tester after Phase 1 integrates, then folds its UWT-### findings, walkthrough, and USS-### spec-suggestions into the same plan."
when_to_use: "Use when checking what the spec-blind usability tester is dispatched with, or how its results are kept distinct from the exploratory findings."
---

# Phase 2 — Usability Pass + Integrate

Only after Phase 1 has integrated, run the spec-blind tester and fold its results into the **same**
plan. Also passive / non-destructive.

**Agent**: `web-usability-tester` — spec-blind. Deliberately ignores specs/source/mockups; judges
only first-time-user perception against Nielsen's 10 heuristics (0–4 severity), cognitive walkthrough,
information scent, edge-case UX states (empty/zero-result/loading/error), and responsive usability;
produces a findings catalog `UWT-###`. Emits no spec-_gaps_ (gap analysis requires reading the specs,
which it refuses), but MAY emit `USS-###` **spec-suggestions** — Gherkin scenarios for behaviour a
first-timer expects but the page lacks, each flagged as a spec-blind candidate for reconciliation.

- **Args**: same as Phase 1.
- **Output**: Returns its findings + `walkthrough` + any `USS-###` spec-suggestions as structured text.

**Integrate**: Add a **separate** `## Usability findings (UWT-###)` section to `findings.md` and the
`walkthrough.md` transcript, merge the usability slice into README/brd/prd, and add a short
**cross-reference note** flagging where an EWT and a UWT describe the same underlying defect (e.g. the
`html lang="en"` locale issue both will catch) so the shared root cause is fixed once. The findings
of the two sources MUST remain in their own labelled sections — a reader must always be able to tell
an exploratory finding from a usability finding. Carry the usability tester's `USS-###`
**spec-suggestions** into the plan's spec coverage too — keep them labelled as spec-blind suggestions
distinct from the exploratory `SG-###` spec-gaps, and let the Phase 4 grill decide which to accept into
`specs/**`.

**Success criteria**: Both findings sections present and source-attributed in one `findings.md`;
`SG-###` and `USS-###` spec proposals captured and kept distinct.
