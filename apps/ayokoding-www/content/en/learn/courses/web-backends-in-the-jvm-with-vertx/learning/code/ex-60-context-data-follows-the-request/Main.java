// Example 60: Context Data Follows the Request.
// Cross-cutting values — request ids, tenants, deadlines — ride the context
// from middleware to handler without polluting signatures. The middleware
// stamps each request with a sequence number, and the handler echoes it,
// so the golden output proves the value followed its own request only.
// (Concepts: co-02, co-03.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.concurrent.atomic.AtomicLong;

public class Main {

  // buildRouter wires the stamping middleware plus one echoing route.
  // The stamp travels on the context: signatures stay clean (co-02).
  static Router buildRouter(Vertx vertx, AtomicLong sequence) {
    // => the stamp source, handed in
    // An empty table first: the stamp middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The stamp lands before any route runs: every handler can read it.
    router.route().handler(ctx -> {
      long n = sequence.incrementAndGet(); // => 1 for the first request (type: long)
      ctx.put("request-id", "req-" + n); // => stored under "request-id" for this request
      ctx.next(); // => the route runs next, stamp aboard
    });
    // The handler echoes its own request's stamp: crosstalk would show here.
    router.get("/hello").handler(ctx -> {
      String id = ctx.get("request-id"); // => "req-1" for the first request (type: String)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"request\":\"" + id + "\"}"); // => the stamp, echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The stamp arrives in the body: context flow made visible.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: stamp, route, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /hello -> 200 {"request":"req-1"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: the stamp source starts at zero.
    AtomicLong sequence = new AtomicLong(0); // => req-1, req-2, in order
    Router router = buildRouter(vertx, sequence); // => wiring, with the source explicit
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
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"request":"req-1"}
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"request":"req-2"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
