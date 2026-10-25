// Example 15: Validate Numbers Inside Bounds.
// A present field can still be nonsense: negative watts, a page size of a
// million. Range checks reject out-of-bounds values with 422 before the
// logic trusts them. This example bounds watts between 1 and 1000.
// (Concepts: co-05, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // inRange answers whether a value sits inside an inclusive bound.
  // One predicate serves every ranged field in the handler below (co-10).
  static boolean inRange(int value, int low, int high) {
    // => value is the parsed field
    return value >= low && value <= high; // => inclusive on both ends, by contract
  }

  // buildRouter wires the service with every route this example serves.
  // Bounds are business rules: they live at the boundary, not in storage.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: validation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Watts outside 1..1000 stop here: the store never sees nonsense.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded, possibly out of bounds
      int watts = body.getInteger("watts", 0); // => 0 when absent: absent is also out of bounds
      // The bound is inclusive: exactly 1 and exactly 1000 both pass.
      if (!inRange(watts, 1, 1000)) {
        // => business rule, checked before logic
        ctx
          .response()
          .setStatusCode(422) // => 422 names an unprocessable body (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":422,\"message\":\"watts must be 1..1000\"}}"); // => the bound, in the contract
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(new JsonObject().put("watts", watts).encode()); // => the accepted value echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one JSON body in-process and prints its status line.
  // sendJsonObject sets the content type the handler expects (co-09).
  static void check(WebClient client, int port, String payload) throws Exception {
    // The payload travels as JSON: bounds are decided by its values.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the body under test, parsed once
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the sent payload, the status, and the body.
    System.out.println("POST /gadgets " + payload + " -> " + response.statusCode() + " " + text); // => Output: POST /gadgets {"watts":40} -> 200 {"watts":40}
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
    check(client, port, "{\"watts\":40}"); // => Output: POST /gadgets {"watts":40} -> 200 {"watts":40}
    check(client, port, "{\"watts\":0}"); // => Output: POST /gadgets {"watts":0} -> 422 {"error":{"code":422,"message":"watts must be 1..1000"}}
    check(client, port, "{\"watts\":1001}"); // => Output: POST /gadgets {"watts":1001} -> 422, the upper bound holding too
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
