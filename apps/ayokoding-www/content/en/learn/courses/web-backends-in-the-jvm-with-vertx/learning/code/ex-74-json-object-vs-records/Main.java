// Example 74: JSON Object vs Records.
// Untyped JsonObject bends without breaking: any key, any shape, no
// compiler help. Records fix the boundary in types the compiler checks:
// the handler builds a Gadget from the body, and later code reads typed
// accessors instead of stringly keys. This example parses the same body
// both ways and prints which one the compiler can see.
// (Concepts: co-15, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // Gadget fixes the boundary in a type: name plus watts, both checked.
  // Records carry rows the compiler can see: typos fail here, not later.
  record Gadget(String name, int watts) {
    // => the typed boundary (co-15)
  }

  // buildRouter wires the service with two parsers over one shape.
  // Loose then strict: the outputs name which is which (co-16).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus two parsers follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: the parsers read the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // The loose read: keys as strings, no compiler help on the shape.
    router.post("/loose").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => untyped: any key goes
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(new JsonObject().put("name", body.getString("name")).put("watts", body.getInteger("watts")).encode()); // => echoed, unchecked
    });
    // The strict read: the body becomes a Gadget the compiler knows.
    router.post("/strict").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => untyped at the edge, once
      Gadget gadget = new Gadget(body.getString("name", "nobody"), body.getInteger("watts", 0)); // => typed from here on (type: Gadget)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("name", gadget.name()).put("watts", gadget.watts()).encode()); // => echoed through accessors, not keys
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one body to one parser and prints its status line.
  // Both parsers answer the same contract: the types differ, not the bytes.
  static void check(WebClient client, int port, String path) throws Exception {
    // The payload travels as JSON: loose and strict read the same bytes.
    var response = client
      .post(port, "127.0.0.1", path) // => the parser under test
      .sendJsonObject(new JsonObject().put("name", "drill").put("watts", 40)) // => the body under test
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the parser runs, then the route
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the path, the status, and the body.
    System.out.println("POST " + path + " -> " + response.statusCode() + " " + text); // => Output: POST /loose -> 200 {"name":"drill","watts":40}
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
    check(client, port, "/loose"); // => Output: POST /loose -> 200 {"name":"drill","watts":40}
    check(client, port, "/strict"); // => Output: POST /strict -> 200 {"name":"drill","watts":40}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
