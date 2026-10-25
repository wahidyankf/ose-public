// Example 30: Error Handler Turns Throws into JSON.
// Handlers throw: a bug, a down dependency, a poisoned input that slipped
// past validation. An uncaught throw must still answer in the error
// contract, never in a stack trace. A failure handler for 500 catches the
// throw and shapes it, and this example proves it with one boom.
// (Concepts: co-02, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with one booming route plus its catcher.
  // Throws travel to failure handlers: the contract survives bugs (co-05).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route plus one failure handler follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The throw escapes the handler: Vert.x routes it to the failure chain.
    router.get("/boom").handler(ctx -> {
      throw new RuntimeException("boom"); // => the bug under test, on purpose
    });
    // failureHandler(500) shapes the throw: code for machines, no stack trace.
    router.route().failureHandler(ctx ->
      ctx
        .response()
        .setStatusCode(500) // => 500 blames the service, never the caller (co-05)
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end("{\"error\":{\"code\":500,\"message\":\"internal error\"}}")
    ); // => the message stays generic on purpose
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The throw runs inside the pipeline: the failure handler answers, not the bug.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /boom -> 500 {"error":{"code":500,"message":"internal error"}}
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
    check(client, port, "GET", "/boom"); // => Output: GET /boom -> 500 {"error":{"code":500,"message":"internal error"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
