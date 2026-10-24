// Example 28: BodyHandler Unlocks JSON Parsing.
// Reading a body is opt-in: without BodyHandler the bytes never reach the
// handler, and parsing sees nothing. Two routers prove the difference —
// one with the middleware, one without — serving the same path on two
// ports and printing how many body bytes each one saw.
// (Concepts: co-02, co-03.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // echo answers with how many body bytes the handler could see.
  // The count is the proof: parsing on versus parsing off (co-03).
  // Without the middleware the body is absent, not empty: buffer() is null.
  static void echo(io.vertx.ext.web.RoutingContext ctx, String label) {
    // => label names the router under test
    int seen = ctx.body().available() ? ctx.body().buffer().length() : 0; // => 17 with the handler, 0 without
    String name = seen == 0 ? "(empty)" : ctx.body().asJsonObject().getString("name", "(empty)"); // => parsed only when bytes exist
    ctx
      .response()
      .putHeader("content-type", "application/json") // => the body is JSON (co-04)
      .end(new JsonObject().put("router", label).put("body-bytes", seen).put("name", name).encode()); // => the bytes seen, as the contract
  }

  // buildRouter wires one router, with or without the body middleware.
  // The flag is the whole difference: parsing is opt-in, not magic (co-02).
  static Router buildRouter(Vertx vertx, boolean withBody, String label) {
    // => label travels into the echo
    // An empty table first: optional middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Only the "with" router decodes: the other reads raw, empty bytes.
    if (withBody) {
      // => the opt-in branch installs the middleware
      router.route().handler(BodyHandler.create()); // => bytes decoded into the body
    }
    // Both routers share the echo: the middleware decides what it sees.
    router.post("/echo").handler(ctx -> echo(ctx, label)); // => same path, different sight
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one JSON body to one port and prints its status line.
  // The port picks the router: with middleware or without (co-09).
  static void check(WebClient client, int port, String payload) throws Exception {
    // The payload travels as JSON: sight depends on the router, not the bytes.
    var response = client
      .post(port, "127.0.0.1", "/echo") // => POST names the verb under test
      .sendJsonObject(new JsonObject(payload)) // => the body under test, parsed once
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the payload, the status, and the body.
    System.out.println("POST /echo " + payload + " -> " + response.statusCode() + " " + text); // => Output: POST /echo {"name":"gopher"} -> 200 {...}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both servers and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // Two routers, two ports: the middleware is the only difference.
    int with = vertx
      .createHttpServer()
      .requestHandler(buildRouter(vertx, true, "with"))
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => the parsing router's port
    int without = vertx
      .createHttpServer()
      .requestHandler(buildRouter(vertx, false, "without"))
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => the blind router's port
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, with, "{\"name\":\"gopher\"}"); // => Output: POST /echo {"name":"gopher"} -> 200 {"router":"with","body-bytes":17,"name":"gopher"}
    check(client, without, "{\"name\":\"gopher\"}"); // => Output: POST /echo {"name":"gopher"} -> 200 {"router":"without","body-bytes":0,"name":"(empty)"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
