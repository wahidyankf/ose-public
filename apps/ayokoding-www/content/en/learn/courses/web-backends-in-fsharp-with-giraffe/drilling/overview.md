---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

## Recall Q&A

Answer each question from memory before opening its answer block: say the answer aloud in one or two sentences, then check. The questions follow the course order — routes and parsing first, middleware and services next, pressure and comparisons last — so a missed question points at the level worth reworking. Say the answer before opening the block: retrieval builds the memory, recognition only flatters it. Mark every miss with the example number it points to, and rework that example the same day.

### Q1 (co-01): What three pieces make a Giraffe route, and what happens when no branch matches?

<details><summary>Answer</summary>

A method filter, a path matcher, and the handler that answers. `choose` tries branches top to bottom; the first match runs, and a request nothing matches falls to the last branch — which is why every table ends with a designed 404 instead of an accident. Method filters compose with path matchers through the same `>=>` operator as everything else, so one line reads as one contract: this verb on this path does this thing. Registration order also decides merge conflicts: two developers adding migrations reorder by agreement, and the journal exposes any divergence the moment histories differ.

**In short**: Method plus path plus handler, tried in order; the unmatched fall through to the final branch, so the fallback is a decision the author writes, not a default the framework picks.

</details>

### Q2 (co-01): Why do typed captures beat manual string parsing at the route boundary?

<details><summary>Answer</summary>

Placeholders turn segments into typed arguments before the handler body runs: `%s` hands a string, `%i` hands an int, and a segment with the wrong type simply does not match. The mismatch becomes a 404 instead of a 500 because the route never claims a request it cannot serve. Handlers stop defending against strings and start trusting their inputs, which moves a whole class of bugs from runtime into route matching. Typed captures compose with method filters, so the full contract reads in one line — verb, path types, and handler — instead of scattering across parsing code and route tables.

**In short**: Typed placeholders match or fall through, so handlers receive values instead of parsing strings — wrong-typed segments 404 rather than crash.

</details>

### Q3 (co-03): How do optional request inputs (query, headers) arrive, and what must the handler decide?

<details><summary>Answer</summary>

They arrive as options: `TryGetQueryStringValue` and `TryGetRequestHeader` return `Some` when present and `None` when absent. The handler names the default — `defaultArg` with `"all"` or `"none"` — instead of letting absence crash or silently misbehave. Every optional input is a small design decision: what does this route mean when the caller sends nothing extra? Query defaults deserve names in code rather than empty-string accidents: the next reader learns the policy without running the service, and callers rely on documented behavior.

**In short**: Optionals arrive as options; the handler supplies the default with `defaultArg`, turning absence into documented behavior.

</details>

### Q4 (co-03): What pairs with a body reader, and what breaks when the pairing is missing?

<details><summary>Answer</summary>

The method filter pairs with the reader: `POST >=> route` means the path alone never reaches the body parser. A reader without its verb filter runs on bodyless GETs and explodes on the empty body — which is why every POST, PUT, and form route in this course filters before it reads. The fallback then answers 404 for wrong-verb traffic instead of 500ing on missing bytes. The pairing also protects the logs: a 404 for wrong-verb traffic reads as routing, while a 500 on an empty body reads as breakage, and the two demand different responses.

**In short**: Method filters guard body readers; without the pairing, a bodyless request reaches the parser and the 404 becomes a 500.

</details>

### Q5 (co-04): What does each of 200, 201, 202, and 404 tell the client to do next?

<details><summary>Answer</summary>

200 says read the body and move on; 201 says a resource was born and the headers name where; 202 says the work started but the answer is not ready; 404 says the address names nothing. Clients branch on codes without parsing bodies, and dashboards aggregate them the same way. Answering everything 200 forces every client to parse bodies for outcomes the status line already encodes. HEAD and OPTIONS inherit the same discipline: safe methods answer from the table, and untaught verbs fall through to the fallback instead of triggering handlers written for other verbs.

**In short**: 200 read on, 201 follow the pointer, 202 wait or poll, 404 fix the address — the code names the outcome before the body.

</details>

### Q6 (co-04): Why does creation answer 201 plus a Location header instead of 200 with the body?

<details><summary>Answer</summary>

The pair splits the contract into outcome and address: 201 announces the birth, `Location` names where the resource lives, and clients that follow the pointer never construct URLs by string concatenation. The service keeps ownership of its URL space through renames and regroupings. A 200 with a body answers what was created but leaves every client guessing where to find it next. Clients that construct addresses break on the first regrouping; clients that follow pointers survive versioning, prefixing, and nesting without a single change.

**In short**: 201 announces, Location points, and pointer-following clients survive every rename that string-building clients do not.

</details>

### Q7 (co-05): What shape do all failures share in this course, and where is it built?

<details><summary>Answer</summary>

Every failure carries the same JSON envelope — an `error` name, sometimes a `status` — built by one helper or one fallback branch that every route shares. Clients parse once and branch on values; dashboards group by the name. Hand-built per-handler errors drift until clients defend against shapes instead of handling failures, so the single builder is the policy that enforces itself. The builder habit compounds: once every failure flows through one function, trace ids, metrics, and alerting land in a single edit instead of thirty.

