# API Contract Delta

## Operation index

All ADD operations belong to the new loopback Phoenix origin; they do not replace an operation on
the existing server. `APP` below is `http://localhost:3102` for development and
`http://localhost:3191` for the owned test server. Canonical/discovery URLs use that configured
origin, not an arbitrary request Host header. These are browser HTML and LiveView interfaces,
not a new REST/GraphQL API. No OpenAPI/AsyncAPI/client generation is required.

| Action | Operation                                                  | Packet                                      |
| ------ | ---------------------------------------------------------- | ------------------------------------------- |
| ADD    | `GET /{locale}` and `GET /{locale}/{route...}`             | [Page navigation](#page-navigation)         |
| ADD    | `GET /` and established historical/uppercase-locale routes | [Permanent redirects](#permanent-redirects) |
| ADD    | `GET /sitemap.xml`                                         | [Sitemap](#sitemap)                         |
| ADD    | `GET /feed.xml`                                            | [RSS](#rss)                                 |
| ADD    | `GET /robots.txt`                                          | [Robots](#robots)                           |
| ADD    | Native Phoenix LiveSocket connection on `/live`            | [LiveSocket](#livesocket)                   |
| ADD    | LiveView `search` event                                    | [Search](#search)                           |
| ADD    | LiveView `benchmark_filters` event                         | [Benchmark filters](#benchmark-filters)     |
| ADD    | LiveView `calculator_filters` event                        | [Calculator filters](#calculator-filters)   |
| RETAIN | Existing origin's `GET /api/trpc/{procedures}`             | [Old tRPC boundary](#old-trpc-boundary)     |

## Common constraints

Every packet incorporates these constraints. No authentication/account, role, tenant, bearer
scope, pagination, or new rate limiter is introduced. Locale is validated as `en|id`; LiveView
context derives it from the mounted route, never a client-supplied locale field. Source roots and
dataset locations come from server configuration. Requests cannot select arbitrary files.

HTML and discovery responses use `Cache-Control: no-store` locally so authoring reloads are
observable; no CDN/hosting cache contract is designed. Generated assets use their normal local
Phoenix asset handling. Server errors disclose no source path, exception stack, environment value,
or browser storage. Log only sanitized operation identity and an error category; no progress record
or salary query/event values. No endpoint persists browser state. HTTP reads are idempotent and
share immutable catalog snapshots; socket event order is scoped to its LiveView process. Reconnect
rebuilds public state from the current URL and preserves browser-owned state only in its hook.

On source failure, a missing/invalid individual document follows its current omission/404 policy;
an unavailable catalog that prevents rendering returns generic 500 HTML and sanitized diagnostics.
Do not use a 200 empty page to mask an infrastructure failure. Such test failures use an injected
fixture adapter, never chmod/delete a developer's corpus.

## Page navigation

Owner: `AyoKodingWeb.Router` and its landing/content/course/tool LiveViews; caller: browser or
crawler. Method: GET, no body, `Accept: text/html`. Supported locale, content identity, and the
current special routes determine the screen. Tools paths are `/en/tools`, `/en/tools/ai-benchmark`,
`/en/tools/cost-of-living-calculator` and the corresponding `id` routes. Content and locale segment
mapping follow the existing app; do not invent untranslated course destinations.

Query contracts: content path context uses the existing validated `path` identifier; invalid or
nonmember context falls back to the canonical course. Tool query fields are listed in their event
packets. Preserve raw query decoding's first-value rule where the old codecs use
`URLSearchParams.get`; Phoenix's default duplicate-key behavior is not a substitute.

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

Owner: ordered redirect plug before LiveView routing; caller: browser/crawler. GET, no body;
`Accept: text/html`; query retained. `/` permanently redirects to `/en`. Existing case variants
such as `/EN` redirect to `/en`. Apply the exact current redirect order from `next.config.ts` and
its typed modules, reconciled to the execution revision. Preserve current destinations and query
strings; fragments are browser-side and are verified in browser navigation, not sent as HTTP input.

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

Owner: discovery controller, crawler caller. GET `/sitemap.xml`, no parameters/body,
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

Owner: discovery controller, feed-reader caller. GET `/feed.xml`, no body/query,
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
  When a reader requests the feed twice
  Then the successful feed retains the existing eligible entries and ordering
  And no draft, browser progress, or filesystem path appears

Scenario: Fail a feed request when its catalog is unavailable
  Given an owned test adapter cannot build the content catalog
  When a reader requests the feed
  Then the server returns a generic server error without source details
```

## Robots

Owner: discovery controller, crawler caller. GET `/robots.txt`, no parameters/body,
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

## LiveSocket

Owner: generated Phoenix endpoint and LiveSocket browser client. Use Phoenix's native `/live`
transport, framework-managed channel join/diff/event protocol, session token, and CSRF token; do
not invent a REST or hand-built WebSocket protocol. Socket connect parameters contain only the
generated public framework context; never add stored progress. Check the configured local origin;
invalid/forged framework context rejects the join without starting a user action. Use the exact
wire profile supplied by the locked Phoenix/LiveView versions and their generated JS client.

Success: the generated client joins its mounted LiveView, receives diffs, and can reconnect.
Failures: rejected origin/session/CSRF join, disconnect, or missing view; show framework reconnect
feedback and retain readable HTML rather than deleting content. No account, authorization scope,
custom response JSON, persistence, pagination, or generated API client. A reconnect derives public
state from URL; hooks preserve local state without re-upload. Privacy, replay and logging follow
common constraints. Rollback stops the new server; no socket consumer changes on the old app.

The public example is client construction using the framework, not a guessed protocol packet:

```javascript
const socket = new LiveSocket("/live", Socket, { params: { _csrf_token: csrfToken }, hooks });
socket.connect();
```

Proof maps to `shell/bilingual-shell.feature` and browser-progress reconnect/privacy scenarios;
Unit validates context filtering, Integration validates joined/disconnected mounts, E2E exercises
the actual JS client. Additional exact scenario “Reject a forged LiveView connection context” is
added to the shell feature during its TDD packet; no Integration exemption.

### LiveSocket detailed scenarios

```gherkin
Scenario: Reconnect without transmitting browser progress
  Given a reader has browser progress and a connected page
  When the socket disconnects and reconnects
  Then the page resumes from its public route context
  And browser progress remains local and visible

Scenario: Reject a forged LiveView connection context
  Given a connection has an invalid framework token or unapproved origin
  When it attempts to join the page
  Then the join is rejected without executing a user action
  And no private source or browser state is exposed
```

## Search

Owner: search LiveView component and `AyoKoding.Search`; caller: the mounted dialog. Native event
`search`; input map has `query` string and optional integer `limit`, default20, range1–50. Locale
comes from mount; reject a supplied conflicting locale or extra field. Whitespace-only dialog
input clears results. Missing/nonstring query or invalid limit produces inline validation code
`invalid_search`, empty result list, and no crash. Successful output is a rendered diff containing
ordered de-duplicated title/slug/excerpt/current-locale links, not a new JSON HTTP endpoint.

```json
{ "query": "elixir", "limit": 20 }
```

No persistence/auth/pagination/codegen. Repeated queries produce the same semantic result for the
same snapshot; later input supersedes earlier results, including when a prior computation finishes
late. No raw input logging. Compatibility: existing app uses its own tRPC search unchanged.

Proof titles “Results stay within the current locale” and “Empty search input does not display stale
results” in `search/search.feature`; all layers. Add the malformed-event and late-result cases in
that feature as part of implementation.

### Search detailed scenarios

```gherkin
Scenario: Search within the mounted locale
  Given matching published content exists in both locales
  When a reader submits a valid query in one locale
  Then only that locale's published content and tools appear
  And the result contains no source path or progress record

Scenario: Reject an invalid direct search event
  Given a reader has a connected search dialog
  When the dialog receives a nonstring query or invalid result limit
  Then an inline invalid-search state appears without a process crash

Scenario: Newer search input wins over a late result
  Given an earlier query is still being evaluated
  When a reader submits a later query and its results arrive first
  Then a late result for the earlier query does not replace the later results
```

## Benchmark filters

Owner: benchmark LiveView/context; caller: current tool form. Native event `benchmark_filters`;
input map contains only scalar string values for `harness`, `tier`, `sub`, `sub-harness`, with
form `_target` discarded before validation. Accepted identifiers, defaults, first-value URL
decoding, and omitted-default encoding match the existing `ai-benchmark/core/url-state.ts`.
Unknown scalar values recover with existing defaults; nested/nonstring structures or unexpected
fields produce inline `invalid_filters` without a crash. Route locale is mount-owned.

```json
{ "harness": "unknown-harness", "tier": "unknown-tier" }
```

This example deliberately exercises default recovery rather than inventing a real dataset ID.
Success is a public rendered result and canonical URL patch using the shared dataset; no matching
models gives an intentional empty state. Same normalized state produces the same result; query
back/forward restores it, no database write occurs, and no telemetry logs the payload. Context
failure produces a generic tool error without partial arithmetic. No auth/pagination/codegen.
Old app data-adapter rollout precedes or accompanies the neutral-data consumer; rollback restores
that coherent extraction unit or stops only the new app.

Proof: all scenarios in `tools/ai-benchmark.feature`, especially “A benchmark URL restores all
supported filter state” and “Invalid benchmark URL values recover using existing defaults”; all
layers. Additional malformed-event/privacy cases follow below.

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

## Calculator filters

Owner: calculator LiveView/context; caller: current calculator form. Native event
`calculator_filters`; input keys are scalar strings matching the existing codec:
`tab`, `region`, `country`, `city`, `adults`, `preschool`, `schoolkids`, `schooltype`, `area`,
`gross`, `baseline`, `target`, `targetcur`, `refcity`, `refrole`, `mygross`, `mysalarycity`,
`mygrosscur`, `displaycur`. Discard form `_target`; reject nested or unexpected fields with
inline `invalid_filters`. Mounted locale is authoritative. Copy defaults, allowed sets, coercion,
bounds, incompatible-geography cleanup, and first-value duplicate handling from the current
`cost-of-living-calculator/core/url-state.ts`; do not replace its behavior with stricter or looser
numeric parsing. Preserve blank target versus explicit zero.

```json
{ "tab": "cost", "adults": "1", "preschool": "0", "schoolkids": "0", "area": "center" }
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
and E2E tests prove that no wire contract changed; no Phoenix tRPC compatibility layer is created.

## Manual wire recipe registry

Use the literal commands in [delivery](../delivery.md#manual-http-and-native-event-verification).
Each changed HTTP operation has success and failure proof. The discovery-controller failure
fixture is enabled only by the owned `test` bootstrap with source adapter
`AyoKoding.Test.UnavailableCatalog`; ordinary dev configuration cannot select it. Native events
are exercised with the actual generated LiveSocket browser client, with sanitized browser
network evidence and malformed-event tests; do not claim curl speaks the LiveView protocol.
