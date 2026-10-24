---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

### Q1 (co-01): What three parts does a minimal-API route mapping carry, and which one selects the handler?

<details>
<summary>Model answer</summary>

An HTTP method, a path pattern, and a handler delegate. The method-plus-path pair selects the handler: `MapGet("/orders", ...)` answers only GET on that path, and the same path with POST reaches a different handler or a 405. The handler itself only sees the request the pair routed to it. Think of the route table as a two-column index: the pair is the key, the delegate is the value, and every request looks itself up before any of your code runs.

</details>

### Q2 (co-01): When does a request fall through to 404, and when to 405?

<details>
<summary>Model answer</summary>

404 when no route matches the path at all; 405 when a route matches the path but not the method, as in Example 4 where DELETE on `/orders` earns 405 while GET on `/goodbye` earns 404. The distinction tells the client whether the resource is missing or the verb is wrong. Clients can therefore react correctly: a 404 means fix the URL, a 405 means fix the method, and neither means the service is down.

</details>

### Q3 (co-02): What does a middleware receive, and what decision does calling or skipping next express?

<details>
<summary>Model answer</summary>

An `HttpContext` and a `RequestDelegate next`. Calling `next` passes control inward toward the handler; skipping it short-circuits the chain, as the guard in Example 27 does when it answers 403 directly. Headers set after `next` must go through `OnStarting`, because the response may already have flushed. The rule of thumb: work that needs the answer registers a callback before calling next, and work that blocks the answer returns before calling it.

</details>

### Q4 (co-02): In what order do registered middlewares execute on the way in and on the way out?

<details>
<summary>Model answer</summary>

Registration order on the way in, reverse order on the way out: first registered runs first inward and last outward, the onion nesting Example 28 prints as `outer-in,inner-in,inner-out,outer-out`. The first registered middleware is therefore the outermost layer and the right home for a global catch-all. When a header stamp goes missing, read the registration order top to bottom: the layer you need runs after everything above it and before everything below it.

</details>

### Q5 (co-03): How does a handler receive path, query, header, and body values without touching HttpContext?

<details>
<summary>Model answer</summary>

By naming them in the signature: route and query values bind by parameter name and type, headers via `[FromHeader]`, bodies by naming a record type. The framework parses and converts before the handler runs, so a handler that names `(int id, Order order)` receives a parsed id and a bound record, never raw strings. Reaching for `HttpContext` directly is the exception for raw access — repeats, negotiation, conditional headers — not the default for typed values.

</details>

### Q6 (co-03): What happens when a typed route segment cannot parse, and where is that decided?

<details>
<summary>Model answer</summary>

Routing falls through to the next route or to 404, before any handler runs — Example 13 shows `/tickets/abc` missing the `{id:int}` route entirely. The decision lives in the route table, not in handler code, which keeps handlers free of parsing guards. This is why typed segments beat string segments plus manual parsing: the mismatch becomes a routing fact instead of a handler branch.

</details>

### Q7 (co-04): Which Results helper produces each of 200, 201, 204, 400, and what body does each carry?

<details>
<summary>Model answer</summary>

`Results.Ok` for 200 with a JSON body, `Results.Created` for 201 with a body plus a Location header, `Results.NoContent` for 204 with no body, `Results.BadRequest` for 400 with the error envelope, as Example 18 demonstrates leg by leg. The helper names the code, so reviewers audit the contract from the route table. Memorizing the five pairs pays off on every code review: the wrong helper is visible at a glance, long before the test suite runs.

</details>

### Q8 (co-04): What two headers does a cacheable response set, and what does a matching revalidation earn?

<details>
<summary>Model answer</summary>

`Cache-Control` with a freshness lifetime and `ETag` with the fact's version string; a request carrying the matching `If-None-Match` earns 304 with no body, as Example 21 shows. The 304 leg proves the round trip: the client asks cheaply and the server answers emptily. Together the headers implement the two caching modes: freshness for skipping the request entirely, validation for skipping the body when the fact has not changed.

</details>

### Q9 (co-05): What three keys does the course error envelope carry, and why is the shape fixed?

<details>
<summary>Model answer</summary>

`code`, `error`, and `hint`, built by one shared helper so every failure parses the same way. A fixed shape lets clients write one error parser instead of one per route, and fixed strings with no trace IDs keep error responses golden-testable exactly like success responses. The hint is the humane part: it tells the caller what to change, turning a rejection into instructions instead of a dead end.

</details>

### Q10 (co-05): How does an unhandled throw become a 500 without leaking a stack trace to the client?

<details>
<summary>Model answer</summary>

`UseExceptionHandler` reroutes the failed request to a failure endpoint that answers a fixed 500 envelope, as Example 29 shows with the throwing route's path named inside. The client sees the envelope; the stack trace stays in server logs, never on the wire. Naming the failing path in the envelope keeps the 500 diagnosable without being leaky: operators know which route threw, attackers learn nothing about internals.

</details>

### Q11 (co-06): What are the three service lifetimes, and what does each share?

<details>
<summary>Model answer</summary>

Singleton shares one instance for the whole process, scoped shares one instance per request, transient builds fresh at every injection point. Examples 35 through 37 prove each in turn: running totals shared process-wide, per-request tickets minted once each, and two injections in one request minting two stamps. Choosing wrong is a category error, not a performance tweak: shared mutable state must be singleton and thread-safe, request baggage must be scoped, and stateless helpers are cheapest as transient.

</details>

### Q12 (co-06): Which lifetime dependency direction is illegal, and what bug does the rule prevent?

<details>
<summary>Model answer</summary>

A longer-lived service may not depend on a shorter-lived one — singleton on scoped is the classic violation — because the scope would be captured past its request. Example 38 composes the legal directions and the container rejects the illegal ones at startup, preventing the captive-dependency bug where two users share one ticket. The container validates the graph before serving traffic, so the mistake fails fast in tests instead of leaking across users in production.

</details>

### Q13 (co-07): Why do async handlers scale better than blocking ones under slow dependencies?

<details>
<summary>Model answer</summary>

An async handler yields its thread at every await, so one thread serves many waiting requests instead of one thread per waiting request. Example 54 awaits a fixed delay without holding the thread, and Example 78 fans ten parallel visits at one counter to prove the pool is shared, not consumed. The failure mode of blocking handlers is thread-pool starvation: latency climbs, timeouts cascade, and the fix is architectural — await instead of Wait — not more threads.

</details>

### Q14 (co-07): What makes `+=` on a shared counter lose updates, and what replaces it?

<details>
<summary>Model answer</summary>

