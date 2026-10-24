// Example 13: Reject Malformed JSON with 400.
// Broken bytes reach every public API eventually, and a handler that
// assumes valid JSON throws a 500 on the caller's mistake. Catching the
// decode failure turns it into a 400 with the error contract, so the
// client learns what to fix. This example posts one broken body.
// (Concepts: co-05, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.json.DecodeException;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The try around decoding is the whole validation story here (co-10).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // BodyHandler reads the bytes; decoding happens in the handler below.
    router.route().handler(BodyHandler.create()); // => raw bytes land in the body buffer
    // A broken body is a client bug: 400 names it, 500 would blame the server.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body; // => assigned below, or the handler returns early
      // Decoding is the risky step: it throws where parsing would merely default.
      try {
        body = ctx.body().asJsonObject(); // => throws DecodeException on broken JSON
        // The catch answers in the error contract: 400, JSON, and what to fix.
      } catch (DecodeException broken) {
        // => the caller's bytes, not our bug
        ctx
          .response()
          .setStatusCode(400) // => 400 blames the request, never the service (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":400,\"message\":\"malformed json\"}}"); // => the stable error contract
        return; // => the handler is done: no gadget is created
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(new JsonObject().put("name", body.getString("name", "unnamed")).encode()); // => the parsed name echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts raw bytes in-process and prints the status line.
  // Raw bytes reach the handler exactly as a broken client would send them.
  static void check(WebClient client, int port, String payload, String label) throws Exception {
    // sendBuffer skips JSON encoding: the bytes travel untouched, flaws included.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .putHeader("content-type", "application/json") // => the handler attempts a JSON decode
      .sendBuffer(io.vertx.core.buffer.Buffer.buffer(payload)) // => broken on purpose for one case
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the case label, the status, and the body.
    System.out.println("POST /gadgets " + label + " -> " + response.statusCode() + " " + text); // => Output: POST /gadgets broken -> 400 {"error":{"code":400,"message":"malformed json"}}
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
    check(client, port, "{\"name\":", "broken"); // => Output: POST /gadgets broken -> 400 {"error":{"code":400,"message":"malformed json"}}
    check(client, port, "{\"name\":\"drill\"}", "valid"); // => Output: POST /gadgets valid -> 200 {"name":"drill"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
