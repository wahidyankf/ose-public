// Example 9: Read Query Parameters Typed.
// Query values arrive as strings, but handlers need numbers and flags.
// Parsing with a default keeps the handler total: missing or blank values
// fall back to a sane page instead of throwing. This example pages a
// fixed list with limit and offset read as integers.
// (Concepts: co-03, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // parseInt reads one named query value as an integer with a fallback.
  // Blank and broken input both fall back: the handler never throws (co-10).
  static int parseInt(java.util.List<String> values, int fallback) {
    // => values hold the raw strings
    // Empty means absent: the caller omitted the parameter entirely.
    if (values == null || values.isEmpty()) {
      // => no value arrived
      return fallback; // => the sane default stands in
    }
    try {
      return Integer.parseInt(values.get(0)); // => "3" becomes 3 (type: int)
    } catch (NumberFormatException bad) {
      // => "abc" cannot become a number
      return fallback; // => broken input degrades to the default, not a 500
    }
  }

  // buildRouter wires the service with every route this example serves.
  // limit and offset page a fixed list: parsing decides the window (co-03).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the paging route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Defaults of 2 and 0 keep /items total: no parameter is mandatory.
    router.get("/items").handler(ctx -> {
      int limit = parseInt(ctx.queryParam("limit"), 2); // => 2 for /items (type: int)
      int offset = parseInt(ctx.queryParam("offset"), 0); // => 0 for /items (type: int)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"limit\":" + limit + ",\"offset\":" + offset + "}"); // => the parsed window echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /items -> 200 {"limit":2,"offset":0}
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
    check(client, port, "GET", "/items"); // => Output: GET /items -> 200 {"limit":2,"offset":0}
    check(client, port, "GET", "/items?limit=1&offset=2"); // => Output: GET /items?limit=1&offset=2 -> 200 {"limit":1,"offset":2}
    check(client, port, "GET", "/items?limit=many"); // => Output: GET /items?limit=many -> 200 {"limit":2,"offset":0}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
