// Example 16: Content Type Selects the Parser.
// One endpoint can accept several body shapes when each declares its own
// content type. A consumes guard routes JSON to the JSON reader and forms
// to the form reader, instead of one handler guessing. This example takes
// a name from either shape and answers the same contract.
// (Concepts: co-03, co-10.)
import io.vertx.core.MultiMap;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // consumes() splits one path by content type: no guessing inside (co-03).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus two shaped routes follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: the route picks the reader.
    router.route().handler(BodyHandler.create()); // => bytes decoded per content type
    // The JSON shape answers only for application/json callers.
    router
      .post("/greet")
      .consumes("application/json")
      .handler(ctx -> {
        String name = ctx.body().asJsonObject().getString("name", "nobody"); // => JSON reader (type: String)
        ctx
          .response()
          .putHeader("content-type", "application/json") // => the body is JSON (co-04)
          .end("{\"hello\":\"" + name + "\"}"); // => the same contract for both shapes
      });
    // The form shape answers only for url-encoded callers.
    router
      .post("/greet")
      .consumes("application/x-www-form-urlencoded")
      .handler(ctx -> {
        String name = ctx.request().getFormAttribute("name"); // => form reader (type: String)
        // A missing field defaults: the contract stays total for both shapes.
        String shown = name == null ? "nobody" : name; // => "nobody" for empty forms
        ctx
          .response()
          .putHeader("content-type", "application/json") // => the body stays JSON
          .end("{\"hello\":\"" + shown + "\"}"); // => the same contract for both shapes
      });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one shaped body in-process and prints its status line.
  // Each shape sets the content type its route consumes (co-09).
  static void check(WebClient client, int port) throws Exception {
    // JSON first: the consumes guard routes it to the JSON reader.
    var json = client
      .post(port, "127.0.0.1", "/greet") // => POST names the verb under test
      .sendJsonObject(new JsonObject().put("name", "gopher")) // => the JSON shape
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    System.out.println("POST /greet json -> " + json.statusCode() + " " + json.bodyAsString()); // => Output: POST /greet json -> 200 {"hello":"gopher"}
    // Then the form: the same path, the url-encoded reader.
    var form = client
      .post(port, "127.0.0.1", "/greet") // => same path, different shape
      .sendForm(MultiMap.caseInsensitiveMultiMap().add("name", "gopher")) // => the form shape
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the other route answers
    System.out.println("POST /greet form -> " + form.statusCode() + " " + form.bodyAsString()); // => Output: POST /greet form -> 200 {"hello":"gopher"}
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
    check(client, port); // => runs the JSON case then the form case
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