**In short**: One envelope, one builder, every failure: same keys with different names, so clients parse once and branch on values.

</details>

### Q8 (co-05): What catches a throwing handler, and what must it never leak?

<details><summary>Answer</summary>

The registered error handler catches every throw and converts it into a status plus a named body. It must never leak internals: log the full exception server-side, return a fixed name on the wire. A missing registration kills the process or leaks a stack trace; a registered one turns explosions into countable, parseable responses in the same contract as everything else. Fixed failure bodies keep transcripts stable across SDK versions, while full exceptions in logs keep operators effective — stability for clients, truth for operators, never mixed.

**In short**: The error handler converts throws into shaped responses — full detail to logs, fixed names to clients, never a leak.

</details>

### Q9 (co-06): Where do services get built, where do they get used, and why apart?

<details><summary>Answer</summary>

Built once at startup with `AddSingleton`, used per request with `GetService` inside handlers. Construction moves to one visible file — the wiring diagram — while use stays in the request where the work happens. Mixing them scatters construction across handlers and makes every implementation swap touch every caller; separating them lets the container own the how and the handler own the what. Registration order does not matter and resolution happens per request, which means the container fails loudly at startup for missing types instead of nulling at runtime.

**In short**: Construct at startup, resolve in handlers — one file owns the wiring, every route owns only its need.

</details>

### Q10 (co-06): Which lifecycle fits per-request data, and how do sequential checks prove it?

<details><summary>Answer</summary>

Scoped: a fresh instance per request scope, so no request ever sees another's service. Sequential checks prove isolation by printing different scope numbers — first scope 1, second scope 2 — which a shared singleton would disprove by repeating. Singletons accumulate across requests, transients rebuild per resolution, and scoped sits between: fresh per call, gone after. Transient fits stateless helpers rebuilt per resolution; scoped fits per-request ambient data; singletons fit shared stores — and the numbered proof tells which is which.

**In short**: Scoped means fresh per request; differing numbers across sequential checks prove the isolation singletons would violate.

</details>

### Q11 (co-02): What is middleware in Giraffe, and what are its two legal moves?

<details><summary>Answer</summary>

A handler that takes the next handler: it receives `next`, and either calls it to continue inward or answers directly to short-circuit. Stamp-then-continue observes every request; check-then-stop guards them. Composition with `>=>` in front of the table wraps every branch at once, which is why cross-cutting behavior cannot be forgotten for one route. Selective guarding composes the wrapper around branches rather than tables, so moving a route in or out of the guard is moving one line that review can audit.

**In short**: Middleware wraps `next` and either continues or answers — observe everything, guard selectively, compose in front.

</details>

### Q12 (co-02): In which order do nested wrappers run their entry and exit code?

<details><summary>Answer</summary>

Entry runs outside-in, exit runs inside-out: outer-in, inner-in, inner-out, outer-out. The outer wrapper receives the request first and finishes last because the inner pipeline must return before it can. Short-circuiting skips all inner entries at once, and the exit steps that never run name the layer that broke. Exit code runs after next returns, which is why timing, logging, and cleanup belong there: the inner answer exists, and the outer layer finishes the observation.

**In short**: Onion order — outer enters first and exits last — so entry runs top-down, exit runs bottom-up, and skips name their layer.

</details>

### Q13 (co-09): Why do all checks in this course run through TestServer instead of a live port?

<details><summary>Answer</summary>

Because the topology removes the flakiest layer: no occupied ports, no firewall rules, no bind races — yet every middleware and handler runs exactly as in production. Suites finish in milliseconds and fail only when behavior breaks. The loopback client is fixed at `http://localhost/`, so no check ever waits on a port or collides with a neighbor. One client drives every check in the unit, which keeps connection behavior uniform: no per-case construction, no port waits, and setup costs that round to zero.

**In short**: In-process serving tests the real composition with none of the network flakiness — fast, fixed, and repeatable.

</details>

### Q14 (co-09): What must a check assert about a miss, and why is status-only assertion insufficient?

<details><summary>Answer</summary>

Both the status and the exact body: a 200 with the wrong body passes a lazy check and fails the client at midnight. The miss envelope is a contract too — error names drift while statuses stay put. Asserting exact bytes on hits and misses alike catches renamed keys and reshaped envelopes that status-only tables wave through. Table-driven checks separate cases from machinery: adding a case appends a tuple, and the transcript names the exact row that failed instead of a line in a helper.

**In short**: Assert status plus exact body on hits and misses; bytes catch the drift that codes miss.

</details>

### Q15 (co-10): Where does validation sit, and what are its three possible answers?

<details><summary>Answer</summary>

Between the bind and the success: parse the shape first, judge the values second, answer 201 only for orders that pass every rule. Each rule owns one check and one error name, so a client can tell a missing item from a bad count. The three answers are accept with 201, reject with a named 400, or miss the route entirely with 404 — never a silent default. Up-front validation converts client mistakes into 400s at the edge, so bad requests never reach business logic, storage, or an on-call pager.

