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
holds only the scenarios whose surfaces already exist. The folder now covers the whole
learning-progress surface: the store, the lesson-navigation chrome, the Learn home and the retired
overview redirect, the course landing header, and the accessibility guarantees.

## Feature Files

- [course-landing-progress.feature](./course-landing-progress.feature) — The course header's progress
  summary and its Continue or Review button (2 scenarios).
- [learn-home.feature](./learn-home.feature) — The Learn home landing page, its Continue or Start
  card, the path cards and hubs, and the retired overview redirect (7 scenarios).
- [learning-progress-accessibility.feature](./learning-progress-accessibility.feature) — Progress in
  words, keyboard-operable controls, reduced motion, phone fit, and automated accessibility checks
  (5 scenarios).
- [lesson-navigation.feature](./lesson-navigation.feature) — Where the reader is inside a course, and
  what "Previous" and "Mark complete & continue" do next (9 scenarios).
- [progress-store.feature](./progress-store.feature) — Browser-only progress: marking and un-marking
  a page, progress shared across paths, and the fallbacks when browser storage is blocked or
  unreadable (9 scenarios).

## Related

- [Parent surface README](../../README.md)
- [Frontend Gherkin index](../README.md)
