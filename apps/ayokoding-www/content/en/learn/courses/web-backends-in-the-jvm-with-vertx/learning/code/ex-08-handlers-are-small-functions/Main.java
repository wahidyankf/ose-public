// Example 8: Handlers Are Small Functions.
// Big handlers mix routing, logic, and rendering until nothing is reusable.
// Small handlers each do one job — one reads state, one shapes the answer —
// so the route table reads like a table of contents. This example splits
// one endpoint across two focused handlers sharing the context.
// (Concepts: co-01, co-03.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // loadGreeting reads the state the answer needs and stores it on the context.
  // Handlers share the context map instead of passing arguments (co-01).
  static void loadGreeting(RoutingContext ctx) {
    // => ctx is the per-request scratch space
    // The value could come from a service; a literal keeps this example small.
    ctx.put("greeting", "hello, vertx"); // => stored under "greeting" for the next handler
    // next() passes control down the matching handler chain.
    ctx.next(); // => without this call the chain stops here
  }

  // writeGreeting shapes the answer from state the earlier handler stored.
  // Rendering stays separate from reading: each handler has one job (co-04).
  static void writeGreeting(RoutingContext ctx) {
    // => runs after loadGreeting stored its value
    String greeting = ctx.get("greeting"); // => "hello, vertx" (type: String)
    ctx
      .response()
      .putHeader("content-type", "application/json") // => the body is JSON (co-04)
      .end("{\"message\":\"" + greeting + "\"}"); // => 200 plus the greeting contract
  }

  // buildRouter wires the service with every route this example serves.
  // One route, two handlers: the chain is the composition (co-01).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the two-handler route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Handlers run in registration order: read first, render second.
    router.get("/hello").handler(Main::loadGreeting).handler(Main::writeGreeting); // => the chain in one line
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
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
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    check(client, port, "GET", "/hello"); // => Output: the same greeting again: handlers hold no state
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
