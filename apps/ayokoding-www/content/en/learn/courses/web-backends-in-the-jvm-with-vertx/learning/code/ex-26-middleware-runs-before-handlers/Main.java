// Example 26: Middleware Runs Before Handlers.
// Middleware is a handler registered without a path: it runs for every
// request before the route handler does. A global handler can stamp every
// response with a header, and the route handler never notices. This example
// stamps x-handler on a route that knows nothing about it.
// (Concepts: co-01, co-02.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with middleware plus one route.
  // router.route() with no path matches everything: that is middleware (co-02).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Global handlers run first: registration order is execution order.
    // next() passes control down; without it the route below never runs.
    router.route().handler(ctx -> {
      ctx.response().putHeader("x-handler", "greet"); // => stamped before the route runs
      ctx.next(); // => the route handler runs after this returns
    });
    // The route stays clean: stamping lives in the middleware above.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request and prints status plus the stamped header.
  // The middleware proof lives in the header, not in the body.
  static void check(WebClient client, int port) throws Exception {
    // A plain request: no header is sent, yet one must come back stamped.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/hello") // => GET names the verb under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => middleware runs, then the route
    String stamped = response.getHeader("x-handler"); // => "greet" (type: String)
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: status, the stamped header, then the body.
    System.out.println("GET /hello -> " + response.statusCode() + " x-handler=" + stamped + " " + text); // => Output: GET /hello -> 200 x-handler=greet {"message":"hello, vertx"}
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
    check(client, port); // => Output: GET /hello -> 200 x-handler=greet {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
