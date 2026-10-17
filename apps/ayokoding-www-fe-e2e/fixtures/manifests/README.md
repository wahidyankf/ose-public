# AyoKoding E2E path fixtures

These JSON manifests give the AyoKoding browser tests a small, predictable set of learning paths.
They make it possible to verify path navigation and empty states before the production content set
contains every example a test needs. 🧪

## How the fixtures are used

The `ayokoding-www-fe-e2e` Playwright configuration points its local test server at this directory.
The test container does the same when it is built for automated checks. These files are test data:
they are not published learning content.

## Fixture coverage

- `careers/immediately-effective/` — two roles (`frontend-track` and `backend-track`): each role
  card shows its own course count, and one course carries the shared multi-path badge.
- `careers/interview-ready/` — a one-role arc: the full card and syllabus preview, never a sparse
  second card.
- `careers/fundamentally-strong/` — a third arc, so the category landing's arc chooser renders one
  card per arc instead of assuming exactly two.
- `skills/e2e-fixture-alpha` and `skills/e2e-fixture-beta` — two skills path landing bodies with
  distinct authored content, so neither path's body leaks onto the other's page.
- `skills/conventional-accounting` — the one skills path still waiting for its restructure: a single
  flat all-courses phase with no outcome, which proves the roadmap renders today's one course list.
- Missing arc slugs — the empty state, without a special zero-manifest fixture.

## Fixture shape

Each fixture manifest uses the same phase shape as the production manifests: `phases` with `core`
and `extension` kinds, `assumes` for assumed courses, and a derived `courseOrder` (the phases'
courses in order). Every core phase carries the outcome
`{"can": "complete this fixture path"}`. The two `skills/e2e-fixture-*` paths have matching draft
content pages in `ayokoding-www/content`.
That is intentional: the tests need real page bodies as well as manifest metadata.

`skills/conventional-accounting.json` is the deliberate exception. It mirrors a path that is still
waiting for its restructure: one flat `all-courses` core phase, no outcome, no assumed courses, and
a `restructurePendingIn` marker naming the phase that will fill it. The fixture exists so the
roadmap's flat-list behaviour stays proved against a real manifest shape rather than a hand-built
object.

## When changing a fixture

Keep each manifest small and purposeful. Update or add a behaviour scenario first when a new reader
experience is needed, then run the browser suite from the workspace root:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www-fe-e2e:test:e2e
```