**In short**: Bind, judge each rule with its own name, then accept or reject — validation sits between parsing and success.

</details>

### Q16 (co-10): Why do absent JSON fields bind as null instead of failing, and what follows?

<details><summary>Answer</summary>

System.Text.Json leaves absent string fields null rather than erroring, so required-field checks come after the bind as explicit `IsNullOrEmpty` tests. Treating missing and empty alike covers both shapes callers actually send. The alternative — trusting the record — carries nulls three layers deep before exploding far from the edge, as a mystery instead of a one-line 400. Required-field checks age better than binder attributes: the rule lives in code the team reads, with an error name the dashboards graph, instead of metadata only the framework understands.

**In short**: Absence binds null, so check after binding: explicit null tests at the edge beat distant explosions.

</details>

### Q17 (co-11): What does a route group buy that a flat table cannot?

<details><summary>Answer</summary>

A shared prefix owned in one place: versioning, guarding, and moving the group become single edits instead of per-route surgery. The inner names are not addresses on their own — the miss proves the prefix is structural — so collisions surface at composition time. Flat tables drift into shadowing; grouped tables collide loudly where the fix is one changed line. Prefix groups scale the route table the way modules scale code: each group owns a namespace, and namespaces compose without the string-matching reviews flat tables need.

**In short**: Groups own their prefix in one edit — version, guard, and move together instead of route by route.

</details>

### Q18 (co-12): How does Accept-header negotiation pick a representation, and what is the default?

<details><summary>Answer</summary>

The handler reads `Accept`, matches a known format, and renders it — JSON by default when the header is absent, CSV when the client names `text/csv`. The default matters because most clients send no header; absent must mean the primary representation, never an error. One address serves many shapes, and the header casts the deciding vote without new routes. Explicit reader choice documents the supported shapes better than any comment: the match arms are the compatibility list, readable by every client author.

**In short**: Match Accept to a renderer with JSON as the absent default — one address, many representations, no new routes.

</details>

### Q19 (co-13): What belongs in a log line, and what must never reach stdout in checks?

<details><summary>Answer</summary>

Method plus path — the smallest line that still identifies what happened — with timings and payloads added only where a question needs them. Framework chatter must never reach check stdout: golden transcripts hold verdicts only, while observation lands in memory journals the check summarizes. One stream per reader: operators grep logs, reviewers read verdicts, and the two never mix. Sequential checks keep journal order deterministic; concurrent traffic would interleave lines, which is why real logs carry timestamps this teaching journal omits.

**In short**: Log method plus path as structure; keep check stdout to verdicts and summarize observation as data.

</details>

### Q20 (co-13): Why structured fields instead of sentences in lifecycle logs?

<details><summary>Answer</summary>

Fields parse without regular expressions: `method=GET path=/a` filters with grep and feeds pipelines that prose cannot. Consistent fields across request and stop events let one query follow a deploy from first request to clean stop. Unstructured logs age into noise nobody greps; structured ones compound into dashboards, alerts, and the answers that end incidents early. Machine-parseable lines turn incidents from archaeology into queries: filter by path, count by method, and follow a deploy from first request to clean stop.

**In short**: Fields are queryable, sentences are not — structure turns logs from text into evidence.

</details>

### Q21 (co-14): What makes a health endpoint trustworthy, and what makes it a lie?

<details><summary>Answer</summary>

Fixed, fast, and beside content: a pinned `ok` body served from the same pipeline as user traffic, so the probe proves the stack works rather than the socket answers. A probe without content beside it is the classic false-ready lie — green health on a host that fails every request. Readiness flips before traffic stops during shutdown, so the balancer drains the instance while in-flight work finishes. Serving health from the same pipeline proves the whole stack works — routing, handlers, serialization — rather than proving only that the socket answers.

**In short**: Fixed body, same pipeline as content, flips before shutdown — probes that prove the stack, not the socket.

</details>

### Q22 (co-07): What are the three atomic tools for shared state, and what breaks without them?

<details><summary>Answer</summary>

Interlocked increments for counters, semaphores for admission bounds, and concurrent dictionaries for cached maps. Without them, read-add-write sequences interleave: hits vanish, buckets admit double, caches compute twice under contention. Sequential checks print tidy orders, but the guarantee worth asserting is uniqueness and boundedness under any interleave — atomicity always, ordering never promised. Sorting at the join removes arrival order from transcripts: concurrency reorders completions by nature, and golden files must never depend on who landed first.

**In short**: Interlocked, semaphores, concurrent maps — atomic primitives that hold under interleavings plain code cannot survive.

</details>

### Q23 (co-08): What is the correct shutdown sequence, and why that order?

<details><summary>Answer</summary>

Flip readiness first so the balancer sends new traffic elsewhere, await in-flight work so nothing is cut, then stop the host and release resources. Each step protects a different party: the flip protects future users, the drain protects current ones, the stop releases the process. Reversing the order strands users on a host that already quit; skipping the flip strands the balancer on a host that stopped serving. Awaiting the flight before stopping is the graceful pattern: collect the in-flight work, land every member, then stop — never mark what is still travelling.

