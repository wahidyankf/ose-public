# API Contract Delta

## Operation index

All ADD operations belong to the new loopback Go origin; they do not replace an operation on
the existing server. `APP` below is `http://localhost:3102` for development and
`http://localhost:3191` for the owned test server. Canonical/discovery URLs use that configured
origin, never an arbitrary request Host header. The configured origin is `AYOKODING_WEB_SITE_URL`
(default `https://www.ayokoding.com`, see [006](./006-parity-program-design.md#discovery-documents-and-origin-g6));
the `localhost` examples below assume local and test runs set it to the server's own origin. These are
browser HTML and htmx fragment interfaces, not a new REST/GraphQL API. No OpenAPI/AsyncAPI/client
generation is required.

| Action | Operation                                                                                     | Packet                                            |
| ------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| ADD    | Canonical pages under `/{locale}/learn/...` (courses, lessons, paths, legacy)                 | [Page navigation](#page-navigation)               |
| ADD    | Every other authored page and section: `GET /{locale}/{slug...}`; nested lessons at any depth | [Generic content pages](#generic-content-pages)   |
| ADD    | `GET /{locale}/browse` and `GET /{locale}/tools`                                              | [Browse and tools index](#browse-and-tools-index) |
| ADD    | Cache validators and cache policy on every response                                           | [Production caching](#production-caching)         |
| ADD    | Crawl contract over the previous site's URLs                                                  | [URL compatibility](#url-compatibility)           |
| ADD    | `GET /`, uppercase-locale entries, and the ordered legacy redirect table                      | [Permanent redirects](#permanent-redirects)       |
| ADD    | `GET /sitemap.xml`                                                                            | [Sitemap](#sitemap)                               |
| ADD    | `GET /feed.xml`                                                                               | [RSS](#rss)                                       |
| ADD    | `GET /robots.txt`                                                                             | [Robots](#robots)                                 |
| ADD    | `GET /htmx/search` fragment                                                                   | [Search fragment](#search-fragment)               |
| ADD    | `GET /htmx/benchmark` fragment                                                                | [Benchmark fragment](#benchmark-fragment)         |
| ADD    | `GET /htmx/calculator` fragment                                                               | [Calculator fragment](#calculator-fragment)       |
| RETAIN | Existing origin's `GET /api/trpc/{procedures}`                                                | [Old tRPC boundary](#old-trpc-boundary)           |
| ABSENT | `GET /api/trpc/*` on the new origin answers the ordinary 404                                  | [Old tRPC boundary](#old-trpc-boundary)           |

## Common constraints

Every packet incorporates these constraints. No authentication/account, role, tenant, Bearer [REDACTED]|scope, pagination, or new rate limiter is introduced. Locale is validated as `en|id`;
fragment handlers derive it from the mounted page route, never from a client-supplied locale
field. Source roots and dataset locations come from server configuration. Requests cannot select
arbitrary files.

Cache headers follow [Production caching](#production-caching): pages and discovery documents
revalidate on every request with a strong `ETag`, fingerprinted assets are immutable, and fragments,
errors, and fixture-mode responses are `no-store`. The fixture mode keeps `no-store` everywhere so
authoring reloads stay observable. Server errors disclose no source path, stack trace, environment value,
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

| Screen                            | Canonical route                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Learn hub                         | `/{locale}/learn`                                                                                 |
| Course catalog                    | `/{locale}/learn/courses`                                                                         |
| Course landing                    | `/{locale}/learn/courses/{course}`                                                                |
| Lesson (`learning` or `drilling`) | `/{locale}/learn/courses/{course}/{learning\|drilling}/{lesson...}` (the lesson may be nested)    |
| Paths hub and categories          | `/{locale}/learn/paths`, `/{locale}/learn/paths/{careers\|skills}`                                |
| Path landing (variable depth)     | `/{locale}/learn/paths/{path-id...}`                                                              |
| Legacy content                    | `/{locale}/learn/legacy/{rest...}`                                                                |
| Tool pages                        | `/{locale}/tools`, `/{locale}/tools/ai-benchmark`, `/{locale}/tools/cost-of-living-calculator`    |
| Browse index                      | `/{locale}/browse`                                                                                |
| Any other authored page           | `/{locale}/{slug...}`, for example `/en/rants/2023/...`, `/id/belajar/...`, `/en/about-ayokoding` |

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
Cache-Control: public, max-age=0, must-revalidate

<!DOCTYPE html>
<html lang="en"><head><title>AyoKoding</title></head><body>...</body></html>
```

The body example is schematic; assert semantic elements and source content, not a fabricated exact
whole document. Compatibility: old origin remains live; rollback stops only the new app. Proof: `content/content-rendering-http.feature`, titles “A lesson page is readable without browser scripts”, “A draft lesson's route returns not found” (fixture), and “A missing page returns the locale's not-found experience”; Unit, Integration, E2E all apply.

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
Cache-Control: public, max-age=3600
```

Compatibility: old server rules remain untouched; new rules follow current merged behavior.
Proof: `navigation/routes-and-navigation-http.feature`, “The root enters the default locale”, “Uppercase locale entries resolve to lowercase URLs”, and “An old URL redirects 308 to its current page”; Unit, Integration, and E2E apply.

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

## Generic content pages

Owner: `internal/web` generic route and the content tree (`P4-Tree`); caller: browser or crawler.
Method GET, no body, `Accept: text/html`. Route `GET /{locale}/{slug...}` registered after every
specific route. `slug` is the slash-joined path below the locale root and may be any depth. It is
validated with `SafePath`: each segment is non-empty ASCII letters, digits, `-`, `_`, or `.` inside a
name, and `.`, `..`, empty segments, separators, whitespace, NUL, and percent-encoded separators are
refused. A slug that names an `_index.md` directory returns that section page; a slug that names a
Markdown file returns that page; the locale root `/en` and `/id` keep their own route. Nested lessons
under `/{locale}/learn/courses/{course}/{learning|drilling}/{lesson...}` use the same resolver and keep
their path context behaviour.

Success: 200, `text/html; charset=utf-8`, one h1, title, description, canonical and alternate links
under the configured origin, sidebar, breadcrumbs, table of contents, and previous and next links
where the existing content rules produce them. Failure: an unknown locale, unknown or unsafe slug, or
hidden draft returns the localized 404 HTML; an unavailable catalog returns the generic 500. No
authentication, pagination, version field, or generated client applies; reads are replay-safe over one
snapshot.

```http
GET /id/belajar/manusia HTTP/1.1
Host: localhost:3102
Accept: text/html
```

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: public, max-age=0, must-revalidate
ETag: "g12-id-belajar-manusia"
```

The `ETag` value is schematic; assert its presence, strength, and per-page uniqueness, not a literal.
Compatibility: every slug the old `[...slug]` route served keeps its path; rollback reverts the
route registration and the loader extension together. Proof titles in
`content/content-tree-routes.feature` (see [008](./008-bdd-delta-map.md)); Unit, Integration, E2E apply.

### Generic content detailed scenarios

These expand the canonical titles in [008](./008-bdd-delta-map.md). The Examples rows of the authored-page outline are the ten kinds listed in the [product requirements](../prd.md).

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

Scenario: A nested lesson requested with its folders collapsed is not found
  Given a course holds a lesson inside a sub-folder of its learning track
  When a visitor requests the same lesson with its folders collapsed
  Then the response is the not-found page

Scenario: A section path lists its children by authored title and order
  Given a section holds child pages with authored titles and an authored order
  When a visitor requests the section path
  Then the response lists each child by its authored title in the authored order

Scenario: A path with traversal or encoded separators returns the not-found page
  Given a request path contains traversal segments or encoded separators
  When a visitor requests it
  Then the response is the not-found page
  And no filesystem path appears in the body or headers

Scenario: A specific route wins over the generic content route
  Given the generic route is registered
  When a visitor requests the course catalog and a path landing
  Then each response comes from its specific handler, not the generic page

Scenario: A content page carries its title, description, and canonical URL
  Given a content page with an authored title and description
  When a visitor requests the page
  Then the head carries the title, the description, and a canonical link under the configured origin
```

## Browse and tools index

Owner: `internal/web` entry-page handlers (`P5-Surfaces`); caller: browser or crawler. GET
`/{locale}/browse` and `/{locale}/tools`, `Accept: text/html`, no parameters. `/browse` lists the
locale's top-level section nodes (English: `learn`, `rants`; Indonesian: `belajar`, `celoteh`,
`konten-video`) from the tree, in tree order, matching `BrowseIndex` in the old app. `/tools` lists the
two tools with their localized link text and description, matching `tools/page.tsx`. `/en` and `/id`
render the old landing's content: section cards and the path cards from loaded manifests
(`[locale]/page.tsx`, `LANDING_SECTION_OVERRIDES`, `mergeLandingSections`), replacing the stub
`templates/home.html`. Success 200 HTML. An unsupported locale returns the 404. No private state is
embedded.

```http
GET /en/tools HTTP/1.1
Host: localhost:3102
Accept: text/html
```

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: public, max-age=0, must-revalidate
```

Compatibility: new routes on the new origin; no old route changes. Proof: `navigation/entry-pages.feature`, “The locale landing page lists the sections and paths that exist”, and `navigation/entry-pages-http.feature`, “The browse page lists every top-level section of the locale” and “The tools index lists both tools with their descriptions in the locale”; all three layers.

### Browse and tools detailed scenarios

These expand the canonical titles in [008](./008-bdd-delta-map.md).

```gherkin
Scenario: The browse page lists every top-level section of the locale
  Given the English tree has two top-level sections and the Indonesian tree has three
  When a reader requests the browse page of each locale
  Then each page lists exactly its locale's sections with links in that locale

Scenario: The tools index lists both tools with their descriptions in the locale
  When a reader requests the tools index in a locale
  Then both tools appear with that locale's link text and description
  And each link opens its tool page

Scenario: The locale landing page lists the sections and paths that exist
  Given the corpus has sections and the manifests define paths
  When a reader requests a locale landing page
  Then the page shows a card for each top-level section and for each landing path
  And no card names an item that the corpus or manifests do not contain
```

## Sitemap

Owner: discovery handler, crawler caller. GET `/sitemap.xml`, no parameters/body,
`Accept: application/xml`. Success 200, XML sitemap media type and namespace, with absolute `<loc>`
values under the configured origin. The set is the union of each locale root, `/{locale}/browse`,
`/{locale}/tools` with both tool pages, every published content node including section pages, the
course catalog and course landings, and every path landing; it is a superset of the old site's
sitemap, and every listed URL answers 200 directly (see [URL compatibility](#url-compatibility)).
`lastmod`, frequency, and priority follow `sitemap.ts` (frontmatter date, `weekly`, 0.8 for sections
and 0.6 for pages). The file lists at most 50,000 URLs, the
[sitemaps.org](https://www.sitemaps.org/protocol.html) limit; a larger corpus fails the sitemap
scenario rather than serving an invalid file. Draft and removed routes are absent. Failure: generic 500 on unavailable catalog; malformed query
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

Compatibility and rollback: new origin only, old document unchanged. Proof titles “The sitemap
reflects the current published corpus”, “The sitemap lists every canonical route class under the
configured origin”, and “A sitemap stays within the protocol's size limit” in
`discovery/discovery-documents.feature`; all three layers.

### Sitemap detailed scenarios

```gherkin
Scenario: The sitemap lists every canonical route class under the configured origin
  Given the configured corpus contains published, draft, and removed page identities
  When a crawler requests the sitemap repeatedly
  Then each successful response lists only canonical published routes
  And no draft, removed, filesystem, or progress value is listed

Scenario: Report an unavailable catalog without exposing its location
  Given an owned test adapter cannot build the content catalog
  When a crawler requests the sitemap
  Then the server returns a generic server error
  And the response contains no filesystem path

Scenario: A sitemap stays within the protocol's size limit
  Given the configured corpus holds more canonical routes than one sitemap file may list
  When a crawler requests the sitemap
  Then every sitemap file stays within the sitemap protocol's URL and byte limits
  And the sitemap index lists each file under the configured origin
```

## RSS

Owner: discovery handler, feed-reader caller. GET `/feed.xml`, no body/query,
`Accept: application/rss+xml`. Success 200, `application/rss+xml; charset=utf-8`, RSS 2.0 channel,
current title/link/description/language/Atom self-link, and published English non-section items
with existing title/link/guid/pubDate/description semantics (`feed.xml/route.ts`: CDATA-wrapped
title and description, `pubDate` from the frontmatter date, absolute links under the configured
origin). Preserve current traversal/order behavior
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
Scenario: The feed exposes the current published entries
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
`Allow: /`, and an absolute sitemap reference using the configured origin. No user-provided values,
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
Scenario: Robots instructions retain the current crawling contract
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
Scenario: Search finds a page that exists only in the real corpus
  Given a page exists in the real corpus and in no fixture
  When a reader searches for a term from that page
  Then the search fragment lists that page

Scenario: Search covers the Indonesian trees and stays within the locale
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

## URL compatibility

Owner: the redirect middleware, the generic route, and the crawl suites (`P4-Redirects`,
`P7-Crawl`); caller: a crawler, the parity suites, and the read-only proof against a configurable `BASE_URL`. The
contract is defined in [006](./006-parity-program-design.md#url-compatibility-contract-and-the-parity-crawl-g9-owner-decision-2):
a URL is compatible when `GET` answers 200, or a chain of at most five permanent 308 responses that
ends in 200. The committed inventory is `apps/ayokoding-web-be-e2e/fixtures/www-url-inventory.json`
(_New_), with the shape below; the inventory may be regenerated from a running old site, as `P7-Crawl` does, with the generator's own documented inputs.

```json
{
  "sourceRevision": "40-character ose-public commit of the old app",
  "urls": ["/en", "/en/learn/courses/just-enough-python"],
  "redirects": [{ "source": "/EN", "status": 308, "location": "/en" }]
}
```

The three old temporary redirects (`/en/learn/software-engineering/software-architecture/by-example`,
`/en/learn/software-engineering/system-design/by-example`,
`/en/learn/information-security/by-example`) are recorded with `"status": 307` in the inventory because
that is what the old app answered; the new app answers 308 with the same `Location`, and the crawler
accepts a 308 where the inventory says 307 only for those three rows. `/api/trpc/*` is not in the
inventory.

```http
GET /en/learn/information-security/by-example HTTP/1.1
Host: localhost:3102
```

```http
HTTP/1.1 308 Permanent Redirect
Location: /en/learn/information-security/by-example/foundations
Cache-Control: public, max-age=3600
```

Errors: any 404, 5xx, 307, loop, or sixth hop is a crawl failure that lists the URL, each hop, and
the first response status. No authentication applies; the crawl is read-only and sends one request per
URL with at most eight in flight. Compatibility: additive; rollback removes the suite, not behaviour.

### URL compatibility detailed scenarios

These five scenarios are durable product scenarios: they are the five `navigation/url-compatibility.feature` rows of
[008](./008-bdd-delta-map.md). The crawl function and the Go chain-follower are test tools, proved by ordinary tests
beside each implementation (Go chain-follower in `P4-Redirects`, TypeScript crawler adapter in `P7-Crawl`); the
scenarios run against them.

```gherkin
Scenario: Every URL of the previous site still answers
  Given the inventory of the previous site's URLs and redirect sources
  When a crawler requests each one
  Then each answers 200, or a chain of at most five permanent 308 responses that ends in 200
  And none answers 404

Scenario: Every sitemap entry of this site answers directly
  Given the new site's sitemap lists its canonical URLs
  When a crawler requests each listed URL
  Then each answers 200 without a redirect

Scenario Outline: A temporary redirect of the previous site becomes permanent
  When a visitor requests "<source>"
  Then the response permanently redirects with status 308 to "<destination>"

  Examples:
    | source                                                              | destination                                                             |
    | /en/learn/software-engineering/software-architecture/by-example     | /en/learn/software-engineering/software-architecture/by-example/overview |
    | /en/learn/software-engineering/system-design/by-example             | /en/learn/software-engineering/system-design/by-example/overview        |
    | /en/learn/information-security/by-example                           | /en/learn/information-security/by-example/foundations                   |

Scenario: A redirect chain ends in a successful page within five hops
  Given a redirect chain of five permanent 308 responses that ends in a page
  When a crawler follows it
  Then the crawl passes and no request is made after the fifth hop

Scenario: The retired RPC interface is not served
  When a visitor requests "/api/trpc/meta.health"
  Then the response is the ordinary not-found page without internals
```

## Production caching

Owner: a single response-header helper in `internal/web` (`P5-Cache`), replacing the thirteen
`Cache-Control: no-store` call sites; caller: browser, a caching reverse proxy or CDN in front, crawler. Policy by response class is
the table in [006](./006-parity-program-design.md#production-caching-g7). Conditional requests: a `GET`
with `If-None-Match` equal to the current strong `ETag` returns 304 with no body and the same
`Cache-Control` and `ETag`. The `ETag` is derived from the snapshot generation and the route, so two
routes never share one and a reload changes all of them. Assets are served under a content-hashed URL
(`?v=<hash>` on the link emitted by the layout). A request whose `v` matches the file's hash is
`public, max-age=31536000, immutable`; a request without `v`, or with a stale one, is still served and
revalidates like a page. The allowlist of served names does not change: unknown names stay 404. Fragments, the 404 and 500 pages, and every
response in fixture mode keep `no-store`. Permanent redirects carry `public, max-age=3600`.

```http
GET /en HTTP/1.1
Host: localhost:3102
If-None-Match: "g12-en"
```

```http
HTTP/1.1 304 Not Modified
Cache-Control: public, max-age=0, must-revalidate
ETag: "g12-en"
```

Compatibility: the old app sent `public, max-age=0, must-revalidate` for locale content, so pages keep
their revalidation behaviour. Rollback: revert the helper; no data changes. Proof titles in
`discovery/http-caching.feature`; all three layers.

### Production caching detailed scenarios

These expand the canonical titles of [008](./008-bdd-delta-map.md) for AC-19.

```gherkin
Scenario: A page can be revalidated without a body
  Given a reader holds a page response and its validator
  When the reader requests the same page with that validator
  Then the response is 304 with no body
  And its cache headers equal the original response's

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

Scenario: Two different pages never share a validator
  Given two different pages with the same locale
  When a reader requests each page
  Then the two ETag values differ

Scenario: Fingerprinted assets are cached for a year
  Given a fingerprinted asset
  When a reader requests it
  Then the response carries Cache-Control public, max-age=31536000, immutable

Scenario: An asset requested without its fingerprint is revalidated
  Given the same asset requested without its fingerprint
  When a reader requests it
  Then the response carries Cache-Control public, max-age=0, must-revalidate and an ETag

Scenario: A permanent redirect may be cached briefly
  Given a permanent redirect
  When a reader requests it
  Then the response carries Cache-Control public, max-age=3600
```

## Old tRPC boundary

The retained origin is `http://localhost:3101`, not APP. It continues serving the existing
`content.getBySlug`, `content.listChildren`, `content.getTree`, `search.query`, `meta.health`,
`meta.languages`, and `coursePaths.getRouteData` procedures. Inspected evidence is the existing
`src/features/*/shell/router.ts`, root router, and old backend Gherkin corpus. Request/response
schemas, tRPC encoding/error behavior, locale constraints, authentication posture, and cache
behavior remain authoritative there. No operation is deleted or moved. Neighboring old-app
changes are typed tool-data adapters only, with unchanged public behavior. Existing old-app Unit
and E2E tests prove that no wire contract changed; no Go tRPC compatibility layer is created. On the
new origin `GET /api/trpc/{anything}` is not a route: it answers the ordinary 404
HTML with no internals, and the durable scenario “The retired RPC interface is not served” in the URL compatibility section pins that decision.

## Manual wire recipe registry

Use the literal commands in the [manual HTTP recipe registry](../delivery.md#manual-http-recipe-registry), which
holds one success and one failure recipe for each new HTTP operation; the Phase 8 block is the pre-amendment capture. The discovery-handler failure
fixture is enabled only by the owned `test` bootstrap with a fixture source adapter;
ordinary dev configuration cannot select it. Fragment endpoints are exercised with plain HTTP
requests carrying `HX-Request: true` plus real-browser htmx swaps, with sanitized browser
network evidence.
