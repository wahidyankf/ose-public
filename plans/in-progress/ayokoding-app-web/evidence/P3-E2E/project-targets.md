# P3-E2E project targets

Both homes follow the [Dedicated E2E project row](../../../../../repo-governance/development/infra/nx-targets/mandatory-targets-summary-matrix.md)
(`test:e2e` for its owner, and `test:behaviour:coverage`). Per-layer `test:coverage:<layer>` and the aggregate
`test:coverage` are retired ([target-naming-rules.md](../../../../../repo-governance/development/infra/nx-targets/target-naming-rules.md)),
so neither home declares them. The `test:integration` target is removed from both homes, because a dedicated E2E project
owns no Integration adapter.

## `ayokoding-web-be-e2e` (HTTP boundary)

| Target                    | Command                                                                                                                                                                                | Notes                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `typecheck`               | `npx tsc --noEmit`                                                                                                                                                                     |                                                                    |
| `lint`                    | `npx oxlint .`                                                                                                                                                                         |                                                                    |
| `test:quick`              | `typecheck`, `lint`, `test:behaviour:coverage`                                                                                                                                         | No runtime Unit target; no browser.                                |
| `test:e2e`                | skip guard, then `bddgen` and `playwright test` on the fixture config, then the same on the real-corpus config; with `BASE_URL` set, only the real-corpus config, and no server starts | `dependsOn: build` of `ayokoding-web`. The command builds nothing. |
| `test:behaviour:coverage` | `./rhino behaviour coverage validate`                                                                                                                                                  |                                                                    |
| `test:e2e:ui`             | `bddgen` and `playwright test --ui` on the real-corpus config                                                                                                                          |                                                                    |
| `test:e2e:report`         | `npx playwright show-report`                                                                                                                                                           |                                                                    |
| `deps:audit`              | `npm audit`                                                                                                                                                                            |                                                                    |

## `ayokoding-web-fe-e2e` (browser boundary)

| Target                    | Command                                                                   | Notes                                                                                         |
| ------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `typecheck`               | `npx tsc --noEmit`                                                        |                                                                                               |
| `lint`                    | `npx oxlint .`                                                            |                                                                                               |
| `test:quick`              | `typecheck`, `lint`, `test:behaviour:coverage`                            | No runtime Unit target.                                                                       |
| `test:e2e`                | skip guard, then `bddgen` and `playwright test` on the real-corpus config | `dependsOn: build` of `ayokoding-web`. The command builds nothing. It has no `BASE_URL` mode. |
| `test:behaviour:coverage` | `./rhino behaviour coverage validate`                                     |                                                                                               |
| `test:e2e:ui`             | `bddgen` and `playwright test --ui` on the real-corpus config             |                                                                                               |
| `test:e2e:report`         | `npx playwright show-report`                                              |                                                                                               |
| `deps:audit`              | `npm audit`                                                               |                                                                                               |

## Retired and changed

- Removed from both homes: `test:integration`.
- Removed from fe `test:e2e`: the inline `npm exec -- nx run ayokoding-web:build`. The declared `dependsOn` replaces it.
- Removed from fe `test:e2e`: `playwright.focused.config.ts`. Its specs run under the `specs-<browser>` projects.
- Fe `test:e2e:ui` and `test:e2e:report` now name the real-corpus config.
- Both `test:e2e` targets keep the existing `test.skip` guard.
