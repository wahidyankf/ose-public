---
description: Bidirectional synchronization requirement between specs/ and application code in apps/ and libs/
when_to_use: "Use when a code change might require a matching specs/ update, or vice versa."
---

# Specs-Application Sync Convention

This convention requires bidirectional synchronization between `specs/` (Gherkin feature files, C4 diagrams, and specs READMEs) and the application code they describe. Neither is allowed to drift from the other.

## Documents

- [Principles and Conventions Implemented/Respected](./specs-application-sync/principles-and-conventions-implemented-respected.md) — Principles and conventions this convention implements. Use when tracing this convention to the principles/conventions behind it.
- [What Must Stay in Sync](./specs-application-sync/what-must-stay-in-sync.md) — The three artifacts requiring sync: C4 diagrams, Gherkin feature files, and specs/ README files. Use when deciding which spec artifact a code change must also update.
- [When to Check Synchronization](./specs-application-sync/when-to-check-synchronization.md) — The trigger points for verifying specs/ and application code are still in sync. Use when deciding whether a change requires a synchronization check.
- [Decision Guide: Architecture Change vs. Minor Change](./specs-application-sync/decision-guide-architecture-change-vs-minor-change.md) — Table (part 1 of 2) mapping common change types to whether a spec update is required. Use when uncertain whether a REST/tRPC/data-store/app-level change requires a spec update.
- [Decision Guide (continued)](./specs-application-sync/decision-guide-change-types-table.md) — Table (part 2 of 2) mapping common change types to whether a spec update is required. Use when uncertain whether a Next.js/React/app-rename/library-level change requires a spec update.
- [Existing Patterns to Follow](./specs-application-sync/existing-patterns-to-follow.md) — Worked spec-organization patterns for organiclever, ayokoding-www, and CLI apps. Use when structuring specs/ for a new app and want an existing pattern to follow.
- [Examples](./specs-application-sync/examples.md) — PASS/FAIL examples of endpoint, app-removal, bug-fix, and refactor changes against sync obligations. Use when you need a concrete example of a change that does or does not require a spec update.
- [Tools and Automation](./specs-application-sync/tools-and-automation.md) — The validators and checks that enforce specs-application sync. Use when locating the automated check for a sync violation.

## Related Documentation

- [Behaviour-Driven Development](../behaviour-driven-development.md) - How mandatory Unit and boundary-applicable Integration/E2E adapters consume shared Gherkin specs
- [Behaviour-Driven Development](../behaviour-driven-development.md) - Mandatory 1:1 mapping for CLI apps; three-level consumption for demo-be backends
- [Nx Target Standards](../infra/nx-targets.md) - Cache input declarations that include Gherkin specs
- [specs/README.md](../../../specs/README.md) - Spec directory organization and per-app spec structure

## Scope

This convention applies to:

- All directories under `apps/`
- All directories under `libs/`
- All directories under `specs/`

It does not apply to:

- `docs/` — documentation follows its own conventions; spec synchronization is a code-and-architecture concern
- `repo-governance/` — governance documents are not application code or acceptance specs
- `plans/` — planning documents describe intentions, not observable system behaviour
- `generated-contracts/` — auto-generated code is not maintained manually; update the source spec instead
