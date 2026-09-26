---
description: The Vercel MCP server is an assumed capability for plans touching a Vercel-deployed surface, probed at planning time and again at execution Phase 0
when_to_use: Use when a plan or its execution touches a Vercel-deployed surface and you need to know whether the Vercel MCP capability is assumed available, what it may be used for, or how to proceed when it is absent.
---

# Vercel MCP Capability Convention

A Vercel MCP server is an assumed capability for any plan touching a Vercel-deployed surface,
resolved through a planning-time probe and a Phase 0 re-check rather than presumed from a prior
plan. The full rule set is split across the sections below.

## Sections

- [Principles, Conventions, and Core Rule](./vercel-mcp/principles-conventions-and-core-rule.md) — The assumption that Vercel MCP is available, the principles and conventions behind it, and the two-gate rule that resolves it for a plan. Use when you need the core assumed-availability rule and its two gates, or the principles/conventions this convention builds on.
- [Scope and the Probe](./vercel-mcp/scope-and-the-probe.md) — How to decide mechanically whether a plan is in scope for this convention, and how to probe whether Vercel MCP is connected and authenticated. Use when checking whether a plan's surface makes it in scope, or when running the probe for Vercel MCP connection state.
- [Capability Boundary and Operational Limits](./vercel-mcp/capability-boundary-and-operational-limits.md) — The exact boundary of what an agent may read or do through Vercel MCP, and the query-window and truncation limits on its tools. Use when checking whether a planned step falls inside or outside the capability boundary, or when writing acceptance commands against Vercel MCP tools.
- [Identifier Hygiene, Degraded Mode, and When to Check](./vercel-mcp/identifier-hygiene-degraded-mode-and-when-to-check.md) — Slug-over-ID addressing for Vercel projects and teams, the fallbacks a plan uses when Vercel MCP is absent, and the four moments to re-run the probe. Use when naming a project or team in a committed artifact, planning around an absent Vercel MCP server, or deciding when to re-probe.
- [Examples](./vercel-mcp/examples.md) — Worked PASS and FAIL examples of applying the Vercel MCP capability boundary and probe-recording rule. Use when checking a plan against worked examples of correct and incorrect Vercel MCP usage.
- [Validation, References, and Platform Binding](./vercel-mcp/validation-references-and-platform-binding.md) — The agents that validate this convention, related standards and workflows, and the platform-binding details for listing MCP servers. Use when looking up which agent validates this convention, finding related documentation, or checking the MCP-listing binding for a harness.
