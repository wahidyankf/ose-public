// Example 72: Router Tables vs Decorators.
// FastAPI attaches routes with decorators on functions; Vert.x registers
// them with calls on a table. The table is data: it can be built by
// helpers, counted, and split across files. This example builds four routes
// through one helper and prints the table size beside the checks.
// (Concepts: co-01, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // json builds one GET route answering a fixed JSON body.
  // Helpers build tables: repetition collapses into a loop (co-01).
  static void json(Router router, String path, String payload) {
    // => path and payload name the row
    // One call per row: the table grows without new handler shapes.
    router.get(path).handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(payload)
    ); // => the fixed answer for this path
  }

  // buildRouter wires four routes through the helper above.
  // The table is explicit: four calls, four rows, countable below (co-16).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the helper fills it row by row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Four rows, one shape: helpers beat copy-paste for uniform routes.
    json(router, "/hello", "{\"message\":\"hello, vertx\"}"); // => row one: the greeting
    json(router, "/healthz", "{\"status\":\"ok\"}"); // => row two: readiness
    json(router, "/version", "{\"version\":\"1.0.0\"}"); // => row three: the build stamp
    json(router, "/ready", "{\"ready\":true}"); // => row four: the traffic flag
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // The table is data: its size prints as the build summary.
    System.out.println("routes=" + router.getRoutes().size()); // => Output: routes=4
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
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    check(client, port, "GET", "/version"); // => Output: GET /version -> 200 {"version":"1.0.0"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
