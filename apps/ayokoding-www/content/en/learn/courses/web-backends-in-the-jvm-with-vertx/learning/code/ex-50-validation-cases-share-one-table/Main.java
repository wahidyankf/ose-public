// Example 50: Validation Cases Share One Table.
// Validation has many faces — missing fields, wrong types, out-of-bounds
// values — and each deserves a row, not a new test. A table of bodies with
// expected statuses drives one loop, so new rules add rows. This example
// pins one valid body plus three rejections in four rows.
// (Concepts: co-09, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // Case names one validation row: the body plus the expected status.
  // Records carry cases: the loop below reads each field by name (co-15).
  record Case(String label, String payload, int expected) {
    // => one row: what to send, what to expect
  }

  // buildRouter wires the service with one guarded creation.
  // The guard checks presence, type, and bounds before logic runs (co-10).
  // Gates run cheapest first: presence before parsing, parsing before range.
  // Each gate answers the same 422 shape: clients learn one error contract.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus the guarded route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: the guard reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Three gates in one handler: presence, then range, then logic.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded, possibly invalid
      // Presence first: a missing name stops the handler with 422.
      if (!body.containsKey("name")) {
        // => the presence gate
        ctx
          .response()
          .setStatusCode(422) // => 422 names an unprocessable body (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":422,\"message\":\"name is required\"}}"); // => what to fix, in the contract
        return; // => the handler is done: the gate held
      }
      int watts = body.getInteger("watts", 0); // => 0 when absent: absent is also out of bounds
      // Range second: watts outside 1..1000 stop here too.
      if (watts < 1 || watts > 1000) {
        // => the range gate
        ctx
          .response()
          .setStatusCode(422) // => 422 again: still the caller's fix
          .putHeader("content-type", "application/json") // => the body stays JSON
          .end("{\"error\":{\"code\":422,\"message\":\"watts must be 1..1000\"}}"); // => the bound, in the contract
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("name", body.getString("name")).put("watts", watts).encode()); // => the valid gadget
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // verdict prints PASS when the status holds, FAIL with both sides otherwise.
  // Tables of expectations read golden: one verdict per row, in row order.
  static void check(WebClient client, int port, Case kase) throws Exception {
    // The payload travels as JSON: presence and range decide the status.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(kase.payload())) // => the row's body
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the guard answers, then logic
    int actual = response.statusCode(); // => the guard's verdict for this row
    // equals() decides: the golden line pins the outcome per row.
    if (actual == kase.expected()) {
      // => the passing branch this example prints
      System.out.println("PASS " + kase.label() + " -> " + actual); // => Output: PASS valid -> 201
    } else {
      System.out.println("FAIL " + kase.label() + ": expected " + kase.expected() + " but got " + actual); // => unreachable here, by design
    }
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example (co-09).
    int port = vertx
      .createHttpServer()
      .requestHandler(router)
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every row
    // The table: one valid body plus one rejection per gate.
    Case[] cases = {
      // => rows, not code: new rules append here
      new Case("valid", "{\"name\":\"drill\",\"watts\":40}", 201), // => passes every gate
      new Case("missing-name", "{\"watts\":40}", 422), // => fails the presence gate
      new Case("watts-low", "{\"name\":\"drill\",\"watts\":0}", 422), // => fails the lower bound
      new Case("watts-high", "{\"name\":\"drill\",\"watts\":1001}", 422), // => fails the upper bound
    };
    // One loop drives every row: the helper stays untouched as rows grow.
    for (Case kase : cases) {
      // => valid, then the three rejections
      check(client, port, kase); // => prints one verdict per row
    }
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
