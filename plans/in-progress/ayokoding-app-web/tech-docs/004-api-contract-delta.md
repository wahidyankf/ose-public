# API Contract Delta

## Operation index

All ADD operations belong to the new loopback Go origin; they do not replace an operation on
the existing server. `APP` below is `http://localhost:3102` for development and
`http://localhost:3191` for the owned test server. Canonical/discovery URLs use that configured
origin, never an arbitrary request Host header. These are browser HTML and htmx fragment
interfaces, not a new REST/GraphQL API. No OpenAPI/AsyncAPI/client generation is required.

| Action | Operation                                                                     | Packet                                      |
| ------ | ----------------------------------------------------------------------------- | ------------------------------------------- |
| ADD    | Canonical pages under `/{locale}/learn/...` (courses, lessons, paths, legacy) | [Page navigation](#page-navigation)         |
| ADD    | `GET /`, uppercase-locale entries, and the ordered legacy redirect table      | [Permanent redirects](#permanent-redirects) |
| ADD    | `GET /sitemap.xml`                                                            | [Sitemap](#sitemap)                         |
| ADD    | `GET /feed.xml`                                                               | [RSS](#rss)                                 |
| ADD    | `GET /robots.txt`                                                             | [Robots](#robots)                           |
| ADD    | `GET /htmx/search` fragment                                                   | [Search fragment](#search-fragment)         |
| ADD    | `GET /htmx/benchmark` fragment                                                | [Benchmark fragment](#benchmark-fragment)   |
| ADD    | `GET /htmx/calculator` fragment                                               | [Calculator fragment](#calculator-fragment) |
| RETAIN | Existing origin's `GET /api/trpc/{procedures}`                                | [Old tRPC boundary](#old-trpc-boundary)     |

## Common constraints

Every packet incorporates these constraints. No authentication/account, role, tenant, Bearer [REDACTED]|scope, pagination, or new rate limiter is introduced. Locale is validated as `en|id`;
fragment handlers derive it from the mounted page route, never from a client-supplied locale
field. Source roots and dataset locations come from server configuration. Requests cannot select
arbitrary files.

HTML and discovery responses use `Cache-Control: no-store` locally so authoring reloads are
observable; no CDN/hosting cache contract is designed. Generated assets use normal Go static
file handling. Server errors disclose no source path, stack trace, environment value,
or browser storage. Log only sanitized operation identity and an error category; no progress
record or salary query/fragment values. No endpoint persists browser state. HTTP reads are
idempotent and share immutable catalog snapshots. A reload rebuilds public state from the
current URL; browser scripts preserve local state without re-upload.

On source failure, a missing/invalid individual document follows its current omission/404
policy; an unavailable catalog that prevents rendering returns generic 500 HTML and sanitized
diagnostics. Do not use a 200 empty page to mask an infrastructure failure. Such test failures
use an injected fixture adapter, never chmod/delete a developer's corpus.

## Page navigation

Owner: `internal/web` router and page/fragment/template handlers; caller: browser or
crawler. Method: GET, no body, `Accept: text/html`. Canonical routes follow the existing app
exactly (bookmarks keep working); do not invent untranslated course destinations or new
top-level sections:

| Screen                            | Canonical route                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Learn hub                         | `/{locale}/learn`                                                                              |
| Course catalog                    | `/{locale}/learn/courses`                                                                      |
| Course landing                    | `/{locale}/learn/courses/{course}`                                                             |
| Lesson (`learning` or `drilling`) | `/{locale}/learn/courses/{course}/{learning\|drilling}/{lesson}`                               |
| Paths hub and categories          | `/{locale}/learn/paths`, `/{locale}/learn/paths/{careers\|skills}`                             |
| Path landing (variable depth)     | `/{locale}/learn/paths/{path-id...}`                                                           |
| Legacy content                    | `/{locale}/learn/legacy/{rest...}`                                                             |
| Tool pages                        | `/{locale}/tools`, `/{locale}/tools/ai-benchmark`, `/{locale}/tools/cost-of-living-calculator` |

Locale is validated as `en|id`. Path, course, lesson, and kind segments are validated;
unsafe segments and unknown identities return the locale's missing-page result.

Query contracts: content path context uses the existing validated `path` identifier; invalid or
nonmember context falls back to the canonical course. Tool query fields are listed in their fragment
packets; preserve raw query decoding's first-value rule exactly as the old codecs implement it —
never substitute `r.URL.Query()` multi-value behavior without the first-value rule.

Success: 200, `Content-Type: text/html; charset=utf-8`, readable server-rendered content and a single
page h1, title/canonical metadata, current locale and public lesson metadata. No progress state is
embedded. Unknown locale/page, unsafe path, hidden draft, or escaping source reference returns 404
HTML without a path disclosure; current localized missing-page behavior applies to a valid locale.
GET requests are replay-safe; no update/version field is applicable.

```http
GET /en HTTP/1.1
Host: localhost:3102
Accept: text/html
```

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-store

<!DOCTYPE html>
<html lang="en"><head><title>AyoKoding</title></head><body>...</body></html>
```

The body example is schematic; assert semantic elements and source content, not a fabricated exact
whole document. Compatibility: old origin remains live; rollback stops only the new app. Proof:
`content/content-rendering.feature`, titles “An ordinary content request contains readable
server-rendered HTML”, “Draft content stays hidden unless draft viewing is enabled”, and “A
missing page returns the locale's not-found experience”; Unit, Integration, E2E all apply.

### Page navigation detailed scenarios

```gherkin
Scenario: Read an allowed page through its locale route
  Given a published page exists in the configured content root
  When a reader requests its canonical locale route
  Then the response is successful readable HTML for that page and locale
  And no browser progress state or filesystem path is present

Scenario: Reject a missing or unsafe page reference
  Given a requested content identity is missing or escapes the configured root
  When a reader requests that identity
  Then the response is a not-found page
  And it does not disclose the resolved filesystem location

Scenario: Repeated page reads do not change content
  Given a published page exists in the configured content root
  When two readers request that page concurrently
  Then both responses use a complete catalog generation
  And the shared source remains unchanged
```

These additional validation/concurrency/privacy cases land in the same canonical content feature;
they are part of AC-01/03/10, not exemptions left for later design.

## Permanent redirects

Owner: ordered redirect middleware before page routing; caller: browser/crawler. GET, no body;
`Accept: text/html`; query retained. `/` permanently redirects to `/en`. Existing case variants
such as `/EN` redirect to `/en`. Apply the exact current redirect order from `next.config.ts` and
its typed modules, reconciled to the execution revision:

1. `localeEntryRedirects` (case variants such as `/EN`),
2. `contentNamespaceRedirects` (section namespace normalization, incl. the `/en/learn/:path*`
   umbrella rule),
3. `learnReorgRedirects` (legacy section moves inside `learn/`, incl. temporary 307 fixups),
4. `courseRehomeRedirects` (37 re-homed `fundamentally-strong/software-engineer/<slug>/:path*`
   bundles plus 3 retired roots to the course library),
5. `learnHomeRedirects` (Learn home entries),
6. `learnThreeBucketRedirects` (Learn hub three-bucket normalization).

Preserve current destinations, permanent/temporary status per rule, and query strings; fragments
are browser-side and are verified in browser navigation, not sent as HTTP input. Legacy course
deep links 308 to their canonical `/en/learn/courses/...` sub-pages (not to the course root);
uppercase entries normalize once without looping.

Success: 308 with `Location` set to the exact canonical destination plus retained query. A path
matching no rule continues normal page routing and may return 404; it never redirects to itself.
No redirect body schema is required. No auth, version, mutation, pagination, codegen, or custom
error object applies. Replay yields the same destination for the same catalog/rules revision.

```http
GET /EN?from=local HTTP/1.1
Host: localhost:3102
```

```http
HTTP/1.1 308 Permanent Redirect
Location: /en?from=local
Cache-Control: no-store
```

Compatibility: old server rules remain untouched; new rules follow current merged behavior.
Proof: `navigation/routes-and-navigation.feature`, “The root enters the default locale”,
“Uppercase locale entries resolve to lowercase URLs”, and “An established redirect preserves its
current destination and query”; Unit, Integration, and E2E apply.

### Redirect detailed scenarios

```gherkin
Scenario: Normalize an uppercase locale without a redirect loop
  Given the lowercase locale route is canonical
  When a reader requests its uppercase locale entry with a query
  Then the response permanently redirects once to the lowercase destination
  And the query is preserved

Scenario: Leave an unmatched missing route as missing
  Given a route matches no established redirect or published page
  When a reader requests that route twice
  Then both responses are not-found responses
  And no source path or private browser value is disclosed
```

## Sitemap

Owner: discovery handler, crawler caller. GET `/sitemap.xml`, no parameters/body,
`Accept: application/xml`. Success 200, XML sitemap media type and namespace, one current canonical
published route per existing sitemap contract, with current dates/frequency/priority semantics.
Draft and removed routes are absent. Failure: generic 500 on unavailable catalog; malformed query
fields are ignored because none are part of this operation. Repeat/concurrent reads use complete
snapshots and create no state; no private fields, auth, pagination, or codegen.

```http
GET /sitemap.xml HTTP/1.1
Host: localhost:3102
Accept: application/xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://localhost:3102/en</loc></url>
</urlset>
```

Compatibility and rollback: new origin only, old document unchanged. Proof title “The sitemap
reflects the current published corpus” in `discovery/discovery-documents.feature`; all three layers.

### Sitemap detailed scenarios

```gherkin
Scenario: Publish only allowed canonical sitemap routes
  Given the configured corpus contains published, draft, and removed page identities
  When a crawler requests the sitemap repeatedly
  Then each successful response lists only canonical published routes
  And no draft, removed, filesystem, or progress value is listed

Scenario: Report an unavailable catalog without exposing its location
  Given an owned test adapter cannot build the content catalog
  When a crawler requests the sitemap
  Then the server returns a generic server error
  And the response contains no filesystem path
```

## RSS

Owner: discovery handler, feed-reader caller. GET `/feed.xml`, no body/query,
`Accept: application/rss+xml`. Success 200, `application/rss+xml; charset=utf-8`, RSS 2.0 channel,
current title/link/description/language/Atom self-link, and published English non-section items
with existing title/link/guid/date/description semantics. Preserve current traversal/order behavior
using the captured corpus; do not introduce a new sorting policy. Failure: generic 500 on
unavailable catalog. Unknown query fields are ignored. All common privacy, snapshot, repeat-read,
compatibility and rollback constraints apply; no auth/pagination/generated client.

```http
GET /feed.xml HTTP/1.1
Host: localhost:3102
Accept: application/rss+xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>AyoKoding</title><language>en</language></channel></rss>
```

Proof title “The feed exposes the current published entries” in the discovery feature; all layers.

### RSS detailed scenarios

```gherkin
Scenario: Read the published feed without private or draft entries
  Given the corpus contains published English articles and draft or non-English pages
  When a reader reads the feed twice
  Then the successful feed retains the existing eligible entries and ordering
  And no draft, browser progress, or filesystem path appears

Scenario: Fail a feed request when its catalog is unavailable
  Given an owned test adapter cannot build the content catalog
  When a reader requests the feed
  Then the server returns a generic server error without source details
```

## Robots

Owner: discovery handler, crawler caller. GET `/robots.txt`, no parameters/body,
`Accept: text/plain`. Success 200, `text/plain; charset=utf-8`, existing `User-agent: *`,
`Allow: /`, and sitemap reference using the configured local origin. No user-provided values,
private state, auth, pagination, concurrency/version, or generated client. This static response
does not depend on catalog availability; missing arbitrary `.txt` routes return normal 404 HTML.
Compatibility/rollback: new origin only.

```http
GET /robots.txt HTTP/1.1
Host: localhost:3102
Accept: text/plain
```

```text
User-agent: *
Allow: /
Sitemap: http://localhost:3102/sitemap.xml
```

Proof title “Robots instructions retain the current crawling contract” in the discovery feature;
all layers.

### Robots detailed scenarios

```gherkin
Scenario: Read stable local robots instructions
  Given the server has its configured local origin
  When a crawler reads the robots document repeatedly
  Then the response is successful plain text allowing the existing crawl scope
  And its sitemap reference uses the configured origin without private state

Scenario: Do not treat another text path as robots instructions
  When a crawler requests an unknown text-document path
  Then it receives the normal not-found response without filesystem details
```

## Search fragment

Owner: search handler and `internal/search`; caller: the htmx-powered dialog, with a full-page
fallback for no-JavaScript readers. Method GET, `Accept: text/html`. Query `q` is a string and
optional integer `limit`, default 20, range 1–50. Locale comes from the mounted page route;
a conflicting locale field or extra field is rejected. A whitespace-only dialog input clears
results. Missing/nonstring query or invalid limit produces an inline validation fragment with
code `invalid_search`, an empty result list, and no crash. Successful output is an HTML fragment
containing ordered de-duplicated title/slug/excerpt/current-locale links — not a JSON endpoint.
The same query parameters on the full page route render the identical result server-side.

```http
GET /htmx/search?q=golang&limit=20 HTTP/1.1
Host: localhost:3102
Accept: text/html
HX-Request: true
```

No persistence/auth/pagination/codegen. Repeated queries produce the same semantic result for the
same snapshot; later input supersedes earlier results, including when a prior computation finishes
late. No raw input logging. Compatibility: existing app uses its own tRPC search unchanged.

Proof titles “Results stay within the current locale” and “Empty search input does not display stale
results” in `search/search.feature`; all layers. The malformed-request and late-result cases land
in that feature as part of implementation.

### Search detailed scenarios

```gherkin
Scenario: Search within the mounted locale
  Given matching published content exists in both locales
  When a reader submits a valid query in one locale
  Then only that locale's published content and tools appear
  And the result contains no source path or progress record

Scenario: Reject an invalid fragment search request
  Given a reader has a search dialog
  When the dialog requests a nonstring query or an invalid result limit
  Then an inline invalid-search state appears without a process crash

Scenario: Newer search input wins over a late result
  Given an earlier query is still being evaluated
  When a reader submits a later query and its results arrive first
  Then a late result for the earlier query does not replace the later results
```

## Benchmark fragment

Owner: benchmark handler and `internal/tools/benchmark`; caller: current tool form, with a
full-page query-URL fallback. Method GET; query keys are scalar strings for `harness`, `tier`,
`sub`, `sub-harness`, matching the existing `ai-benchmark/core/url-state.ts` accepted
identifiers, defaults, first-value decoding, and omitted-default encoding. Unknown scalar values
recover with existing defaults; nested/structured values or unexpected fields produce an inline
`invalid_filters` fragment without a crash. Route locale is mount-owned.

```http
GET /htmx/benchmark?harness=unknown-harness&tier=unknown-tier HTTP/1.1
Host: localhost:3102
Accept: text/html
HX-Request: true
```

This example deliberately exercises default recovery rather than inventing a real dataset ID.
Success is a public rendered fragment and canonical URL patch using the shared dataset; no
matching models gives an intentional empty state. Same normalized state produces the same
result; query back/forward restores it, no database write occurs, and no telemetry logs the
payload. Handler failure produces a generic tool error without partial arithmetic. No
auth/pagination/codegen. Old app data-adapter rollout precedes or accompanies the neutral-data
consumer; rollback restores that coherent extraction unit or stops only the new app.

Proof: all scenarios in `tools/ai-benchmark.feature`, especially “A benchmark URL restores all
supported filter state” and “Invalid benchmark URL values recover using existing defaults”;
all layers. Malformed-input/privacy cases follow below.

### Benchmark detailed scenarios

```gherkin
Scenario: Reapply benchmark options without changing their result
  Given the shared data and a valid benchmark state
  When a reader applies that state repeatedly and reloads its URL
  Then the comparison and encoded options remain equivalent
  And no private browser progress is included

Scenario: Recover an unknown scalar benchmark option
  When a reader applies an unknown scalar benchmark option
  Then the existing codec's default is used without a process crash

Scenario: Reject a structured benchmark option
  When a connected tool receives a nested value instead of a scalar filter
  Then an inline invalid-filters state appears without exposing source details
```

## Calculator fragment

Owner: calculator handler and `internal/tools/calculator`; caller: current calculator form,
with a full-page query-URL fallback. Method GET; query keys are scalar strings matching the
existing codec: `tab`, `region`, `country`, `city`, `adults`, `preschool`, `schoolkids`,
`schooltype`, `area`, `gross`, `baseline`, `target`, `targetcur`, `refcity`, `refrole`,
`mygross`, `mysalarycity`, `mygrosscur`, `displaycur`. Nested or unexpected fields are rejected
with inline `invalid_filters`. Mounted locale is authoritative. Copy defaults, allowed sets,
coercion, bounds, incompatible-geography cleanup, and first-value duplicate handling from the
current `cost-of-living-calculator/core/url-state.ts`; do not replace its behavior with stricter
or looser numeric parsing. Preserve blank target versus explicit zero.

```http
GET /htmx/calculator?tab=cost&adults=1&preschool=0&schoolkids=0&area=center HTTP/1.1
Host: localhost:3102
Accept: text/html
HX-Request: true
```

Success: rendered cost/savings/minimum-role results and canonical encoded URL, with current empty,
warning, unsupported, and nonfinite-result handling. Repeated normalized inputs and browser
back/forward retain equivalent results. Salary/household input remains transient view state and
URL state as in the old tool, not logs, a cookie, a stored server record, or analytics. No
auth/pagination/custom API client. Dataset failure gives a generic tool error; no misleading
finite estimate is fabricated. Compatibility/rollback follow the benchmark data boundary.

Proof titles “A calculator URL restores all supported input state”, “Invalid calculator inputs
follow the current validation rules”, and “A geography change removes an incompatible city
selection” in `tools/cost-of-living-calculator.feature`; all layers.

### Calculator detailed scenarios

```gherkin
Scenario: Reapply calculator options without changing their result
  Given a shared calculator reference vector
  When a reader applies its inputs repeatedly and reloads the resulting URL
  Then the cost, savings, and minimum-role results match the vector
  And the server stores or logs no household or salary record

Scenario: Recover an invalid scalar calculator option
  When a reader supplies an invalid scalar input through the tool URL
  Then the existing codec's accepted recovery or validation result is shown
  And invalid arithmetic does not become a misleading finite estimate

Scenario: Reject a structured calculator input
  When a connected tool receives a nested value instead of a scalar input
  Then an inline invalid-filters state appears without exposing source details
```

## Old tRPC boundary

The retained origin is `http://localhost:3101`, not APP. It continues serving the existing
`content.getBySlug`, `content.listChildren`, `content.getTree`, `search.query`, `meta.health`,
`meta.languages`, and `coursePaths.getRouteData` procedures. Inspected evidence is the existing
`src/features/*/shell/router.ts`, root router, and old backend Gherkin corpus. Request/response
schemas, tRPC encoding/error behavior, locale constraints, authentication posture, and cache
behavior remain authoritative there. No operation is deleted or moved. Neighboring old-app
changes are typed tool-data adapters only, with unchanged public behavior. Existing old-app Unit
and E2E tests prove that no wire contract changed; no Go tRPC compatibility layer is created.

## Manual wire recipe registry

Use the literal commands in [delivery](../delivery.md#manual-http-and-fragment-verification).
Each changed HTTP operation has success and failure proof. The discovery-handler failure
fixture is enabled only by the owned `test` bootstrap with a fixture source adapter;
ordinary dev configuration cannot select it. Fragment endpoints are exercised with plain HTTP
requests carrying `HX-Request: true` plus real-browser htmx swaps, with sanitized browser
network evidence.
