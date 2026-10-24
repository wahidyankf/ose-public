// Example 69: Two Servers Share One Vertx.
// One runtime hosts several services: two routers bind two ports on the
// same Vert.x instance, and each answers its own routes. The services stay
// isolated — no shared state, no shared table — while the runtime is one.
// This example serves gadgets and orders from one process.
// (Concepts: co-01, co-11.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the gadget service: its own table, its own port.
  // Isolation by construction: this table never sees the orders routes.
  static Router buildGadgets(Vertx vertx) {
    // An empty table first: the gadget route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The gadget answer lives behind its own server below.
    router.get("/gadgets").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"gadgets\":2}")
    ); // => 200 with the gadget count
    // Hand the wired table back to the caller.
    return router;
  }

  // buildOrders wires the order service: a second table, a second port.
  // Same runtime, separate tables: one Vert.x hosts both services (co-11).
  static Router buildOrders(Vertx vertx) {
    // An empty table first: the order route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The order answer lives behind its own server below.
    router.get("/orders").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"orders\":3}")
    ); // => 200 with the order count
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request on one port and prints its status line.
  // The port picks the service: same runtime, different tables (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: the port's router, then response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets -> 200 {"gadgets":2}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both servers and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime both servers share
    // Two binds, two ports: the runtime is shared, the tables are not.
    int gadgets = vertx
      .createHttpServer()
      .requestHandler(buildGadgets(vertx))
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => the gadget service's port
    int orders = vertx
      .createHttpServer()
      .requestHandler(buildOrders(vertx))
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join()
      .actualPort(); // => the order service's port
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client serves both services
    check(client, gadgets, "GET", "/gadgets"); // => Output: GET /gadgets -> 200 {"gadgets":2}
    check(client, orders, "GET", "/orders"); // => Output: GET /orders -> 200 {"orders":3}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
