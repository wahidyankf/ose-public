// Example 66: Shutdown Order Is Reverse.
// Startup builds up — client, server, runtime — so shutdown tears down:
// client first so no new requests start, server next so in-flight drains,
// runtime last so nothing runs without its loop. Each step completes before
// the next begins, and the summary prints the order that held.
// (Concepts: co-01, co-08.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // One route is enough: the shutdown sequence is the real subject (co-08).
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
    // Tear down in reverse: client, then server, then runtime.
    // New requests stop first: the pool closes before the server drains.
    client.close(); // => no new requests can start from here
    System.out.println("closed client"); // => first: the request source is gone
    // The server drains in-flight, then releases the port.
    server.close().toCompletionStage().toCompletableFuture().join(); // => drained, then released
    System.out.println("closed server"); // => second: nothing in flight was cut
    // The runtime stops last: nothing runs without its loop.
    vertx.close().toCompletionStage().toCompletableFuture().join(); // => the loop stops after every print
    System.out.println("closed vertx"); // => third: shutdown complete, in reverse order
  }
}
