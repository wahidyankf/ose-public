---
title: "Overview"
date: 2026-10-13T00:00:00+07:00
draft: false
weight: 1
---

This page is the active-recall companion to the Go backend learning track: four fixed
drills that force retrieval instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on implementation, then a checklist to confirm real
automaticity. Every answer is hidden in a `<details>` block; try each item yourself, out loud or on
paper, before opening it. Every prompt below uses its own mocked, self-contained input -- none of it
is copy-pasted from the learning track's 80 worked examples, so recognizing an answer isn't enough;
you have to actually reconstruct the reasoning. The Go track answers everything with the standard
library plus one driver: `net/http` and `ServeMux` for serving and routing, `encoding/json` for
bodies, `database/sql` with the pure-Go `modernc.org/sqlite` driver for persistence, plain
`func(http.Handler) http.Handler` wrappers for middleware, bearer-token checks read straight off the
`Authorization` header, and `httptest` for every in-process verification.

## Recall Q&A

Twenty-four short-answer questions, one per concept (`co-01` through `co-24`). Answer from memory,
then check.

**Q1 (co-01 -- http-request-response).** Describe the shape of an HTTP request and the shape of an
HTTP response, in terms of their parts.

<details>
<summary>Answer</summary>

A request is a method + path + headers + an optional body (for example, `POST /tasks` with a
`Content-Type` header and a JSON body). A response is a status line + headers + an optional body (for
example, `201 Created` with a `Location` header and the created resource as JSON). In Go, `net/http`
parses the request into an `*http.Request` and exposes the response through `http.ResponseWriter` --
the same four parts, now typed instead of hand-assembled bytes.

</details>

**Q2 (co-02 -- http-methods).** According to RFC 9110, which HTTP methods are idempotent, and which
of GET/POST/PUT/PATCH/DELETE is explicitly _not_ idempotent?

<details>
<summary>Answer</summary>

The idempotent set is GET, HEAD, PUT, DELETE, OPTIONS, and TRACE -- repeating any of these any number
of times produces the same server state as calling it once. POST is explicitly **not** idempotent
(two identical POSTs can create two separate rows). PATCH is also not idempotent -- a partial update
like "increment by 1" produces a different result each time it is replayed. A Go client library may
blindly retry only the idempotent set.

</details>

**Q3 (co-03 -- http-status-codes).** Name the four status-code classes by their leading digit, and
give one status code this track uses from each class.

<details>
<summary>Answer</summary>

2xx success (for example, `201 Created`), 3xx redirect, 4xx client error (for example, `404 Not Found`,
`422 Unprocessable Content`), and 5xx server error (for example, `500`). Go names them as constants --
`http.StatusCreated`, `http.StatusNotFound`, `http.StatusUnprocessableEntity`,
`http.StatusInternalServerError` -- written with `w.WriteHeader`, but the numeric classes are the same
RFC 9110 partition.

</details>

**Q4 (co-04 -- http-headers).** What do HTTP headers carry, and name three concrete examples spanning
both request and response.

<details>
<summary>Answer</summary>

Headers carry metadata about the request or response that does not belong in the body itself --
content type, authentication, tracing ids, and more. Concrete examples: `Content-Type` (declares the
body media type, set by hand with `w.Header().Set` since the stdlib never guesses JSON),
`Authorization` (carries `Bearer <token>` on a request), and a custom `X-Request-Id` (stamped by
middleware onto every response for tracing).

</details>

**Q5 (co-05 -- statelessness).** Why is HTTP deliberately stateless, and what does that force you to
do with data that must persist between requests?

<details>
<summary>Answer</summary>

Each HTTP request is self-contained and shares no server-side memory with any other request -- the
server holds no conversational state about "what happened last time." That forces any data that must
outlive a single request to live somewhere durable and shared, not in a handler's map or a worker's
local cache -- typically a `database/sql` store. It is exactly what lets multiple processes serve the
same application interchangeably: none of them needs to remember anything about a specific client.

</details>

**Q6 (co-06 -- raw-stdlib-server).** What does hand-writing a route on a raw TCP connection reveal
that `net/http` normally hides?

<details>
<summary>Answer</summary>

Writing against raw `net` means assembling the status line, headers, blank line, and body by hand and
parsing the request line yourself -- exactly what `net/http` automates behind
`func(http.ResponseWriter, *http.Request)` plus `http.ListenAndServe`. The raw tier types `HTTP/1.1`
literally; `net/http` composes the version, `Date`, and `Content-Length` for you, leaving only the
`Content-Type` and the body as your explicit work.

