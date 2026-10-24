// Example 5: Route Groups Share a Prefix.
// Related routes share a prefix, and a sub-router keeps their paths short.
// The main router mounts the group at /api, so handlers inside declare
// /users while the outside world calls /api/users. This example mounts
// two group routes and proves the prefix resolves for both.
// (Concepts: co-01, co-11.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildApi wires the group with short paths: the prefix is added by mounting.
  // Handlers inside a group never repeat the shared prefix (co-11).
  static Router buildApi(Vertx vertx) {
    // A plain router first: it becomes a group only once mounted.
    Router api = Router.router(vertx); // => a second table for the /api family
    // Short path here: the mount point supplies the /api prefix.
    api.get("/users").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"users\":[]}")
    ); // => 200 with the empty collection
    // A second group member proves the prefix is shared, not per-route.
    api.get("/health").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"ok\":true}")
    ); // => 200 with the group health flag
    // Hand the group back: the caller mounts it under its prefix.
    return api;
  }

  // buildRouter wires the service: the group mounts at /api, nothing else.
  // Mounting composes tables: the group stays testable on its own (co-11).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the mount below is its only route.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // "/*" forwards the whole subtree; the group strips the prefix itself.
    router.route("/api/*").subRouter(buildApi(vertx)); // => /api/users reaches the group
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /api/users -> 200 {"users":[]}
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
    check(client, port, "GET", "/api/users"); // => Output: GET /api/users -> 200 {"users":[]}
    check(client, port, "GET", "/api/health"); // => Output: GET /api/health -> 200 {"ok":true}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
