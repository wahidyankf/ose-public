// Example 23: Content Negotiation Picks JSON or Text.
// One resource can speak several formats when the client names one in the
// Accept header. The handler reads the header and answers JSON or plain
// text, defaulting to JSON when the caller names nothing. This example
// serves a gadget status in both tongues from one route.
// (Concepts: co-04, co-12.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Accept picks the tongue: the resource stays one route (co-12).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the negotiating route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // contains() tolerates "text/plain; charset=utf-8": matching stays loose.
    router.get("/status").handler(ctx -> {
      String accept = ctx.request().getHeader("accept"); // => null when the caller names nothing
      String wants = accept == null ? "" : accept; // => "" defaults to JSON below
      // Text for text callers, JSON for everyone else: one resource, two tongues.
      if (wants.contains("text/plain")) {
        // => the plain-text branch
        ctx
          .response()
          .putHeader("content-type", "text/plain") // => the tongue the caller asked for
          .end("gadget 1 is ok"); // => 200 in plain words
      } else {
        ctx
          .response()
          .putHeader("content-type", "application/json") // => the default tongue (co-04)
          .end("{\"gadget\":1,\"status\":\"ok\"}"); // => 200 in JSON
      }
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request with an Accept header and prints its line.
  // The header under test rides the same helper shape as the rest (co-09).
  static void check(WebClient client, int port, String accept) throws Exception {
    // The request names the tongue, or nothing when accept is null.
    var request = client.request(HttpMethod.GET, port, "127.0.0.1", "/status"); // => GET names the verb under test
    // Null means omission: the default branch is asserted, not assumed.
    if (accept != null) {
      // => one branch names a tongue, one stays silent
      request.putHeader("accept", accept); // => the tongue under test
    }
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    String type = response.getHeader("content-type"); // => the tongue the handler chose
    // One golden line: the requested tongue, the status, the served tongue, the body.
    System.out.println("GET /status accept=" + accept + " -> " + response.statusCode() + " " + type + " " + text); // => Output: GET /status accept=text/plain -> 200 text/plain gadget 1 is ok
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
    check(client, port, "text/plain"); // => Output: GET /status accept=text/plain -> 200 text/plain gadget 1 is ok
    check(client, port, null); // => Output: GET /status accept=null -> 200 application/json {"gadget":1,"status":"ok"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
