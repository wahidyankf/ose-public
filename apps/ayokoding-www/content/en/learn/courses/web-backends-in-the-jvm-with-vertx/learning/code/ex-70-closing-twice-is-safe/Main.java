// Example 70: Closing Twice Is Safe.
// Shutdown code runs on every path — normal exit, signal, test teardown —
// and paths overlap, so close must tolerate repetition. Closing an already
// closed server and an already closed runtime completes normally instead of
// throwing, and this example proves it with four closes and one verdict.
// (Concepts: co-01, co-08.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // One route is enough: the double close below is the real subject (co-08).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route answers before the teardown.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The route answers JSON: the check below runs before any close.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Bind: the assigned port arrives here, never as a fixed constant.
    HttpServer server = vertx
      .createHttpServer()
      .requestHandler(router)
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => bound: traffic may arrive from here
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client proves traffic flows
    // The check runs before any close: traffic first, teardown after.
    var response = client
      .request(HttpMethod.GET, server.actualPort(), "127.0.0.1", "/hello") // => the greeting route
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    System.out.println("GET /hello -> " + response.statusCode() + " " + response.bodyAsString()); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    // Tear down twice: overlapping shutdown paths must both complete.
    // The pool closes once: no new requests can start from here.
    client.close();
    // The server closes twice: the second close is a harmless no-op.
    server.close().toCompletionStage().toCompletableFuture().join(); // => first close drains, then releases
    server.close().toCompletionStage().toCompletableFuture().join(); // => second close completes without throwing (co-08)
    // The runtime closes twice: the loop stops once, the repeat is silent.
    vertx.close().toCompletionStage().toCompletableFuture().join(); // => first close stops the loop
    vertx.close().toCompletionStage().toCompletableFuture().join(); // => second close completes without throwing
    // Four closes, four completions: the summary is the safety proof.
    System.out.println("closes=4 ok=4"); // => Output: closes=4 ok=4
  }
}
