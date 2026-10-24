// Example 31: Route Failure Handler Is Local.
// A global failure handler is the last resort, but one sensitive route can
// own its failure shape: a payment route says "try again", a lookup says
// "not found". A per-route failureHandler overrides the global one for its
// route only. This example fails two routes and prints both contracts.
// (Concepts: co-02, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with two failing routes and two catchers.
  // Local beats global: the payment route owns its failure shape (co-05).
  // The global guard checks ended(): answered failures must not print twice.
  // Route-level catchers run before global ones: locality decides first.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: two routes plus two failure handlers follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The payment route fails with a retryable contract, local to this route.
    router
      .get("/pay")
      .handler(ctx -> {
        ctx.fail(502); // => the dependency failed, not the caller (co-05)
      })
      .failureHandler(ctx ->
        ctx
          .response()
          .setStatusCode(502) // => 502 names the bad gateway behind us
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":502,\"message\":\"retry later\"}}")
      ); // => the local contract: retryable
    // The lookup route fails with no local catcher: the global one answers.
    router.get("/missing").handler(ctx -> {
      ctx.fail(404); // => absent, routed to the global catcher below
    });
    // Global last resort: every failure without a local catcher lands here.
    // A local catcher ends the response first, so the guard skips answered ones.
    router.route().failureHandler(ctx -> {
      if (ctx.response().ended()) {
        // => the local contract already went out
        return; // => answered: the global catcher stays silent
      }
      ctx
        .response()
        .setStatusCode(ctx.statusCode()) // => the status the handler named above
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"error\":{\"code\":" + ctx.statusCode() + ",\"message\":\"failed\"}}"); // => the generic fallback contract
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The fail() call runs inside the pipeline: the catcher answers, not the bug.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /pay -> 502 {"error":{"code":502,"message":"retry later"}}
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
    check(client, port, "GET", "/pay"); // => Output: GET /pay -> 502 {"error":{"code":502,"message":"retry later"}}
    check(client, port, "GET", "/missing"); // => Output: GET /missing -> 404 {"error":{"code":404,"message":"failed"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
