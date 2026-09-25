---
description: Orchestrated processes for live REST and GraphQL API quality validation and remediation
when_to_use: Use when routing to a workflow that exercises a running REST or GraphQL API against its contract and specs.
---

# API Workflows

Use these workflows when an API needs to be checked as a real client experiences it. They test a **running** service against its contract, then turn evidence into a focused fix path.

## Available Workflows

- [api-quality-gate](./api-quality-gate.md) — Runs one live discovery, at most one fix pass, one rebuild/redeployment, and one scoped verification over original findings and affected-API regressions. Use when a plan ships an API/backend surface needing contract, functional, and security validation.

Unlike the checker/fixer gates elsewhere in this directory tree, the API gate is **tester-driven**:
`api-exploratory-tester` emits `AET-###` findings against a live endpoint, and `swe-code-maker`
applies the fixes under the service's stack packs. There is no `api-checker` or
`api-fixer` agent.

## Related Documentation

- [UI Workflows](../ui/README.md) — The static component-source counterpart to this category
- [Web Workflows](../web/README.md) — The running-UI tester triad, this category's UI-side analogue
- [PR Merge Protocol](../../development/workflow/pr-merge-protocol.md) — Keeps applicable surface gates merge-blocking
- [Manual Behavioural Verification](../../development/quality/manual-behavioural-verification.md) — Standards these workflows enforce
- [Workflows Index](../README.md) — All available workflows
