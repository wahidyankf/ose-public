// Example 39: Config Object Carries Limits.
// Magic numbers scatter; a config object gathers them in one place with
// names. The paging limit clamps to the configured maximum, so callers
// asking for a million rows get the ceiling instead of an outage. This
// example caps the page at ten through a config built at the root.
// (Concepts: co-03, co-06.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // PageConfig gathers the paging rules in one named place.
  // Records carry config: immutable, transparent, and tiny (co-15).
  record PageConfig(int defaultLimit, int maxLimit) {
    // => the two numbers every list honors
  }

  // limitOf clamps the caller's ask to the configured ceiling.
  // Broken input falls to the default: the list stays total (co-10).
  static int limitOf(PageConfig config, java.util.List<String> values) {
    // => values hold the raw strings
    int asked; // => assigned below from the caller's value or the default
    try {
      asked = values == null || values.isEmpty() ? config.defaultLimit() : Integer.parseInt(values.get(0)); // => the caller's ask, or the default
    } catch (NumberFormatException bad) {
      // => "many" cannot become a number
      asked = config.defaultLimit(); // => broken input degrades to the default
    }
    // The ceiling holds for giants and negatives alike: one clamp covers both.
    return Math.min(Math.max(asked, 1), config.maxLimit()); // => within 1..maxLimit, always (type: int)
  }

  // buildRouter wires the service with the config it needs.
  // Config arrives as a parameter: routes never hard-code limits (co-06).
  static Router buildRouter(Vertx vertx, PageConfig config) {
    // => the limits under test, handed in
    // An empty table first: the capped list below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // One clamped read keeps the handler to two lines of real logic.
    router.get("/gadgets").handler(ctx -> {
      int limit = limitOf(config, ctx.queryParam("limit")); // => capped at config.maxLimit() (type: int)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"limit\":" + limit + "}"); // => the honored limit, never the raw ask
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, the clamp, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets -> 200 {"limit":5}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: limits are decided here, honored everywhere.
    PageConfig config = new PageConfig(5, 10); // => default 5, ceiling 10
    Router router = buildRouter(vertx, config); // => wiring, with the limits explicit
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
    check(client, port, "GET", "/gadgets"); // => Output: GET /gadgets -> 200 {"limit":5}
    check(client, port, "GET", "/gadgets?limit=1000000"); // => Output: GET /gadgets?limit=1000000 -> 200 {"limit":10}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
