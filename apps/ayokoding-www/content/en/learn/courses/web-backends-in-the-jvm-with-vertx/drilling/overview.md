---
title: Overview
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns the sixteen concepts into durable skill: recall questions that force definitions from memory, applied problems that rehearse real incidents, code katas that rebuild the motions by hand, a self-check checklist that audits readiness honestly, and elaborative prompts that connect each choice to its rejected alternative. Work the sections in order, and do not peek at answers before attempting the recall.

## Recall Q&A

### Q1 (co-01): What is a route, and what two halves pick the handler?

<details>
<summary>Model answer</summary>

A route maps one HTTP method plus one path to one handler, and the pair of method and path picks the handler. GET /hello and POST /hello are different routes with different handlers, even though the path matches. The router tries registered routes in order and runs the first whose method and path both match, so Examples 1 and 4 prove dispatch reads as a table rather than branching inside handlers.

</details>

### Q2 (co-01): Why do path parameters beat per-resource routes?

<details>
<summary>Model answer</summary>

Because one parameterized route serves every resource while the table stays fixed, as Example 2 shows with /users/:id answering both 42 and 7. Per-resource routes would multiply the table with the data, forcing a code change for every new resource and inviting copy-paste drift between nearly identical handlers. The colon declares the variable segment once, and pathParam reads whatever value the request carried.

</details>

### Q3 (co-02): What is middleware, and how does next() compose a chain?

<details>
<summary>Model answer</summary>

Middleware is a handler registered without a path, so it runs for every request before route handlers do, and next() passes control down the chain, as Examples 26 and 27 prove. Each middleware either ends the response or calls next(), which runs the following link; without the call the chain stops. Registration order is execution order, so auth before logging reads top to bottom and the visit log pins the sequence.

</details>

### Q4 (co-02): Why must parsing be installed as middleware instead of assumed?

<details>
<summary>Model answer</summary>

Because Vert.x reads no body unless a BodyHandler is installed, as Example 28 proves with the blind router seeing zero bytes. Explicit installation keeps routes that never asked for bodies cheap and total, while body routes declare their need in one place. Placement is also control: per-route installation parses once for one path, while global installation parses for every route below it.

</details>

### Q5 (co-03): Where do query values, headers, and bodies each arrive from?

<details>
<summary>Model answer</summary>

Query values arrive from queryParam with defaults for the omitted, headers arrive from getHeader with defaults for the absent, and bodies arrive from ctx.body() after the BodyHandler decodes them, as Examples 3, 10, and 11 show. Each source has its own reader because each travels differently: strings in the URL, metadata beside the content, bytes decoded once. The handler converts all three to typed values at the boundary.

</details>

### Q6 (co-03): Why do defaults beat branches for optional values?

<details>
<summary>Model answer</summary>

Because defaulting helpers keep handlers single-pathed instead of forked on presence, as Examples 9 and 17 prove with limit and language defaults. One straight path from request to response is trivially reviewable, while present-versus-absent branches double every behavior below them. Defaults declared at the read site also document the contract executably, so callers learn that omitting a filter means the whole list.

</details>

### Q7 (co-04): What does the status code promise before the body is read?

<details>
<summary>Model answer</summary>

The status code promises the outcome class: 201 means a resource was created, 204 means success with nothing to show, 404 means the resource is absent, as Example 18 proves. Caches, retries, and monitors all read codes first, so precise codes propagate correct behavior to layers that never parse the payload. Handlers set the code explicitly instead of leaving every answer at 200, because the code is the API's first verb.

</details>

### Q8 (co-04): Why must every reply wear the same envelope?

<details>
<summary>Model answer</summary>

Because clients parse faster when successes answer data and failures answer error in one uniform shape, as Examples 19 and 22 prove with one helper building every reply. Uniform envelopes collapse client parsing to one deserializer with a status branch, instead of per-route guessing about bare values that change type. New failures inherit the contract automatically when they share the builder.

</details>

### Q9 (co-05): Which failures answer 400, 404, 422, and 500?

<details>
<summary>Model answer</summary>

Malformed bytes answer 400 because the sender broke the syntax, as Example 13 proves; absent resources answer 404 because the lookup missed, as Example 6 proves; present-but-invalid bodies answer 422 because the content fails the rules, as Example 14 proves; and uncaught throws answer 500 because the service broke, as Example 30 proves. The code assigns blame precisely: caller syntax, caller address, caller content, or service fault.

</details>

### Q10 (co-05): Why do failure handlers beat try-catch inside handlers?

<details>
<summary>Model answer</summary>

Because failure handlers shape every failure in one contract while try-catch litters translation across handlers, as Examples 30 through 32 prove with global, local, and per-status catchers. Throws and fail() calls route to the failure chain automatically, so handlers stay focused on the happy path while catchers own the wording. Per-route catchers override the global one, which lets sensitive failures speak carefully without duplicating the fallback.

</details>

### Q11 (co-06): What travels through a builder's parameters?

<details>
<summary>Model answer</summary>

Every service the routes need travels through the builder's parameters: stores, counters, clocks, configs, and repositories, as Examples 35 through 44 prove. Parameters make dependencies reviewable and replaceable, because the signature names exactly what each route needs. The composition root builds every service once and hands them in, so main reads as a parts list and tests swap fakes without touching routes.

</details>

### Q12 (co-06): Why do handlers program to seams instead of implementations?

<details>
<summary>Model answer</summary>

Because interfaces let handlers accept any implementation, including fakes that answer on rails, as Examples 38, 40, and 43 prove with counters, repositories, and error translation. Seams keep handlers honest about exactly what they use, and storage swaps behind unchanged interfaces when the map becomes a database. Translation at the handler edge also keeps services free of HTTP vocabulary, so the same service serves new transports.

</details>

### Q13 (co-07): When must work leave the event loop?

<details>
<summary>Model answer</summary>

Whenever work blocks or computes long enough to stall other requests, it must move to a worker pool or worker verticle, as Examples 54 through 56 prove with fast handlers, executeBlocking, and bus-offloaded math. The event loop serves thousands of overlapping requests only while every handler returns quickly, so one blocking call freezes the whole service. Shared numbers additionally need atomics, because handlers run on many loop threads at once.

