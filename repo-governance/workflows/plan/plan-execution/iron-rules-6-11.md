---
description: "States the remaining six non-negotiable execution rules: CI verification, thematic commits, manual assertions, progress streaming, resume reconciliation, and the file-touch ledger."
when_to_use: Use when checking execution against rules 6-11 of the hard, non-negotiable rules governing every execution step.
---

# Iron Rules (Non-Negotiable) — Rules 6-11

**Continues** [Iron Rules (Non-Negotiable) — Rules 1-5](./iron-rules-1-5.md).

1. **Post-Push CI Verification**: After every push, monitor ALL GitHub Actions workflows triggered by that push. Fix ALL failures (including preexisting). Do NOT proceed until CI is fully green.
2. **Thematic Commits**: Staging and commit require explicit authorization of the named change set.
   Once authorized, choose the fewest build-valid, independently reviewable and revertible commits
   without another boundary prompt unless the user prescribed one. Keep required completion
   artifacts together; split independent concerns and never exceed authorized scope. Follow
   Conventional Commits.
3. **Manual Behavioural Assertions**: After quality gates pass, use real-browser tooling for web UI,
   `rtk curl` for HTTP APIs, and a protocol-native wire client for non-HTTP RPC/events. Run every
   changed operation's planned success/failure recipe and fix broken behaviour before proceeding.
4. **Progress Streaming (Observability)**: The live Task list is the user's monitoring window — keep it fresh in real time. Never run silent for more than one checkbox. After each phase completes, emit a one-line user-visible status: phase name, items ticked / total, files changed, any preexisting fixes.
5. **Resume Reconciliation (Canonical Instructions and Disk Are Truth)**: On every start or
   re-entry, first re-read canonical instructions and reconcile the active user-rule decision
   record. Do this unconditionally before reading delivery state or taking the first resumed
   action. Then read `delivery.md` and rebuild the Task list from disk; if memory disagrees with its
   checkboxes, replace the in-memory tasks. Stop on an unresolved rule conflict.
6. **File-Touch Ledger — Survives Compaction**: These repos are edited constantly by other agents, engineers, and background processes, in other worktrees and on local `main`, while your plan runs. Keep an append-only record of every path you create, modify, delete, or move, and **reproduce it in full in every compaction, summary, and handoff** — it is a required section, never droppable detail. Before staging, reconcile it against `git status --porcelain` in both directions: anything in the tree but not on your ledger is another actor's in-flight work and stays untouched and unstaged — unless it trips the bounded read-only diagnosis obligation (large foreign set, unchanged since a prior deferral, or blocking a gate), in which case identify it before deferring again; anything on your ledger but missing from the tree means your change was overwritten — stop and find out why. `git status` is the union of everyone's work, never a report of yours. Without a ledger, assume NOTHING in the tree is yours: reconstruct from your transcript, or ask. A canonical `.claude/` agent or Skill edit legitimately pulls registry-declared generated changes under `.opencode/`, `.codex/`, and `.agents/` into the same commit — those are yours, belong on the ledger, and MUST ship in that same commit, never a follow-up sync commit; unrelated vendored paths are not. See [File-Touch Discipline](../../../development/practice/file-touch-discipline.md).
