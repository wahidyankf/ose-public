---
description: States that the calling context orchestrates plan execution, routing substantive work to specialized agents.
when_to_use: Use when confirming whether the orchestrator may implement a delivery item directly or must delegate it.
---

# Orchestration Model

The **calling context** (top-level assistant session) acts as the orchestrator, following this workflow as its procedure. It reads the delivery checklist, determines which specialized agent is best suited for each item, delegates implementation to that agent via the Agent tool, verifies completion, and performs the Atomic Sync Ritual.

The orchestrator never implements code or documentation in bulk by itself — it routes each non-trivial item to the domain expert agent and collects results. Trivial text edits (e.g., a single-line update to a governance doc) MAY be executed directly via `Edit` without delegating, when delegation would add overhead without adding value.