</details>

### Q14 (co-07): Why do summaries replace timings in load assertions?

<details>
<summary>Model answer</summary>

Because timings wobble between runs and golden files cannot hold them, while counts hold everywhere, as Examples 54, 57, 58, and 61 prove with outcome summaries. Requests, ok, and failed capture the behavior that matters — did everything answer correctly under overlap — while milliseconds capture the machine, which tests must never assert. Stable numbers run green on laptops and CI alike.

</details>

### Q15 (co-08): What order does graceful shutdown follow, and why?

<details>
<summary>Model answer</summary>

Client first so no new requests start, server next after the in-flight count reaches zero so nothing accepted is cut, runtime last so nothing runs without its loop, as Examples 62 and 66 prove with the drain counter and the printed teardown order. Close completes each step before the next begins, because overlapping shutdown paths compose only when every close is idempotent, which Example 70 proves with double closes.

</details>

### Q16 (co-08): Why do verticles promise their routes?

<details>
<summary>Model answer</summary>

Because deployment completes only when start's promise does, so callers never see a half-started service, as Example 67 proves by binding inside start and checking only after deploy. Stop reverses the promise by closing the server before undeploy completes, as Example 68 proves with the reachable flip. Promises turn lifecycle ordering into a value the deployer awaits instead of a race the tests hope to win.

</details>

### Q17 (co-09): What makes a test in-process without a real network?

<details>
<summary>Model answer</summary>

The program starts its own server on a system-assigned loopback port, drives it with the web client from the same JVM, prints one golden line per request, and shuts down cleanly, as all seventy-eight examples prove. Port zero keeps fixed ports out of every test, while stderr stays ignored so framework logging never pollutes the transcript. Real HTTP travels the loopback wire with status lines, headers, and bodies, so the suite proves the wire contract.

</details>

### Q18 (co-09): Why do tables beat copies for test coverage?

<details>
<summary>Model answer</summary>

Because rows name request plus expectation while one loop drives them all through one helper, as Examples 46 and 50 prove with path tables and validation tables. New behavior appends one row instead of copying a whole test, so coverage grows in seconds and reviewers read the matrix instead of tracing copies. Tables also pin fallbacks and rejections beside happy paths, which copy-paste suites leave to rot.

</details>

### Q19 (co-10): In what order must validation gates run?

<details>
<summary>Model answer</summary>

Presence first, then type, then range, cheapest first, as Examples 14, 15, and 76 prove with layered guards. Each gate answers the same 422 envelope so clients learn one error contract, and each names the next check's precondition so failures read in order. Malformed bytes additionally answer 400 before any gate runs, because syntax precedes content and the decode failure is the caller's first fix.

</details>

### Q20 (co-11): What does mounting buy over repeated prefixes?

<details>
<summary>Model answer</summary>

Mounting supplies the shared prefix once at the mount line, so handlers inside the group declare short paths, as Examples 5 and 37 prove with the /api group and the two-service table. Versioning and relocating become one mount edit instead of find-and-replace across dozens of path strings. Groups also stay testable alone, because the sub-router serves its short paths without the prefix during focused tests.

</details>

### Q21 (co-12): How does one route serve JSON and text?

<details>
<summary>Model answer</summary>

By reading the Accept header and branching tongues in one handler, defaulting to JSON when the caller names nothing, as Examples 23 and 25 prove with negotiation and the HTML page. The content type is set explicitly per branch, so machines parse JSON while humans read text from the same path. One route serving both tongues keeps fixes in one place for every consumer.

</details>

### Q22 (co-13): What belongs in a structured log line, and what never does?

<details>
<summary>Model answer</summary>

Method, path, and status belong, because operators query those facts per request, while timestamps, thread names, and timings never do, because clocks and pools differ between runs, as Example 33 proves with its two-line journal. One JSON object per line at response end keeps the log machine-parseable and the tests deterministic. Facts only is the rule that lets logs double as golden output.

</details>

### Q23 (co-14): Why must the probe avoid business logic?

<details>
<summary>Model answer</summary>

Because the probe must answer readiness without exercising anything that can fail for business reasons, as Examples 63 and 64 prove with the fixed flag and the flipping flag. Balancers need exactly one signal — route traffic here or shed it — so the probe reads a per-request flag and answers 200 or 503. Tying health to logic would turn every business bug into a traffic shed, which confuses liveness with correctness.

</details>

### Q24 (co-15): How do records fix the boundary?

<details>
<summary>Model answer</summary>

By building a typed record from the body at the edge, so later code reads compiler-checked accessors instead of stringly keys, as Examples 41 and 74 prove with frozen clocks and Gadget records. Types move shape drift from 3 AM runtime failures to build-time errors, because a renamed field breaks the record construction immediately. Constructor injection of configs and clocks behind seams extends the same typing to time and policy.

</details>

## Applied problems

Applied problems rehearse incidents you will meet in production: each names the symptom, constrains the fix to the course's idioms, and points at the worked model to follow. Solve on paper or in a scratch file first, then compare against the referenced example before touching the katas.

### P1: The 500 that should have been a 422

Production logs show a spike of 500s from the gadget creation route, and the payloads all miss the name field. The handler reads getString with a default and builds anyway, so storage fills with unnamed gadgets while monitors page the team. Add a presence gate that rejects the missing name with 422 in the error envelope before any logic runs, then table-test the valid, missing, and out-of-range bodies. The guards in Examples 14 and 50 are the worked models.

### P2: The event loop that froze at noon

Latency jumps to seconds every day at noon when the report job calls the slow endpoint, and every other route freezes with it. The handler sleeps on the event loop while it waits for the legacy export. Move the blocking work into executeBlocking so the loop stays free, then burst the endpoint with eight concurrent calls and assert the outcome summary instead of timings. Count the 200s; never print milliseconds. The offload in Example 55 is the worked model.

### P3: The deploy that answered 404s for a minute

