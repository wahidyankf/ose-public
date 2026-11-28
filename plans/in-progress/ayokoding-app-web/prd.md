# Product Requirements

## Product and users

The new local AyoKoding website serves the same learners and maintainers as the existing site.
Readers browse lessons, follow courses or career/skills paths, search, keep progress in their
browser, and use the two existing tools. Authors continue editing the current source corpus.

## Product boundary

The new surface is `apps/ayokoding-web`; the retained surface is `apps/ayokoding-www`, which this plan leaves untouched. Its Playwright homes are `apps/ayokoding-web-fe-e2e` (the former
`apps/ayokoding-web-e2e`, browser boundary) and `apps/ayokoding-web-be-e2e` (_new_, HTTP boundary).
The new surface's canonical behavior corpus
is [specs/apps/ayokoding/web](../../../specs/apps/ayokoding/web/README.md), which the parity units extend.

Full parity means the current tested product experience, not Next.js build artifacts or the old
app's internal tRPC wire format. Locale coverage means `en` and `id` with the content that actually
exists in each locale; it does not mean inventing Indonesian counterparts for English-only courses.
No redesign, course, data-price, or FX snapshot refresh is bundled with the rewrite.

**Amended 2026-11-28.** The bar for "full parity" is now full content and design parity with the old site:
the app serves the **real corpus** by default, serves **every URL** the old site serves (200 or a
permanent 308, never 404), and reproduces the old site's **visual design** page by page. The deferred
design item D1 is required. tRPC stays intentionally unreproduced: `/api/trpc/*` answers 404.

## Acceptance criteria

