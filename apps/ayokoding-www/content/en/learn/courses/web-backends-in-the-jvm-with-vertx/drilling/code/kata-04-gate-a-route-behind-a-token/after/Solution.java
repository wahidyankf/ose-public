// Kata 4: Gate a Route Behind a Token.
// Private routes need a gate: a middleware that ends anonymous requests
// with 401 before the handler ever runs. This kata replays the token gate
// from Example 29 so the motion becomes reflex.
// (Concepts: co-02, co-05.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // buildRouter wires the service with a gate plus two routes.
  // The gate runs before the private route only: public stays open.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one open route, one gate, one gated route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Open by design: no middleware runs before this handler.
    router.get("/public").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON
        .end("{\"open\":true}")
    ); // => 200 for everyone, token or not
    // The gate ends anonymous requests here: gated handlers trust the caller.
    router.route("/private/*").handler(ctx -> {
      String auth = ctx.request().getHeader("authorization"); // => null when anonymous
      // Only the exact token passes: anything else is anonymous by definition.
      if (!"Bearer s3cret".equals(auth)) {
        // => constant first: null-safe by construction
        ctx
          .response()
          .setStatusCode(401) // => 401 names the missing credential
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":401,\"message\":\"token required\"}}"); // => what to fix, in the contract
        return; // => no next(): the gated handler never runs
      }
      ctx.next(); // => the token held: the gated handler runs next
    });
    // Anonymous callers never reach this line: the gate ended them above.
    router.get("/private/notes").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"notes\":[]}")
    ); // => 200 for token holders only
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request with or without a token and prints its line.
  // The token rides the header: presence decides the branch.
  static void check(WebClient client, int port, String target, String token) throws Exception {
    // The request carries the token under test, or none when token is null.
    var request = client.request(HttpMethod.GET, port, "127.0.0.1", target); // => GET names the verb under test
    // Null means anonymous: the 401 branch is asserted, not just the happy one.
    if (token != null) {
      // => one branch sends a token, one stays anonymous
      request.putHeader("authorization", token); // => the credential under test
    }
    // The full pipeline runs, then answers: gate, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: the path, the token sent, the status, and the body.
    System.out.println("GET " + target + " token=" + token + " -> " + response.statusCode() + " " + text); // => Output: GET /private/notes token=null -> 401 {...}
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
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port, "/public", null); // => Output: GET /public token=null -> 200 {"open":true}
    check(client, port, "/private/notes", null); // => Output: GET /private/notes token=null -> 401 {"error":{"code":401,"message":"token required"}}
    check(client, port, "/private/notes", "Bearer s3cret"); // => Output: GET /private/notes token=Bearer s3cret -> 200 {"notes":[]}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
