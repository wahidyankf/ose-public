// Example 32: Error Handler by Status Code.
// Different failures deserve different contracts: a missing route is a
// client typo worth a hint, a crash is a server fault worth an apology.
// errorHandler registered per status code owns each shape separately, so
// 404 and 500 never share wording. This example triggers both.
// (Concepts: co-04, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with one crashing route plus two catchers.
  // Status codes route to catchers: each failure owns its wording (co-05).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route plus two status catchers follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The crash becomes a 500: the status catcher below shapes it.
    router.get("/boom").handler(ctx -> {
      throw new RuntimeException("boom"); // => the bug under test, on purpose
    });
    // 404 answers the typo: a hint, not an apology.
    router.errorHandler(404, ctx ->
      ctx
        .response()
        .setStatusCode(404) // => 404 names the absence, as the client expects
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end("{\"error\":{\"code\":404,\"message\":\"check the path\"}}")
    ); // => the hint for typos
    // 500 answers the crash: an apology, never a stack trace.
    router.errorHandler(500, ctx ->
      ctx
        .response()
        .setStatusCode(500) // => 500 blames the service, never the caller
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"error\":{\"code\":500,\"message\":\"we are on it\"}}")
    ); // => the apology, generic on purpose
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The crash or the miss runs inside the pipeline: the catcher answers.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /boom -> 500 {"error":{"code":500,"message":"we are on it"}}
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
    check(client, port, "GET", "/boom"); // => Output: GET /boom -> 500 {"error":{"code":500,"message":"we are on it"}}
    check(client, port, "GET", "/nowhere"); // => Output: GET /nowhere -> 404 {"error":{"code":404,"message":"check the path"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
