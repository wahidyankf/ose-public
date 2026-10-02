---
description: Defines how execution reconfirms Vercel MCP availability at Phase 0 for plans touching a Vercel-deployed surface.
when_to_use: Use when a plan touches a Vercel-deployed surface and Phase 0 must verify the authoring-time MCP assumption still holds.
---

# Vercel MCP Availability (Surface-Conditional)

Binds here exactly as it bound at authoring time (see
[plan-planning §Vercel MCP Availability](../plan-planning/006-vercel-mcp-availability.md#vercel-mcp-availability-surface-conditional)).
The plan already assumed an answer; Phase 0 confirms it still holds before Phase 1 depends on it.

- **Plan touches no Vercel-deployed surface** → skip. Nothing to probe, nothing to record.
- **Touches one, and the probe agrees with the plan** → record the confirmation and proceed.
- **Touches one, and the probe disagrees** → do **not** proceed as written. Downgrade every affected
  `[AI]` step per [§Degraded Mode](../../../development/infra/vercel-mcp/identifier-hygiene-degraded-mode-and-when-to-check.md#degraded-mode), record the
  downgrade in the plan, and continue. Silently skipping a verification step it can no longer perform
  is the failure this gate exists to prevent.

A server that connects but exposes only authentication tools is **unauthenticated**, not available;
authenticating it is interactive and belongs to a human.

Capability boundary, operational limits (a 72-hour query window is the widest usable one), and
identifier hygiene: [Vercel MCP Capability Convention](../../../development/infra/vercel-mcp.md).