</details>

**Q7 (co-07 -- routing).** In one sentence, what does routing do?

<details>
<summary>Answer</summary>

Routing maps a method + path pattern (like `GET /items/{id}` registered on a `ServeMux`) to the
specific handler function responsible for producing a response to that combination -- it is the
dispatch table between "what the client asked for" and "which code runs."

</details>

**Q8 (co-08 -- request-handlers).** What should a request handler do, and what should it ideally
_not_ do?

<details>
<summary>Answer</summary>

A handler receives a parsed request (`*http.Request` with path values, query params, and a decoded
body) and writes a response through `http.ResponseWriter`. Ideally it holds no persistence logic of
its own -- no raw SQL, no direct `*sql.DB` handling -- that responsibility belongs to a repository
layer it calls, which keeps the request-to-handler-to-repository-to-store layering clean.

</details>

**Q9 (co-09 -- json-serialization).** What does (de)serialization mean in the context of a JSON API,
and in which two directions does it happen?

<details>
<summary>Answer</summary>

Serialization converts a typed Go value (a struct with `json` tags, a map, or a slice) into JSON text
for the outgoing response body via `json.Marshal` or `json.NewEncoder(w).Encode`; deserialization
converts incoming JSON text into a typed Go value via `json.Unmarshal` or
`json.NewDecoder(r.Body).Decode`. Both directions happen on nearly every request: the body arrives as
JSON text and is decoded into a request struct, and the return value is encoded back into JSON text.

</details>

**Q10 (co-10 -- request-validation).** What do hand-written checks validate on an incoming request,
and when do they run relative to the handler's own logic?

<details>
<summary>Answer</summary>

They validate the incoming shape, field types, and declared constraints (presence of `title`,
`len(title) >= 3`, `quantity > 0`, numeric path segments via `strconv.Atoi`, bounded
`limit`/`offset`). The stdlib performs none of this for you, so the check is the first branch inside
the handler (or in a tiny helper it calls): a missing field, a wrong type, or an out-of-range value
is rejected with a 422 before any business logic or store access runs.

</details>

**Q11 (co-11 -- structured-errors).** What must every error response share, and what must it never
contain?

<details>
<summary>Answer</summary>

Every error response should share one consistent JSON envelope shape (a `code` plus `message` pair
nested under a fixed `error` key, built by one constructor) paired with the right status code,
regardless of which endpoint or failure path produced it. It must never leak a panic value, a driver
error string, or any internal detail to the caller -- internals go to the operator log, the client
gets a generic, actionable message.

</details>

**Q12 (co-12 -- path-and-query-params).** Distinguish a path param from a query param, with one
example of each in Go terms.

<details>
<summary>Answer</summary>

A path param is embedded in the `ServeMux` pattern and read with `r.PathValue`, for example `id` in
`GET /items/{id}` requested as `/items/42` and converted with `strconv.Atoi`. A query param is read
off `r.URL.Query()`, for example `q` in `/search?q=hello` via `r.URL.Query().Get("q")`. The mux
matches path segments as text; typing them is always hand-written code inside the handler.

</details>

**Q13 (co-13 -- request-body-parsing).** What happens to a request body between arriving over the
wire and becoming a usable Go value?

<details>
<summary>Answer</summary>

The raw body bytes are read off `r.Body`, decoded with `json.NewDecoder(r.Body).Decode` into a
request struct, and validated by hand. A malformed JSON document or a valid document with the wrong
top-level shape never reaches business logic -- the decode error branch answers 422 first, and
`r.Body.Close` is deferred in every handler.

</details>

**Q14 (co-14 -- persistence-repository).** What is a repository-style function responsible for, and
what specific SQL practice must it always use?

<details>
<summary>Answer</summary>

A repository is the single place in the codebase that talks to `database/sql` -- handlers call it but
never issue SQL themselves. It always uses parameterized queries (`WHERE status = ?` with the value
bound separately) instead of `fmt.Sprintf`-concatenating user input into SQL text, which keeps an
injected payload as inert, quoted data instead of letting it become part of the executed syntax.

</details>

**Q15 (co-15 -- migrations).** What does an additive schema migration look like, and why "additive"
specifically?

<details>
<summary>Answer</summary>

