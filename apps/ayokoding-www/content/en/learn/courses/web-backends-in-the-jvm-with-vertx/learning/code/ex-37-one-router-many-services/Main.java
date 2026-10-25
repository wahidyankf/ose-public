// Example 37: One Router, Many Services.
// Real services compose several domains, each with its own service. The
// builder takes both and mounts each under its group, so gadgets and orders
// evolve independently behind one router. This example serves both groups
// from two services through one table.
// (Concepts: co-06, co-11.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // GadgetService answers the gadget group with a fixed collection.
  // One domain, one service: groups evolve without touching each other.
  static class GadgetService {

    // => the gadget domain, standing alone
    // count names how many gadgets the group reports.
    int count() {
      // => no arguments: the service holds its answer
      return 2; // => the fixed collection size (type: int)
    }
  }

  // OrderService answers the order group with a fixed collection.
  // A second domain proves the router composes services, not routes (co-06).
  static class OrderService {

    // => the order domain, standing alone
    // count names how many orders the group reports.
    int count() {
      // => no arguments: the service holds its answer
      return 3; // => the fixed collection size (type: int)
    }
  }

  // buildRouter wires the service with both services it needs.
  // Groups mount per service: domains stay separate behind one table (co-11).
  static Router buildRouter(Vertx vertx, GadgetService gadgets, OrderService orders) {
    // => both domains, handed in
    // An empty table first: two groups mount below, nothing else.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The gadget group serves the gadget service's answer.
    Router api = Router.router(vertx); // => the group both domains share below
    api.get("/gadgets").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"gadgets\":" + gadgets.count() + "}")
    ); // => 2, from the gadget service
    // The order group serves the order service's answer.
    api.get("/orders").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"orders\":" + orders.count() + "}")
    ); // => 3, from the order service
    // One mount carries both groups: composition at the table level.
    router.route("/api/*").subRouter(api); // => /api/gadgets and /api/orders resolve
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, services, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /api/gadgets -> 200 {"gadgets":2}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: one service per domain, built side by side.
    GadgetService gadgets = new GadgetService(); // => the gadget domain
    OrderService orders = new OrderService(); // => the order domain
    Router router = buildRouter(vertx, gadgets, orders); // => wiring, with both dependencies explicit
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
    check(client, port, "GET", "/api/gadgets"); // => Output: GET /api/gadgets -> 200 {"gadgets":2}
    check(client, port, "GET", "/api/orders"); // => Output: GET /api/orders -> 200 {"orders":3}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
