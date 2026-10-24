// Example 51: Headers Asserted Like Bodies.
// Content types are contracts too: a client parsing JSON breaks when the
// server answers text. Asserting the content type beside the status pins
// the tongue, not just the words. This example asserts JSON for the API
// and HTML for the page in two verdicts.
// (Concepts: co-04, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires one API route plus one page route.
  // Two tongues, one router: the assertions pin each route's tongue (co-04).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: JSON plus HTML follow on separate paths.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The API answers JSON: parsers depend on this header.
    router.get("/gadgets").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the tongue JSON clients parse
        .end("{\"gadgets\":[]}")
    ); // => 200 with the empty collection
    // The page answers HTML: browsers depend on this header.
    router.get("/dashboard").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "text/html") // => the tongue browsers render
        .end("<html><body><h1>Gadget Dashboard</h1></body></html>")
    ); // => 200 as a page
    // Hand the wired table back to the caller.
    return router;
  }

  // verdict prints PASS when the tongue holds, FAIL with both sides otherwise.
  // Tongue assertions read golden: the header is pinned per route.
  static void check(WebClient client, int port, String path, String expected) throws Exception {
    // A server-side request needs no socket: it never leaves this process.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", path) // => the route under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the route answers in its tongue
    String actual = response.getHeader("content-type"); // => the tongue the handler served (type: String)
    // equals() decides: the golden line pins the tongue per route.
    if (expected.equals(actual)) {
      // => the passing branch this example prints
      System.out.println("PASS GET " + path + " content-type == " + expected); // => Output: PASS GET /gadgets content-type == application/json
    } else {
      System.out.println("FAIL GET " + path + " content-type: expected " + expected + " but got " + actual); // => unreachable here, by design
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
    WebClient client = WebClient.create(vertx); // => one client serves both verdicts
    check(client, port, "/gadgets", "application/json"); // => Output: PASS GET /gadgets content-type == application/json
    check(client, port, "/dashboard", "text/html"); // => Output: PASS GET /dashboard content-type == text/html
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
