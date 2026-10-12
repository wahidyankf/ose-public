# course-paths — ayokoding-www Gherkin Domain

Behaviour scenarios for the learning-path schema, prerequisite graph, and path-aware navigation
owned by `ayokoding-www`.

## Coverage Model

Every active scenario has substantive Unit proof in `apps/ayokoding-www/tests/unit/`. Browser-visible
scenarios also have Playwright proof in `apps/ayokoding-www-fe-e2e/tests/e2e/`; a scenario whose
concern cannot be observed through that public browser boundary carries its own canonical
`@e2e-exempt` comment and tag. The corpus uses no positive layer-selection tags and no `@wip`
deferral. Static `test:coverage:*` targets validate recursive corpus and adapter closure without
executing tests.

The former build-green scenario was retired because repository build status is a CI-meta concern,
not product behaviour. Manifest integrity and prerequisite ordering remain product rules and are
proved by pure Unit adapters over synthetic manifest data.

## Feature Files

- [accessibility.feature](./accessibility.feature) — Accessible path-navigation affordances.
- [arc-landing-one-role.feature](./arc-landing-one-role.feature) — Complete one-role arc cards.
- [arc-landing-two-role.feature](./arc-landing-two-role.feature) — Complete two-role arc cards.
- [breadcrumb.feature](./breadcrumb.feature) — Path-aware breadcrumbs and legacy redirects.
- [canonical-fallback.feature](./canonical-fallback.feature) — Canonical course fallback.
- [category-landing-arc-chooser.feature](./category-landing-arc-chooser.feature) — Career arc choices.
- [category-landing-empty-state.feature](./category-landing-empty-state.feature) — Explicit empty states.
- [core-closure.feature](./core-closure.feature) — Core closure and path model integrity.
- [invalid-path-fallback.feature](./invalid-path-fallback.feature) — Invalid path fallback.
- [landing-hero.feature](./landing-hero.feature) — Path promise above the fold.
- [manifest-integrity.feature](./manifest-integrity.feature) — Resolvable, unique manifest references.
- [omitted-course.feature](./omitted-course.feature) — Canonical rendering for an omitted course.
- [outline-course-status.feature](./outline-course-status.feature) — Outline course status.
- [path-assumes.feature](./path-assumes.feature) — Assumed prior courses.
- [path-copy.feature](./path-copy.feature) — Plain path page copy.
- [path-order-nav.feature](./path-order-nav.feature) — Manifest-ordered previous/next navigation and the rail's scroll-to-current-course behaviour.
- [path-phases.feature](./path-phases.feature) — Phase-grouped learning paths.
- [path-position-numbers.feature](./path-position-numbers.feature) — 1-based path position numbers on the syllabus, rail, and arc card preview, and catalog-number-free course titles.
- [paths-hub-category-grouping.feature](./paths-hub-category-grouping.feature) — Category-grouped paths.
- [prerequisite-consistent-ordering.feature](./prerequisite-consistent-ordering.feature) — Stable prerequisite ordering.
- [prerequisite-display.feature](./prerequisite-display.feature) — Declared prerequisites on course pages.
- [skills-fixed-arc-statement.feature](./skills-fixed-arc-statement.feature) — One fixed skills arc.
- [skills-path-composition.feature](./skills-path-composition.feature) — Skills path composition rules.
- [skills-path-landing-body.feature](./skills-path-landing-body.feature) — Skills path landing content.

## Related

- [Parent surface README](../../README.md)
- [Frontend Gherkin index](../README.md)