**In short**: Shed probes, drain flights, then stop — future traffic reroutes while current traffic lands.

</details>

### Q24 (co-16): When do values beat decorators, and when do exceptions beat Results?

<details><summary>Answer</summary>

Values win at composition distance zero: route slices, rule lists, and lookups decided beside their callers compose, test, and move as expressions. Exceptions win at depth: failures six layers down propagate without threading Results through every intermediate signature. The honest rule is distance — near decisions match, far failures throw — and edges mostly decide near. Boundary typing pairs compile-time shape with runtime rules: records fix fields the compiler checks, ordered checks judge values callers send, and both layers agree.

**In short**: Compose near decisions as values, propagate far failures as throws — distance picks the mechanism, honestly.

</details>

## Applied problems

Work each on paper before touching a terminal: name the routes, the handlers, and the expected transcript lines. Then build the file and run it — the terminal is the grader, not the draft. Sketch the route table first, predict every line second, and let the transcript confirm or correct the prediction.

### Problem 1: Problem 1: Close the table

The service serves `/a` and `/b` as JSON but answers strangers with bare text. Add the designed miss: serve every unknown path as a JSON envelope with a fixed error name, and write the three transcript lines proving both hits and the miss. State where the envelope branch sits and why it must sit last. Sketch the table before writing any handler, and predict all three lines before running.

### Problem 2: Problem 2: Validate the intake

The `POST /signup` route binds `{name, year}` and echoes it without judgment. Add two rules — names are never empty, years are never below 1900 — each with its own error name, and write the four transcript lines: two rejections, one acceptance, one miss. State what binds as null and where the null check lives. Predict all four transcript lines on paper before the terminal grades them.

### Problem 3: Problem 3: Guard the admin

The `/admin` route serves secrets to everyone. Wrap it in a key-checking wrapper that answers 403 to strangers and serves holders, while `/public` stays open. Write the three transcript lines and state whether the guard wraps the branch or the table — and what changes if the requirement grows to three guarded routes. Prove the open route never passes through the guard.

### Problem 4: Problem 4: Prove the sharing

Two routes must share one counter, and the reviewer doubts they do. Design the two routes and the three transcript lines that convict separate counters and acquit a shared one. State the lifecycle the service must register and what the numbers read if the registration is wrong. Drive both routes from one client and compare the sequences.

### Problem 5: Problem 5: Shed the surge

The `/api` route slows under load and the team wants a bound of two concurrent entries. Add the semaphore, choose Wait(0) over blocking waits, and write the transcript lines for two admissions plus one shed. State where the permit releases and what leaks if the release sits outside a finally. Hold the permits from the checks to make the shed deterministic.

### Problem 6: Problem 6: Drain the deploy

Deploys reset in-flight checkouts. Add the readiness flip plus the drain: probes shed with 503 while traffic still serves 200, and the stop waits for the flight. Write the transcript lines in shutdown order and state which line proves the drain versus which proves the flip. Flip the flag from the checks to keep the mechanism visible.

### Problem 7: Problem 7: Cache the square

The `/square` route recomputes on every call and profiling blames it. Add the concurrent dictionary with a compute counter, and write the two transcript lines proving the second identical call skipped the work. State what `GetOrAdd` guarantees under concurrent misses that a check-then-add would not. Count computations instead of timing them to keep the lesson deterministic.

### Problem 8: Problem 8: Compare honestly

The team debates rewriting a validation route in FastAPI for its Pydantic models. Write the honest comparison: what the decorator version shortens, what the explicit rule list keeps visible, and which codebase pays when the third unusual rule arrives. State the distance rule for values versus exceptions and apply it to this route. Cite the documentation for every claim about the other framework.

## Code katas

Each kata ships a `before/` starter holding the smell and an `after/` solution proving the fix. Work the starter first — name the smell aloud, write the failing line you expect — then compare against the solution's transcript. The harness runs only the `after/` code; the `before/` is yours to break and learn from. Spend real time in the starter: reproduce the smell, exaggerate it, and watch the transcript prove the cost before you read the fix.

### Add Request Validation That Rejects a Malformed Body

The starter echoes any posted body with 200, including nulls. Add the rule that rejects empty values with a named 400 and echoes clean ones, then prove both transcript lines. The `before/` starter shows what trusting the client costs: nulls echo back with 200 and no rule ever fires.

Work in `drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/before/Program.fs`**:

```fsharp
module App // => STARTER: echoes without validating (the smell)

open System.Net.Http
open System.Text
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => KataVal is the value the kata validates.
[<CLIMutable>]
type KataVal =
    { v: string }

// => webApp trusts the client: no validation anywhere.
let webApp: HttpHandler = // => SMELL: the echo never judges
    choose [
        POST >=> route "/v" >=> fun next ctx ->
            task {
                let! value = ctx.BindJsonAsync<KataVal>() // => binds, never validates
                return! json {| v = value.v |} next ctx // => nulls echo as nulls
            }
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: post {} and watch null echo back with 200
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => KataVal is the value the kata validates.
[<CLIMutable>] // => one field to judge
type KataVal =
    { v: string } // => empty values fail
// => webApp validates before echoing.
let webApp: HttpHandler =
    choose [
        POST >=> route "/v" >=> fun next ctx ->
            task {
                let! value = ctx.BindJsonAsync<KataVal>() // => the candidate binds typed
                if System.String.IsNullOrEmpty(value.v) then // => the kata's one rule
                    return! (setStatusCode 400 >=> json {| error = "v-required" |}) next ctx
                else // => clean values echo back
                    return! json {| v = value.v |} next ctx
            }
        setStatusCode 404 >=> text "Not Found" // => other paths miss
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    postJson client "/v" "{}" // => the malformed body fails
    postJson client "/v" """{"v":"x"}""" // => the clean body echoes
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/expected/main.stdout.txt`):

```text
POST /v -> 400 {"error":"v-required"}
POST /v -> 200 {"v":"x"}
```

### Convert a Blocking Call into the Framework's Async Idiom

The starter sleeps the thread to wait. Convert the wait to `Task.Delay` inside the task expression and explain which thread serves other requests during the pause. The transcript stays identical either way, which is exactly the point: behavior matches while resource usage diverges.

Work in `drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/before/Program.fs`**:

```fsharp
module App // => STARTER: blocks a thread to wait (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp sleeps the thread: nothing else runs meanwhile.
let webApp: HttpHandler = // => SMELL: Thread.Sleep holds its thread hostage
    choose [
        GET >=> route "/work" >=> fun next ctx ->
            task {
                System.Threading.Thread.Sleep(10) // => blocks: ten wasted milliseconds
                return! text "done" next ctx
            }
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: convert the sleep to Task.Delay and compare thread behavior
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => webApp awaits instead of blocking.
let webApp: HttpHandler =
    choose [
        GET >=> route "/work" >=> fun next ctx ->
            task {
                do! System.Threading.Tasks.Task.Delay(10) // => the thread serves others during the wait
                return! text "done" next ctx
            }
        setStatusCode 404 >=> text "Not Found" // => other paths miss
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/work" // => the awaited answer arrives
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/expected/main.stdout.txt`):

```text
GET /work -> 200 done
```

### Write an In-Process Test for a New Route

The starter serves an untested route. Write the three-row table driving the new route, its neighbor, and the miss — then read the verdicts and state what each row covers. The table is the deliverable: future routes arrive as rows, and the machinery never changes underneath.

Work in `drilling/code/kata-03-write-an-in-process-test-for-a-new-route/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/before/Program.fs`**:

```fsharp
module App // => STARTER: a new route with no checks (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp serves the new route nobody drives.
let webApp: HttpHandler = // => SMELL: /new exists but no check requests it
    choose [
        GET >=> route "/new" >=> text "brand-new" // => untested: does it even serve?
        GET >=> route "/old" >=> text "kept"
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: write a three-row table driving /new, /old, and /nope
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => webApp serves the two routes the new checks cover.
let webApp: HttpHandler =
    choose [
        GET >=> route "/new" >=> text "brand-new" // => the new route under test
        GET >=> route "/old" >=> text "kept" // => the neighbor that must not break
        setStatusCode 404 >=> text "Not Found" // => misses stay plain
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    let check (path: string) (want: int) = // => the kata's first table
        let resp = client.GetAsync(path).GetAwaiter().GetResult() // => in-process, no socket
        show (sprintf "GET %s ok=%b" path (int resp.StatusCode = want)) // => one verdict per row
    check "/new" 200 // => the new route serves
    check "/old" 200 // => the neighbor still serves
    check "/nope" 404 // => misses still miss
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/expected/main.stdout.txt`):

```text
GET /new ok=true
GET /old ok=true
GET /nope ok=true
```

### Add a Designed 404 Envelope

The starter misses as bare text. Serve the miss as a JSON envelope with a fixed error name and prove the hit stayed plain while the miss became parseable. Clients parse one shape after your change instead of two, and the dashboards graph the error name.

Work in `drilling/code/kata-04-add-a-designed-404-envelope/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-04-add-a-designed-404-envelope/before/Program.fs`**:

```fsharp
module App // => STARTER: misses answer as bare text (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp misses in a different shape than it hits.
let webApp: HttpHandler = // => SMELL: text misses break JSON clients
    choose [
        GET >=> route "/a" >=> text "a"
        setStatusCode 404 >=> text "Not Found" // => bare text: unparseable by contract
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: serve the miss as a JSON envelope with an error name
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-04-add-a-designed-404-envelope/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => webApp answers misses with a designed envelope.
let webApp: HttpHandler =
    choose [
        GET >=> route "/a" >=> text "a" // => the one real route
        setStatusCode 404 >=> json {| error = "nope" |} // => the designed miss
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/a" // => the real route answers plainly
    get client "/missing" // => the miss carries the envelope
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-04-add-a-designed-404-envelope/expected/main.stdout.txt`):