Read-plus-add-plus-write is three steps, so two threads can read the same value before either writes back and one update vanishes. `Interlocked.Increment` performs the whole read-add-write atomically in hardware, which is why Example 55 and kata 6 pin lost counts at zero under ten parallel visits. The rule generalizes: any read-modify-write on shared state needs an atomic primitive or a lock, and the atomic is cheaper whenever the operation fits one.

</details>

### Q15 (co-08): What does StopAsync guarantee to in-flight requests, and what does it refuse?

<details>
<summary>Model answer</summary>

It stops accepting new connections while letting in-flight requests finish — the drain — and only calls made after the stop begins are refused, as Example 63 shows with the completed slow answer plus the refused late call. Draining makes deploys invisible instead of user-visible errors. The guarantee is what lets load balancers shift traffic without coordination: old servers finish what they hold, new servers take what arrives.

</details>

### Q16 (co-08): What bounds the drain, and what happens to requests still working past it?

<details>
<summary>Model answer</summary>

`ShutdownTimeout` bounds it: requests still working when the deadline passes have their tokens cancelled, and the stop returns on schedule. Example 68 sets 300 milliseconds and the slow request takes the cut instead of holding the process hostage, which is why the transcript prints a bounded stop. Handlers that watch the token turn the cut into a recorded abandonment; handlers that ignore it get aborted mid-write, which is why cooperative cancellation is a shutdown requirement, not a nicety.

</details>

### Q17 (co-09): What does TestServer replace, and what stays identical to production serving?

<details>
<summary>Model answer</summary>

It replaces the socket transport with in-memory delivery: no listener, no port, no network. Routing, middleware, model binding, handlers, and status codes run identically, which is why Example 45 proves both the 200 and the 404 with one client and no server process. Tests written this way assert the service's behavior rather than the network's mood, and they run in milliseconds instead of seconds.

</details>

### Q18 (co-09): When is a real loopback listener required instead of TestServer?

<details>
<summary>Model answer</summary>

When the behavior under test is the listener itself: binding, shutdown, draining, connection close, and generation handoff. Examples 52 and 62 through 70 bind 127.0.0.1 on an OS-chosen ephemeral port for exactly these cases, and never print the port number so the transcripts stay byte-identical. The split is principled: TestServer for request behavior, loopback for serving behavior, and no test pays for a listener it does not study.

</details>

### Q19 (co-10): Where do validation rules live so that every handler reuses them?

<details>
<summary>Model answer</summary>

On the type as data annotations, or in an injected validator service: attributes travel with the record as Example 11 shows, and a rulebook service centralizes verdicts as Example 44 shows. Both keep rules out of handlers, so adding a route cannot fork the definition of clean input. Test the rules through the validator directly for speed, and through one route for the wiring: the combination pins both the rule and its plumbing.

</details>

### Q20 (co-11): What does a route group buy over repeating a prefix on every mapping?

<details>
<summary>Model answer</summary>

One edit point for the version or area name, so the prefix cannot drift between routes, plus a scope for group-level middleware and filters later. Example 5 writes `/v1` once for two order routes, and unprefixed paths stay untouched, which turns the URL prefix into an organizational boundary. Versioning the API later means adding one group, not editing every mapping and hoping the search-and-replace caught them all.

</details>

### Q21 (co-12): How does one route serve both JSON and plain text, and who chooses?

<details>
<summary>Model answer</summary>

The handler branches on the request's Content-Type header and parses with the matching reader, as Example 16 does for `application/json` versus `text/plain`. The client chooses per request, and both shapes land as the same stored text, so downstream logic never learns which encoding arrived. Content negotiation is therefore a per-request decision the server makes by reading headers, not a property of the route worth a second URL.

</details>

### Q22 (co-13): What makes a log line structured, and what must it never contain?

<details>
<summary>Model answer</summary>

A fixed template with named values — method, path, status — written through the logging pipeline, never interpolated prose. It must never contain timings, trace IDs, or any value that varies run to run inside a golden test; real durations belong in metrics systems, as Examples 31 and 32 demonstrate by asserting mechanism, not time. Structured lines answer the first question of every incident — what arrived and what left — with a query instead of a reading session.

</details>

### Q23 (co-14): What does the health probe answer before and after a drain flip, and who reads it?

<details>
<summary>Model answer</summary>

200 with `{"status":"ok"}` before the flip and 503 with `{"status":"draining"}` after, as Example 66 shows. Load balancers read it to decide routing: shed traffic first, then stop, with no request falling between the flip and the shutdown. The probe is the only coordination a rolling deploy needs: flip, wait for the balancer to notice, then stop, and every request lands on a server that wants it.

</details>

### Q24 (co-15): Why do records use lowercase property names in this course, and what breaks if they do not?

<details>
<summary>Model answer</summary>

Lowercase names serialize unchanged through the default JSON policy, so the bytes in the code fences match the bytes on the wire exactly. PascalCase names would serialize camelCased unless a policy object renames them, which Example 19 does deliberately in one place — everywhere else, lowercase keeps the contract visible without a policy to remember. The convention trades idiomatic C# naming for byte-transparent contracts, which is the right trade inside examples whose output is asserted exactly.

</details>

## Applied problems

Applied problems rehearse the judgments maintenance work actually demands: sketch first, map to examples second, write code last. Each prompt names the examples that prove the pieces, so a stuck answer has a precise place to re-read. Time-box each problem to thirty minutes; an answer that needs longer is two problems wearing one number, and splitting it is part of the work.

### A1: Design the middleware chain for authentication and logging

A new admin area needs a key check plus one structured line per request. Sketch the registration order, name which middleware wraps which, and state what each of the four combinations (key present or absent, route known or unknown) answers. Map your sketch to Examples 27, 31, and 33 before writing any code.

Map your sketch to Examples 27, 31, and 33 before writing any code.

Work it like this: draw the two boxes with the logger outside and the key check inside, then walk the four combinations through the drawing and write the status each produces — 401 without the key on a known route, 200 with it, 404 without it on an unknown route, and the log line that appears in every case. If any combination has no answer, the drawing is missing a branch, not the code.

### A2: Decide what belongs in a handler versus a dependency

A create-order handler has grown validation, a discount lookup, and a notification send. Draw the line: which stays in the handler, which moves into injected services, and what each service's lifetime is with one sentence of justification each. Map your split to Examples 8, 43, and 44, then defend it against a reviewer who wants everything in the handler.

Map your split to Examples 8, 43, and 44, then defend it against a reviewer who wants everything in the handler.

