// Example 47: Assert Status Then Body.
// Printing is observing; asserting is testing. A two-step helper checks the
// status first, then the body, printing PASS with the expectation when both
// hold. Failures would print FAIL, but this example's expectations hold, so
// the golden output is three PASS lines.
// (Concepts: co-04, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Small on purpose: the assertion helper below is the real subject (co-09).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route is enough to demonstrate assertions.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The route answers JSON: the helper asserts status, then body.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // verdict prints PASS when actual holds, FAIL with both sides otherwise.
  // Failures show their work: expected beside actual, never a bare red line.
  static void verdict(String label, Object expected, Object actual) {
    // => label names the assertion
    // equals() decides: the golden line pins the outcome either way.
    if (expected.equals(actual)) {
      // => the passing branch this example prints
      System.out.println("PASS " + label + " == " + expected); // => Output: PASS status == 200
    } else {
      System.out.println("FAIL " + label + ": expected " + expected + " but got " + actual); // => unreachable here, by design
    }
  }

  // check asserts one request in two steps and prints both verdicts.
  // Status first, body second: layered assertions localize failures.
  static void check(WebClient client, int port) throws Exception {
    // A server-side request needs no socket: it never leaves this process.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/hello") // => GET names the verb under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    // Status first: the coarsest assertion localizes the most breakage.
    verdict("status", 200, response.statusCode()); // => 200, as the route promises
    // Body second: the exact contract, asserted byte for byte.
    verdict("body", "{\"message\":\"hello, vertx\"}", response.bodyAsString()); // => the greeting contract, exactly
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
    WebClient client = WebClient.create(vertx); // => one client serves the assertions
    check(client, port); // => Output: two PASS lines, status then body
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