Rolling deploys answer 404 for unknown paths that used to exist, because renamed routes dropped the old addresses and the balancer kept sending traffic during the swap. Operators ask for graceful removal: keep the old paths answering redirects for one release while readiness gates the new instance. Add the redirect pointers from Example 7 beside the renamed routes, assert each 302 with its Location header, and flip the readiness flag from Example 64 only after startup completes and the first probe answers 200.

### P4: The client that cannot parse failures

The mobile client crashes on every error because failures arrive as framework HTML while successes arrive as JSON, and the parser handles exactly one shape. Wrap every failure in the shared error envelope with code and message, including the 404 fallback and the validation gates, so one deserializer serves the whole API. Prove the lookup, the validation, and the fallback each wear the envelope with their own code. The envelope helper from Examples 19 and 22 is the worked model.

### P5: The test that passed alone and failed in CI

The creation test passes locally but fails in CI every third run, because it dials a fixed port that another job sometimes holds. Convert the suite to system-assigned ports read back from the bind, drive every check through the in-process web client, and print summaries without timings. Run the suite twice in a row to prove repeatability, then assert both passes read identical. The port discipline from Example 1 and the summary discipline from Example 61 are the worked models.

### P6: The midnight write that lost three orders

Three of thirty-two concurrent orders vanished during the sale, and the store is a plain map behind the service. Replace it with a concurrent map plus atomic ids, then burst thirty-two overlapping posts and assert posted equals stored. Repeat the burst three times and require identical summaries, since a race that survives once may still fail on repetition. The thread-safe store from Example 57 is the worked model, and the atomic counting from Example 58 explains why the plain counter lost updates across loop threads.

### P7: The browser that the API refuses

The new dashboard cannot call the API because browsers block the cross-origin reads while curl works fine, and preflight receives no stamps at all. Add the CORS middleware that stamps allow-origin, allow-methods, and allow-headers on every answer and ends preflight with 204, then assert all three stamps on real calls and both critical stamps on preflight. Add the origin header browsers send, since curl without it never exercises the gate. The stamps in Example 34 are the worked model.

### P8: The rollback that shipped both versions at once

The failed deploy needs reversal, but undeploy alone left the old server answering because stop never closed it, so two versions served together for an hour. Close the exact server inside stop so the port frees before undeploy completes, then prove reachable flips to unreachable with a fresh client that owns no pooled connections. Verify the flip twice, since a stale keep-alive can fake one passing probe. The lifecycle from Examples 67 and 68 is the worked model.

## Code katas

Eight katas rebuild the course motions by hand. Each kata ships a `before/` starter with a `todo` to replace and an `after/` solution the harness runs; the lesson embeds both so the gap between them is the exercise.

### Kata 1: Add request validation that rejects a malformed body

Validation is a skill separate from routing: the presence gate and the range gate must hold before storage ever runs. This kata replays the guard pattern from Example 14 so the motion becomes reflex. Replace the todo with the guarded creation, then prove the valid body passes while the missing name and the out-of-range watts each fail with 422.

- Starter: `drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/before/Starter.java`
- Solution: `drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/after/Solution.java`

**`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/before/Starter.java`**:

```java
// Starter: Add Request Validation That Rejects a Malformed Body. The smell: a creation route that trusts every byte.
// Validation is a skill separate from routing: presence and range gates must hold before storage ever runs. This kata replays the guard pattern from Example 14 so the motion becomes reflex.
// Your solution validates the gadget body, rejects the missing name and the out-of-range watts, then prints one verdict per case.
// Your task: Add the presence gate and the range gate, then print PASS or FAIL for the three bodies.
public class Starter {

  // => the shape to keep: middleware, guard, create
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the guarded creation
  } // => main ends: the kata is done when todo is gone
}
// fix me: Add the presence gate and the range gate, then print PASS or FAIL for the three bodies.
```

**`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/after/Solution.java`**:

```java
// Kata 1: Add Request Validation That Rejects a Malformed Body.
// Validation is a skill separate from routing: presence and range gates
// must hold before storage ever runs. This kata replays the guard pattern
// from Example 14 so the motion becomes reflex.
// (Concepts: co-05, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Solution {

  // buildRouter wires the service with one guarded creation.
  // The guards run cheapest first: presence, then range, then creation.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus the guarded route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: the guards read the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Presence first: a missing name stops the handler with 422.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded, possibly invalid
      // A missing name stops here: storage never sees half a gadget.
      if (!body.containsKey("name")) { // => presence, not value, is the question
        ctx.response()
          .setStatusCode(422) // => 422 names an unprocessable body
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":422,\"message\":\"name is required\"}}"); // => what to fix, in the contract
        return; // => the handler is done: the gate held
      }
      int watts = body.getInteger("watts", 0); // => 0 when absent: absent is out of bounds
      // Range second: watts outside 1..1000 stop here too.
      if (watts < 1 || watts > 1000) { // => business rule, checked before logic
        ctx.response()
          .setStatusCode(422) // => 422 again: still the caller's fix
          .putHeader("content-type", "application/json") // => the body stays JSON
          .end("{\"error\":{\"code\":422,\"message\":\"watts must be 1..1000\"}}"); // => the bound, in the contract
        return; // => the handler is done: the gate held
      }
      ctx.response()
        .setStatusCode(201) // => 201 names the creation
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("name", body.getString("name")).put("watts", watts).encode()); // => the gated gadget
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one body in-process and prints PASS when the status holds.
  // Three bodies, three gates: the verdicts prove the guards fire.
  static int check(WebClient client, int port, String label, String payload, int expected, int passed) throws Exception {
    // The payload travels as JSON: presence and range decide the status.
    var response = client.post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the row's body
      .toCompletionStage().toCompletableFuture().join(); // => the guards answer, then logic
    int actual = response.statusCode(); // => the guards' verdict for this row
    // equals() decides: the golden line pins the verdict per row.
    if (actual == expected) { // => the passing branch this kata prints
      System.out.println("PASS " + label + " -> " + actual); // => Output: PASS valid -> 201
      return passed + 1; // => the win is counted
    }
    System.out.println("FAIL " + label + ": expected " + expected + " but got " + actual); // => unreachable here, by design
    return passed; // => failures do not advance the count
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every row
    int passed = 0; // => the wins, counted verdict by verdict
    passed = check(client, port, "valid", "{\"name\":\"drill\",\"watts\":40}", 201, passed); // => passes every gate
    passed = check(client, port, "missing-name", "{\"watts\":40}", 422, passed); // => fails the presence gate
    passed = check(client, port, "watts-high", "{\"name\":\"drill\",\"watts\":1001}", 422, passed); // => fails the range gate
    // The summary is the kata's gold: wins over total, no timings.
    System.out.println("kata ok=" + passed + " failed=" + (3 - passed)); // => Output: kata ok=3 failed=0
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-01-add-request-validation-that-rejects-a-malformed-body/expected/main.stdout.txt`):

