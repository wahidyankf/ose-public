// Example 53: Failing Check Prints the Diff.
// A bare FAIL wastes the next hour: the reader diffs by hand. A check that
// prints expected beside actual on mismatch points straight at the drift.
// This example matches once and mismatches once on purpose, and the program
// still exits 0: the diff is the lesson, not a failure.
// (Concepts: co-04, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Small on purpose: the diff printer below is the real subject (co-09).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route is enough to demonstrate the diff.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The route answers JSON: the printer compares against expectations.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // compare prints match, or the diff with expected beside actual.
  // Diffs point at drift: two values side by side beat one red line.
  static void compare(String label, String expected, String actual) {
    // => label names the comparison
    // equals() decides: the golden line pins the match or the whole diff.
    if (expected.equals(actual)) {
      // => the matching branch prints first
      System.out.println("match " + label + " == " + expected); // => Output: match body == {"message":"hello, vertx"}
    } else {
      System.out.println("DIFF " + label + ": expected [" + expected + "] actual [" + actual + "]"); // => the drift, in full
    }
  }

  // check fetches the greeting and compares it twice: once right, once off.
  // The mismatch is deliberate: the diff format is the lesson (co-09).
  static void check(WebClient client, int port) throws Exception {
    // A server-side request needs no socket: it never leaves this process.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/hello") // => GET names the verb under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String actual = response.bodyAsString(); // => the exact bytes the handler wrote
    // The right expectation matches: the baseline every diff needs.
    compare("body", "{\"message\":\"hello, vertx\"}", actual); // => Output: match body == {"message":"hello, vertx"}
    // The wrong expectation diffs: the format readers will meet on real drift.
    compare("body", "{\"message\":\"goodbye\"}", actual); // => Output: DIFF body: expected [{"message":"goodbye"}] actual [{"message":"hello, vertx"}]
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
    WebClient client = WebClient.create(vertx); // => one client serves the comparisons
    check(client, port); // => Output: one match line, then one DIFF line
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
