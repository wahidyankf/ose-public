// Example 52: One Router, Two Passes.
// Flaky tests pass once and fail on rerun because state leaks between
// runs. Serving the same router twice on two ports and asserting both
// passes proves the handlers hold no state: the second pass reads exactly
// like the first. This example checks the greeting in pass 1 and pass 2.
// (Concepts: co-01, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Stateless by construction: no field, no map, no counter anywhere.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one stateless route is the whole service.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The answer depends on nothing but the request: reruns are identical.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // verdict prints PASS when the body holds, FAIL with both sides otherwise.
  // Two passes print two verdicts: identical lines prove no leakage.
  static void check(WebClient client, int port, int pass) throws Exception {
    // A server-side request needs no socket: it never leaves this process.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/hello") // => the route under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the router answers from scratch
    String actual = response.bodyAsString(); // => the exact bytes the handler wrote
    // equals() decides: the golden lines pin both passes identical.
    if ("{\"message\":\"hello, vertx\"}".equals(actual)) {
      // => the passing branch this example prints
      System.out.println("PASS pass " + pass + " body == " + actual); // => Output: PASS pass 1 body == {"message":"hello, vertx"}
    } else {
      System.out.println("FAIL pass " + pass + " body: got " + actual); // => unreachable here, by design
    }
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both servers and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Two serves, two ports: the same router answers both passes.
    int first = vertx
      .createHttpServer()
      .requestHandler(router)
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => pass 1 rides this port
    int second = vertx
      .createHttpServer()
      .requestHandler(router)
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => pass 2 rides this port
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves both passes
    check(client, first, 1); // => Output: PASS pass 1 body == {"message":"hello, vertx"}
    check(client, second, 2); // => Output: PASS pass 2 body == {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