An additive migration creates the schema once and evolves it with `ALTER TABLE ... ADD COLUMN` plus
an explicit `UPDATE ... SET col = <default> WHERE col IS NULL` backfill for existing rows, verified
with `PRAGMA table_info`. "Additive" matters because already-running instances that do not know about
the new column keep working unchanged -- nothing existing changed shape partway through a deploy.

</details>

**Q16 (co-16 -- middleware).** What is middleware for, and name three concrete cross-cutting behaviors
it commonly adds.

<details>
<summary>Answer</summary>

Middleware is a plain `func(http.Handler) http.Handler` wrapper around every request/response that
adds behavior otherwise duplicated inside each handler. Three concrete examples: stamping an
`X-Request-Id` header for tracing, logging each request's method plus path, and recording an
`X-Process-Time` header via a `ResponseWriter` wrapper that stamps at commit time -- none of which is
specific to any one endpoint's business logic.

</details>

**Q17 (co-17 -- authn-sessions-vs-tokens).** Name the two common authentication mechanisms this track
covers, and where does each one's "source of truth" about the caller's identity actually live?

<details>
<summary>Answer</summary>

Server-side sessions (identified by a cookie value) and stateless bearer tokens. A session cookie is
only an opaque key -- the actual identity lookup happens against server-side session state the server
maintains. A bearer token is self-contained and stateless: whatever the token itself encodes or the
token's validity check confirms is the identity, with no session store consulted at all.

</details>

**Q18 (co-18 -- token-check).** What does a bearer-token check do on a protected route, and what
status code guards a missing or invalid token?

<details>
<summary>Answer</summary>

A token check reads the `Authorization` header, confirms it is a well-formed `Bearer <token>` value
(usually with `strings.HasPrefix` or an exact `Bearer` prefix plus constant comparison), and validates the
token itself. A missing header, a malformed value, or an unknown token all reject the request with
401 -- typically before the handler's own logic runs, and commonly guarding writes
(POST/PUT/PATCH/DELETE) while leaving reads (GET) open.

</details>

**Q19 (co-19 -- pagination).** What two query params does list pagination typically use, and what
should happen to each when the caller does not supply them?

<details>
<summary>Answer</summary>

`limit` and `offset`. `limit` should fall back to a sane default (10 here) when omitted and be
clamped to a configured maximum (100 here) rather than trusted as-is. `offset` should default to 0,
meaning "start from the beginning." A well-designed list endpoint also returns metadata alongside the
page -- a `total` count plus a `next_offset` cursor -- so the caller knows whether more pages exist.

</details>

**Q20 (co-20 -- filtering).** How do list-endpoint filters typically compose when more than one is
supplied, and what must a filter value always become before it reaches SQL?

<details>
<summary>Answer</summary>

Multiple filters combine with AND semantics -- for example, `?status=done&priority=high` returns only
rows matching both conditions, not either one. Whatever value a filter carries must become a bound
parameter in a parameterized query, exactly like the persistence rule -- filter values are untrusted
user input, and concatenating them into a `WHERE` clause reopens the same injection risk.

</details>

**Q21 (co-21 -- content-negotiation).** Does the Go standard library reject a JSON body sent with the
wrong `Content-Type` automatically, and what does this track do instead?

<details>
<summary>Answer</summary>

No -- `net/http` never inspects `Content-Type` for you and has no 415 or 422 default for this case.
Honoring it is a hand-written branch: read `r.Header.Get("Content-Type")`, strip any
`; charset=utf-8` suffix, lowercase the media type, accept only `application/json`, and reject
anything else (including a missing header) with a 422 before decoding. The same hand-written
treatment applies to the `Accept` header when a track needs it.

</details>

**Q22 (co-22 -- local-dev-loop).** What three things make up the local development loop for
exercising a Go backend service?

<details>
<summary>Answer</summary>

Serving the app with `go run .` from inside its own module directory, exercising it manually with
`curl`, and exercising it automatically with an `httptest` suite (`httptest.NewRequest` plus
`httptest.NewRecorder` driving the same `ServeMux` curl would hit). Together they verify behavior by
hand during development and repeatably in CI -- without ever needing a browser or a live socket for
tests.

</details>

**Q23 (co-23 -- dependency-injection).** What does this track's dependency factory supply to a
handler, and who is responsible for resolving it?

<details>
<summary>Answer</summary>

