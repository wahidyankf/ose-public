// Example 73: Futures vs Async Await.
// Python awaits coroutines; Vert.x composes Futures. Reading a gadget and
// its orders needs two lookups, and compose() chains them without nesting:
// the second lookup runs when the first succeeds, and one onSuccess renders
// the pair. This example joins a gadget with its order count.
// (Concepts: co-06, co-16.)
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.Map;

public class Main {

  // findGadget reads one gadget asynchronously, or fails the lookup.
  // Succeeded futures carry rows; failed ones carry the absence (co-06).
  static Future<JsonObject> findGadget(Map<Integer, String> store, int id) {
    // => the store plus the wanted id
    String name = store.get(id); // => null for unknown ids
    // Failed futures skip the chain: compose never runs its function.
    if (name == null) {
      // => the absence branch fails fast
      return Future.failedFuture("gadget " + id + " not found"); // => the reason the catcher renders
    }
    return Future.succeededFuture(new JsonObject().put("id", id).put("name", name)); // => the found row, already complete
  }

  // countOrders answers the order count for one gadget, asynchronously.
  // The second lookup in the chain: it runs only after the first succeeds.
  static Future<Integer> countOrders(int gadgetId) {
    // => the gadget the orders belong to
    // Fixed for this example: the chain shape matters, not the storage.
    return Future.succeededFuture(gadgetId == 1 ? 2 : 0); // => 2 orders for gadget 1 (type: int)
  }

  // buildRouter wires one route that chains two async lookups.
  // compose() replaces nesting: flat chains read like await sequences (co-16).
  static Router buildRouter(Vertx vertx, Map<Integer, String> store) {
    // => the store under test, handed in
    // An empty table first: the chaining lookup below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The chain: find the gadget, count its orders, render the pair.
    router.get("/gadgets/:id").handler(ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id")); // => "1" becomes 1 (type: int)
      findGadget(store, id) // => first lookup: the gadget or a failed future
        .compose(gadget ->
          countOrders(id) // => second lookup: runs only on success
            .map(orders -> gadget.put("orders", orders))
        ) // => the pair, joined in one object
        .onSuccess(joined ->
          ctx
            .response() // => both lookups succeeded: render
            .putHeader("content-type", "application/json") // => the body is JSON (co-04)
            .end(joined.encode())
        ) // => 200 with the joined row
        .onFailure(missing ->
          ctx
            .response() // => the first lookup failed: translate
            .setStatusCode(404) // => 404 names the absence (co-05)
            .putHeader("content-type", "application/json") // => failures parse like successes
            .end(
              new JsonObject()
                .put("error", new JsonObject().put("code", 404).put("message", missing.getMessage()))
                .encode()
            )
        ); // => the absence contract
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: chain, render, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets/1 -> 200 {"id":1,"name":"drill","orders":2}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: one stored gadget for the chain to find.
    Map<Integer, String> store = new java.util.LinkedHashMap<>(Map.of(1, "drill")); // => gadget 1 exists, 9 does not
    Router router = buildRouter(vertx, store); // => wiring, with the store explicit
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
    check(client, port, "GET", "/gadgets/1"); // => Output: GET /gadgets/1 -> 200 {"id":1,"name":"drill","orders":2}
    check(client, port, "GET", "/gadgets/9"); // => Output: GET /gadgets/9 -> 404 {"error":{"code":404,"message":"gadget 9 not found"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
