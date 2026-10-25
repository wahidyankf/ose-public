// Example 14: Require Fields Before Logic.
// Valid JSON can still miss the fields the logic needs, and reading them
// with defaults hides the caller's mistake. Checking presence first turns
// a missing name into a 422 with the error contract, before any business
// logic runs. This example rejects a gadget without a name.
// (Concepts: co-05, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Validation guards the gate: logic only sees complete bodies (co-10).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: validation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // containsKey asks about presence; getString would silently default.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded, possibly incomplete
      // A missing name stops the handler: no gadget is built from half a body.
      if (!body.containsKey("name")) {
        // => presence, not value, is the question
        ctx
          .response()
          .setStatusCode(422) // => 422 names an unprocessable body (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":422,\"message\":\"name is required\"}}"); // => what to fix, in the contract
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(new JsonObject().put("name", body.getString("name")).encode()); // => the required field echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one JSON body in-process and prints its status line.
  // sendJsonObject sets the content type the handler expects (co-09).
  static void check(WebClient client, int port, String payload) throws Exception {
    // The payload travels as JSON: presence is decided by its keys.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the body under test, parsed once
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the sent payload, the status, and the body.
    System.out.println("POST /gadgets " + payload + " -> " + response.statusCode() + " " + text); // => Output: POST /gadgets {"watts":40} -> 422 {...}
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
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "{\"name\":\"drill\"}"); // => Output: POST /gadgets {"name":"drill"} -> 200 {"name":"drill"}
    check(client, port, "{\"watts\":40}"); // => Output: POST /gadgets {"watts":40} -> 422 {"error":{"code":422,"message":"name is required"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
