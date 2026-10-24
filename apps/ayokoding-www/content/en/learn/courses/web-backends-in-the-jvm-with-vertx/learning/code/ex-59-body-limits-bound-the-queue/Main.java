// Example 59: Body Limits Bound the Queue.
// Unbounded bodies are an outage waiting for a caller: one 100MB upload
// can crowd out every other request. A body limit caps each request at
// the boundary, and oversized ones fail fast with 413 before the handler
// spends a byte of logic on them. This example caps bodies at 64 bytes.
// (Concepts: co-03, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the service with a capped body middleware.
  // The cap is the backpressure: oversized bodies never reach logic (co-07).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the capped middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // setBodyLimit(64) fails bodies past 64 bytes: the queue stays bounded.
    router.route().handler(BodyHandler.create().setBodyLimit(64)); // => the boundary guard, in bytes
    // Oversized bodies never arrive here: the middleware fails them first.
    router.post("/echo").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => at most 64 bytes, by construction
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(new JsonObject().put("name", body.getString("name", "nobody")).encode()); // => the parsed name echoed back
    });
    // The 413 catcher shapes the bound as the error contract (co-05).
    router.errorHandler(413, ctx ->
      ctx
        .response()
        .setStatusCode(413) // => 413 names the oversized body deliberately
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end("{\"error\":{\"code\":413,\"message\":\"body too large\"}}")
    ); // => the bound, in the contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one raw body in-process and prints its status line.
  // Raw bytes control the size: JSON encoding would hide the byte count.
  static void check(WebClient client, int port, String payload, String label) throws Exception {
    // sendBuffer carries exact bytes: the middleware measures, not the encoder.
    var response = client
      .post(port, "127.0.0.1", "/echo") // => POST names the verb under test
      .putHeader("content-type", "application/json") // => the handler attempts a JSON decode
      .sendBuffer(Buffer.buffer(payload)) // => the bytes under test, sized on purpose
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the guard answers, then logic
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the case label, the status, and the body.
    System.out.println("POST /echo " + label + " -> " + response.statusCode() + " " + text); // => Output: POST /echo small -> 200 {"name":"gopher"}
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
    check(client, port, "{\"name\":\"gopher\"}", "small"); // => Output: POST /echo small -> 200 {"name":"gopher"}
    check(client, port, "{\"name\":\"" + "g".repeat(200) + "\"}", "large"); // => Output: POST /echo large -> 413 {"error":{"code":413,"message":"body too large"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