```text
PASS valid -> 201
PASS missing-name -> 422
PASS watts-high -> 422
kata ok=3 failed=0
```

### Kata 2: Convert a blocking call into the framework's async idiom

Blocking the loop freezes every request, and the fix is one wrapper: executeBlocking moves the slow work to a worker pool while the handler resumes on success. This kata replays the offload from Example 55 so the motion becomes reflex. Wrap the sleep, serve four concurrent calls, then print the outcome summary.

- Starter: `drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/before/Starter.java`
- Solution: `drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/after/Solution.java`

**`drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/before/Starter.java`**:

```java
// Starter: Convert a Blocking Call into the Framework's Async Idiom. The smell: a sleep sitting on the event loop.
// Blocking the loop freezes every request, and the fix is one wrapper: executeBlocking moves the slow work to a
// worker pool while the handler resumes on success. This kata replays the offload from Example 55 so the motion becomes reflex.
// Your solution wraps the sleep, serves four concurrent calls, then prints the outcome summary.
// Your task: Move the slow work into executeBlocking, then print slow=4 ok=4 for the burst.
public class Starter {

  // => the shape to keep: wrap, resume, summarize
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the offloaded burst
  } // => main ends: the kata is done when todo is gone
}
// fix me: Move the slow work into executeBlocking, then print slow=4 ok=4 for the burst.
```

**`drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/after/Solution.java`**:

```java
// Kata 2: Convert a Blocking Call into the Framework's Async Idiom.
// Blocking the loop freezes every request, and the fix is one wrapper:
// executeBlocking moves the slow work to a worker pool while the handler
// resumes on success. This kata replays the offload from Example 55 so
// the motion becomes reflex.
// (Concepts: co-02, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class Solution {

  // buildRouter wires the service with one deliberately slow route.
  // The sleep stands in for blocking work: JDBC, files, legacy APIs.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the slow route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // executeBlocking borrows a worker thread: the loop stays free.
    // ordered=true keeps this route's calls in arrival order.
    router.get("/slow").handler(ctx -> ctx.vertx().executeBlocking(() -> {
      Thread.sleep(50); // => the stand-in for blocking work: never on the loop
      return "done"; // => the slow answer, computed off-loop
    }, true).onSuccess(value -> ctx.response()
      .putHeader("content-type", "application/json") // => the body is JSON
      .end("{\"slow\":\"" + value + "\"}"))); // => 200 after the slow work finishes
    // Hand the wired table back to the caller.
    return router;
  }

  // check fires the concurrent burst and prints the outcome summary.
  // Slow but parallel: the pool carries what the loop must not.
  static void check(WebClient client, int port, int total) throws Exception {
    // One future per request: four slow calls overlap on the pool.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per request
    // Sending from the main thread is safe: the client owns its pool.
    for (int i = 0; i < total; i++) { // => four concurrent slow calls
      flights.add(client.request(HttpMethod.GET, port, "127.0.0.1", "/slow") // => the slow route under load
        .send().toCompletionStage().toCompletableFuture() // => the future completes on answer
        .thenApply(response -> response.statusCode())); // => the code is the only fact kept
    }
    // allOf waits for every flight: the summary covers the whole burst.
    CompletableFuture.allOf(flights.toArray(new CompletableFuture[0])).join(); // => every slow call answered
    long ok = flights.stream().filter(future -> future.join() == 200).count(); // => 4 when the pool kept up
    // The summary replaces timings: outcomes, not milliseconds.
    System.out.println("slow=" + total + " ok=" + ok); // => Output: slow=4 ok=4
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server; the pool carries the slow work.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one pooled client serves the burst
    check(client, port, 4); // => Output: slow=4 ok=4
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-02-convert-a-blocking-call-into-the-frameworks-async-idiom/expected/main.stdout.txt`):

```text
slow=4 ok=4
```

### Kata 3: Write an in-process test for a new route

Untested routes rot: the fix is one verdict table that asserts status plus a body fragment for the new route and the old ones. This kata replays the suite pattern from Example 77 so the motion becomes reflex. Table-test the new /version route beside /hello, then print one verdict per row.

- Starter: `drilling/code/kata-03-write-an-in-process-test-for-a-new-route/before/Starter.java`
- Solution: `drilling/code/kata-03-write-an-in-process-test-for-a-new-route/after/Solution.java`

**`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/before/Starter.java`**:

```java
// Starter: Write an In-Process Test for a New Route. The smell: a version route with no test pinning it.
// Untested routes rot: the fix is one verdict table that asserts status plus a body fragment for the new route and the
// old ones. This kata replays the suite pattern from Example 77 so the motion becomes reflex.
// Your solution table-tests the new /version route beside /hello, then prints one verdict per row.
// Your task: Add the /version row to the table, then print PASS for both rows.
public class Starter {

  // => the shape to keep: table, loop, verdicts
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the table-driven suite
  } // => main ends: the kata is done when todo is gone
}
// fix me: Add the /version row to the table, then print PASS for both rows.
```

**`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/after/Solution.java`**:

```java
// Kata 3: Write an In-Process Test for a New Route.
// Untested routes rot: the fix is one verdict table that asserts status
// plus a body fragment for the new route and the old ones. This kata
// replays the suite pattern from Example 77 so the motion becomes reflex.
// (Concepts: co-04, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // Case names one row of the in-process suite: request plus expectation.
  // Records carry cases: the loop below reads each field by name.
  record Case(String method, String path, int expected, String fragment) { // => one row: what to send, what to expect
  }

  // buildRouter wires the old greeting plus the new version route.
  // The new route is the kata: it ships with its own test row.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the old route plus the new one follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The old route keeps its answer: the suite pins it against drift.
    router.get("/hello").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body is JSON
      .end("{\"message\":\"hello, vertx\"}")); // => 200 plus the greeting contract
    // The new route answers the build stamp: the kata's subject.
    router.get("/version").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the stamp is JSON too
      .end("{\"version\":\"1.0.0\"}")); // => 200 with the build stamp
    // Hand the wired table back to the caller.
    return router;
  }

  // check drives one suite row through the real client and prints a verdict.
  // Status and fragment must both hold: the verdict names which failed.
  static void check(WebClient client, int port, Case kase) throws Exception {
    // A loopback request, no test double: headers and bodies travel for real.
    var response = client.request(HttpMethod.valueOf(kase.method()), port, "127.0.0.1", kase.path()) // => the row's request
      .send().toCompletionStage().toCompletableFuture().join(); // => the route answers in-process
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // Status and fragment must both hold: the row passes only when both do.
    boolean holds = response.statusCode() == kase.expected() // => 200 for both rows here
      && text != null && text.contains(kase.fragment()); // => the fragment proves the right route answered
    // One verdict per row: the row passes only when both halves hold.
    if (holds) { // => the passing branch this kata prints
      System.out.println("PASS " + kase.method() + " " + kase.path() + " -> " + response.statusCode()); // => Output: PASS GET /hello -> 200
    } else {
      System.out.println("FAIL " + kase.method() + " " + kase.path() + ": got " + response.statusCode()); // => unreachable here, by design
    }
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one real client serves the suite
    // The suite: the old route plus the new row this kata adds.
    Case[] cases = { // => rows, not code: coverage grows by appending
      new Case("GET", "/hello", 200, "hello"), // => the old route, pinned
      new Case("GET", "/version", 200, "1.0.0"), // => the new row: the kata's proof
    };
    // One loop drives every row: the helper stays untouched as rows grow.
    for (Case kase : cases) { // => old, then new
      check(client, port, kase); // => prints one verdict per row
    }
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-03-write-an-in-process-test-for-a-new-route/expected/main.stdout.txt`):

```text
PASS GET /hello -> 200
PASS GET /version -> 200
```

### Kata 4: Gate a route behind a token

Private routes need a gate: a middleware that ends anonymous requests with 401 before the handler ever runs. This kata replays the token gate from Example 29 so the motion becomes reflex. Open /public, gate /private/notes, then print 200 for the token holder and 401 for the anonymous caller.

- Starter: `drilling/code/kata-04-gate-a-route-behind-a-token/before/Starter.java`
- Solution: `drilling/code/kata-04-gate-a-route-behind-a-token/after/Solution.java`

**`drilling/code/kata-04-gate-a-route-behind-a-token/before/Starter.java`**:

```java
// Starter: Gate a Route Behind a Token. The smell: a private route that trusts anonymous callers.
// Private routes need a gate: a middleware that ends anonymous requests with 401 before the handler ever runs.
// This kata replays the token gate from Example 29 so the motion becomes reflex.
// Your solution opens /public, gates /private/notes, then prints one line per check.
// Your task: Add the gate middleware, then print 200 for the token holder and 401 for the anonymous caller.
public class Starter {

  // => the shape to keep: open route, gate, gated route
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the gated service
  } // => main ends: the kata is done when todo is gone
}
// fix me: Add the gate middleware, then print 200 for the token holder and 401 for the anonymous caller.
```

**`drilling/code/kata-04-gate-a-route-behind-a-token/after/Solution.java`**:

```java
// Kata 4: Gate a Route Behind a Token.
// Private routes need a gate: a middleware that ends anonymous requests
// with 401 before the handler ever runs. This kata replays the token gate
// from Example 29 so the motion becomes reflex.
// (Concepts: co-02, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // buildRouter wires the service with a gate plus two routes.
  // The gate runs before the private route only: public stays open.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one open route, one gate, one gated route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Open by design: no middleware runs before this handler.
    router.get("/public").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body is JSON
      .end("{\"open\":true}")); // => 200 for everyone, token or not
    // The gate ends anonymous requests here: gated handlers trust the caller.
    router.route("/private/*").handler(ctx -> {
      String auth = ctx.request().getHeader("authorization"); // => null when anonymous
      // Only the exact token passes: anything else is anonymous by definition.
      if (!"Bearer s3cret".equals(auth)) { // => constant first: null-safe by construction
        ctx.response()
          .setStatusCode(401) // => 401 names the missing credential
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":401,\"message\":\"token required\"}}"); // => what to fix, in the contract
        return; // => no next(): the gated handler never runs
      }
      ctx.next(); // => the token held: the gated handler runs next
    });
    // Anonymous callers never reach this line: the gate ended them above.
    router.get("/private/notes").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body stays JSON
      .end("{\"notes\":[]}")); // => 200 for token holders only
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request with or without a token and prints its line.
  // The token rides the header: presence decides the branch.
  static void check(WebClient client, int port, String target, String token) throws Exception {
    // The request carries the token under test, or none when token is null.
    var request = client.request(HttpMethod.GET, port, "127.0.0.1", target); // => GET names the verb under test
    // Null means anonymous: the 401 branch is asserted, not just the happy one.
    if (token != null) { // => one branch sends a token, one stays anonymous
      request.putHeader("authorization", token); // => the credential under test
    }
    // The full pipeline runs, then answers: gate, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: the path, the token sent, the status, and the body.
    System.out.println("GET " + target + " token=" + token + " -> " + response.statusCode() + " " + text); // => Output: GET /private/notes token=null -> 401 {...}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "/public", null); // => Output: GET /public token=null -> 200 {"open":true}
    check(client, port, "/private/notes", null); // => Output: GET /private/notes token=null -> 401 {"error":{"code":401,"message":"token required"}}
    check(client, port, "/private/notes", "Bearer s3cret"); // => Output: GET /private/notes token=Bearer s3cret -> 200 {"notes":[]}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-04-gate-a-route-behind-a-token/expected/main.stdout.txt`):

