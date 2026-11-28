# P3-E2E file moves

Scenarios cut from the source feature files and pasted unchanged, title and Gherkin, into the four destination files
named in [008](../../tech-docs/008-bdd-delta-map.md#existing-scenarios-that-move-to-the-http-home). The `# Behaviour:`
comments travel with each scenario. The only new scenario is the split row.

## Scenarios

| Moved title                                                                                        | Source feature                                           | Destination feature                                           |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| A lesson page is readable without browser scripts                                                  | `behaviours/content/content-rendering.feature`           | `behaviours/content/content-rendering-http.feature`           |
| A draft lesson's route returns not found (`@fixture`)                                              | same                                                     | same                                                          |
| A draft lesson is absent from search results (`@fixture`)                                          | same                                                     | same                                                          |
| A missing page returns the locale's not-found experience                                           | same                                                     | same                                                          |
| With AYOKODING_WEB_SHOW_DRAFTS set to true a draft lesson is shown (`@fixture`)                    | same                                                     | same                                                          |
| The root enters the default locale                                                                 | `behaviours/navigation/routes-and-navigation.feature`    | `behaviours/navigation/routes-and-navigation-http.feature`    |
| Uppercase locale entries resolve to lowercase URLs                                                 | same                                                     | same                                                          |
| An old URL redirects 308 to its current page (Outline; the real row stays in the Outline)          | same                                                     | same                                                          |
| A fixture-only old URL redirects 308 to its current page (`@fixture`; new, split from the Outline) | none (new)                                               | same                                                          |
| A legacy archived page URL shows the archived page                                                 | same                                                     | same                                                          |
| The search page route returns results for a query without the dialog                               | `behaviours/search/search.feature`                       | `behaviours/search/search-http.feature`                       |
| Static assets and the favicon are served; an unknown asset returns 404 (Outline)                   | `behaviours/local-development/local-development.feature` | `behaviours/local-development/local-development-http.feature` |

`behaviours/discovery/discovery-documents.feature` stays in place. Its binding moves from the fe home to the be home,
because it is one of the nine HTTP-only files.

## Step definitions

Each definition moved from the fe step file to the be step file for its destination feature. Definitions are
`request`-based in the be home, and the be home has its own copies of the shared steps and hook it needs.

| Step text (as bound)                                                                                                                                                                                                                                                                                                         | fe source                                    | be destination                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| a published Markdown lesson exists in the shared corpus; a reader requests its route without running browser scripts; the response contains the lesson title and readable article body; the response does not depend on a client-side build artifact                                                                         | `steps/content.steps.ts`                     | `steps/content-rendering-http.steps.ts`     |
| a lesson is marked as a draft; draft viewing is disabled; a reader requests the draft lesson's route; a reader searches the corpus; AYOKODING_WEB_SHOW_DRAFTS is set to true for the app; the draft lesson's page shows its title and body; the lesson is absent from the public results; its direct route returns not found | `steps/content.steps.ts`                     | `steps/content-rendering-http.steps.ts`     |
| a reader requests a nonexistent content route in a supported locale; the response status is 404; the reader sees a localized not-found page with usable navigation                                                                                                                                                           | `steps/content.steps.ts`                     | `steps/content-rendering-http.steps.ts`     |
| a visitor requests the root URL; the visitor is redirected to {string}; the redirect does not loop; a visitor requests {string}; the response permanently redirects with status 308 to {string}; the query string is preserved; the redirect does not depend on the old page still existing                                  | `steps/routes.steps.ts`                      | `steps/routes-and-navigation-http.steps.ts` |
| a reader opens a legacy archived page; the archived page shows its title and canonical body                                                                                                                                                                                                                                  | `steps/routes.steps.ts`                      | `steps/routes-and-navigation-http.steps.ts` |
| a reader opens the search page for the matching term in one locale; the search page lists the matching results for that locale only                                                                                                                                                                                          | `steps/search.steps.ts`                      | `steps/search-http.steps.ts`                |
| a reader requests the asset {string}; the asset responds with status {string}                                                                                                                                                                                                                                                | `steps/localdev.steps.ts`                    | `steps/local-development-http.steps.ts`     |
| every step of `behaviours/discovery/discovery-documents.feature` (file `steps/discovery.steps.ts`)                                                                                                                                                                                                                           | `steps/discovery.steps.ts` (deleted from fe) | `steps/discovery-documents.steps.ts`        |

## Duplicated, not moved

The fe home keeps these because its remaining browser scenarios still bind them. The be home has its own copy.

- `the app is running` (fe `steps/common.steps.ts`, be `steps/common.steps.ts`).
- `matching published content exists in both supported locales` (fe `steps/search.steps.ts` for "Results stay within
  the current locale"; be `steps/search-http.steps.ts`).
- The `After` hook that closes owned servers (fe `steps/lifecycle.steps.ts`, be `steps/lifecycle.steps.ts`).

## Be-only support

- `tests/e2e/support/state.ts`: scenario state keyed by the `request` context, not by a page.
- `tests/e2e/support/http.ts`: `fetchText`, `statusOf`, `bodyOf`, `headerOf`, and `locationOf` on the request context.
  GET only, no retry.
- `tests/e2e/support/servers.ts`: `appBinaryPath`, `freePort`, and `startOwnedBinary`. The fe helper's start loop with
  its port-collision retry is not copied.

## Reference lines (C13)

- `@scenario` lines added: four be step files (`content-rendering-http`, `routes-and-navigation-http`,
  `search-http`, `local-development-http`) plus `discovery-documents` (moved with its steps); the be config files name
  the nine HTTP-only features.
- `@scenario` lines added to `apps/ayokoding-web/tests/bdd/suite_test.go` and `apps/ayokoding-web/tests/bdd-integration/suite_test.go`
  for the four new files.
- The four source files keep their reference lines, because they keep browser scenarios. No reference line was removed
  from a source file.
