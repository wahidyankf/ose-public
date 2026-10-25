// Example 20: Headers Carry Metadata.
// Bodies carry content; headers carry metadata about the content. A total
// count lets a client page without another round trip, and a request id
// echoed back lets operators trace one call across services. This example
// asserts both headers beside the JSON body.
// (Concepts: co-03, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Metadata rides headers so the body keeps only the content (co-04).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the counted collection below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // X-Total-Count names the collection size without a second request.
    // X-Request-Id echoes the caller's id for cross-service tracing.
    router.get("/gadgets").handler(ctx -> {
      String requestId = ctx.request().getHeader("x-request-id"); // => null when the caller sends none
      String echoed = requestId == null ? "none" : requestId; // => "none" keeps the contract total
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .putHeader("x-total-count", "2") // => the collection size, as metadata
        .putHeader("x-request-id", echoed) // => the caller's id, echoed for tracing
        .end("{\"gadgets\":[{\"id\":1},{\"id\":2}]}"); // => the content itself
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request with headers and prints status plus headers.
  // Headers are asserted like bodies: the contract lives in them too.
  static void check(WebClient client, int port) throws Exception {
    // The request carries the id the handler is expected to echo.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/gadgets") // => GET names the verb under test
      .putHeader("x-request-id", "trace-1") // => the id under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    // Each header is read by name: the golden line pins the metadata.
    String total = response.getHeader("x-total-count"); // => "2" (type: String)
    String echoed = response.getHeader("x-request-id"); // => "trace-1" (type: String)
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: status, metadata headers, then the body.
    System.out.println(
      "GET /gadgets -> " + response.statusCode() + " x-total-count=" + total + " x-request-id=" + echoed + " " + text
    ); // => Output: GET /gadgets -> 200 x-total-count=2 x-request-id=trace-1 {...}
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
    check(client, port); // => Output: GET /gadgets -> 200 x-total-count=2 x-request-id=trace-1 {"gadgets":[...]}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
