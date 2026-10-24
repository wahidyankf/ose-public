// Example 75: Middleware Chains in Both Worlds.
// FastAPI stacks middleware as nested wrappers; Vert.x chains handlers in
// registration order. Both wrap every request, but the Vert.x chain is
// visible as a list of route() calls instead of nested decorators. This
// example chains timing-free auth plus a stamp, then proves the order.
// (Concepts: co-02, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the chain plus one guarded route.
  // Auth first, stamp second, route last: the chain reads top to bottom.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: two chain links plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // First link: the token gate ends anonymous requests here.
    router.route().handler(ctx -> {
      String auth = ctx.request().getHeader("authorization"); // => null when anonymous
      // Only the exact token passes: anything else ends at the gate.
      if (!"Bearer s3cret".equals(auth)) {
        // => constant first: null-safe by construction
        ctx
          .response()
          .setStatusCode(401) // => 401 names the missing credential (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":401,\"message\":\"token required\"}}"); // => what to fix, in the contract
        return; // => no next(): the chain stops at the gate
      }
      ctx.next(); // => the token held: the stamp runs next
    });
    // Second link: the stamp marks every request the gate let through.
    router.route().handler(ctx -> {
      ctx.response().putHeader("x-chain", "auth,stamp"); // => the chain order, stamped
      ctx.next(); // => the route runs last, stamps aboard
    });
    // The route answers only for requests the whole chain passed.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request and prints status plus the chain stamp.
  // The stamp proves the chain ran: order made visible in a header.
  static void check(WebClient client, int port, String token, String label) throws Exception {
    // The request carries the token under test, or none when token is null.
    var request = client.request(HttpMethod.GET, port, "127.0.0.1", "/hello"); // => GET names the verb under test
    // Null means anonymous: the gate branch is asserted, not assumed.
    if (token != null) {
      // => one branch sends a token, one stays anonymous
      request.putHeader("authorization", token); // => the credential under test
    }
    // The full pipeline runs, then answers: gate, stamp, route, response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String chain = response.getHeader("x-chain"); // => "auth,stamp" when the chain ran
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: the case, the status, the stamp, and the body.
    System.out.println("GET /hello " + label + " -> " + response.statusCode() + " x-chain=" + chain + " " + text); // => Output: GET /hello anon -> 401 x-chain=null {...}
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
    check(client, port, null, "anon"); // => Output: GET /hello anon -> 401 x-chain=null {"error":{"code":401,"message":"token required"}}
    check(client, port, "Bearer s3cret", "token"); // => Output: GET /hello token -> 200 x-chain=auth,stamp {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
