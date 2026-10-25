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
      if (!body.containsKey("name")) {
        // => presence, not value, is the question
        ctx
          .response()
          .setStatusCode(422) // => 422 names an unprocessable body
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":422,\"message\":\"name is required\"}}"); // => what to fix, in the contract
        return; // => the handler is done: the gate held
      }
      int watts = body.getInteger("watts", 0); // => 0 when absent: absent is out of bounds
      // Range second: watts outside 1..1000 stop here too.
      if (watts < 1 || watts > 1000) {
        // => business rule, checked before logic
        ctx
          .response()
          .setStatusCode(422) // => 422 again: still the caller's fix
          .putHeader("content-type", "application/json") // => the body stays JSON
          .end("{\"error\":{\"code\":422,\"message\":\"watts must be 1..1000\"}}"); // => the bound, in the contract
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("name", body.getString("name")).put("watts", watts).encode()); // => the gated gadget
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one body in-process and prints PASS when the status holds.
  // Three bodies, three gates: the verdicts prove the guards fire.
  static int check(WebClient client, int port, String label, String payload, int expected, int passed)
    throws Exception {
    // The payload travels as JSON: presence and range decide the status.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the row's body
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the guards answer, then logic
    int actual = response.statusCode(); // => the guards' verdict for this row
    // equals() decides: the golden line pins the verdict per row.
    if (actual == expected) {
      // => the passing branch this kata prints
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
