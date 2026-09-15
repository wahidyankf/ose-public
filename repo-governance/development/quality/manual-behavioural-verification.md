---
description: Practice requiring manual UI and HTTP or non-HTTP API verification after implementing changes
when_to_use: "Use after implementing a UI or API change, before declaring it done."
---

# Manual Behavioural Verification Convention

This convention requires manually verifying UI features and API operations after implementing a
change, in addition to automated tests. Use real-browser tooling for UI, `rtk curl` for HTTP, and a
protocol-native wire client for non-HTTP RPC or events.

## Documents

- [Principles and Conventions Implemented/Respected](./manual-behavioural-verification/principles-and-conventions-implemented-respected.md) — Principles/conventions this convention implements. Use when tracing this convention's rationale.
- [UI Verification](./manual-behavioural-verification/ui-verification.md) — Required tools for manual UI verification. Use when preparing to manually verify a UI change.
- [UI Verification Checklist](./manual-behavioural-verification/ui-verification-checklist.md) — The checklist to run through when verifying a UI change. Use when manually verifying a UI change.
- [Example: UI Feature Verification (multi-locale app)](./manual-behavioural-verification/example-ui-feature-verification-multi-locale-app.md) — A worked example of manually verifying a UI feature across locales. Use for a concrete example of multi-locale UI verification.
- [API Verification](./manual-behavioural-verification/api-verification.md) — How to verify HTTP and non-HTTP operations at their wire boundary. Use when preparing to manually verify an API change.
- [When Verification Is Required](./manual-behavioural-verification/when-verification-is-required.md) — The triggers that require manual behavioural verification. Use when deciding whether a change needs manual verification.
- [Relationship to Automated Tests](./manual-behavioural-verification/relationship-to-automated-tests.md) — How manual verification relates to automated test coverage. Use when deciding whether automated tests already cover manual verification.
- [Examples](./manual-behavioural-verification/examples.md) — Worked examples of manual behavioural verification. Use for a concrete example of this convention applied.
- [Related Documentation](./manual-behavioural-verification/related-documentation.md) — Related testing and evidence conventions. Use for a related convention on testing or evidence.

## The Rule

**Manual behavioural verification is MANDATORY after implementing UI or API changes.**

For an API-affecting formal plan, `delivery.md` must carry the executable verification recipe before
implementation starts. Every changed HTTP-accessible operation has a literal, copy-pasteable `rtk curl` command for its
success case and at least one representative failure case. The recipe also fixes prerequisites and
synthetic fixtures, expected status/headers/media type/body or schema, sanitized evidence destination,
and cleanup/failure routing. A prose instruction to call an endpoint, a generated-client-only check,
or a shared command that cannot report each operation/case independently is not manual API proof.
Non-HTTP RPC or event contracts use their protocol-native wire client instead of pretending curl can
exercise them.

This applies to:

- New UI features (pages, components, interactions)
- UI bug fixes
- New API endpoints
- API behaviour changes (request/response shape, validation rules, error handling)
- Integration changes (connecting UI to API, connecting API to data source)

## Tools and Automation

- **Browser MCP tools**: Discover installed integrations first; prefer Playwright MCP, then Chrome
  DevTools MCP, then equivalent available real-browser tooling
- **rtk curl**: Use via Bash for HTTP API verification
- **Protocol-native wire client**: Use for non-HTTP RPC/event verification
- **jq**: Available via Bash for JSON response inspection

## Scope

This convention applies to:

- All AI agents implementing UI or API changes
- All human developers implementing UI or API changes
- All apps in `apps/` that have a UI or API surface

It does not apply to:

- Library-only changes (`libs/`) with no UI or API surface
- Documentation changes (`docs/`, `repo-governance/`, `plans/`)
- Configuration changes that do not affect runtime behaviour
- Internal refactors with no observable behavioural change