Work it like this: list every operation the handler performs today, then sort each into HTTP translation, rule checking, or side effect — translation stays, rules move to the validator, effects move to injected services with singleton for shared stores and scoped for per-request baggage. The reviewer's version loses the moment you ask how to unit-test the discount rule without starting the server.

### A3: Diagnose a concurrency bug under load

Ten parallel checkout calls oversell the last item: the store reads stock, all ten see one left, all ten sell it. Name the race, state which primitive from Examples 55 to 57 fixes it, and explain why a lock around the whole handler would work but scale worse than the atomic you chose. Run kata 6 to feel the loss count before and after.

Run kata 6 to feel the loss count before and after.

Work it like this: reproduce first with ten parallel checkouts against the naive store and watch the oversell count climb, then apply the atomic decrement and watch it pin at zero across five runs. The lock version is your stretch goal: wrap the read-check-write in a lock, measure that it also fixes the count, then explain why its serialized section would throttle the throughput the atomic preserves.

### A4: Shape the error contract for a public API

Two teams consume your service: one parses `{code, error, hint}`, the other expects FastAPI-style `{detail}`. Decide whether to serve one shape, negotiate by Accept header, or version the difference, and write the exact bytes of a 404 under your choice. Map the trade-off to Examples 20, 34, and 75 before committing to it.

Map the trade-off to Examples 20, 34, and 75 before committing to it.

Work it like this: write the exact 404 bytes under each option — single shape, negotiated shape, versioned shape — then score them on client effort, server complexity, and migration pain for the team that must switch. The negotiation option looks clever until you write the Accept-header matrix; most teams pick one shape and version the exception, and the exercise is feeling why.

### A5: Plan a zero-downtime deploy for a breaking route rename

`/orders` must become `/v2/orders` while mobile clients still call `/v1/orders` for one release. Sequence the rollout: redirects, dual registration, health-gate flips, and generation handoff, naming which example proves each step and what each leg of the rollout prints. State exactly when the old route may be deleted.

State exactly when the old route may be deleted.

Work it like this: sequence five phases — dual-register both routes, redirect old to new with 308, flip the health gate on the old generation, hand traffic to the new generation, then delete the old route one release after the last mobile version that calls it expires. Each phase names its proving example and prints its legs; deletion happens only when the access logs show zero hits on the old route for a full release cycle.

### A6: Bound the blast radius of a slow dependency

A recommendation call takes 800 milliseconds at p99 and your shutdown deadline is 300 milliseconds. Work out what happens to in-flight recommendation requests on deploy, decide whether the deadline, the dependency timeout, or the handler design changes, and justify the new numbers. Map your reasoning to Examples 58, 65, and 68.

Map your reasoning to Examples 58, 65, and 68.

Work it like this: compute the overlap — a 300-millisecond deadline against an 800-millisecond p99 means most in-flight recommendations take the cut on every deploy — then choose the smallest change that fixes the arithmetic: a 250-millisecond dependency timeout with a cached fallback keeps the handler fast enough that the deadline rarely fires. Justify the numbers from the percentiles, not from round values.

### A7: Test a middleware in isolation before wiring it into the service

A new header-stamping middleware must prove it stamps every answer including 404s without changing any body. Design the isolated test first — bare route, two requests, what to assert — then state what the full-service test would add and what it could never prove. Map the plan to Examples 26, 30, and 50.

Map the plan to Examples 26, 30, and 50.

Work it like this: write the isolated test first with a bare route returning a fixed body, assert the stamp header on both the 200 and the 404, and assert both bodies byte-identical to the no-middleware baseline. The full-service test then adds ordering — stamp present with auth and logging also running — which the isolated test cannot prove because it never wires the neighbors.

### A8: Choose the caching layer for three hot shapes

A public fact, a per-user profile, and a paged list each get hot. Decide for each whether output caching, a concurrent dictionary, or no cache fits, and state the invalidation story that keeps each answer correct. Map each choice to Examples 21, 57, and 61, and name the shared-cache mistake each wrong choice would commit.

Map each choice to Examples 21, 57, and 61, and name the shared-cache mistake each wrong choice would commit.

Work it like this: build the three-by-three matrix of shape versus layer, fill each cell with fit or the exact staleness bug, and write the invalidation rule beside every fit — ETag versioning for the fact, no cache for the profile, keyed eviction for the list. The matrix is the deliverable: any cell you cannot fill honestly is a caching decision you have not made yet.

## Code katas

Eight hands-on katas. Each starts from the `before/` starter, and the `after/` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: validation and async first, because the boundary and the idiom underlie everything; routes, middleware, and dependencies next, because each isolates one production judgement; races, envelopes, and deadlines last, because each proves one runtime property. Run the reference in the harness after diffing: your version and the reference must both exit green, and any output difference is a behavior difference to explain, not a formatting quirk to ignore.

### Kata 01: Add Validation That Rejects a Malformed Body

(Concepts: co-03, co-10.)

The create route accepts anything: add the two boundary rules so malformed bodies earn named 400s.

The starter below creates every order it receives. Add the qty and title rules so the suite prints one 201 and two 400s.

**`drilling/code/kata-01-add-validation-rejects-malformed-body/before/Program.cs`**:

```csharp
// Kata 1 starter: add validation that rejects a malformed body.
// Fix me: POST /orders accepts anything right now. Add the two rules from
// Example 10 (qty must be positive, title is required) and print the 201
// plus the two 400s. The after/ solution shows one shape for the fix.
using System.Text; // => StringContent carries the JSON body
using System.Text.Json; // => JsonSerializer writes the request body
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/orders",
        (Order order) => // => body binds into the record
            Results.Created($"/orders/{order.id}", order)
    ); // => Fix me: validate first, 400 when broken
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the handler did.
static async Task PostAsync(HttpClient client, Order order) // => the record to send
{ // => post block opens
    var json = JsonSerializer.Serialize(order); // => record becomes a JSON string
    using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body
    using var response = await client.PostAsync("/orders", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /orders -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line
} // => post ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Order(1, "dune", 2)); // => clean: earns a 201 after the fix
await PostAsync(client, new Order(2, "hyperion", 0)); // => broken qty: must become a 400
await PostAsync(client, new Order(3, "", 1)); // => broken title: must become a 400
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Order is the typed boundary of this kata: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape
```

**`drilling/code/kata-01-add-validation-rejects-malformed-body/after/Program.cs`**:

```csharp
// Kata 1 solution: validate at the boundary, then create.
// The handler checks both rules before storing anything: clean orders earn
// a 201, broken ones earn the named 400. Compare with before/: the route
// is identical, only the guard is new.
using System.Text; // => StringContent carries the JSON body
using System.Text.Json; // => JsonSerializer writes the request body
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapPost(
        "/orders",
        (Order order) => // => body binds into the record
        { // => handler block opens
            if (order.qty <= 0) // => quantities must move at least one unit
                return Results.BadRequest(new { error = "qty-must-be-positive" }); // => 400 names the rule
            if (string.IsNullOrWhiteSpace(order.title)) // => titles must name something
                return Results.BadRequest(new { error = "title-is-required" }); // => 400 names the rule
            return Results.Created($"/orders/{order.id}", order); // => clean input earns a 201
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => PostAsync sends one JSON body and prints what the handler did.
static async Task PostAsync(HttpClient client, Order order) // => the record to send
{ // => post block opens
    var json = JsonSerializer.Serialize(order); // => record becomes a JSON string
    using var body = new StringContent(json, Encoding.UTF8, "application/json"); // => the labeled body
    using var response = await client.PostAsync("/orders", body); // => full pipeline runs, then answers
    var text = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"POST /orders -> {(int)response.StatusCode} {text}".TrimEnd()); // => one golden line
} // => post ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await PostAsync(client, new Order(1, "dune", 2)); // => Output: POST /orders -> 201 {"id":1,"title":"dune","qty":2}
await PostAsync(client, new Order(2, "hyperion", 0)); // => Output: POST /orders -> 400 {"error":"qty-must-be-positive"}
await PostAsync(client, new Order(3, "", 1)); // => Output: POST /orders -> 400 {"error":"title-is-required"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Order is the typed boundary of this kata: JSON in, record out.
record Order(int id, string title, int qty); // => the order shape
```

**Output** (`drilling/code/kata-01-add-validation-rejects-malformed-body/expected/main.stdout.txt`):

```text
POST /orders -> 201 {"id":1,"title":"dune","qty":2}
POST /orders -> 400 {"error":"qty-must-be-positive"}
POST /orders -> 400 {"error":"title-is-required"}
```

### Kata 02: Convert a Blocking Call into the Async Idiom

(Concepts: co-07.)

The handler blocks its thread with Wait: convert it to await with byte-identical answers.

The starter below holds its thread during the delay. Make the handler async so the thread serves others while waiting.

**`drilling/code/kata-02-blocking-call-becomes-async-idiom/before/Program.cs`**:

```csharp
// Kata 2 starter: convert the blocking call into the async idiom.
// Fix me: the handler below blocks its thread with Wait(). Rewrite it as
// an async handler that awaits the same delay, keeping the answers byte
// identical. The after/ solution shows the converted shape.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow/{id:int}",
        (int id) => // => Fix me: make this async and await
        { // => handler block opens
            Task.Delay(10).Wait(); // => blocking wait: holds the thread hostage
            return Results.Ok(new { id, ready = true }); // => the fixed answer
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the answer observed.
static async Task CheckAsync(HttpClient client, int id) // => the slow resource to read
{ // => check block opens
    using var response = await client.GetAsync($"/slow/{id}"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /slow/{id} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, read twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, 1); // => the first slow read
await CheckAsync(client, 2); // => the second slow read
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**`drilling/code/kata-02-blocking-call-becomes-async-idiom/after/Program.cs`**:

```csharp
// Kata 2 solution: await instead of Wait.
// The handler is async now: it yields the thread during the delay instead
// of holding it. Same answers, freed thread. Compare with before/: the
// route is identical, only the waiting idiom changed.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow/{id:int}",
        async (int id) => // => async handler: awaits without blocking
        { // => handler block opens
            await Task.Delay(10); // => the thread serves others during the wait
            return Results.Ok(new { id, ready = true }); // => the fixed answer, unchanged
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the answer observed.
static async Task CheckAsync(HttpClient client, int id) // => the slow resource to read
{ // => check block opens
    using var response = await client.GetAsync($"/slow/{id}"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /slow/{id} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, read twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, 1); // => Output: GET /slow/1 -> 200 {"id":1,"ready":true}
await CheckAsync(client, 2); // => Output: GET /slow/2 -> 200 {"id":2,"ready":true}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**Output** (`drilling/code/kata-02-blocking-call-becomes-async-idiom/expected/main.stdout.txt`):

```text
GET /slow/1 -> 200 {"id":1,"ready":true}
GET /slow/2 -> 200 {"id":2,"ready":true}
```

### Kata 03: Write an In-Process Test for a New Route

(Concepts: co-09.)

The refund routes exist but the suite never calls them: extend the suite to pin both refund legs.

The starter below tests only the old route. Add a check per refund route so the suite proves both the 200 and the 404.

**`drilling/code/kata-03-in-process-test-for-new-route/before/Program.cs`**:

```csharp
// Kata 3 starter: write an in-process test for the new route.
// Fix me: /refund exists but the suite never calls it. Add two checks — a
// known id refunds, an unknown id 404s — and print both lines. The after/
// solution shows the extended suite.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/orders/1", () => Results.Ok(new { id = 1, title = "dune" })); // => the tested route
    app.MapPost("/refund/1", () => Results.Ok(new { refunded = 1 })); // => Fix me: no test calls this route
    app.MapPost("/refund/9", () => Results.NotFound(new { error = "order-not-found" })); // => Fix me: nor this one
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check once, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
using var response = await client.GetAsync("/orders/1"); // => the only tested call
var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
Console.WriteLine($"GET /orders/1 -> {(int)response.StatusCode} {body}".TrimEnd()); // => the only golden line
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**`drilling/code/kata-03-in-process-test-for-new-route/after/Program.cs`**:

```csharp
// Kata 3 solution: the new route earns its own tests.
// The suite grows with the service: every new route arrives with checks
// that pin its status and body. Compare with before/: the service is
// identical, only the suite grew two legs.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet("/orders/1", () => Results.Ok(new { id = 1, title = "dune" })); // => the old route
    app.MapPost("/refund/1", () => Results.Ok(new { refunded = 1 })); // => the new route, now tested
    app.MapPost("/refund/9", () => Results.NotFound(new { error = "order-not-found" })); // => the new miss, tested
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
static async Task CheckAsync(HttpClient client, string method, string target) // => method plus path
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this kata
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, check three times, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/orders/1"); // => Output: GET /orders/1 -> 200 {"id":1,"title":"dune"}
await CheckAsync(client, "POST", "/refund/1"); // => Output: POST /refund/1 -> 200 {"refunded":1}
await CheckAsync(client, "POST", "/refund/9"); // => Output: POST /refund/9 -> 404 {"error":"order-not-found"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**Output** (`drilling/code/kata-03-in-process-test-for-new-route/expected/main.stdout.txt`):

```text
GET /orders/1 -> 200 {"id":1,"title":"dune"}
POST /refund/1 -> 200 {"refunded":1}
POST /refund/9 -> 404 {"error":"order-not-found"}
```

### Kata 04: Chain Authentication and Logging Middleware

(Concepts: co-02.)

Logging runs but nothing checks the key: add the auth layer in front with the log line kept for both outcomes.

The starter below logs every request but serves everyone. Add the key check inside the logger so misses log 401 and trusted calls log 200.

**`drilling/code/kata-04-middleware-chain-auth-and-logging/before/Program.cs`**:

```csharp
// Kata 4 starter: chain authentication and logging middleware.
// Fix me: the logger runs but nothing checks the key. Add an auth layer in
// front that answers 401 without a key, keeping the log line for both
// outcomes. The after/ solution shows the ordered pair.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires logging only: the auth layer is missing.
// => Fix me: add the key check in front, 401 without the key.
// => The shared list is the log: one fixed line per request.
static (WebApplication app, List<string> lines) BuildApp(string[] args) // => wiring plus the log capture
{ // => builder block opens
    var lines = new List<string>(); // => the shared log for this run
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the logging middleware
        { // => middleware block opens
            await next(context); // => let the handler answer first
            lock (lines) // => requests may log from many threads
                lines.Add(
                    $"{context.Request.Method} {context.Request.Path} -> {context.Response.StatusCode}"
                ); // => fixed line
        }
    ); // => middleware ends here
    app.MapGet("/admin", () => Results.Ok(new { area = "admin" })); // => open today: must require the key
    return (app, lines); // => hand both back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional key.
static async Task CheckAsync(HttpClient client, string? key) // => null means send no key
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, "/admin"); // => target never changes here
    if (key is not null) // => only trusted checks carry the key
        request.Headers.Add("X-Key", key); // => the credential rides a header
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine(
        $"GET /admin [{key ?? "(none)"}] -> {(int)response.StatusCode} {body}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, print the log, stop.
var (app, lines) = BuildApp(args); // => wiring plus capture, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, null); // => no key: must become a 401
await CheckAsync(client, "admin-1"); // => trusted key: stays a 200 after the fix
foreach (var line in lines.Order()) // => sort so the transcript is stable
    Console.WriteLine($"log {line}"); // => one fixed line per request
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**`drilling/code/kata-04-middleware-chain-auth-and-logging/after/Program.cs`**:

```csharp
// Kata 4 solution: auth in front, logging outside.
// The auth layer registers after the logger, so the logger wraps the auth:
// every request logs, only trusted ones reach the handler. Compare with
// before/: one Use call is new, and the order is the whole lesson.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires logging outside and auth inside: order matters.
// => The shared list is the log: one fixed line per request.
static (WebApplication app, List<string> lines) BuildApp(string[] args) // => wiring plus the log capture
{ // => builder block opens
    var lines = new List<string>(); // => the shared log for this run
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.Use(
        async (context, next) => // => the logging middleware: outermost
        { // => middleware block opens
            await next(context); // => auth and handler run inside
            lock (lines) // => requests may log from many threads
                lines.Add(
                    $"{context.Request.Method} {context.Request.Path} -> {context.Response.StatusCode}"
                ); // => fixed line
        }
    ); // => middleware ends here
    app.Use(
        async (context, next) => // => the auth middleware: inside the logger
        { // => auth block opens
            if (context.Request.Headers["X-Key"].ToString() != "admin-1") // => the one trusted key
            { // => block block opens
                context.Response.StatusCode = 401; // => answer directly: no next call
                await context.Response.WriteAsJsonAsync(new { error = "unauthorized" }); // => the fixed refusal
                return; // => the chain stops: the handler never runs
            } // => block ends here
            await next(context); // => trusted: continue inward
        }
    ); // => auth ends here
    app.MapGet("/admin", () => Results.Ok(new { area = "admin" })); // => reachable only with the key
    return (app, lines); // => hand both back to the caller
} // => builder ends here

// => CheckAsync serves one request with an optional key.
static async Task CheckAsync(HttpClient client, string? key) // => null means send no key
{ // => check block opens
    using var request = new HttpRequestMessage(HttpMethod.Get, "/admin"); // => target never changes here
    if (key is not null) // => only trusted checks carry the key
        request.Headers.Add("X-Key", key); // => the credential rides a header
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine(
        $"GET /admin [{key ?? "(none)"}] -> {(int)response.StatusCode} {body}".TrimEnd()
    ); // => golden line
} // => check ends here

// => Top-level entry: build once, check twice, print the log, stop.
var (app, lines) = BuildApp(args); // => wiring plus capture, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
await CheckAsync(client, null); // => Output: GET /admin [(none)] -> 401 {"error":"unauthorized"}
await CheckAsync(client, "admin-1"); // => Output: GET /admin [admin-1] -> 200 {"area":"admin"}
foreach (var line in lines.Order()) // => sort so the transcript is stable
    Console.WriteLine($"log {line}"); // => Output lines: log GET /admin -> 200, then log GET /admin -> 401
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**Output** (`drilling/code/kata-04-middleware-chain-auth-and-logging/expected/main.stdout.txt`):

```text
GET /admin [(none)] -> 401 {"error":"unauthorized"}
GET /admin [admin-1] -> 200 {"area":"admin"}
log GET /admin -> 200
log GET /admin -> 401
```

### Kata 05: Split the Handler from Its Dependency

(Concepts: co-06.)

The handler news up its greeter: register and inject it with byte-identical answers.

The starter below constructs the greeter inside the handler. Move construction into the container so tests can swap the dependency.

**`drilling/code/kata-05-split-handler-from-dependency/before/Program.cs`**:

```csharp
// Kata 5 starter: split the handler from its dependency.
// Fix me: the handler below news up its own Greeter, so no test can swap
// it. Register the greeter in the container and inject it, keeping the
// answers byte identical. The after/ solution shows the split.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/greet/{name}",
        (string name) => // => Fix me: inject Greeter instead of newing it
            Results.Ok(new { greeting = new Greeter().Greet(name) })
    ); // => hidden construction: untestable
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
foreach (var name in new[] { "ada", "linus" }) // => the two greeted names
{ // => check block opens
    using var response = await client.GetAsync($"/greet/{name}"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /greet/{name} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Greeter is the logic the handler hides today: construction inside.
// => After the split it injects, and tests can swap it.
sealed class Greeter // => the hidden dependency
{ // => greeter block opens
    public string Greet(string name) => $"hello, {name}"; // => pure function: same name, same words
} // => greeter ends here
```

**`drilling/code/kata-05-split-handler-from-dependency/after/Program.cs`**:

```csharp
// Kata 5 solution: the container builds, the handler only calls.
// Registration moves construction out of the handler: tests can swap the
// greeter without touching the route. Compare with before/: the answers
// are byte identical, only the construction moved.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.DependencyInjection; // => AddSingleton registers the service
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<Greeter>(); // => one shared greeter: built once, injected twice
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/greet/{name}",
        (string name, Greeter greeter) => // => the greeter arrives by type
            Results.Ok(new { greeting = greeter.Greet(name) })
    ); // => the handler only calls it
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: build once, check twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => client talks to memory, not the network
foreach (var name in new[] { "ada", "linus" }) // => the two greeted names
{ // => check block opens
    using var response = await client.GetAsync($"/greet/{name}"); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"GET /greet/{name} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => Output: GET /greet/ada -> 200 {"greeting":"hello, ada"}
// => Output: GET /greet/linus -> 200 {"greeting":"hello, linus"}

// => Greeter is the injected logic: pure function, swappable in tests.
sealed class Greeter // => the shared dependency
{ // => greeter block opens
    public string Greet(string name) => $"hello, {name}"; // => pure function: same name, same words
} // => greeter ends here
```

**Output** (`drilling/code/kata-05-split-handler-from-dependency/expected/main.stdout.txt`):

```text
GET /greet/ada -> 200 {"greeting":"hello, ada"}
GET /greet/linus -> 200 {"greeting":"hello, linus"}
```

### Kata 06: Fix a Race Under Load with Interlocked

(Concepts: co-07.)

Ten parallel visits lose counts through +=: make the increments atomic and pin lost at zero.

The starter below races ten visits at a racy counter. Switch the increments to Interlocked and watch lost pin at zero across runs.

**`drilling/code/kata-06-race-under-load-uses-interlocked/before/Program.cs`**:

```csharp
// Kata 6 starter: diagnose the concurrency bug under load.
// Fix me: ten parallel visits lose counts because += is not atomic. Run it
// a few times and watch lost drift above zero, then switch the counter to
// Interlocked like Example 55. The after/ solution pins lost at zero.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the counter
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<HitCounter>(); // => one counter for every visit
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/visit",
        (HitCounter counter) => // => the shared counter arrives by type
            Results.Ok(new { visit = counter.Next() })
    ); // => the racy total, echoed
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fire ten visits at once, print the loss.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, ten parallel calls
var tasks = Enumerable.Range(0, 10).Select(_ => client.GetStringAsync("/visit")).ToArray(); // => ten visits, no awaits
await Task.WhenAll(tasks); // => all ten run concurrently
Console.WriteLine($"parallel=10 lost={10 - HitCounter.Seen}"); // => drifts above zero: the bug
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => HitCounter hides the bug: read plus add is two steps, not one.
// => Two threads can read the same value before either writes back.
sealed class HitCounter // => the racy singleton
{ // => counter block opens
    private int visits; // => the running total, mutated racily

    public static int Seen => seenCount; // => the calls observed so far
    private static int seenCount; // => the demo observer, shared and atomic

    public int Next() // => Fix me: make the add atomic with Interlocked
    { // => next block opens
        seenCount++; // => observe this call, racily too
        visits++; // => the lost update lives here
        return visits; // => the maybe-duplicate total
    } // => next ends here
} // => counter ends here
```

**`drilling/code/kata-06-race-under-load-uses-interlocked/after/Program.cs`**:

```csharp
// Kata 6 solution: atomic increments, zero loss.
// Interlocked makes the read-add-write indivisible: ten parallel visits
// produce exactly ten. Compare with before/: the route is identical, only
// the two increments changed, and lost pins at zero every run.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.DependencyInjection; // => AddSingleton shares the counter
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    builder.Services.AddSingleton<HitCounter>(); // => one counter for every visit
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/visit",
        (HitCounter counter) => // => the shared counter arrives by type
            Results.Ok(new { visit = counter.Next() })
    ); // => the atomic total, echoed
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: fire ten visits at once, print the loss.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client, ten parallel calls
var tasks = Enumerable.Range(0, 10).Select(_ => client.GetStringAsync("/visit")).ToArray(); // => ten visits, no awaits
await Task.WhenAll(tasks); // => all ten run concurrently
Console.WriteLine($"parallel=10 lost={10 - HitCounter.Seen}"); // => Output: parallel=10 lost=0
await app.StopAsync(); // => stop cleanly: nothing in flight is cut

// => HitCounter is the fixed state: atomic increments, exact totals.
sealed class HitCounter // => the fixed singleton
{ // => counter block opens
    private int visits; // => the running total, mutated atomically

    public static int Seen => seenCount; // => the calls observed so far
    private static int seenCount; // => the demo observer, shared and atomic

    public int Next() // => atomic add-and-read
    { // => next block opens
        Interlocked.Increment(ref seenCount); // => observe this call first
        return Interlocked.Increment(ref visits); // => then advance the total
    } // => next ends here
} // => counter ends here
```

**Output** (`drilling/code/kata-06-race-under-load-uses-interlocked/expected/main.stdout.txt`):

```text
parallel=10 lost=0
```

### Kata 07: Wrap Failures in the Service Error Envelope

(Concepts: co-05.)

Misses answer bare 404s and 400s: route every failure through one envelope helper.

The starter below answers failures with empty bodies. Add the shared Fail helper so every failure wears the code-error-hint envelope.

**`drilling/code/kata-07-error-envelope-for-clients/before/Program.cs`**:

```csharp
// Kata 7 starter: wrap failures in the service error envelope.
// Fix me: misses answer bare 404s with empty bodies, so clients parse two
// shapes. Add the shared Fail helper from Example 20 and route every
// failure through it. The after/ solution shows one envelope everywhere.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/books/{id:int}",
        (int id) => // => Fix me: failures must wear the envelope
            id == 1 ? Results.Ok(new { id, title = "dune" }) : Results.NotFound()
    ); // => bare 404: two shapes
    app.MapPost("/books", () => Results.BadRequest()); // => bare 400: two shapes
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
static async Task CheckAsync(HttpClient client, string method, string target) // => method plus path
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this kata
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, fail twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/books/99"); // => empty 404 today: must wear the envelope
await CheckAsync(client, "POST", "/books"); // => empty 400 today: must wear the envelope
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**`drilling/code/kata-07-error-envelope-for-clients/after/Program.cs`**:

```csharp
// Kata 7 solution: one envelope for every failure.
// The Fail helper wraps each failure in the same shape: code plus error
// plus hint. Compare with before/: the routes are identical, only the
// failure answers changed, and clients parse one shape now.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.AspNetCore.TestHost; // => TestServer serves requests in memory
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => Fail is the one envelope every failure in this kata wears.
static IResult Fail(int status, string error, string hint) // => status plus two fixed strings
{ // => helper block opens
    var body = new
    {
        code = status,
        error,
        hint,
    }; // => the shared envelope
    return status switch // => the status picks the Results helper
    { // => switch block opens
        404 => Results.NotFound(body), // => absence wears the envelope too
        _ => Results.BadRequest(body), // => every other fault defaults here
    }; // => switch ends here
} // => helper ends here

// => BuildApp wires the service with every route this kata serves.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseTestServer(); // => in-memory server: no socket, no port
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/books/{id:int}",
        (int id) => // => the lookup route
            id == 1
                ? Results.Ok(new { id, title = "dune" })
                : Fail(404, "book-not-found", "check the id and retry")
    );
    app.MapPost("/books", () => Fail(400, "title-is-required", "send a JSON body with a title")); // => the bad body
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => CheckAsync serves one request and prints the code with the body.
static async Task CheckAsync(HttpClient client, string method, string target) // => method plus path
{ // => check block opens
    using var request = new HttpRequestMessage(new HttpMethod(method), target); // => no bodies in this kata
    using var response = await client.SendAsync(request); // => full pipeline runs, then answers
    var body = await response.Content.ReadAsStringAsync(); // => the exact bytes written
    Console.WriteLine($"{method} {target} -> {(int)response.StatusCode} {body}".TrimEnd()); // => one golden line
} // => check ends here

// => Top-level entry: build once, fail twice, stop cleanly.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => TestServer starts without opening any socket
using var client = app.GetTestClient(); // => one client for the whole suite
await CheckAsync(client, "GET", "/books/99"); // => Output: GET /books/99 -> 404 {"code":404,"error":"book-not-found","hint":"check the id and retry"}
await CheckAsync(client, "POST", "/books"); // => Output: POST /books -> 400 {"code":400,"error":"title-is-required","hint":"send a JSON body with a title"}
await app.StopAsync(); // => stop cleanly: nothing in flight is cut
```

**Output** (`drilling/code/kata-07-error-envelope-for-clients/expected/main.stdout.txt`):

```text
GET /books/99 -> 404 {"code":404,"error":"book-not-found","hint":"check the id and retry"}
POST /books -> 400 {"code":400,"error":"title-is-required","hint":"send a JSON body with a title"}
```

### Kata 08: Stop on a Shutdown Deadline

(Concepts: co-08.)

The stop waits out the whole slow request: configure the 300-millisecond deadline and print the bounded stop.

The starter below drains without a bound. Configure ShutdownTimeout so the slow request takes the cut and the stop returns on schedule.

**`drilling/code/kata-08-shutdown-with-a-deadline/before/Program.cs`**:

```csharp
// Kata 8 starter: stop on a deadline.
// Fix me: the stop below waits out the whole slow request, so deploys hang
// behind one dependency. Configure a 300ms ShutdownTimeout like Example 68
// and print the bounded stop. The after/ solution shows the deadline.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.Extensions.Hosting; // => HostOptions carries the deadline
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
// => Fix me: the deadline configuration is missing here.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (CancellationToken token) => // => the token fires at the deadline
        { // => handler block opens
            try // => the work may be cut partway
            { // => work block opens
                await Task.Delay(5000, token); // => five seconds of pretend work
                return Results.Ok(new { done = true }); // => reached only when never cut
            } // => work ends here
            catch (OperationCanceledException) // => the deadline cut this request
            { // => cancel block opens
                return Results.Json(new { cut = true }, statusCode: 499); // => fixed cut mark
            } // => cancel ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, overlap a request with the stop, report.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var flight = client.GetStringAsync("/slow"); // => the request the deadline will cut
await Task.Delay(200); // => let the slow request reach the handler first
await app.StopAsync(); // => Fix me: unbounded today, bounded after the fix
string clientWord; // => the client side always ends the same way here
try // => the cut connection cannot deliver an answer
{ // => try block opens
    await flight; // => the answer that never arrives
    clientWord = "answered"; // => a surprise: the socket survived
} // => try ends here
catch (Exception) // => refused, reset, or cancelled: all mean cut
{ // => catch block opens
    clientWord = "cut"; // => the fixed client-side word
} // => catch ends here
Console.WriteLine($"stop -> bounded client={clientWord}"); // => the bounded stop, after the fix
```

**`drilling/code/kata-08-shutdown-with-a-deadline/after/Program.cs`**:

```csharp
// Kata 8 solution: the deadline bounds the drain.
// ShutdownTimeout cuts the slow request 300ms into the stop: the token
// fires, the handler records the cut, and the stop returns on schedule.
// Compare with before/: one Configure call is new, and the five-second
// hang becomes a bounded stop.
using Microsoft.AspNetCore.Builder; // => WebApplication wires routes to handlers
using Microsoft.Extensions.Hosting; // => HostOptions carries the deadline
using Microsoft.Extensions.Logging; // => ClearProviders silences logs

// => BuildApp wires the service with every route this kata serves.
// => The 300ms deadline cuts the five-second request mid-flight.
static WebApplication BuildApp(string[] args) // => args carry no flags here
{ // => builder block opens
    var builder = WebApplication.CreateBuilder(args); // => defaults plus our overrides
    builder.Logging.ClearProviders(); // => no log lines: only our prints appear
    builder.WebHost.UseUrls("http://127.0.0.1:0"); // => loopback, OS-chosen port, never fixed
    builder.Services.Configure<HostOptions>(options => // => the drain bound
        options.ShutdownTimeout = TimeSpan.FromMilliseconds(300)
    ); // => short on purpose for the demo
    var app = builder.Build(); // => the pipeline with routing and endpoints
    app.MapGet(
        "/slow",
        async (CancellationToken token) => // => the token fires at the deadline
        { // => handler block opens
            try // => the work may be cut partway
            { // => work block opens
                await Task.Delay(5000, token); // => five seconds of pretend work
                return Results.Ok(new { done = true }); // => reached only when never cut
            } // => work ends here
            catch (OperationCanceledException) // => the deadline cut this request
            { // => cancel block opens
                return Results.Json(new { cut = true }, statusCode: 499); // => fixed cut mark
            } // => cancel ends here
        }
    ); // => handler ends here
    return app; // => hand the wired service back to the caller
} // => builder ends here

// => Top-level entry: start, overlap a request with a bounded stop, report.
var app = BuildApp(args); // => wiring separate from traffic, as always
await app.StartAsync(); // => Kestrel listens on 127.0.0.1 and an ephemeral port
var port = new Uri(app.Urls.First()).Port; // => the OS-chosen port: used, never printed
using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}") }; // => loopback client
var flight = client.GetStringAsync("/slow"); // => the request the deadline will cut
await Task.Delay(200); // => let the slow request reach the handler first
await app.StopAsync(); // => bounded stop: the deadline cuts the drain
string clientWord; // => the client side always ends the same way here
try // => the cut connection cannot deliver an answer
{ // => try block opens
    await flight; // => the answer that never arrives
    clientWord = "answered"; // => a surprise: the socket survived
} // => try ends here
catch (Exception) // => refused, reset, or cancelled: all mean cut
{ // => catch block opens
    clientWord = "cut"; // => the fixed client-side word
} // => catch ends here
Console.WriteLine($"stop -> bounded client={clientWord}"); // => Output: stop -> bounded client=cut
```

**Output** (`drilling/code/kata-08-shutdown-with-a-deadline/expected/main.stdout.txt`):

```text
stop -> bounded client=cut
```

## Self-check checklist

- I can map a method plus a path to a handler so the pair selects exactly one function.
- I can predict whether an unknown path earns a 404 or a used path with the wrong verb earns a 405.
- I can write a middleware with before and after legs and schedule post-handler stamps with OnStarting.
- I can stack two middlewares and state the four-stage execution order without running it.
- I can bind path segments into typed parameters so unparsable values never reach the handler.
- I can bind optional query values with defaults that distinguish omission from zero.
- I can read a header with a fallback default for requests that omit it.
- I can parse both JSON and form bodies into the same typed record.
- I can choose 200, 201, 204, or 400 for a response and name the helper that produces it.
- I can fix JSON key casing once with a serializer policy instead of per route.
- I can answer every failure in one shared envelope with code, error, and hint.
- I can serve cache headers and conditional 304s from a fixed ETag without printing timestamps.
- I can set and read a session cookie across two requests with manual header handling.
- I can register singleton, scoped, and transient services and predict what each shares.
- I can compose the three lifetimes without creating a captive dependency.
- I can bind settings once with Configure and read them through IOptions in any handler.
- I can pick keyed implementations of one contract at request time.
- I can serve requests in-process through TestServer with no socket and no port.
- I can pin status plus body assertions that fail on any drift in either.
- I can fan parallel requests out with WhenAll and sort the results for a stable transcript.
- I can guard one request with a semaphore cap and state the peak the test proves.
- I can start a loopback server on an ephemeral port and stop it without leaking the port number.
- I can drain in-flight requests on shutdown and refuse only the calls after the stop.
- I can map each ASP.NET Core idiom in this course to its FastAPI counterpart and name the difference.

## Elaborative interrogation & self-explanation

Answer each prompt in writing before reading the model answer: name the choice, name the rejected alternative, and state the exact failure the choice prevents. A prompt you answer with slogans instead of mechanisms is still open — rework it with the mapped example running beside you. Read each rejected alternative as a live option teams actually choose, not a strawman: the trade-off only teaches if the wrong answer tempts you first.

### Prompt 1: Why test through TestServer instead of always binding loopback — and why not bind loopback everywhere?

The rejected alternative is testing everything over loopback: it would work, but every test would pay for a listener and risk port collisions, and the transcripts would need port scrubbing. The model answer: TestServer removes the socket, the port, and the timing from every test that does not study serving itself, which makes most examples hermetic and fast. Loopback is kept for the examples where the listener is the subject — binding, draining, closing, handoff — because TestServer cannot exhibit those behaviors. The nine loopback examples prove the split is sufficient: every serving behavior the course teaches is covered, and nothing else needs a listener.

### Prompt 2: Why keep handlers small with services injected — and why not let handlers own the logic?

The rejected alternative is logic inside handlers: it works for one route, then duplicates across routes, drifts between copies, and forces HTTP-level tests for pure logic. The model answer: Thin handlers are documentation — the route table reads as the service's contract — while services own rules that unit tests reach without HTTP. The course pays the injection ceremony on every example so the habit transfers to services where the logic is real. The capstone is the payoff: five routes share one validator and one store precisely because no handler owns logic worth duplicating.

### Prompt 3: Why use fixed strings with no trace IDs in the error envelope — and why not include dynamic correlation data?

The rejected alternative is dynamic envelopes with trace IDs and timestamps: they help production debugging but make every failure transcript unstable, which means the tests that should guard the contract cannot assert on it. The model answer: Fixed strings make failures golden-testable byte for byte, so the suite locks the error contract exactly like the success contract. Production can add correlation IDs at the edge; the course keeps the envelope testable. When production needs correlation, add it in one middleware that logs the ID server side while the client envelope stays fixed.

### Prompt 4: Why keep validation rules on the type or in a service — and why not check inside each handler?

The rejected alternative is per-handler checks: they read naturally once, then scatter, drift, and disagree — two routes validating the same record differently is the bug this prevents. The model answer: Rules on the type or in one service give a single source of truth, so adding a route cannot fork the definition of clean input. Centralized rules also test without HTTP, which is faster and more precise than driving every rule through the full pipeline. The kata sequence proves the habit: kata 1 moves rules out of the handler, and every later kata keeps them out.

### Prompt 5: Why drain shutdown within a deadline — and why not stop instantly or wait forever?

The model answer: Instant stops drop in-flight requests and turn every deploy into user-visible errors, while unbounded drains hang deploys behind one stuck dependency and block every later release. The deadline splits the difference with a known budget: finish inside it or take the cut, and the stop always returns on schedule. The rejected extremes are both operationally expensive — one in errors, one in frozen deploys — and the bounded drain is the only option with a predictable cost. Examples 63 and 68 print both halves of the bargain so the bounded stop is a tested property, not a configuration hope.

### Prompt 6: Why mirror FastAPI shapes in the comparison cluster — and why not teach ASP.NET Core in isolation?

The rejected alternative is teaching in isolation: it avoids confusion in the short term but leaves the transfer unmapped, so developers cargo-cult one framework's shapes into the other at the first unfamiliar problem. The model answer: Developers arriving from the backend courses already think in FastAPI, so mapping each idiom — decorators to builder calls, Pydantic to attributes, Depends to lifetimes, TestClient to test clients — transfers their existing judgment instead of rebuilding it. Explicit comparison names the differences where they matter — error keys, validation codes, schedulers — instead of letting them surface as production surprises. Every comparison example prints its FastAPI mirror line, so the mapping is asserted in the transcript rather than claimed in prose.