The factory supplies a per-request resource -- most commonly a `*sql.DB`-backed connection or a
mocked `*Connection` -- resolved once per call by the wiring code (the `provider` your `main` or test
passes in), then handed to the handler as a plain argument, and torn down with `defer conn.Close()`
after the handler returns. The handler itself never dials the pool or manages lifetimes; it only ever
receives an already-ready resource.

</details>

**Q24 (co-24 -- layering).** Name the four layers in this track's request-processing pipeline, in
order, and what "clean" means for the boundaries between them.

<details>
<summary>Answer</summary>

Request to handler to repository to store. "Clean" boundaries mean each layer only talks to its
immediate neighbor and holds only its own concern: the handler parses, validates, and shapes a
response but issues no SQL; the repository issues parameterized SQL but knows nothing about HTTP
status codes; the store just stores data. A handler with an inline query string, or a repository that
picks an HTTP status, is a layering violation.

</details>

## Applied problems

Sixteen scenarios spanning HTTP semantics through auth and list-shaping. Each describes a realistic
engineering situation without naming the concept -- decide which one solves it and why, then check
your reasoning against the worked solution.

**AP1.** Your client library needs to safely retry any failed write on a network timeout, without
risking a duplicate. Which of "create a new order" (a typical POST) and "cancel this specific order"
(a typical DELETE) is safe to blindly retry, and which is not?

<details>
<summary>Worked solution</summary>

DELETE is safe to blindly retry -- it is in RFC 9110's idempotent set, so calling it twice leaves the
same end state as calling it once. POST is explicitly not idempotent, so retrying "create a new
order" risks creating two separate orders if the first request actually succeeded but the response
was lost. The kata's `IsIdempotent` plus `SafeToBlindRetry` helpers encode exactly this table.

</details>

**AP2.** A code reviewer flags that your handler builds its SQL with `fmt.Sprintf` concatenating a
user-supplied `status` filter value directly into a `WHERE` clause. What is the concrete risk, and what
pattern fixes it?

<details>
<summary>Worked solution</summary>

The risk is SQL injection: a value like `done' OR '1'='1` escapes the intended string literal and
changes the query's actual logic, returning every row. The fix is a parameterized query --
`WHERE status = ?` with the value bound separately -- kept inside a repository function, never in the
handler. Kata 05 proves it against a live in-memory database: the unsafe shape matches three rows,
the safe shape matches zero.

</details>

**AP3.** Your API currently writes a raw panic value into the response body whenever an unhandled
failure occurs, and a review flags it as an information leak. What should the response look like
instead?

<details>
<summary>Worked solution</summary>

A structured error envelope -- a fixed `{"error": {"code", "message"}}` shape with status 500 --
that names the failure class without exposing internals. Every failure path across the API should emit
the same envelope via one constructor, while the real panic value goes only to the operator log
(typically behind a `recover` middleware wrapping the whole mux).

</details>

**AP4.** A client POSTs a new task but omits the required `owner` field. Your handler currently
indexes the decoded map directly and panics with a nil dereference. What should happen instead, and
with which status?

<details>
<summary>Worked solution</summary>

The missing field should be caught by hand-written validation before any business logic runs and
rejected with a 422 envelope naming exactly which field is missing. The handler only ever proceeds
with a body that already satisfies its declared shape -- the stdlib performs no such check for you,
so the branch is your code.

</details>

**AP5.** Two instances of your API run behind a load balancer. A tester reports "sometimes my recent
changes seem to disappear," and it correlates with which instance handled the request.

<details>
<summary>Worked solution</summary>

Some durable state is almost certainly kept in one process's local memory instead of the shared
database -- exactly what HTTP statelessness forbids relying on. The fix is routing every durable
read and write through the shared `database/sql` store, so the response is identical regardless of
which stateless worker handled any given request. Kata 12 simulates the divergence directly.

</details>

**AP6.** Ops wants to trace a single request across multiple log lines and downstream calls, even
though several different worker processes might touch it.

<details>
<summary>Worked solution</summary>

Request-id middleware: a `func(http.Handler) http.Handler` wrapper that stamps an `X-Request-Id`
header (generated when the client did not send one) that every log line and downstream call can
reference. It is a textbook cross-cutting concern -- exactly what middleware exists for, instead of
adding tracing logic inside every individual handler.

</details>

**AP7.** You need "list tasks" to remain publicly readable, but "delete task" must only work for an
authenticated caller.

<details>
<summary>Worked solution</summary>