| ID    | Required outcome                                                                                                                                                                                                                                                                 | Canonical feature destination                                                                                                                        | Proof                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Both apps run together on distinct ports; the Go developer loop reads shared sources without rewriting them.                                                                                                                                                                     | `local-development/local-development.feature`                                                                                                        | Unit configuration tests, local filesystem Integration, Playwright and simultaneous-server manual proof.                                                      |
| AC-02 | Landing, shell, locale switching, theme, responsive navigation, and keyboard accessibility retain their behavior.                                                                                                                                                                | `shell/bilingual-shell.feature`                                                                                                                      | Unit, applicable handler Integration, browser E2E, both locales at each breakpoint.                                                                           |
| AC-03 | Published Markdown renders with current metadata, shortcodes, math, diagrams, code copying, headings, and relative links.                                                                                                                                                        | `content/content-rendering.feature`                                                                                                                  | Pure parser Unit, real fixture Integration, rendered browser E2E.                                                                                             |
| AC-04 | Canonical and historical URLs, sidebar/TOC/breadcrumbs, and previous/next navigation remain correct.                                                                                                                                                                             | `navigation/routes-and-navigation.feature`                                                                                                           | Unit route/tree vectors, HTTP Integration, browser/HTTP E2E.                                                                                                  |
| AC-05 | Search is locale-scoped, includes static tool pages, and preserves dialog, result, empty-state, and keyboard behavior.                                                                                                                                                           | `search/search.feature`                                                                                                                              | Unit query/excerpt/matching cases, handler Integration, browser E2E.                                                                                          |
| AC-06 | Catalog metadata, phase order, prerequisites, outline state, path framing, and canonical fallback remain correct.                                                                                                                                                                | `courses/course-catalog-and-paths.feature`                                                                                                           | Unit manifest/domain tests, real-corpus Integration, browser E2E.                                                                                             |
| AC-07 | Learning progress preserves the v1 schema, browser-only privacy, recovery, reset, cross-tab synchronization, and lesson navigation.                                                                                                                                              | `learning-progress/browser-progress.feature`                                                                                                         | Browser-helper Unit plus Playwright storage/network proof; only genuinely browser-only record effects may have documented Integration exemptions.             |
| AC-08 | AI benchmark filters, ranking, substitutes, dates, notes, and URL state keep existing results.                                                                                                                                                                                   | `tools/ai-benchmark.feature`                                                                                                                         | Shared-vector Unit in both runtimes, handler Integration, browser E2E.                                                                                        |
| AC-09 | Calculator cost/savings/minimum-role modes, controls, rounding, notes, and URL state keep existing results.                                                                                                                                                                      | `tools/cost-of-living-calculator.feature`                                                                                                            | Shared-vector Unit in both runtimes, handler Integration, browser E2E.                                                                                        |
| AC-10 | Page metadata, canonical URLs, sitemap, robots, RSS, and missing-page behavior use the current source corpus.                                                                                                                                                                    | `discovery/discovery-documents.feature`                                                                                                              | Unit document/URL tests, HTTP Integration and E2E.                                                                                                            |
| AC-11 | godog binds the canonical Gherkin corpus with strict step matching, following the `ayokoding-cli` pattern; no step is unused or ambiguous.                                                                                                                                       | `local-development/local-development.feature` (harness proof)                                                                                        | godog suites, behaviour-coverage static checks, repository validator regressions.                                                                             |
| AC-12 | The rewrite remains independent of all live course plans while tracking their already-merged source changes.                                                                                                                                                                     | `local-development/local-development.feature`                                                                                                        | Dependency/DAG inspection, shared-source diff and current-main parity ledger.                                                                                 |
| AC-13 | The default start serves the real content corpus; a fixture needs an explicit switch; an unreadable corpus stops startup.                                                                                                                                                        | `local-development/local-development-http.feature` (default start and fixture) and `local-development/local-development.feature` (unreadable corpus) | Config Unit tests, launcher Integration, the be home's real-corpus and fixture configs, and the fe home's process-boundary binding for the unreadable corpus. |
| AC-14 | Every authored page kind has its canonical route: nested lessons, section pages, English rants, about and terms, all Indonesian trees, legacy pages.                                                                                                                             | `content/content-tree-routes.feature`                                                                                                                | Unit tree vectors, real-corpus Integration, HTTP E2E.                                                                                                         |
| AC-15 | Every URL of the old site answers 200 or a permanent 308 chain ending in 200; the three temporary redirects become permanent; `/api/trpc/*` is 404. Durable proof: the URL inventory and gap-report scenarios of `parity-tools.feature`, and the Unit drift test.                | `navigation/url-compatibility.feature`                                                                                                               | Crawl function Unit and Integration, inventory-driven HTTP E2E on the real corpus and any `BASE_URL`.                                                         |
| AC-16 | The landing, browse, and tools index pages show real content in both locales.                                                                                                                                                                                                    | `navigation/entry-pages.feature` (landing) and `navigation/entry-pages-http.feature` (browse and tools index)                                        | Unit, real-corpus Integration, HTTP E2E for browse and tools, and browser E2E for the landing.                                                                |
| AC-17 | Search is built from the whole corpus, stays within the locale, and covers the Indonesian trees.                                                                                                                                                                                 | `search/search.feature` (real-corpus results) and `search/search-http.feature` (Indonesian trees)                                                    | Unit index vectors, real-corpus Integration, browser E2E for `search.feature`, HTTP E2E for `search-http.feature`.                                            |
| AC-18 | The site origin is configurable and valid; sitemap, feed, robots, and canonical links use it and cover every route.                                                                                                                                                              | `discovery/discovery-documents.feature`                                                                                                              | Unit, Integration, HTTP E2E.                                                                                                                                  |
| AC-19 | Production caching is defined: validators with 304, immutable hashed assets, no-store for fragments and errors.                                                                                                                                                                  | `discovery/http-caching.feature`                                                                                                                     | Unit, Integration, HTTP E2E.                                                                                                                                  |
| AC-20 | Each page class matches the old site's visual design within the measured tolerance, or the owner accepted the recorded difference. The page-level comparison is plan-level proof with no durable Gherkin; the durable tool scenario is the pixel diff in `parity-tools.feature`. | Plan-level (see [008](./tech-docs/008-bdd-delta-map.md)); no durable scenario                                                                        | Design-parity harness report and exceptions file under `evidence/P6-Harness/`.                                                                                |
| AC-21 | `ayokoding-web-be-e2e` proves the HTTP boundary and the parity crawl against a local server or, read-only, a configurable `BASE_URL` (the be home only).                                                                                                                         | The nine HTTP-only feature files listed in [008](./tech-docs/008-bdd-delta-map.md#http-only-feature-files)                                           | HTTP E2E runs, local and against a `BASE_URL` (read-only, GET only, for the be home only).                                                                    |
| AC-22 | `ayokoding-web-fe-e2e` is the one browser owner, runs against the real corpus, follows the no-retry rule, and maps or drops every old scenario with a reason.                                                                                                                    | Every other feature file under `behaviours/` (all browser scenarios)                                                                                 | Browser E2E runs and `evidence/P7-FE/e2e-scenario-mapping.csv`.                                                                                               |
| AC-23 | The final-name e2e homes exist, and every `ayokoding-www-*` file is byte-identical to the base revision.                                                                                                                                                                         | Plan-level                                                                                                                                           | Byte-identity check of the `ayokoding-www-*` paths at each unit gate, against the plan's base revision.                                                       |

Feature destinations above are relative to
`specs/apps/ayokoding/web/behaviours/`. The [baseline and parity guide](./tech-docs/001-baseline-and-parity.md)
defines the complete existing-scenario mapping procedure; the initial new corpus is a real starting
contract, not permission to discard unlisted existing scenarios. The Gherkin in this section is a summary of the
full text in [004](./tech-docs/004-api-contract-delta.md); where the two differ, 004 is authoritative and this section is corrected to match it.

### Local coexistence and source ownership

```gherkin
Scenario: Develop the Go website beside the existing website
  Given the existing website listens on port 3101
  When the maintainer starts the Go website with its default configuration
  Then the Go website listens on port 3102
  And both websites remain reachable
  And neither website's listener is replaced

Scenario: Read shared lessons without rewriting the corpus
  Given a lesson exists in the shared Markdown corpus
  When the maintainer opens that lesson in the Go website
  Then the lesson is rendered from the shared source
  And the source bytes are unchanged
```

### Independent execution and privacy

```gherkin
Scenario: Complete the rewrite while course work remains unfinished
  Given a course plan remains unfinished
  And its unmerged output is absent from the rewrite worktree
  When the rewrite satisfies its acceptance criteria against the recorded merged corpus
  Then the unfinished course plan does not block rewrite completion

Scenario: Keep a learner's progress out of server requests
  Given a learner has a valid browser progress record
  When the learner completes a lesson and reloads the page
  Then the browser retains the updated record
  And no progress record is included in any request to the server
```

### Real corpus and startup

```gherkin
Scenario: A default start serves the real content corpus
  Given the repository content corpus exists and no fixture is selected
  When the maintainer starts the Go website with its default configuration
  Then lessons from the real corpus are served
  And no canned fixture page is served

Scenario: A fixture is served only when one is selected
  Given a test selects the parity fixture explicitly
  When the test server starts
  Then the canned fixture corpus is served

Scenario: An unreadable content directory stops startup before the listener opens
  Given the configured content directory cannot be read
  When the maintainer starts the Go website
  Then startup fails with a message that names the setting
  And no listener opens

Scenario Outline: An invalid site origin stops startup with a message
  When the maintainer starts the Go website with the site origin "<value>"
  Then startup fails with a message that names the setting
  Examples:
    | value                            |
    | /en                              |
    | https://www.ayokoding.com/en     |
    | ftp://www.ayokoding.com          |
    | www.ayokoding.com                |
```

### Every page and every old URL

```gherkin
Scenario Outline: Every kind of authored page is served at its canonical path
  Given the corpus contains a <kind> page
  When a visitor requests its canonical path
  Then the response is successful HTML for that page in its locale

  Examples:
    | kind                                   |
    | nested lesson several folders deep     |
    | section index                          |
    | course overview                        |
    | legacy                                 |
    | English rant                           |
    | English about and terms                |
    | Indonesian belajar                     |
    | Indonesian celoteh                     |
    | Indonesian konten-video                |
    | Indonesian about and terms             |

Scenario: Every URL of the previous site still answers
  Given the inventory of the previous site's URLs and redirect sources
  When a crawler requests each one
  Then each answers 200, or a chain of at most five permanent 308 responses that ends in 200
  And none answers 404

Scenario Outline: A temporary redirect of the previous site becomes permanent
  When a visitor requests "<source>"
  Then the response permanently redirects with status 308 to "<destination>"

  Examples:
    | source                                                              | destination                                                         |
    | /en/learn/software-engineering/software-architecture/by-example     | /en/learn/software-engineering/software-architecture/by-example/overview |
    | /en/learn/software-engineering/system-design/by-example             | /en/learn/software-engineering/system-design/by-example/overview    |
    | /en/learn/information-security/by-example                           | /en/learn/information-security/by-example/foundations               |

Scenario: The retired RPC interface is not served
  When a visitor requests "/api/trpc/meta.health"
  Then the response is the ordinary not-found page without internals
```

### Entry pages, search, and discovery

```gherkin
Scenario: The locale landing page lists the sections and paths that exist
  Given the corpus has sections and the manifests define paths
  When a reader opens a locale landing page
  Then it shows a card for each top-level section and each landing path
  And no card names an item that the corpus or manifests do not contain

Scenario: The browse page lists every top-level section of the locale
  When a reader opens the browse page of a locale
  Then exactly that locale's top-level sections are listed with links in that locale

Scenario: The tools index lists both tools with their descriptions in the locale
  When a reader opens the tools index of a locale
  Then both tools appear with that locale's link text and description

Scenario: Search finds a page that exists only in the real corpus
  Given the real corpus holds a page that no fixture contains
  When a reader searches for a word in that page's title
  Then the page appears in the results of its locale

Scenario: The sitemap lists every canonical route class under the configured origin
  Given the configured corpus contains published, draft, and removed page identities
  When a crawler requests the sitemap repeatedly
  Then each successful response lists only canonical published routes
  And no draft, removed, filesystem, or progress value is listed

Scenario: Robots instructions retain the current crawling contract
  Given the server has its configured local origin
  When a crawler reads the robots document repeatedly
  Then the response is successful plain text allowing the existing crawl scope
  And its sitemap reference uses the configured origin without private state
```

### Caching

```gherkin
Scenario: A page can be revalidated without a body
  Given a reader holds a page response and its validator
  When the reader requests the same page with that validator
  Then the response is 304 with no body

Scenario Outline: Responses that must not be stored say so
  When a reader requests a <case>
  Then the response carries Cache-Control no-store

  Examples:
    | case            |
    | search fragment |
    | missing page    |

Scenario: A catalog failure response is not stored
  Given the catalog is unavailable
  When a reader requests a page
  Then the response carries Cache-Control no-store
```

### Design and suites

These outcomes are proved at the plan level, so the scenarios stay in this document and do not enter
the product corpus (see [008](./tech-docs/008-bdd-delta-map.md)).

```gherkin
Scenario Outline: A page class matches the previous site's rendering
  Given both sites render the same <page class> from the real corpus in <locale>
  When both are captured at <viewport> pixels wide in <theme> theme
  Then the pixel difference is at most the previous site's own capture-to-capture noise
  And every difference region above that noise is fixed or accepted by the owner with a reason

  Examples:
    | page class | locale | viewport | theme |
    | lesson     | en     | 375      | light |
    | lesson     | id     | 1280     | dark  |
    | catalog    | en     | 768      | light |

Scenario: The HTTP suite checks a configured server read-only
  Given the server's address is given as the base address
  When the HTTP suite runs
  Then Playwright starts no server and sends only GET requests
  And the be home's real-corpus scenarios and the parity crawl run against that address; the fe home has no read-only mode
```

## UI reference and refactor disposition

This is a behavior- and appearance-preserving implementation rewrite. It adds no product screen,
control, layout choice, or visual redesign. The pure-refactor exemption in
[UI Mockups Scope](../../../repo-governance/conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#scope)
applies: do not invent divergent product designs or manufacture alternative mockups.

The existing app is the reference for landing, content reader, catalog, path landing, Learn home,
tools index, and both tool screens. Ground the implementation in the existing `globals.css`,
shell/navigation components, tool components, and `libs/web-ui-token`; React components from
`libs/web-ui` are references, not components that can be imported into Go templates. Interactive
regions (search dialog, tool filters, progress islands) use htmx partial swaps against small
fragment endpoints, with full-page query-parameter fallbacks that work without JavaScript.

Before changing a behavior slice, capture its existing screen in `en` and `id` where the route
exists, at 375, 768, and 1280 px, in relevant light/dark modes. Preserve mobile sheets and stacked
controls, tablet reflow, desktop side rails, focus order, visible labels, and accessible contrast.
The equivalent Go capture accompanies the comparison. Since the 2026-11-28 amendment a harness does
this for every page class on the real corpus (see
[006](./tech-docs/006-parity-program-design.md#design-parity-method-g8-owner-decision-1)); the earlier
partial captures under `evidence/P0/` are its starting references. The reader may accept different
framework-generated DOM attributes, not missing content or changed navigation. Unexpected visible
differences are defects unless the user explicitly changes this product boundary.

## Product risks and exclusions

Different ports are different browser storage origins. The new app retains compatible keys and
schemas but does not automatically transfer progress from port 3101 to 3102, and this plan adds no
export/import UI. htmx partial swaps need a reachable server for those regions; the initial
server-rendered HTML, canonical links, and navigation remain usable from the first response.
Deployment, DNS cutover, hosting and retiring the old app are outside this plan's scope. Accounts, databases,
and redesigned screens are also excluded. Visual parity may leave a recorded difference only with the owner's
written acceptance, and a read-only suite run against a `BASE_URL` never writes to the server.
