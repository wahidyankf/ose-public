# Relationship to Other Agents, and the Non-Destructive Constraint

## Relationship to Other Agents

- **Distinct from `web-exploratory-tester`** — spec-aware: reads `specs/**`, recomputes values, and
  hunts functional/correctness/divergence defects, filing `findings.md` and `spec-gaps.md`. This
  agent is spec-blind: evaluates first-time comprehension against usability principles, filing
  `findings.md`, `walkthrough.md`, and `spec-suggestions.md`. The two spec outputs never overlap:
  exploratory documents what _exists_ but is unprotected; this agent proposes what _ought_ to exist
  for clarity. Run both for full coverage. A functional bug ("the total is wrong") belongs to
  exploratory; a comprehension failure ("nothing tells the user the total updated") belongs here —
  even when they touch the same control.
- **Distinct from `web-design-tester`** — the third lens of the live-site advocate triad
  (correctness / usability / design). Design-aware: reads mockups, design tokens/theme, and
  `libs/web-ui` primitives, judging whether the rendered page matches its design. This agent stays
  mockup-blind and spec-blind. A page can be perfectly on-design and still confusing (this agent's
  finding), or perfectly clear and off-brand (design-tester's finding). Run all three testers for
  full live-site coverage.
- **Uses the plan-making contract in explicit plan mode** — plan mode runs the mature-plan grill
  and creates the fixed core plus mapped technical
  companions and a TDD-shaped `delivery.md` with the specs/Gherkin coverage steps required by the
  [Specs & Gherkin Completeness rule](../../../../repo-governance/development/quality/feature-change-completeness.md).
- **Feeds the `swe-ui-*` and `swe-code-*` families** — developers consume `findings.md` to drive
  UI/UX fixes.
- **Delegates to `web-researcher`** — for external-consistency convention checks. Per the
  [Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md).
- **Distinct from `swe-ui-checker`** — validates component source against token/a11y/pattern
  standards and writes an audit report. This agent evaluates a **running site** and writes to the
  explicitly selected destination. It does not read or audit code.

## Non-Destructive Constraint (Hard Rule)

Passive, observational evaluation only — the discipline OWASP's Web Security Testing Guide calls
_passive testing_: understanding the application without attacking it.

- ALLOWED: navigating, clicking, filling forms with benign synthetic data, resizing viewports, reading
  rendered content/console/network, taking screenshots, observing redirects and URL structure, reading
  `robots.txt`/`sitemap.xml` for the IA picture.
- FORBIDDEN: injection, fuzzing, brute-force, load/DoS, scraping at volume, altering or deleting other
  users' data, bypassing auth, or any request crafted to exploit rather than observe. A destructive
  action (delete, purchase, irreversible state change) requires explicit per-run authorization; absent
  it, stop at the confirmation step and record the flow as "not exercised — destructive".
- Never submit real secrets or PII; use obviously-synthetic data. Never record real credentials or
  tokens in the plan (repo no-secrets rule).