A token-check guard applied selectively: `GET /tasks` stays open, while write routes require a valid
bearer token and reject a missing or invalid one with 401. The split maps onto method semantics --
reads stay open, writes are the operations worth protecting, and the check lives in middleware or at
the top of the guarded handlers.

</details>

**AP8.** A frontend developer complains that `GET /tasks` returns all 50,000 rows in a single JSON
response, causing the browser to hang.

<details>
<summary>Worked solution</summary>

Pagination via `limit`/`offset`, with a sane default and a bounded maximum on `limit` so a caller
cannot demand the whole table at once. Returning `total` plus `next_offset` metadata alongside the
page lets the frontend page through without loading everything up front.

</details>

**AP9.** Product wants users to narrow the task list to just `status=done` items with a specific
priority, without loading the entire list client-side and filtering it in the browser.

<details>
<summary>Worked solution</summary>

Query-param filtering mapped to a parameterized `WHERE` clause combining conditions with AND
semantics -- `?status=done&priority=high` returns only rows matching both. This keeps the filtering
work on the server and its index rather than shipping the whole table over the wire.

</details>

**AP10.** Your `/items/{id}` handler currently treats the segment as an opaque string. A request
for `/items/abc` reaches deep into a database call expecting an integer primary key and fails there
instead of failing cleanly at the boundary.

<details>
<summary>Worked solution</summary>

Convert with `strconv.Atoi` immediately after `r.PathValue("id")` and reject failures with a
client-error status before any store access. A non-numeric segment then fails validation at the
routing boundary instead of propagating a wrong-typed value deep into a query where the failure is
harder to diagnose.

</details>

**AP11.** A client sends a POST with a JSON-shaped body but declares `Content-Type: text/plain`
instead of `application/json`. What happens on this track, and did the standard library do any of it
for you?

<details>
<summary>Worked solution</summary>

The request is rejected with a 422 by your own hand-written content-type branch, which accepts only
`application/json` (tolerating a `; charset=utf-8` suffix) and refuses everything else before
decoding. The stdlib did none of it -- `net/http` never inspects `Content-Type`, so the check, the
status, and the envelope are all application code, not a framework default.

</details>

**AP12.** During a live deploy, you need to add a nullable `archived` column to the `tasks` table
without breaking requests from an already-running, not-yet-redeployed instance of the app.

<details>
<summary>Worked solution</summary>

An additive migration: one `ALTER TABLE ... ADD COLUMN` plus a backfill `UPDATE` for existing rows,
never a rename or a drop. Because the change only adds, an older running instance that has no idea the
new column exists keeps working exactly as before -- nothing it already relies on changed shape.

</details>

**AP13.** A new hire's pull request adds a raw `SELECT` statement directly inside a request handler
function, right alongside the response-formatting logic, and a senior engineer requests a refactor
before merging.

<details>
<summary>Worked solution</summary>

Move the SQL into a repository-style function -- the one place permitted to talk to the database --
and have the handler call it instead of issuing SQL itself. That keeps the
request-to-handler-to-repository-to-store layering clean: the handler shapes a response, the
repository owns persistence, and each concern stays testable in isolation.

</details>

**AP14.** Every database-backed endpoint currently calls `sql.Open` by hand at the top of its
function body, duplicating pool setup and leaking connections across tests.

<details>
<summary>Worked solution</summary>

A per-request provider factory that supplies an already-open `*sql.DB` handle (or a mocked
`*Connection` in tests) as a handler argument, resolved once per request by the wiring code and
closed with `defer` afterward. Each handler stops managing its own connection lifecycle entirely.

</details>

**AP15.** QA wants an automated test suite that exercises your API's endpoints without starting a real
server process or opening a real network socket.

<details>
<summary>Worked solution</summary>

An in-process suite driven through `httptest`: `httptest.NewRequest` builds each synthetic request
and `httptest.NewRecorder` captures the response, dispatched through the same `ServeMux` curl would
hit. It is fast, deterministic, and part of the same local loop as manually exercising the API with
`curl`.

</details>

**AP16.** A login endpoint issues some kind of credential after checking a username and password, and
a completely separate, stateless downstream service must later verify the caller's identity from that
credential _alone_, without querying any shared session store.

<details>
<summary>Worked solution</summary>

A bearer token, not a session cookie. A session cookie is only meaningful together with server-side
session state the issuing service maintains -- a different, stateless service has nothing to look it
up against. A bearer token is self-contained: whatever it encodes or however its validity is checked
is enough on its own, with no shared store required.

