---
description: The agents that validate this convention, related standards and workflows, and the platform-binding details for listing MCP servers.
when_to_use: Use when looking up which agent validates this convention, finding related documentation, or checking the MCP-listing binding for a harness.
---

# Validation, References, and Platform Binding

## Validation

- `plan-checker` verifies that a plan touching a Vercel-deployed surface states its Vercel MCP
  dependency and that no step assumes a capability outside the boundary above.
- `plan-execution-checker` verifies that Phase 0 recorded the probe outcome.
- `repo-setup-manager` performs the Phase 0 probe and records it.

## References

**Related Development Standards:**

- [Vercel Deployment Convention](../vercel-deployment.md) - How Vercel builds are configured
- [Manual Behavioural Verification](../../quality/manual-behavioural-verification.md) - Verifying real
  running behaviour rather than asserting from source
- [CI Post-Push Verification](../../workflow/ci-post-push-verification.md) - The CI-side counterpart

**Related Workflows:**

- [Plan Planning](../../../workflows/plan/plan-planning.md) - Where the planning-time gate binds
- [Plan Execution](../../../workflows/plan/plan-execution.md) - Where the Phase 0 gate binds

**Agents:**

- `plan-maker` - Probes while authoring and records the result
- `repo-setup-manager` - Probes at Phase 0
- `plan-checker`, `plan-execution-checker` - Validate that both happened

## Platform Binding Examples

The content under this heading is intentionally vendor-specific. The vendor gate has no skip logic,
so any vendor name here needs a per-term vocabulary exception in `repo-config.yml`.

Listing configured MCP servers and their connection state:

```binding-example
claude mcp list
```

A connected, authenticated Vercel entry appears as a URL-backed HTTP server with a healthy state; an
unauthenticated one is reported as needing authentication. Authentication is interactive and belongs
to a human: `/mcp`, then select the Vercel server.

Representative tool names on the current server: `list_projects`, `list_deployments`,
`get_deployment`, `get_deployment_build_logs`, `get_runtime_logs`, `get_runtime_errors`,
`deploy_to_vercel`, `search_vercel_documentation`. The absence of any billing, firewall, or
domain-configuration tool is what the [Capability Boundary](./capability-boundary-and-operational-limits.md#capability-boundary)
section describes.
