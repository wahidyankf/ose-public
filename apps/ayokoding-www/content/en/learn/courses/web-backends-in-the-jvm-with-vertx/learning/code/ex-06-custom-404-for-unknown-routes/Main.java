// Example 6: Custom 404 for Unknown Routes.
// An unmatched path should answer in the API's own shape, not the
// framework's default page. An error handler for status 404 replaces the
// HTML fallback with a JSON contract, so clients parse failures the same
// way they parse successes. This example asserts both shapes differ.
// (Concepts: co-04, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The error handler below owns every unmatched path at once (co-05).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route plus one error handler follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The only real route: everything else must fall through to 404.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // errorHandler(404) replaces the default HTML page with JSON.
    // The status is set explicitly: the contract owns its code (co-05).
    router.errorHandler(404, ctx ->
      ctx
        .response()
        .setStatusCode(404) // => 404 names the absence, as the client expects
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end("{\"error\":{\"code\":404,\"message\":\"not found\"}}")
    ); // => the stable error contract
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /goodbye -> 404 {"error":{...}}
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
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    check(client, port, "GET", "/goodbye"); // => Output: GET /goodbye -> 404 {"error":{"code":404,"message":"not found"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
