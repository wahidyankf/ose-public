// Example 17: Query Defaults Keep Handlers Total.
// Optional parameters should not fork the handler into present and absent
// branches at every use. Reading each value once through a defaulting
// helper keeps one straight path from request to response. This example
// greets in a language the caller picks, defaulting to English.
// (Concepts: co-03, co-10.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // firstOf reads one named query value, defaulting when it is absent.
  // Callers pass the fallback that fits their contract (co-03).
  static String firstOf(java.util.List<String> values, String fallback) {
    // => values hold the raw strings
    // Empty means absent: the caller omitted the parameter entirely.
    if (values == null || values.isEmpty()) {
      // => no value arrived
      return fallback; // => the default stands in, no branch in the handler
    }
    return values.get(0); // => the caller's value wins when present (type: String)
  }

  // buildRouter wires the service with every route this example serves.
  // The language parameter is optional: the handler stays single-pathed.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the greeting route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // One read with a default: no if-statements fork the handler below.
    router.get("/greet").handler(ctx -> {
      String lang = firstOf(ctx.queryParam("lang"), "en"); // => "en" for /greet (type: String)
      String hello = lang.equals("id") ? "halo" : "hello"; // => two languages, one line
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"hello\":\"" + hello + "\"}"); // => the greeting in the chosen language
    });
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /greet -> 200 {"hello":"hello"}
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
    check(client, port, "GET", "/greet"); // => Output: GET /greet -> 200 {"hello":"hello"}
    check(client, port, "GET", "/greet?lang=id"); // => Output: GET /greet?lang=id -> 200 {"hello":"halo"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
