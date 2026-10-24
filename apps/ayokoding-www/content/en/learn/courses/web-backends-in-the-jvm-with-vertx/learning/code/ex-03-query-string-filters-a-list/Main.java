// Example 3: Query String Filters a List.
// List endpoints stay one route while the query string varies the answer.
// The handler reads named parameters off the request, falling back to a
// default when the caller omits one, so /items and /items?type=book share
// one handler with different results. This example filters by type.
// (Concepts: co-01, co-03.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The query string varies the answer; the route table stays fixed (co-03).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: routes are added below, none exists yet.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // getParam reads one named query value, defaulting when it is absent.
    // The default keeps the handler total: no parameter is mandatory (co-03).
    router.get("/items").handler(ctx -> {
      String type = ctx.queryParam("type").isEmpty() ? "all" : ctx.queryParam("type").get(0); // => "all" for /items (type: String)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"type\":\"" + type + "\"}"); // => the filter echoed back as the contract
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /items -> 200 {"type":"all"}
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
    check(client, port, "GET", "/items"); // => Output: GET /items -> 200 {"type":"all"}
    check(client, port, "GET", "/items?type=book"); // => Output: GET /items?type=book -> 200 {"type":"book"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
