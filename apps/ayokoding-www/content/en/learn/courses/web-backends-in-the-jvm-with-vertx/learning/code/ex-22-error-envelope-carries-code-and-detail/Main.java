// Example 22: Error Envelope Carries Code and Detail.
// Every failure answers three questions: what code, what happened, and
// what to fix. A two-field error object answers all three in one shape,
// so clients branch on code and humans read message. This example fails
// a lookup and a validation, both inside the same envelope.
// (Concepts: co-04, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // error answers a failure inside the shared envelope with a status.
  // Code for machines, message for humans: one object serves both (co-05).
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

  // buildRouter wires the service with every route this example serves.
  // Both failures share the helper: the contract cannot drift (co-05).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one missing gadget plus one bad request follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The absent gadget fails with where to look next.
    router.get("/gadgets/9").handler(ctx -> error(ctx, 404, "gadget 9 not found")); // => lookup failure in the envelope
    // The bad request fails with what to fix.
    router.get("/gadgets").handler(ctx -> error(ctx, 400, "limit must be a number")); // => validation failure, same shape
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets/9 -> 404 {"error":{...}}
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
    check(client, port, "GET", "/gadgets/9"); // => Output: GET /gadgets/9 -> 404 {"error":{"code":404,"message":"gadget 9 not found"}}
    check(client, port, "GET", "/gadgets"); // => Output: GET /gadgets -> 400 {"error":{"code":400,"message":"limit must be a number"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
