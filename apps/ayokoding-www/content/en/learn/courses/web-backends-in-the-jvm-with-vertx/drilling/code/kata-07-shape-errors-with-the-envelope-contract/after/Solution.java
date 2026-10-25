// Kata 7: Shape Errors with the Envelope Contract.
// Every failure answers three questions — code, message, fix — inside one
// shared envelope, so clients parse failures the same way they parse
// successes. This kata replays the envelope from Example 22 so the motion
// becomes reflex.
// (Concepts: co-04, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // error answers a failure inside the shared envelope with a status.
  // Code for machines, message for humans: one object serves both.
  static void error(io.vertx.ext.web.RoutingContext ctx, int status, String message) {
    // => ctx writes this response
    ctx
      .response()
      .setStatusCode(status) // => the HTTP code matches the envelope code
      .putHeader("content-type", "application/json") // => failures parse like successes
      .end(
        new JsonObject() // => the envelope, built in one expression
          .put("error", new JsonObject().put("code", status).put("message", message))
          .encode()
      ); // => code plus what to fix
  }

  // buildRouter wires the service with one hit plus one miss.
  // Both branches share the helper: the contract cannot drift.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one present gadget plus one absent gadget follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The present gadget answers the data envelope: the success shape.
    router.get("/gadgets/1").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("data", new JsonObject().put("id", 1).put("name", "drill")).encode())
    ); // => 200 with the data envelope
    // The missing gadget answers the error envelope: the failure shape.
    router.get("/gadgets/2").handler(ctx -> error(ctx, 404, "gadget 2 not found")); // => absence in the envelope
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets/1 -> 200 {"data":{...}}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
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
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