```text
GET /public token=null -> 200 {"open":true}
GET /private/notes token=null -> 401 {"error":{"code":401,"message":"token required"}}
GET /private/notes token=Bearer s3cret -> 200 {"notes":[]}
```

### Kata 5: Add a health-check endpoint

Balancers need one question answered: readiness stays a separate route with a fixed shape, never tangled with business logic. This kata replays the probe from Example 63 so the motion becomes reflex. Serve /healthz beside /hello, then print 200 with the flag for the probe.

- Starter: `drilling/code/kata-05-add-a-health-check-endpoint/before/Starter.java`
- Solution: `drilling/code/kata-05-add-a-health-check-endpoint/after/Solution.java`

**`drilling/code/kata-05-add-a-health-check-endpoint/before/Starter.java`**:

```java
// Starter: Add a Health-Check Endpoint. The smell: a service with no readiness probe.
// Balancers need one question answered: readiness stays a separate route with a fixed shape, never tangled with business
// logic. This kata replays the probe from Example 63 so the motion becomes reflex.
// Your solution serves /healthz beside /hello, then prints one line per check.
// Your task: Add the probe route, then print 200 {"status":"ok"} for the probe.
public class Starter {

  // => the shape to keep: business route, probe route
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the service plus probe
  } // => main ends: the kata is done when todo is gone
}
// fix me: Add the probe route, then print 200 {"status":"ok"} for the probe.
```

**`drilling/code/kata-05-add-a-health-check-endpoint/after/Solution.java`**:

```java
// Kata 5: Add a Health-Check Endpoint.
// Balancers need one question answered: readiness stays a separate route
// with a fixed shape, never tangled with business logic. This kata replays
// the probe from Example 63 so the motion becomes reflex.
// (Concepts: co-01, co-14.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // buildRouter wires one business route plus the readiness probe.
  // Probes stay separate: balancers read health without exercising logic.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: business plus probe follow on separate paths.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The business route answers the greeting every test expects.
    router.get("/hello").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body is JSON
      .end("{\"message\":\"hello, vertx\"}")); // => 200 plus the greeting contract
    // The probe answers readiness in one fixed shape: balancers parse this.
    router.get("/healthz").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the flag is JSON too
      .end("{\"status\":\"ok\"}")); // => 200 with the readiness flag
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = (text == null || text.isEmpty()) ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /healthz -> 200 {"status":"ok"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "GET", "/healthz"); // => Output: GET /healthz -> 200 {"status":"ok"}
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-05-add-a-health-check-endpoint/expected/main.stdout.txt`):

```text
GET /healthz -> 200 {"status":"ok"}
GET /hello -> 200 {"message":"hello, vertx"}
```

### Kata 6: Group routes under a shared prefix

Related routes share a prefix, and a sub-router keeps their paths short while the mount supplies the shared part. This kata replays the grouping from Example 5 so the motion becomes reflex. Mount the group at /api, then print 200 for both grouped routes.

- Starter: `drilling/code/kata-06-group-routes-under-a-shared-prefix/before/Starter.java`
- Solution: `drilling/code/kata-06-group-routes-under-a-shared-prefix/after/Solution.java`

**`drilling/code/kata-06-group-routes-under-a-shared-prefix/before/Starter.java`**:

```java
// Starter: Group Routes Under a Shared Prefix. The smell: versioned paths repeated on every route.
// Related routes share a prefix, and a sub-router keeps their paths short while the mount supplies the shared part.
// This kata replays the grouping from Example 5 so the motion becomes reflex.
// Your solution mounts the group at /api, then prints one line per grouped check.
// Your task: Mount the sub-router at /api, then print 200 for both grouped routes.
public class Starter {

  // => the shape to keep: group, mount, checks
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the mounted group
  } // => main ends: the kata is done when todo is gone
}
// fix me: Mount the sub-router at /api, then print 200 for both grouped routes.
```

**`drilling/code/kata-06-group-routes-under-a-shared-prefix/after/Solution.java`**:

```java
// Kata 6: Group Routes Under a Shared Prefix.
// Related routes share a prefix, and a sub-router keeps their paths short
// while the mount supplies the shared part. This kata replays the grouping
// from Example 5 so the motion becomes reflex.
// (Concepts: co-01, co-11.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // buildApi wires the group with short paths: the prefix is added by mounting.
  // Handlers inside a group never repeat the shared prefix.
  static Router buildApi(Vertx vertx) {
    // A plain router first: it becomes a group only once mounted.
    Router api = Router.router(vertx); // => a second table for the /api family
    // Short path here: the mount point supplies the /api prefix.
    api.get("/users").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body is JSON
      .end("{\"users\":[]}")); // => 200 with the empty collection
    // A second group member proves the prefix is shared, not per-route.
    api.get("/health").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body stays JSON
      .end("{\"ok\":true}")); // => 200 with the group health flag
    // Hand the group back: the caller mounts it under its prefix.
    return api;
  }

  // buildRouter wires the service: the group mounts at /api, nothing else.
  // Mounting composes tables: the group stays testable on its own.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the mount below is its only route.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // "/*" forwards the whole subtree; the group strips the prefix itself.
    router.route("/api/*").subRouter(buildApi(vertx)); // => /api/users reaches the group
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = (text == null || text.isEmpty()) ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /api/users -> 200 {"users":[]}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "GET", "/api/users"); // => Output: GET /api/users -> 200 {"users":[]}
    check(client, port, "GET", "/api/health"); // => Output: GET /api/health -> 200 {"ok":true}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-06-group-routes-under-a-shared-prefix/expected/main.stdout.txt`):

```text
GET /api/users -> 200 {"users":[]}
GET /api/health -> 200 {"ok":true}
```

