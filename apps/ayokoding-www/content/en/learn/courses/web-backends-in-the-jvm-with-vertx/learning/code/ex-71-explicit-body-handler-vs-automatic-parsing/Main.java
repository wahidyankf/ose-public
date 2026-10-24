// Example 71: Explicit Body Handler vs Automatic Parsing.
// FastAPI parses bodies before the handler runs; Vert.x parses only where
// a BodyHandler is installed. Explicitness trades one line per route for
// control over limits, uploads, and shapes. This example installs the
// middleware per route on one path and globally for contrast, proving both
// placements parse the same body.
// (Concepts: co-02, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the same creation twice: per-route versus global.
  // Placement is the lesson: parsing is explicit, never ambient (co-16).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: two placements of one creation follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Per-route placement: only this path pays for parsing.
    router
      .post("/explicit")
      .handler(BodyHandler.create())
      .handler(ctx -> {
        // => parsing installed on the route itself
        String name = ctx.body().asJsonObject().getString("name", "nobody"); // => parsed by the route's own middleware
        ctx
          .response()
          .putHeader("content-type", "application/json") // => the body is JSON (co-04)
          .end(new JsonObject().put("name", name).put("via", "explicit").encode()); // => the name plus its placement
      });
    // Global placement: every route below this line parses.
    router.route().handler(BodyHandler.create()); // => parsing for the routes that follow
    // No per-route middleware here: the global one above already decoded.
    router.post("/global").handler(ctx -> {
      // => parsed by the global middleware
      String name = ctx.body().asJsonObject().getString("name", "nobody"); // => same read, different placement
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("name", name).put("via", "global").encode()); // => the name plus its placement
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one body to one placement and prints its status line.
  // Both placements answer the same contract: control, not magic.
  static void check(WebClient client, int port, String path) throws Exception {
    // The payload travels as JSON: placement decides who decodes it.
    var response = client
      .post(port, "127.0.0.1", path) // => the placement under test
      .sendJsonObject(new JsonObject().put("name", "gopher")) // => the body under test, parsed twice over
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the middleware runs, then the route
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the path, the status, and the body.
    System.out.println("POST " + path + " -> " + response.statusCode() + " " + text); // => Output: POST /explicit -> 200 {"name":"gopher","via":"explicit"}
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
    check(client, port, "/explicit"); // => Output: POST /explicit -> 200 {"name":"gopher","via":"explicit"}
    check(client, port, "/global"); // => Output: POST /global -> 200 {"name":"gopher","via":"global"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
