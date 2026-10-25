// Example 11: Parse JSON Body into Typed Values.
// Bodies arrive as bytes; handlers need typed fields. A BodyHandler reads
// the bytes once, and the handler pulls typed getters off the resulting
// JsonObject: strings, integers, and nested objects. This example creates
// a gadget from a JSON body and echoes its typed fields back.
// (Concepts: co-03, co-15.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // BodyHandler runs first so the body is parsed before logic reads it.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Without this line ctx.body() is empty: parsing is opt-in, not magic.
    router.route().handler(BodyHandler.create()); // => reads the bytes into a JsonObject
    // Typed getters replace stringly parsing: the boundary is typed (co-15).
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => {"name":"...","watts":...} (type: JsonObject)
      String name = body.getString("name", "unnamed"); // => "unnamed" when absent (type: String)
      int watts = body.getInteger("watts", 0); // => 0 when absent (type: int)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(new JsonObject().put("name", name).put("watts", watts).encode()); // => the typed fields echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one JSON body in-process and prints its status line.
  // sendJsonObject sets the content type the handler expects (co-09).
  static void check(WebClient client, int port, String payload) throws Exception {
    // The payload travels as JSON: the handler parses, never string-splits.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the body under test, parsed once
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the sent payload, the status, and the body.
    System.out.println("POST /gadgets " + payload + " -> " + response.statusCode() + " " + text); // => Output: POST /gadgets {"name":"drill","watts":40} -> 200 {...}
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
    check(client, port, "{\"name\":\"drill\",\"watts\":40}"); // => Output: POST /gadgets {"name":"drill","watts":40} -> 200 {"name":"drill","watts":40}
    check(client, port, "{}"); // => Output: POST /gadgets {} -> 200 {"name":"unnamed","watts":0}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
