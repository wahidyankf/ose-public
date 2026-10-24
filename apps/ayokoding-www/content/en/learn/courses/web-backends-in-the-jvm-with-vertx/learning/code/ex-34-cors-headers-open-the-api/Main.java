// Example 34: CORS Headers Open the API.
// Browsers block cross-origin reads unless the server opts in, and the
// opt-in is three headers: origin, methods, and headers. A middleware
// stamps them on every answer and short-circuits preflight OPTIONS with
// 204, so browser clients pass the check. This example asserts the stamps.
// (Concepts: co-02, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with CORS middleware plus one route.
  // The stamps ride every response: preflight and real calls alike (co-02).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the stamp middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Preflight never reaches the route: OPTIONS ends here with 204.
    router.route().handler(ctx -> {
      ctx
        .response()
        .putHeader("access-control-allow-origin", "*") // => every origin may read (co-04)
        .putHeader("access-control-allow-methods", "GET,POST,OPTIONS") // => the verbs this API speaks
        .putHeader("access-control-allow-headers", "content-type,authorization"); // => the headers callers may send
      // OPTIONS asks permission; other verbs ask for content.
      if (ctx.request().method() == HttpMethod.OPTIONS) {
        // => the preflight branch
        ctx.response().setStatusCode(204).end(); // => permission granted, no body
        return; // => no next(): the route stays silent for preflight
      }
      ctx.next(); // => real calls continue to the route below
    });
    // The route answers content: the stamps were added before it ran.
    router.get("/gadgets").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"gadgets\":[]}")
    ); // => 200 with the empty collection
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request and prints status plus the CORS stamps.
  // The stamps are the contract: browsers enforce them, tests pin them.
  static void check(WebClient client, int port, String method) throws Exception {
    // The browser's preflight carries an Origin the server must bless.
    var response = client
      .request(HttpMethod.valueOf(method), port, "127.0.0.1", "/gadgets") // => OPTIONS or GET under test
      .putHeader("origin", "https://app.example") // => the foreign origin under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the middleware stamps, then answers
    String origin = response.getHeader("access-control-allow-origin"); // => "*" (type: String)
    String methods = response.getHeader("access-control-allow-methods"); // => "GET,POST,OPTIONS" (type: String)
    // One golden line: the verb, the status, and the two stamps that matter.
    System.out.println(
      method + " /gadgets -> " + response.statusCode() + " allow-origin=" + origin + " allow-methods=" + methods
    ); // => Output: OPTIONS /gadgets -> 204 allow-origin=* allow-methods=GET,POST,OPTIONS
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
    check(client, port, "OPTIONS"); // => Output: OPTIONS /gadgets -> 204 allow-origin=* allow-methods=GET,POST,OPTIONS
    check(client, port, "GET"); // => Output: GET /gadgets -> 200 allow-origin=* allow-methods=GET,POST,OPTIONS
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
