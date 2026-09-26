---
description: Defines which documents the ban covers, what counts as an effort estimate, and what stays permitted.
when_to_use: Use for a quick scope check before writing or flagging a duration.
---

# What

**Banned — in plan documents only**:

- Plan documents are the core documents at every lifecycle stage: `README.md`, `brd.md`, `prd.md`,
  `tech-docs.md` or `tech-docs/`, and `delivery.md`, plus idea two-pagers and other plan-stage briefs
- A time estimate is any duration or date stated as the effort or completion of the planned work:
  "Phase 1: 2 days", "Implementation estimate: 2-3 weeks", "Target completion: next Friday",
  "a quick afternoon's work"

**Not an estimate — permitted in plan documents**:

- Durations that specify the product or its operation: a retention period, a timeout, a token
  lifetime, a CI polling interval, a measured benchmark
- Historical dates: when a decision was made, when a source was accessed, a plan's completion date
  in its `done/` folder name

**Permitted everywhere else, labelled as an estimate**:

- Conversation with an agent, and execution status updates
- Git-ignored scratch, a plan's `evidence/`, and its `learnings.md`
- Tutorials, how-to guides, reference, and all other documentation
