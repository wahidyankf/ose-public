// Example 10: Read Request Headers.
// Headers carry metadata the body should not: correlation ids, callers,
// and capabilities. The handler reads them off the request like query
// values, defaulting when a caller omits one. This example echoes the
// caller back so the header round-trips through the golden output.
// (Concepts: co-03, co-13.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // X-Caller names the caller; the handler echoes it for tracing (co-03).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the echo route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Headers arrive as strings: absent means the caller sent none.
    router.get("/whoami").handler(ctx -> {
      String caller = ctx.request().getHeader("x-caller"); // => null when omitted (type: String)
      // A default keeps the contract total: every response names a caller.
      String shown = caller == null ? "anonymous" : caller; // => "anonymous" for bare calls
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"caller\":\"" + shown + "\"}"); // => the caller echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check sends one request with headers and prints its status line.
  // Header checks ride the same helper shape as body checks (co-09).
  static void check(WebClient client, int port, String caller) throws Exception {
    // The request carries the header under test, or none when caller is null.
    var request = client.request(HttpMethod.GET, port, "127.0.0.1", "/whoami"); // => GET names the verb under test
    // Null means omission: the default branch is asserted, not just the happy one.
    if (caller != null) {
      // => one branch sends the header, one skips it
      request.putHeader("x-caller", caller); // => the value the handler will echo
    }
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the sent header, the status, and the body.
    System.out.println("GET /whoami x-caller=" + caller + " -> " + response.statusCode() + " " + text); // => Output: GET /whoami x-caller=atlas -> 200 {"caller":"atlas"}
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
    check(client, port, "atlas"); // => Output: GET /whoami x-caller=atlas -> 200 {"caller":"atlas"}
    check(client, port, null); // => Output: GET /whoami x-caller=null -> 200 {"caller":"anonymous"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
