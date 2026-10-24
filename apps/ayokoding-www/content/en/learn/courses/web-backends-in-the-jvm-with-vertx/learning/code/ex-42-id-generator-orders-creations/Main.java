// Example 42: ID Generator Orders Creations.
// Creation order is data worth keeping: the first gadget is 1, the second
// is 2, and gaps would confuse clients. A sequence counter hands out ids
// in order, and the handler renders each one. This example creates three
// gadgets and prints the ordered ids.
// (Concepts: co-03, co-06.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;
import java.util.concurrent.atomic.AtomicLong;

public class Main {

  // buildRouter wires the service with the sequence it needs.
  // The counter is a dependency like any service: handed in, not global.
  static Router buildRouter(Vertx vertx, AtomicLong sequence) {
    // => the id source, handed in
    // An empty table first: middleware plus one creation follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: creation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // incrementAndGet hands the next id: atomic, so concurrent posts stay ordered.
    router.post("/gadgets").handler(ctx -> {
      String name = ctx.body().asJsonObject().getString("name", "unnamed"); // => the gadget to number (type: String)
      long id = sequence.incrementAndGet(); // => 1, then 2, then 3 in this program (type: long)
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("id", id).put("name", name).encode()); // => the ordered address
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check creates three gadgets in-process and prints each address.
  // Order is the contract: the ids must read 1, 2, 3 (co-09).
  static void check(WebClient client, int port) throws Exception {
    // Three creations in a row: the sequence must not skip or repeat.
    String[] names = { "alpha", "beta", "gamma" }; // => three gadgets, created in this order
    // Each creation prints its own line: the golden output is the order.
    for (String name : names) {
      // => alpha, then beta, then gamma
      var response = client
        .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
        .sendJsonObject(new JsonObject().put("name", name)) // => the gadget to number
        .toCompletionStage()
        .toCompletableFuture()
        .join(); // => the sequence advances once per post
      System.out.println("POST /gadgets " + name + " -> " + response.statusCode() + " " + response.bodyAsString()); // => Output: POST /gadgets alpha -> 201 {"id":1,...}
    }
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: the sequence starts at zero, first creation is 1.
    AtomicLong sequence = new AtomicLong(0); // => ordered ids from here on
    Router router = buildRouter(vertx, sequence); // => wiring, with the counter explicit
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
    check(client, port); // => Output: three creations with ids 1, 2, 3 in order
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
