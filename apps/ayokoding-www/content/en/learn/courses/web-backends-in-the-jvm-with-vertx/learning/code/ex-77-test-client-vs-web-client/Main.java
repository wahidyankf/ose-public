// Example 77: Test Client vs Web Client.
// FastAPI tests call the app in memory with a test client; Vert.x tests
// drive a loopback server with the web client from the same process. Both
// stay in-process, but the Vert.x client speaks real HTTP: status lines,
// headers, and bodies travel the loopback wire. This example table-tests
// four routes through the real client and prints four verdicts.
// (Concepts: co-09, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // Case names one row of the in-process suite: request plus expectation.
  // Records carry cases: the loop below reads each field by name (co-15).
  record Case(String method, String path, int expected, String fragment) {
    // => one row: what to send, what to expect
  }

  // buildRouter wires the service with every route this example serves.
  // Small tables test completely: every row answers, nothing is mocked.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: three routes follow, the fallback is automatic.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Each route answers JSON: the suite asserts status plus a body fragment.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    router.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the flag is JSON too
        .end("{\"status\":\"ok\"}")
    ); // => 200 with the readiness flag
    router.get("/version").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the stamp is JSON too
        .end("{\"version\":\"1.0.0\"}")
    ); // => 200 with the build stamp
    // Hand the wired table back to the caller.
    return router;
  }

  // check drives one suite row through the real client and prints a verdict.
  // Real HTTP in-process: status plus a body fragment, asserted together.
  static void check(WebClient client, int port, Case kase) throws Exception {
    // A loopback request, no test double: headers and bodies travel for real.
    var response = client
      .request(HttpMethod.valueOf(kase.method()), port, "127.0.0.1", kase.path()) // => the row's request
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the route or the fallback answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // Status and fragment must both hold: the verdict names which failed.
    boolean statusOk = response.statusCode() == kase.expected(); // => 200 for rows, 404 for the miss
    boolean bodyOk = text != null && text.contains(kase.fragment()); // => the fragment proves the right route answered
    // One verdict per row: the row passes only when both halves hold.
    if (statusOk && bodyOk) {
      // => the passing branch this example prints
      System.out.println(
        "PASS " + kase.method() + " " + kase.path() + " -> " + response.statusCode() + " contains " + kase.fragment()
      ); // => Output: PASS GET /hello -> 200 contains hello
    } else {
      System.out.println("FAIL " + kase.method() + " " + kase.path() + ": got " + response.statusCode() + " " + text); // => unreachable here, by design
    }
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
    WebClient client = WebClient.create(vertx); // => one real client serves the suite
    // The suite: three routes plus the fallback every suite should pin.
    Case[] cases = {
      // => rows, not code: coverage grows by appending
      new Case("GET", "/hello", 200, "hello"), // => the greeting route
      new Case("GET", "/healthz", 200, "ok"), // => the readiness probe
      new Case("GET", "/version", 200, "1.0.0"), // => the build stamp
      new Case("GET", "/nowhere", 404, "not found"), // => the fallback, asserted too
    };
    // One loop drives every row: the helper stays untouched as rows grow.
    for (Case kase : cases) {
      // => three hits, then the miss
      check(client, port, kase); // => prints one verdict per row
    }
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
