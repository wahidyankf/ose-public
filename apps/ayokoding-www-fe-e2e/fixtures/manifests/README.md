# AyoKoding E2E path fixtures

These JSON manifests give the AyoKoding browser tests a small, predictable set of learning paths.
They make it possible to verify path navigation and empty states before the production content set
contains every example a test needs. 🧪

## How the fixtures are used

The `ayokoding-www-fe-e2e` Playwright configuration points its local test server at this directory.
The test container does the same when it is built for automated checks. These files are test data:
they are not published learning content.

## Fixture coverage

| Area              | What the manifests prove                                         |
| ----------------- | ---------------------------------------------------------------- |
| `careers/`        | Arc and category landing pages, including one- and two-role arcs |
| `skills/`         | Path landing bodies with distinct authored content               |
| Missing arc slugs | The empty state, without a special zero-manifest fixture         |

The two `skills/e2e-fixture-*` paths have matching draft content pages in `ayokoding-www/content`.
That is intentional: the tests need real page bodies as well as manifest metadata.

## When changing a fixture

Keep each manifest small and purposeful. Update or add a behaviour scenario first when a new reader
experience is needed, then run the browser suite from the workspace root:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www-fe-e2e:test:e2e
```
