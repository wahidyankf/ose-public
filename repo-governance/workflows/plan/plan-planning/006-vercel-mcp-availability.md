---
description: Explains when a plan must probe for a connected Vercel MCP server, how the result changes executor tags, and the narrow boundary of what the MCP server can observe.
when_to_use: Use when a plan touches a Vercel-deployed surface and needs to decide whether deployment-observation steps can be tagged [AI].
---

# Vercel MCP Availability (Surface-Conditional)

A second surface-conditional gate, resolved at authoring time for the same reason the tester gates
are: the answer changes what the delivery checklist can contain.

**Trigger** — the plan touches a Vercel-deployed surface if a path it changes is covered by a
`vercel.json`, it names a `prod-*`/`stag-*` branch a Vercel project builds from, or a deployment
agent exists for an app it changes. Decide this mechanically (`git ls-files | grep 'vercel\.json$'`),
never from memory: the set drifts, and in some repositories of this ecosystem it is empty, which
makes every plan there out of scope.

**When triggered**, the author probes for a connected, authenticated Vercel MCP server and records
the result in the chosen technical form's README or a companion it maps. That result decides
executor tags:

- **Available** → deployment-observation steps are `[AI]`: deploy state and provenance, build logs,
  runtime errors, and runtime invocation counts grouped by source, route, or status code. This is
  what lets a plan assert its own effect — a measured before-and-after — instead of a single
  hand-checked URL.
- **Unavailable** → the plan degrades explicitly rather than quietly weakening a criterion. See
  [§Degraded Mode](../../../development/infra/vercel-mcp/identifier-hygiene-degraded-mode-and-when-to-check.md#degraded-mode).

**The boundary is narrow, and over-assuming it is the common failure**: billing, usage, invoices,
Spend Management, Observability settings, firewall rulesets, the compute-model setting, and domain
configuration have **no** tool. Those steps stay `[HUMAN]` whatever the probe says. Group them into
Phase 0 so the human actions land in one sitting and the remaining phases stay `[AI]`.

Full rule, capability boundary, operational limits, and identifier hygiene:
[Vercel MCP Capability Convention](../../../development/infra/vercel-mcp.md).