</details>

## Code katas

Nineteen hands-on implementation drills, spanning HTTP fundamentals through composing pagination,
filtering, and sorting together. Each kata is a self-contained Go module under
`drilling/code/<name>/` with its own `main.go` plus `go.mod` -- no live server, no separate
`curl` step unless you want one: implement the task yourself first, then compare against the
reference module and run it in place. Only kata 05 and kata 16 carry a third-party requirement
(`modernc.org/sqlite v1.60.1`); everything else is standard library only.

### Kata 1 -- Parse a raw HTTP request line (`kata-01-parse-request-line`)

Split `GET /items/5 HTTP/1.1` into method, path, and version; reject malformed lines with an error.

Run: `cd drilling/code/kata-01-parse-request-line && go run .`

### Kata 2 -- Classify a status code into its response class (`kata-02-status-code-classifier`)

Map 200/201/204/301/400/401/404/405/422/500 to success, redirect, client-error, or server-error.

Run: `cd drilling/code/kata-02-status-code-classifier && go run .`

### Kata 3 -- Validate required fields into a 422 error envelope (`kata-03-required-field-validation`)

Return nil when nothing is missing, else a 422-shaped envelope naming the missing fields.

Run: `cd drilling/code/kata-03-required-field-validation && go run .`

### Kata 4 -- Parse and bounds-check limit/offset query params (`kata-04-pagination-params-bounds-check`)

Default `limit` to 10, clamp it to 100, default `offset` to 0, and reject negatives.

Run: `cd drilling/code/kata-04-pagination-params-bounds-check && go run .`

### Kata 5 -- Detect a string-concatenated SQL injection vs a parameterized query (`kata-05-sql-injection-detection`)

Prove a malicious `status` value hijacks the concatenated query but stays inert data in the `?`
query, against a live in-memory SQLite database.

Run: `cd drilling/code/kata-05-sql-injection-detection && go mod tidy && go run .`

### Kata 6 -- Authenticate via session cookie vs bearer token (`kata-06-session-vs-token-auth`)

Look a session cookie up in a server-side store versus self-validating a `Bearer` token value.

Run: `cd drilling/code/kata-06-session-vs-token-auth && go run .`

### Kata 7 -- Determine method idempotency from a dispatch table (`kata-07-method-idempotency`)

Encode RFC 9110's idempotent set in a map and expose a `SafeToBlindRetry` helper for clients.

Run: `cd drilling/code/kata-07-method-idempotency && go run .`

### Kata 8 -- A reusable error-envelope constructor (`kata-08-error-envelope-constructor`)

Funnel 404, 401, and 500 failures through one constructor sharing one top-level JSON shape.

Run: `cd drilling/code/kata-08-error-envelope-constructor && go run .`

### Kata 9 -- A minimal router with typed path params (`kata-09-minimal-router-typed-params`)

Serve `GET /items/{id}` on a `ServeMux`, convert the segment with `strconv.Atoi`, and prove the
404 and 422 branches with `httptest`.

Run: `cd drilling/code/kata-09-minimal-router-typed-params && go run .`

### Kata 10 -- Parse a raw JSON request body, handling malformed input (`kata-10-json-body-parsing`)

Decode text with `encoding/json` into an object map; return a caller-facing reason for malformed
JSON or a non-object shape, never a panic.

Run: `cd drilling/code/kata-10-json-body-parsing && go run .`

### Kata 11 -- An in-memory repository keeping a handler free of SQL (`kata-11-in-memory-repository`)

Implement create, get, update-done, and delete on a map-backed repository plus a thin handler that
only calls it.

Run: `cd drilling/code/kata-11-in-memory-repository && go run .`

### Kata 12 -- Simulate two stateless workers sharing only a common store (`kata-12-stateless-workers-simulation`)

Route durable state through one shared map while each worker keeps a divergent local cache.

Run: `cd drilling/code/kata-12-stateless-workers-simulation && go run .`

### Kata 13 -- Compose a request-id plus timing middleware chain (`kata-13-middleware-chain`)

Wrap a bare handler with `X-Request-Id` and `X-Process-Time` middlewares in the standard
`func(http.Handler) http.Handler` shape, verified with `httptest`.

Run: `cd drilling/code/kata-13-middleware-chain && go run .`

### Kata 14 -- Filter and sort mock records from query-param-like input (`kata-14-filter-and-sort`)

Apply AND-combined allowlisted filters, then an optional stable sort, over a small slice.

