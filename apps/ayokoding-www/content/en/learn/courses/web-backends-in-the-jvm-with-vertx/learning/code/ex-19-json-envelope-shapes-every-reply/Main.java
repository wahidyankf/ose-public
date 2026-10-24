// Example 19: JSON Envelope Shapes Every Reply.
// Clients parse faster when every reply shares one shape: a data field on
// success, an error field on failure, never a bare value that changes type.
// One envelope helper keeps the contract uniform across routes. This
// example wraps a gadget read and a missing gadget in the same envelope.
// (Concepts: co-04, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // ok wraps a success payload in the shared envelope shape.
  // Every success answers {"data": ...}: the client learns one shape (co-04).
  static String ok(JsonObject payload) {
    // => payload holds the route's answer
    return new JsonObject().put("data", payload).encode(); // => the uniform success shape
  }

  // fail wraps a failure in the same envelope with the error beside it.
  // Errors answer {"error": {...}}: parsing never branches on shape (co-05).
  static String fail(int code, String message) {
    // => code and message name the failure
    return new JsonObject().put("error", new JsonObject().put("code", code).put("message", message)).encode(); // => the uniform failure shape
  }

  // buildRouter wires the service with every route this example serves.
  // Both branches use the envelope: success and failure look alike (co-04).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one present gadget plus one absent gadget follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The envelope helper keeps this handler to two lines of real logic.
    router.get("/gadgets/1").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(ok(new JsonObject().put("id", 1).put("name", "drill")))
    ); // => 200 with the data envelope
    // The missing gadget answers 404, still inside the envelope.
    router.get("/gadgets/2").handler(ctx ->
      ctx
        .response()
        .setStatusCode(404) // => 404 names the absence (co-05)
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end(fail(404, "gadget 2 not found"))
    ); // => 404 with the error envelope
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets/1 -> 200 {"data":{"id":1,...}}
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
    check(client, port, "GET", "/gadgets/1"); // => Output: GET /gadgets/1 -> 200 {"data":{"id":1,"name":"drill"}}
    check(client, port, "GET", "/gadgets/2"); // => Output: GET /gadgets/2 -> 404 {"error":{"code":404,"message":"gadget 2 not found"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