```text
GET /a -> 200 a
GET /missing -> 404 {"error":"nope"}
```

### Guard a Route with a Key Check

The starter serves secrets to everyone. Wrap the admin branch in a key check, keep the open route open, and prove the 403 plus the admitted read. Placement is the policy: readers see the guard by reading the composition, not by hunting handlers.

Work in `drilling/code/kata-05-guard-a-route-with-a-key-check/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-05-guard-a-route-with-a-key-check/before/Program.fs`**:

```fsharp
module App // => STARTER: the admin route stands open (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp guards nothing: every route answers everyone.
let webApp: HttpHandler = // => SMELL: /admin serves strangers like friends
    choose [
        route "/open" >=> text "everyone"
        route "/admin" >=> text "holders" // => unguarded: no check anywhere
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: wrap /admin in a key-checking wrapper and prove 403s
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-05-guard-a-route-with-a-key-check/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => gate keeps strangers off the admin branch.
let gate: HttpHandler =
    fun next ctx ->
        task {
            match ctx.TryGetQueryStringValue "key" with
            | Some "s3cr3t" -> return! next ctx // => holders continue
            | _ -> return! (setStatusCode 403 >=> text "forbidden") next ctx // => strangers stop
        }

// => webApp leaves one route open and guards the other.
let webApp: HttpHandler =
    choose [
        route "/open" >=> text "everyone" // => outside the guard
        gate >=> route "/admin" >=> text "holders" // => inside the guard
        setStatusCode 404 >=> text "Not Found" // => misses stay plain
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/open" // => the open route needs nothing
    get client "/admin" // => the guarded route rejects strangers
    get client "/admin?key=s3cr3t" // => the key admits holders
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-05-guard-a-route-with-a-key-check/expected/main.stdout.txt`):

```text
GET /open -> 200 everyone
GET /admin -> 403 forbidden
GET /admin?key=s3cr3t -> 200 holders
```

### Add a Health Endpoint

The starter serves content nobody can probe. Add `/healthz` beside the content route and prove readiness answers while misses stay misses. Fixed, fast, and beside content: the three properties that keep a probe honest.

Work in `drilling/code/kata-06-add-a-health-endpoint/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-06-add-a-health-endpoint/before/Program.fs`**:

```fsharp
module App // => STARTER: no health endpoint at all (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp serves content nobody can probe.
let webApp: HttpHandler = // => SMELL: load balancers cannot see this service
    choose [
        GET >=> route "/app" >=> text "app-ok" // => content with no readiness beside it
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: add /healthz and prove it beside /app
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-06-add-a-health-endpoint/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => webApp answers readiness beside content.
let webApp: HttpHandler =
    choose [
        GET >=> route "/healthz" >=> json {| status = "ok" |} // => the machine-readable readiness
        GET >=> route "/app" >=> text "app-ok" // => content beside health
        setStatusCode 404 >=> text "Not Found" // => misses stay plain
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/healthz" // => the probe answers readiness
    get client "/app" // => content serves beside health
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-06-add-a-health-endpoint/expected/main.stdout.txt`):

```text
GET /healthz -> 200 {"status":"ok"}
GET /app -> 200 app-ok
```

### Move State into a Registered Service

The starter reads a module-level mutable. Move the greeting into a registered singleton, resolve it in the handler, and prove the same answer through the container. Wiring stays production-shaped with one implementation swapped.

Work in `drilling/code/kata-07-move-state-into-a-registered-service/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-07-move-state-into-a-registered-service/before/Program.fs`**:

```fsharp
module App // => STARTER: greeting lives in a module mutable (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => greeting is module state: untestable, unswappable, global.
let mutable greeting = "served-hi" // => SMELL: every test shares this cell

// => webApp reads the global instead of a service.
let webApp: HttpHandler =
    choose [
        route "/hi" >=> fun next ctx ->
            task {
                return! text greeting next ctx // => the global answers
            }
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: move the greeting into a registered singleton service
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-07-move-state-into-a-registered-service/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => HiStore owns the greeting the route serves.
type HiStore() = // => state lives in the container, not the module
    member _.Greeting = "served-hi" // => one fixed greeting to serve
// => webApp reads its greeting from the container.
let webApp: HttpHandler =
    choose [
        route "/hi" >=> fun next ctx ->
            task {
                let store = ctx.GetService<HiStore>() // => the container provides
                return! text store.Greeting next ctx // => the service answers
            }
        setStatusCode 404 >=> text "Not Found" // => other paths miss
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.Services.AddSingleton<HiStore>() |> ignore // => the store outlives every request
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/hi" // => the container-provided greeting
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-07-move-state-into-a-registered-service/expected/main.stdout.txt`):

```text
GET /hi -> 200 served-hi
```

### Wrap the Table in a Timing Wrapper

The starter serves blind with no observation. Wrap the table in a recording wrapper, serve two routes, and report the observation count without printing from the middleware. Verdicts stay on stdout; evidence stays in memory.

Work in `drilling/code/kata-08-wrap-the-table-in-a-timing-wrapper/`: the `before/` starter holds the smell, the `after/` solution holds the fix.