### Kata 7: Shape errors with the envelope contract

Every failure answers three questions — code, message, fix — inside one shared envelope, so clients parse failures the same way they parse successes. This kata replays the envelope from Example 22 so the motion becomes reflex. Fail the lookup inside the envelope, then print the status plus the envelope body.

- Starter: `drilling/code/kata-07-shape-errors-with-the-envelope-contract/before/Starter.java`
- Solution: `drilling/code/kata-07-shape-errors-with-the-envelope-contract/after/Solution.java`

**`drilling/code/kata-07-shape-errors-with-the-envelope-contract/before/Starter.java`**:

```java
// Starter: Shape Errors with the Envelope Contract. The smell: a lookup that answers 404 with an empty body.
// Every failure answers three questions — code, message, fix — inside one shared envelope, so clients parse failures
// the same way they parse successes. This kata replays the envelope from Example 22 so the motion becomes reflex.
// Your solution fails the lookup inside the envelope, then prints the status plus the envelope body.
// Your task: Answer the missing gadget with the envelope contract, then print the 404 line.
public class Starter {

  // => the shape to keep: helper, routes, checks
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the enveloped service
  } // => main ends: the kata is done when todo is gone
}
// fix me: Answer the missing gadget with the envelope contract, then print the 404 line.
```

**`drilling/code/kata-07-shape-errors-with-the-envelope-contract/after/Solution.java`**:

```java
// Kata 7: Shape Errors with the Envelope Contract.
// Every failure answers three questions — code, message, fix — inside one
// shared envelope, so clients parse failures the same way they parse
// successes. This kata replays the envelope from Example 22 so the motion
// becomes reflex.
// (Concepts: co-04, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // error answers a failure inside the shared envelope with a status.
  // Code for machines, message for humans: one object serves both.
  static void error(io.vertx.ext.web.RoutingContext ctx, int status, String message) { // => ctx writes this response
    ctx.response()
      .setStatusCode(status) // => the HTTP code matches the envelope code
      .putHeader("content-type", "application/json") // => failures parse like successes
      .end(new JsonObject() // => the envelope, built in one expression
        .put("error", new JsonObject().put("code", status).put("message", message)).encode()); // => code plus what to fix
  }

  // buildRouter wires the service with one hit plus one miss.
  // Both branches share the helper: the contract cannot drift.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one present gadget plus one absent gadget follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The present gadget answers the data envelope: the success shape.
    router.get("/gadgets/1").handler(ctx -> ctx.response()
      .putHeader("content-type", "application/json") // => the body is JSON
      .end(new JsonObject().put("data", new JsonObject().put("id", 1).put("name", "drill")).encode())); // => 200 with the data envelope
    // The missing gadget answers the error envelope: the failure shape.
    router.get("/gadgets/2").handler(ctx -> error(ctx, 404, "gadget 2 not found")); // => absence in the envelope
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = (text == null || text.isEmpty()) ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets/1 -> 200 {"data":{...}}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "GET", "/gadgets/1"); // => Output: GET /gadgets/1 -> 200 {"data":{"id":1,"name":"drill"}}
    check(client, port, "GET", "/gadgets/2"); // => Output: GET /gadgets/2 -> 404 {"error":{"code":404,"message":"gadget 2 not found"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-07-shape-errors-with-the-envelope-contract/expected/main.stdout.txt`):

```text
GET /gadgets/1 -> 200 {"data":{"id":1,"name":"drill"}}
GET /gadgets/2 -> 404 {"error":{"code":404,"message":"gadget 2 not found"}}
```

### Kata 8: Cap bodies with a limit

Unbounded bodies crowd out every other request, so the boundary caps each one and fails oversized callers fast with 413. This kata replays the bound from Example 59 so the motion becomes reflex. Cap bodies at 64 bytes, then print 200 for the small body and 413 for the large one.

- Starter: `drilling/code/kata-08-cap-bodies-with-a-limit/before/Starter.java`
- Solution: `drilling/code/kata-08-cap-bodies-with-a-limit/after/Solution.java`

**`drilling/code/kata-08-cap-bodies-with-a-limit/before/Starter.java`**:

```java
// Starter: Cap Bodies with a Limit. The smell: an echo route that reads bodies of any size.
// Unbounded bodies crowd out every other request, so the boundary caps each one and fails oversized callers fast with
// 413. This kata replays the bound from Example 59 so the motion becomes reflex.
// Your solution caps bodies at 64 bytes, then prints 200 for the small body and 413 for the large one.
// Your task: Install the capped middleware plus the 413 catcher, then print both verdict lines.
public class Starter {

  // => the shape to keep: capped middleware, echo, catcher
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the capped echo
  } // => main ends: the kata is done when todo is gone
}
// fix me: Install the capped middleware plus the 413 catcher, then print both verdict lines.
```

**`drilling/code/kata-08-cap-bodies-with-a-limit/after/Solution.java`**:

