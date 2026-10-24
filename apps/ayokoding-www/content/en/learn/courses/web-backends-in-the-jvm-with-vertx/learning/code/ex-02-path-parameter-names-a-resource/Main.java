// Example 2: Path Parameter Names a Resource.
// One route serves many resources when part of the path is a variable.
// A colon in the path declares the parameter, and the handler reads it
// back by name, so /users/42 and /users/7 share one handler with
// different values. This example proves the mapping with two ids.
// (Concepts: co-01, co-03.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // One parameterized route replaces one route per resource (co-01).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: routes are added below, none exists yet.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // ":id" declares the variable segment of the path.
    // pathParam reads the segment the request actually carried (co-03).
    router.get("/users/:id").handler(ctx -> {
      String id = ctx.pathParam("id"); // => "42" for /users/42 (type: String)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"id\":\"" + id + "\"}"); // => the id echoed back as the contract
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /users/42 -> 200 {"id":"42"}
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
    check(client, port, "GET", "/users/42"); // => Output: GET /users/42 -> 200 {"id":"42"}
    check(client, port, "GET", "/users/7"); // => Output: GET /users/7 -> 200 {"id":"7"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
