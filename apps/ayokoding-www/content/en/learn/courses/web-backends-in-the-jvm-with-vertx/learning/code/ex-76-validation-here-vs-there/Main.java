// Example 76: Validation Here vs There.
// FastAPI validates with declared models; Vert.x validates with guard
// clauses the handler reads top to bottom. Both reject before logic, but
// the guards here name their own order: presence, then type, then range.
// This example layers three guards and proves each one fires.
// (Concepts: co-10, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // reject answers one guard's failure in the shared error shape.
  // Guards share the helper: wording stays uniform across gates (co-05).
  static void reject(io.vertx.ext.web.RoutingContext ctx, int status, String message) {
    // => ctx writes this response
    ctx
      .response()
      .setStatusCode(status) // => 422 for every validation failure here
      .putHeader("content-type", "application/json") // => failures parse like successes
      .end(new JsonObject().put("error", new JsonObject().put("code", status).put("message", message)).encode()); // => the gate's reason, in the contract
  }

  // buildRouter wires the service with three layered guards.
  // Order is the lesson: presence before type, type before range (co-16).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus the guarded creation follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: the guards read the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Three gates, cheapest first: each names the next check's precondition.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded, possibly invalid
      // Gate one, presence: logic needs a name, so its absence stops here.
      if (!body.containsKey("name")) {
        // => the cheapest check runs first
        reject(ctx, 422, "name is required"); // => presence, named
        return; // => the handler is done: the gate held
      }
      Object watts = body.getValue("watts"); // => untyped read: the type gate decides next
      // Gate two, type: a string where a number belongs stops here.
      if (!(watts instanceof Integer)) {
        // => type before range: range needs a number
        reject(ctx, 422, "watts must be a number"); // => type, named
        return; // => the handler is done: the gate held
      }
      // Gate three, range: a number outside 1..1000 stops here.
      int value = (Integer) watts; // => safe: the type gate proved it (type: int)
      if (value < 1 || value > 1000) {
        // => the most expensive check runs last
        reject(ctx, 422, "watts must be 1..1000"); // => range, named
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("name", body.getString("name")).put("watts", value).encode()); // => the thrice-gated gadget
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one body in-process and prints the guard's verdict.
  // Each row fires a different gate: the table proves the order (co-09).
  static void check(WebClient client, int port, String label, String payload, int expected) throws Exception {
    // The payload travels as JSON: presence, type, and range decide the status.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the row's body
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the guards answer, then logic
    int actual = response.statusCode(); // => the guards' verdict for this row
    // equals() decides: the golden line pins the verdict per row.
    if (actual == expected) {
      // => the passing branch this example prints
      System.out.println("PASS " + label + " -> " + actual); // => Output: PASS valid -> 201
    } else {
      System.out.println("FAIL " + label + ": expected " + expected + " but got " + actual); // => unreachable here, by design
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
    check(client, port, "valid", "{\"name\":\"drill\",\"watts\":40}", 201); // => Output: PASS valid -> 201
    check(client, port, "missing-name", "{\"watts\":40}", 422); // => Output: PASS missing-name -> 422
    check(client, port, "watts-text", "{\"name\":\"drill\",\"watts\":\"lots\"}", 422); // => Output: PASS watts-text -> 422
    check(client, port, "watts-high", "{\"name\":\"drill\",\"watts\":1001}", 422); // => Output: PASS watts-high -> 422
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
