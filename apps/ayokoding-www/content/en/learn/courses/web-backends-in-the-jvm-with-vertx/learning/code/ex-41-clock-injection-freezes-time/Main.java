// Example 41: Clock Injection Freezes Time.
// Handlers that read the clock print a different answer every run, and
// golden tests cannot pin a moving target. A clock behind a seam answers a
// fixed instant in tests and the real clock in production. This example
// stamps creations with a frozen instant, byte-identical every run.
// (Concepts: co-06, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // Clock names the time seam: now answers the current instant as text.
  // Tests freeze it; production wires the real clock behind this seam.
  interface Clock {
    // => the seam time hides behind
    // now answers the current instant in ISO text.
    String now(); // => the stamp every creation carries
  }

  // FrozenClock answers one instant forever: the test double under test.
  // Deterministic by construction: golden output never moves (co-09).
  static class FrozenClock implements Clock {

    // => the test implementation
    public String now() {
      // => must be public: it implements the seam
      return "2026-01-01T00:00:00Z"; // => the frozen instant every creation stamps
    }
  }

  // buildRouter wires the service with the clock it needs.
  // The stamp comes from the seam: the handler never reads the clock (co-06).
  static Router buildRouter(Vertx vertx, Clock clock) {
    // => time, handed in
    // An empty table first: middleware plus one creation follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: creation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // The stamp is a service answer, not a wall-clock read: frozen in tests.
    router.post("/gadgets").handler(ctx -> {
      String name = ctx.body().asJsonObject().getString("name", "unnamed"); // => the gadget to stamp (type: String)
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("name", name).put("createdAt", clock.now()).encode()); // => the frozen stamp, every run
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check creates one gadget in-process and prints its status line.
  // The stamp is asserted: frozen time makes the line golden (co-09).
  static void check(WebClient client, int port) throws Exception {
    // Creation carries the stamp: the only clock in this program is frozen.
    var response = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject().put("name", "drill")) // => the gadget to stamp
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: status plus the body with its frozen stamp.
    System.out.println("POST /gadgets -> " + response.statusCode() + " " + text); // => Output: POST /gadgets -> 201 {"name":"drill","createdAt":"2026-01-01T00:00:00Z"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The test wires the frozen clock: golden output never moves.
    Clock clock = new FrozenClock(); // => 2026-01-01 forever in this program
    Router router = buildRouter(vertx, clock); // => wiring, with time explicit
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
    check(client, port); // => Output: POST /gadgets -> 201 {"name":"drill","createdAt":"2026-01-01T00:00:00Z"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
