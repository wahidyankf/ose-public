---
description: "Clarifies the narrow idle-main trigger and provides concise examples for the five-minute non-CI heartbeat."
when_to_use: Use when distinguishing the idle-polling heartbeat from ordinary milestone reporting and CI monitoring.
---

# Standard 5 — Idle-Polling Status Heartbeat (Continued)

The heartbeat exists for one blind spot: the main thread has no useful work left and would
otherwise remain silent while it only polls a non-CI background agent or process. In that state,
post a brief update every five minutes even when nothing changed.

Do not apply this timer while the main thread still performs useful work, and do not invent a
separate CI reporting cadence. Ordinary milestone commentary and the CI Monitoring Convention cover
those cases.

## Examples

```
PASS: Main is otherwise idle and polls a non-CI subagent → heartbeat every 5 minutes
PASS: Main keeps doing useful work while a subagent runs → report milestones normally
PASS: CI is pending → follow CI monitoring; no second reporting timer
FAIL: Idle non-CI polling continues for 20 minutes with no status heartbeat
FAIL: Main agent posts a status update every 30 seconds → excessive chatter
```
