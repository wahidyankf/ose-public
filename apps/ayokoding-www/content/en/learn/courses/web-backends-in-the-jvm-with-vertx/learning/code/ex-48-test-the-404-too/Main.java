// Example 48: Test the 404 Too.
// Happy paths pass while the fallback rots: nobody asserts the absence
// until a client depends on it. A table with known and unknown paths pins
// the fallback beside the routes, so the 404 contract is tested, not
// hoped for. This example asserts one known route and one unknown path.
// (Concepts: co-04, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with one route plus a JSON fallback.
  // The fallback is a feature: unknown paths answer the error contract.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route plus the fallback catcher follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The known route answers the greeting every test expects.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // The fallback answers JSON too: absences parse like successes (co-05).
    router.errorHandler(404, ctx ->
      ctx
        .response()
        .setStatusCode(404) // => 404 names the absence deliberately
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end(new JsonObject().put("error", new JsonObject().put("code", 404).put("message", "not found")).encode())
    ); // => the absence contract
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
      System.out.println("PASS " + label + " == " + expected); // => Output: PASS GET /hello status == 200
    } else {
      System.out.println("FAIL " + label + ": expected " + expected + " but got " + actual); // => unreachable here, by design
    }
  }

  // check asserts one path's status and prints the verdict.
  // Known and unknown share the helper: absence is tested, not hoped for.
  static void check(WebClient client, int port, String path, int expected) throws Exception {
    // A server-side request needs no socket: it never leaves this process.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", path) // => the path under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the route or the fallback answers
    // The label carries the path: two verdicts stay distinguishable in gold.
    verdict("GET " + path + " status", expected, response.statusCode()); // => 200 for hello, 404 for nowhere
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
    WebClient client = WebClient.create(vertx); // => one client serves both verdicts
    check(client, port, "/hello", 200); // => Output: PASS GET /hello status == 200
    check(client, port, "/nowhere", 404); // => Output: PASS GET /nowhere status == 404
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
