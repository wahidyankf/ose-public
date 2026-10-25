// Example 46: Table-Driven Paths in One Loop.
// Copy-pasted checks drift; a table keeps them honest. Each row names a
// method, a path, and the expected status, and one loop drives every row,
// printing the actual line beside the expectation. This example covers
// two routes plus the 404 fallback in three rows.
// (Concepts: co-01, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // Case names one row of the test table: request plus expectation.
  // Records carry cases: the loop below reads each field by name (co-15).
  record Case(String method, String path, int expected) {
    // => one row: what to send, what to expect
  }

  // buildRouter wires the service with every route this example serves.
  // Two routes plus the framework fallback: the table expects all three.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: two routes follow, the fallback is automatic.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Both routes answer JSON: the table asserts status, the body rides along.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    router.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"ready\":true}")
    ); // => 200 with the readiness flag
    // Hand the wired table back to the caller.
    return router;
  }

  // check drives one table row and prints actual beside expected.
  // Tables scale: new behavior adds a row, never a new helper (co-09).
  static void check(WebClient client, int port, Case kase) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(kase.method()), port, "127.0.0.1", kase.path()); // => the row's request
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // Actual beside expected: a drift reads as two numbers that differ.
    System.out.println(
      kase.method() +
        " " +
        kase.path() +
        " -> " +
        response.statusCode() +
        " " +
        shown +
        " (expected " +
        kase.expected() +
        ")"
    ); // => Output: GET /hello -> 200 {...} (expected 200)
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
    WebClient client = WebClient.create(vertx); // => one client serves every row
    // The table: two known routes plus the fallback every API owns.
    Case[] cases = {
      // => rows, not code: behavior grows by appending
      new Case("GET", "/hello", 200), // => the greeting route
      new Case("GET", "/healthz", 200), // => the readiness route
      new Case("GET", "/nowhere", 404), // => the fallback every table should pin
    };
    // One loop drives every row: the helper stays untouched as rows grow.
    for (Case kase : cases) {
      // => hello, healthz, then the fallback
      check(client, port, kase); // => prints actual beside expected per row
    }
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