Run: `cd drilling/code/kata-14-filter-and-sort && go run .`

### Kata 15 -- Validate field constraints without a framework (`kata-15-field-constraints-validation`)

Enforce `min_length`-style and `gt=0`-style rules by hand, collecting every violation for one 422.

Run: `cd drilling/code/kata-15-field-constraints-validation && go run .`

### Kata 16 -- Apply an additive schema migration with backfill (`kata-16-schema-migration-backfill`)

Seed the old table, run `ALTER TABLE ... ADD COLUMN` plus a backfill `UPDATE`, and read the
migrated shape back from an in-memory SQLite database.

Run: `cd drilling/code/kata-16-schema-migration-backfill && go mod tidy && go run .`

### Kata 17 -- Decide JSON-vs-reject from a Content-Type header (`kata-17-content-type-negotiation`)

Accept only `application/json` (tolerating a charset suffix); reject a wrong or missing type with
422 in a hand-written branch.

Run: `cd drilling/code/kata-17-content-type-negotiation && go run .`

### Kata 18 -- A tiny per-call dependency-injection factory (`kata-18-dependency-injection-factory`)

Resolve a pooled connection, hand it to the handler, then close it -- without the handler wiring
any of that itself.

Run: `cd drilling/code/kata-18-dependency-injection-factory && go run .`

### Kata 19 -- Compose pagination, filter, and sort together (`kata-19-pagination-filter-sort`)

Combine a filter step, an optional sort step, and a pagination step in that order, returning a page
plus `total` and `next_offset` metadata.

Run: `cd drilling/code/kata-19-pagination-filter-sort && go run .`

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can describe the shape of an HTTP request and an HTTP response, part by part, without
      notes. (co-01)
- [ ] I can name RFC 9110's idempotent method set and state that POST is explicitly not idempotent.
      (co-02)
- [ ] I can name the four status-code classes and give a concrete code this track uses from each.
      (co-03)
- [ ] I can name three concrete HTTP headers and what each one carries. (co-04)
- [ ] I can explain why HTTP is deliberately stateless and where durable state must live instead.
      (co-05)
- [ ] I can explain what hand-writing a route on a raw TCP connection reveals that `net/http`
      automates. (co-06)
- [ ] I can state, in one sentence, what routing does. (co-07)
- [ ] I can describe what a request handler should do and what it should ideally not do. (co-08)
- [ ] I can explain (de)serialization and identify both directions it happens in a JSON API. (co-09)
- [ ] I can explain what hand-written validation checks and when it runs relative to the handler's
      own logic. (co-10)
- [ ] I can state what every error response must share and what it must never contain. (co-11)
- [ ] I can distinguish a path param from a query param with one example of each in Go terms.
      (co-12)
- [ ] I can trace what happens to a request body between arriving over the wire and becoming a
      usable Go value. (co-13)
- [ ] I can explain what a repository function is responsible for and the SQL practice it must
      always use. (co-14)
- [ ] I can describe an additive schema migration and explain why "additive" matters during a live
      deploy. (co-15)
- [ ] I can explain what middleware is for and name three concrete cross-cutting behaviors it
      commonly adds. (co-16)
- [ ] I can name the two common authentication mechanisms this track covers and where each one's
      identity source of truth lives. (co-17)
- [ ] I can describe what a bearer-token check does and the status code that guards a
      missing/invalid token. (co-18)
- [ ] I can name the two params list pagination typically uses and the default and bound behavior
      for each. (co-19)
- [ ] I can explain how multiple list filters combine and what a filter value must become before it
      reaches SQL. (co-20)
- [ ] I can explain why the standard library enforces no `Content-Type` default and what the
      hand-written branch does instead. (co-21)
- [ ] I can name the three pieces of the local development loop for exercising a Go backend
      service. (co-22)
- [ ] I can explain what the dependency factory supplies to a handler and who resolves it. (co-23)
- [ ] I can name the four layers of this track's request-processing pipeline, in order, and explain
      what "clean" boundaries mean between them. (co-24)
- [ ] I can explain, in one sentence, what `taming-state` means for this track -- why HTTP is
      deliberately stateless and where the hard state actually lives instead. (`taming-state`)
- [ ] I can explain, in one sentence, what `layering-and-leaks` means for this track -- name one
      concrete layering violation (like SQL inside a handler) and the layer it should have lived in
      instead. (`layering-and-leaks`)
