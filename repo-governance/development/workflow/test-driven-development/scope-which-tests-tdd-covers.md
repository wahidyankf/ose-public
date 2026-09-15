---
description: The ten verification levels TDD applies to, from unit tests through security testing, and the rule for each.
when_to_use: Use when deciding which test level (unit, integration, E2E, contract, etc.) a behaviour's first failing test belongs at.
---

# Scope: Which Tests TDD Covers

TDD applies to **every level of automated and manual verification** that backs a behavioural
guarantee. Every active Gherkin scenario starts with failing Unit proof; write each applicable
higher-layer adapter's failing test before its production implementation lands.

| Test level                       | What it covers                                                       | Tooling examples                                                         |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Unit**                         | A single function, class, or module in isolation; deps mocked        | Vitest, Go `testing` + Godog, JUnit, ExUnit, xUnit, Pytest, Hspec        |
| **Integration**                  | Real isolated local resources/processes, no external network         | Temporary files, local database, child processes, standard streams       |
| **E2E (UI + API)**               | Real HTTP, real browser, end-to-end flow across services             | Playwright (UI), Playwright API tests (HTTP), Pact-style contract checks |
| **Contract**                     | API contracts (OpenAPI, Pact) — request/response shape and semantics | OpenAPI spec lint, codegen drift checks, contract round-trip tests       |
| **Property / fuzz**              | Invariants over generated inputs, not handwritten cases              | fast-check (TS), gopter (Go), QuickCheck-family in F#/Elixir/Rust        |
| **Snapshot / visual regression** | Stable rendered output (UI, generated docs)                          | Vitest snapshots, Playwright visual diff                                 |
| **Manual verification**          | Human-driven behavioural check that supplements automation           | Real browser, `rtk curl` for HTTP, native client for non-HTTP APIs       |
| **Performance / load**           | Latency, throughput, resource usage budgets                          | k6, Lighthouse CI, `nx run [project]:bench` targets                      |
| **Accessibility (a11y)**         | WCAG AA conformance, semantic HTML, focus order                      | axe, Storybook a11y addon, Playwright a11y assertions                    |
| **Security**                     | Authn/authz boundaries, input validation, OWASP-class regressions    | Targeted unit/integration tests, fuzz harnesses, security-focused E2E    |

**TDD rule for every level above**: write the failing check first, watch it fail for the
right reason, then implement to make it pass, then refactor.
