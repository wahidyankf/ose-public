// Example 27: Middleware Order Is the Contract.
// Several middleware share one chain, and registration order decides who
// runs first. Each one appends its name to a list seeded on the context,
// so the final handler prints the exact visit order. This example proves
// first, second, then the route ran in that order.
// (Concepts: co-02, co-03.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;

public class Main {

  // buildRouter wires the service with three middleware plus one route.
  // Registration order is execution order: the list below proves it (co-02).
  // Every middleware runs for this request: no path filters narrow the chain.
  // The seeder must run first: recorders assume the list already exists.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: a seeder, two recorders, and one route follow.
    // The seeder carries no name: setup stays invisible in the golden order.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The seeder runs before every recorder: the list exists from here on.
    router.route().handler(ctx -> {
      ctx.put("order", new ArrayList<String>()); // => the visit log, empty for now
      ctx.next(); // => the first recorder runs after this returns
    });
    // First registered recorder, first recorded: the name lands at position zero.
    router.route().handler(ctx -> {
      ctx.<List<String>>get("order").add("first"); // => recorded before "second"
      ctx.next(); // => the second recorder runs after this returns
    });
    // Second registered recorder, second recorded: chains compose by appending.
    router.route().handler(ctx -> {
      ctx.<List<String>>get("order").add("second"); // => recorded before "handler"
      ctx.next(); // => the route handler runs after this returns
    });
    // The route reads the visit order the middleware recorded.
    // Reading last proves the route ran after every middleware above.
    router.get("/order").handler(ctx -> {
      List<String> order = ctx.get("order"); // => ["first", "second"] so far (type: List)
      order.add("handler"); // => the route runs last, as registered last
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("[\"" + String.join("\",\"", order) + "\"]"); // => the visit order as the contract
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The visit order arrives in the body: registration order made visible.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /order -> 200 ["first","second","handler"]
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
    check(client, port, "GET", "/order"); // => Output: GET /order -> 200 ["first","second","handler"]
    check(client, port, "GET", "/order"); // => Output: the seed runs per request, so the order repeats exactly
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