**`drilling/code/kata-08-wrap-the-table-in-a-timing-wrapper/before/Program.fs`**:

```fsharp
module App // => STARTER: no observation anywhere (the smell)

open System.Net.Http
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.TestHost
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open Giraffe

// => webApp serves blind: nobody records what arrived.
let webApp: HttpHandler = // => SMELL: traffic passes without a trace
    choose [
        GET >=> route "/a" >=> text "a"
        GET >=> route "/b" >=> text "b"
        setStatusCode 404 >=> text "Not Found"
    ]

// => buildApp wires the service the checks exercise.
let buildApp (args: string[]) =
    let builder = WebApplication.CreateBuilder(args)
    builder.Logging.ClearProviders() |> ignore
    builder.Services.AddGiraffe() |> ignore
    builder.WebHost.UseTestServer() |> ignore
    let app = builder.Build()
    app.UseGiraffe(webApp) |> ignore
    app

[<EntryPoint>]
let main args =
    let app = buildApp args
    app.StartAsync().GetAwaiter().GetResult()
    use client = app.GetTestClient()
    // => TODO: wrap the table in an observing wrapper and count
    app.StopAsync().GetAwaiter().GetResult()
    0
```

**`drilling/code/kata-08-wrap-the-table-in-a-timing-wrapper/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open System // => String.Join sorts joined output deterministically
open System.Net.Http // => HttpClient drives the service in-process (co-09)
open System.Text // => Encoding names UTF8 for JSON payloads
open System.Threading // => Interlocked and SemaphoreSlim live here (co-07)
open System.Threading.Tasks // => Task.WhenAll fans requests out (co-07)
open Microsoft.AspNetCore.Builder // => WebApplication wires routes to handlers
open Microsoft.AspNetCore.Hosting // => UseTestServer marks the in-memory host
open Microsoft.AspNetCore.Http // => HttpContext carries request and response
open Microsoft.AspNetCore.TestHost // => TestServer serves with no socket (co-09)
open Microsoft.Extensions.DependencyInjection // => AddSingleton registers services (co-06)
open Microsoft.Extensions.Logging // => ClearProviders silences logs (co-13)
open Giraffe // => route, choose, and json live here (co-01)

// => All checks below block on async HTTP with GetAwaiter().GetResult().
// => Main stays synchronous so prints land in request order, and the
// => in-process pipeline answers before the next request leaves.

// => show prints one transcript line with no trailing space.
let show (line: string) = // => every printed line flows through here
    printfn "%s" (line.TrimEnd()) // => TrimEnd keeps empty bodies clean

// => get serves one GET and prints method, path, status, and body.
// => One client drives every check: no per-case construction, no sockets.
let get (client: HttpClient) (path: string) = // => path names the resource
    let resp = client.GetAsync(path).GetAwaiter().GetResult() // => full pipeline runs in-process
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "GET %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line

// => send serves one arbitrary method and prints status with body.
let send (client: HttpClient) (method: string) (path: string) = // => method plus path name the call
    use request = new HttpRequestMessage(HttpMethod(method), path) // => no body on these calls
    use resp = client.SendAsync(request).GetAwaiter().GetResult() // => the pipeline answers in memory
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => empty for HEAD and redirects
    show (sprintf "%s %s -> %d %s" method path (int resp.StatusCode) (body.Trim())) // => one line per call

// => postJson serves one JSON POST and prints status with body.
let postJson (client: HttpClient) (path: string) (payload: string) = // => payload is already JSON text
    use content = new StringContent(payload, Encoding.UTF8, "application/json") // => UTF8 names the charset
    use resp = client.PostAsync(path, content).GetAwaiter().GetResult() // => the handler reads the body
    let body = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult() // => the exact bytes written
    show (sprintf "POST %s -> %d %s" path (int resp.StatusCode) (body.Trim())) // => status plus body in one line
// => seen08 records the requests the wrap observes.
let seen08 = System.Collections.Generic.List<string>() // => arrival order, no timings
// => watch08 observes without changing answers.
let watch08: HttpHandler =
    fun next ctx ->
        task {
            seen08.Add(ctx.Request.Method + " " + ctx.Request.Path.ToString()) // => the line lands in memory
            return! next ctx // => answers pass through untouched
        }

// => webApp watches the whole table through one wrapper.
let webApp: HttpHandler =
    watch08 >=> choose [ // => every branch below is observed
        GET >=> route "/a" >=> text "a" // => first observed route
        GET >=> route "/b" >=> text "b" // => second observed route
        setStatusCode 404 >=> text "Not Found" // => misses are observed too
    ]
// => buildApp wires the service every check in this unit exercises.
let buildApp (args: string[]) = // => args carry no flags in this course
    let builder = WebApplication.CreateBuilder(args) // => defaults plus our overrides
    // => Silenced logs keep stdout to printed lines only: golden transcripts
    // => must never contain framework chatter.
    builder.Logging.ClearProviders() |> ignore // => no log lines: only our prints appear
    // => Giraffe's JSON serializer lives in DI: without AddGiraffe the first
    // => json answer throws MissingDependencyException at runtime.
    builder.Services.AddGiraffe() |> ignore // => Giraffe needs its serializer in DI
    builder.WebHost.UseTestServer() |> ignore // => in-memory server: no socket, no port
    let app = builder.Build() // => the pipeline with routing and endpoints
    app.UseGiraffe(webApp) |> ignore // => every request flows through webApp
    app // => hand the wired service back to the caller
// => Top-level entry: build once, check, stop cleanly.
[<EntryPoint>] // => the harness runs the compiled assembly
let main args = // => every unit answers zero on success
    let app = buildApp args // => wiring separate from traffic, as always
    // => StartAsync boots the in-memory host: no socket binds, no port opens,
    // => yet every middleware and route runs exactly as in production.
    app.StartAsync().GetAwaiter().GetResult() // => TestServer starts without any socket
    use client = app.GetTestClient() // => client talks to memory, not the network
    get client "/a" // => the first observation lands
    get client "/b" // => the second observation lands
    show (sprintf "observed=%d" seen08.Count) // => the wrap proves its coverage
    // => StopAsync drains in-flight requests before releasing the host, so the
    // => checks above always land before the process exits.
    app.StopAsync().GetAwaiter().GetResult() // => stop cleanly: nothing in flight is cut (co-08)
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-08-wrap-the-table-in-a-timing-wrapper/expected/main.stdout.txt`):

