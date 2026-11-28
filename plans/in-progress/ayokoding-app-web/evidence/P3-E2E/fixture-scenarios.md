# P3-E2E fixture scenarios

Every `@fixture` scenario, with the reason it needs deterministic fixture data. The real corpus cannot supply the data
for these rows (see [moved-scenario-verification.md](./moved-scenario-verification.md)). No `@fixture-unavailable`
scenario exists yet; `P5-Cache` adds the first one and lists it here.

| Scenario                                                           | Feature file                                               | Home and config                                        | Reason the real corpus cannot supply the data                                                                                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A draft lesson's route returns not found                           | `behaviours/content/content-rendering-http.feature`        | `ayokoding-web-be-e2e`, `playwright.fixture.config.ts` | The draft lesson `draft-note` (`draft: true`) exists only in the parity fixture. The real corpus has no draft lesson; its two `draft: true` files are path index pages. |
| A draft lesson is absent from search results                       | `behaviours/content/content-rendering-http.feature`        | `ayokoding-web-be-e2e`, `playwright.fixture.config.ts` | Same draft lesson as the row above.                                                                                                                                     |
| With AYOKODING_WEB_SHOW_DRAFTS set to true a draft lesson is shown | `behaviours/content/content-rendering-http.feature`        | `ayokoding-web-be-e2e`, `playwright.fixture.config.ts` | Needs the same draft lesson, and a second server started with `AYOKODING_WEB_SHOW_DRAFTS=true` on a free port.                                                          |
| A fixture-only old URL redirects 308 to its current page           | `behaviours/navigation/routes-and-navigation-http.feature` | `ayokoding-web-be-e2e`, `playwright.fixture.config.ts` | `/en/old-guide` has no redirect rule in `apps/ayokoding-www/src/redirects` or in `next.config.ts`, so only the fixture serves it.                                       |

## Selection check

- The fixture config selects `@fixture and not @fixture-unavailable` in the nine HTTP-only files. Its run (see
  [be-e2e-1.raw.txt](./be-e2e-1.raw.txt)) executed 4 scenarios: the four rows above.
- The real-corpus config selects `not @fixture`. Its run executed 19 scenarios and no `@fixture` scenario.
- The fe home's real-corpus config selects no `@fixture` scenario, because every `@fixture` scenario is in an HTTP-only
  file.
- `P3-Corpus` removes the `AYOKODING_WEB_FIXTURE=parity` switch from both real-corpus configs, so the four rows above
  stay on the fixture config only.
