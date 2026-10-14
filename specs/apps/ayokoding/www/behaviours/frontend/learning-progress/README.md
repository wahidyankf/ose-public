# learning-progress — ayokoding-www Gherkin Domain

Behaviour scenarios for progress kept in the reader's own browser and for finding your way around
inside a course, owned by `ayokoding-www`.

## Coverage Model

Every active scenario has substantive Unit proof in `apps/ayokoding-www/tests/unit/fe-steps/` and
Playwright proof in `apps/ayokoding-www-fe-e2e/tests/e2e/`. Progress and lesson navigation are
observable at the public browser boundary and own no separate local resource, so each scenario
carries its own canonical `@integration-exempt` comment and tag instead of an Integration binding.
The corpus uses no positive layer-selection tags and no `@wip` deferral. Static `test:coverage:*`
targets validate recursive corpus and adapter closure without executing tests.

A scenario joins this folder in the phase that renders the screen it describes, so each feature file
holds only the scenarios whose surfaces already exist. `progress-store.feature` currently carries
the three scenarios Phase 3 renders (mark, un-mark, and the blocked-storage fallback); the remaining
store scenarios and the Learn home, course landing header, and accessibility features join the
folder in their own phases.

## Feature Files

- [lesson-navigation.feature](./lesson-navigation.feature) — Where the reader is inside a course, and
  what "Previous" and "Mark complete & continue" do next (9 scenarios).
- [progress-store.feature](./progress-store.feature) — Browser-only progress: marking and un-marking
  a page, and the fallback when browser storage is blocked (3 scenarios).

## Related

- [Parent surface README](../../README.md)
- [Frontend Gherkin index](../README.md)