```text
GET /a -> 200 a
GET /b -> 200 b
observed=2
```

## Self-check checklist

Answer honestly: every line you cannot check names the example to rework. A checked line means you can do it, not that you have read about it. Revisit unchecked lines by rebuilding the example from an empty file, not by rereading the page — doing rebuilds the skill, reading only refreshes the memory.

- [ ] Register a route with a typed capture and predict the 404 for a wrong-typed segment before running.
- [ ] Read an optional query value with its default and state what absence means for that route.
- [ ] Pair every body reader with its method filter and explain what breaks without the pairing.
- [ ] Set a status before its body and name what each of 200, 201, 202, and 404 tells the client.
- [ ] Serve a 201 with a Location header the checks follow instead of constructing the address.
- [ ] Build one error helper or envelope branch and route two different failures through it.
- [ ] Redirect an old address with the correct permanence flag and print the bare 302.
- [ ] Compose a route table from named handler values without an inline lambda in the table.
- [ ] Wrap a table in a stamping wrapper and read the stamp back through the client's eyes.
- [ ] Short-circuit a guarded branch with 403 and prove the open branch never needed the key.
- [ ] Draw the onion order from a printed journal without rereading the composition.
- [ ] Register an error handler and prove the neighbor still serves after a throw.
- [ ] Fill a bodiless error status through re-execution and prove bodied answers pass untouched.
- [ ] Record method plus path for every request including misses, silently.
- [ ] Register a singleton and prove sharing by reading the total back after two ticks.
- [ ] Resolve a scoped service twice and prove isolation from the differing numbers.
- [ ] Inject an options record and change behavior by editing data, not the route.
- [ ] Pin time behind an interface and serve the fixed instant instead of wall-clock time.
- [ ] Drive a miss, a validation failure, and a throw through one in-process table.
- [ ] Assert status plus exact body for a hit and its envelope, in one verdict per route.
- [ ] Number shared hits atomically and state why ordering is never asserted.
- [ ] Bound entries with a semaphore and shed with 429 when Wait(0) finds nothing.
- [ ] Flip readiness before stopping and prove probes shed while traffic still serves.
- [ ] Compare one design against FastAPI with a cited, honest difference in each direction.

## Elaborative interrogation & self-explanation

Answer in writing, in your own words, without opening the examples. A complete answer names the mechanism, the reason, and the failure it prevents. Trade answers with a partner when you can: explaining aloud exposes the gaps that silent reading hides, and the questions are designed to reward mechanism over vocabulary. Keep a miss log with example numbers; patterns in the log reveal which level to rework next. A second pass over the same questions should feel boring; boredom means the recall is automatic. Two consecutive clean passes retire the question from the rotation until the capstone review.

### I1: Why does this course put method filters on read routes even when the table holds no POST? Explain what a future POST would do to an unfiltered read, and who pays for the missing filter

### I2: Why do checks block on async calls with `GetAwaiter().GetResult()` instead of awaiting? Explain what ordered prints need, what Main cannot do, and where awaiting belongs instead

### I3: Why do golden transcripts forbid timings, thread ids, and dictionary orders? Explain which recorded values stay (statuses, bodies, counts) and what makes a value transcript-safe

### I4: Why does the course teach Result-matching at the edge while admitting exceptions win at depth? Explain the distance rule in your own service: which of your failures decide near, and which propagate far

### I5: Why does validation live between binding and success rather than inside either? Explain what binding guarantees, what rules add, and what breaks when the two mix

### I6: Why do reviews compose old skills instead of teaching new ones? Explain what a review that introduces a mechanism would break, and what recombination proves that examples alone cannot
