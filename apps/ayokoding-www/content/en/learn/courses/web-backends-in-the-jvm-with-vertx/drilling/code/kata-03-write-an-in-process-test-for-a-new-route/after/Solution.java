// Kata 3: Write an In-Process Test for a New Route.
// Untested routes rot: the fix is one verdict table that asserts status
// plus a body fragment for the new route and the old ones. This kata
// replays the suite pattern from Example 77 so the motion becomes reflex.
// (Concepts: co-04, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // Case names one row of the in-process suite: request plus expectation.
  // Records carry cases: the loop below reads each field by name.
  record Case(String method, String path, int expected, String fragment) {
    // => one row: what to send, what to expect
  }

  // buildRouter wires the old greeting plus the new version route.
  // The new route is the kata: it ships with its own test row.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the old route plus the new one follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The old route keeps its answer: the suite pins it against drift.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // The new route answers the build stamp: the kata's subject.
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
  // Status and fragment must both hold: the verdict names which failed.
  static void check(WebClient client, int port, Case kase) throws Exception {
    // A loopback request, no test double: headers and bodies travel for real.
    var response = client
      .request(HttpMethod.valueOf(kase.method()), port, "127.0.0.1", kase.path()) // => the row's request
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the route answers in-process
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // Status and fragment must both hold: the row passes only when both do.
    boolean holds =
      response.statusCode() == kase.expected() && // => 200 for both rows here
      text != null &&
      text.contains(kase.fragment()); // => the fragment proves the right route answered
    // One verdict per row: the row passes only when both halves hold.
    if (holds) {
      // => the passing branch this kata prints
      System.out.println("PASS " + kase.method() + " " + kase.path() + " -> " + response.statusCode()); // => Output: PASS GET /hello -> 200
    } else {
      System.out.println("FAIL " + kase.method() + " " + kase.path() + ": got " + response.statusCode()); // => unreachable here, by design
    }
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
    WebClient client = WebClient.create(vertx); // => one real client serves the suite
    // The suite: the old route plus the new row this kata adds.
    Case[] cases = {
      // => rows, not code: coverage grows by appending
      new Case("GET", "/hello", 200, "hello"), // => the old route, pinned
      new Case("GET", "/version", 200, "1.0.0"), // => the new row: the kata's proof
    };
    // One loop drives every row: the helper stays untouched as rows grow.
    for (Case kase : cases) {
      // => old, then new
      check(client, port, kase); // => prints one verdict per row
    }
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