```java
// Kata 8: Cap Bodies with a Limit.
// Unbounded bodies crowd out every other request, so the boundary caps
// each one and fails oversized callers fast with 413. This kata replays
// the bound from Example 59 so the motion becomes reflex.
// (Concepts: co-03, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Solution {

  // buildRouter wires the service with a capped body middleware.
  // The cap is the backpressure: oversized bodies never reach logic.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the capped middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // setBodyLimit(64) fails bodies past 64 bytes: the queue stays bounded.
    router.route().handler(BodyHandler.create().setBodyLimit(64)); // => the boundary guard, in bytes
    // Oversized bodies never arrive here: the middleware fails them first.
    router.post("/echo").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => at most 64 bytes, by construction
      ctx.response()
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("name", body.getString("name", "nobody")).encode()); // => the parsed name echoed back
    });
    // The 413 catcher shapes the bound as the error contract.
    router.errorHandler(413, ctx -> ctx.response()
      .setStatusCode(413) // => 413 names the oversized body deliberately
      .putHeader("content-type", "application/json") // => failures parse like successes
      .end("{\"error\":{\"code\":413,\"message\":\"body too large\"}}")); // => the bound, in the contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one raw body in-process and prints its status line.
  // Raw bytes control the size: JSON encoding would hide the byte count.
  static void check(WebClient client, int port, String payload, String label) throws Exception {
    // sendBuffer carries exact bytes: the middleware measures, not the encoder.
    var response = client.post(port, "127.0.0.1", "/echo") // => POST names the verb under test
      .putHeader("content-type", "application/json") // => the handler attempts a JSON decode
      .sendBuffer(Buffer.buffer(payload)) // => the bytes under test, sized on purpose
      .toCompletionStage().toCompletableFuture().join(); // => the guard answers, then logic
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the case label, the status, and the body.
    System.out.println("POST /echo " + label + " -> " + response.statusCode() + " " + text); // => Output: POST /echo small -> 200 {"name":"gopher"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
    int port = vertx.createHttpServer().requestHandler(router).listen(0, "127.0.0.1")
      .toCompletionStage().toCompletableFuture().join().actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "{\"name\":\"gopher\"}", "small"); // => Output: POST /echo small -> 200 {"name":"gopher"}
    check(client, port, "{\"name\":\"" + "g".repeat(200) + "\"}", "large"); // => Output: POST /echo large -> 413 {"error":{"code":413,"message":"body too large"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
```

**Output** (`drilling/code/kata-08-cap-bodies-with-a-limit/expected/main.stdout.txt`):

```text
POST /echo small -> 200 {"name":"gopher"}
POST /echo large -> 413 {"error":{"code":413,"message":"body too large"}}
```

## Self-check checklist

Answer honestly: check an item only when you can perform it without notes. Fewer than twenty honest checks means another pass through the level pages; all twenty-four means the capstone is yours.

- [ ] Register GET /hello answering `{"message":"hello, vertx"}` with status 200 from memory.
- [ ] Read two path parameters and two query parameters with defaults in one handler.
- [ ] Split one path by GET and POST into two handlers with different status codes.
- [ ] Mount a two-route sub-router at /api and call both grouped paths successfully.
- [ ] Answer unknown paths with a JSON 404 contract instead of the default page.
- [ ] Point an old path at a new one with a 302 plus Location, asserted without following.
- [ ] Chain two small handlers sharing state through the context with next().
- [ ] Parse a JSON body into typed getters and a form body into attributes in separate routes.
- [ ] Reject malformed JSON with 400 and a missing field with 422, each in the error envelope.
- [ ] Split one path by consumes into a JSON reader and a form reader with the same contract.
- [ ] Shape every reply in the data-or-error envelope through one shared helper.
- [ ] Stamp X-Total-Count and echo X-Request-Id, asserting both headers beside the body.
- [ ] Order three middleware so the visit log reads seeder, first, second, handler.
- [ ] Gate one route behind a Bearer token while a sibling route stays public.
- [ ] Translate a thrown exception and a fail(502) into their JSON contracts.
- [ ] Emit one JSON log line per request at response end with no timestamps or thread names.
- [ ] Wire a service, a config, and a repository into one builder without globals.
- [ ] Drive a four-row verdict table through the in-process web client with all rows passing.
- [ ] Burst 64 concurrent requests and print requests, ok, and failed without timings.
- [ ] Drain four in-flight slow requests to zero before closing the server port.
- [ ] Flip a readiness flag through starting, ready, and draining with 503s tracked.
- [ ] Deploy a verticle that binds in start, then prove undeploy flips reachable to false.
- [ ] Close server and runtime twice each and watch all four completions succeed.
- [ ] Name four Vert.x-versus-FastAPI trade-offs with the route that proves each one.

## Elaborative interrogation & self-explanation

Answer each prompt in your own words before comparing with the referenced example. Sixty words minimum per answer: explain the mechanism, then the rejected alternative, then why the course chose this side.

### W1: Why explicit parsing instead of automatic parsing?

Automatic parsing feels faster until the one route that must not parse pays for the other fifty that must. Explain how per-route BodyHandler placement lets a service parse exactly where it needs to, using Example 71's two placements as evidence, then explain why automatic parsing would force limits and uploads through one global policy. Why not parse everywhere and opt out where unwanted?

### W2: Why guards instead of declared models?

Declared models validate in one place until the order of checks matters, and presence before type before range is an order models cannot see. Explain how the three layered guards in Example 76 fail cheapest first with one shared reject helper, then explain why a model annotation would hide the sequencing the 422 contract depends on. Why not declare the shape once and let the framework sort it?

### W3: Why in-process loopback instead of a test double?

In-memory test doubles skip the wire: no status lines, no headers, no serialization, so the contract goes unproven. Explain how Example 77's table suite drives the real web client against a system-assigned loopback port, then explain why a doubled handler would pass while the content type breaks every parser. Why not test handlers directly and trust the wiring?

### W4: Why drain before close instead of closing immediately?

Closing the socket first cuts the requests already accepted, turning rolling deploys into dropped traffic at the worst moment. Explain how Example 62's in-flight counter reaches zero before the port releases, then explain why connection-cutting close would answer the four slow calls with failures instead of 200s. Retries push the failure onto callers who did nothing wrong, so the drain is the honest contract. Why not close and let clients retry?

### W5: Why freeze time instead of reading the clock?

Wall-clock reads print a different answer every run, so golden tests either flake or avoid time entirely, leaving stamps and expiries untested. Explain how Example 41's frozen clock seam stamps creations identically every run, then explain why sleep-based or real-time assertions would wobble between machines and CI runners. Loose assertions around now() pass broken formatting, so exactness is the only honest stamp test. Why not assert loosely around the current time?

### W6: Why tables instead of copy-pasted tests?

Copies drift: the third copy forgets the fragment assertion, the fifth skips the fallback, and nobody notices until the refactor breaks production. Explain how Examples 46 and 50 grow coverage by appending rows to one loop, then explain why copy-paste suites rot as behavior multiplies while tables stay reviewable matrices. Hand-written tests read well once but review badly at fifty copies, so rows win on clarity at scale. Why not write each test by hand for clarity?
