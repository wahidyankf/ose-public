// Example 33: Request Logger Emits JSON Lines.
// Operators read logs with machines, so each request becomes one JSON
// object on its own line: method, path, and status, never timestamps or
// thread names. A middleware appends the entry after the route answers,
// and the check prints the collected lines as the golden output.
// (Concepts: co-02, co-13.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;

public class Main {

  // log appends one JSON line per request to the shared journal.
  // No clock, no thread: the line holds only request facts (co-13).
  static void log(List<String> journal, String method, String path, int status) {
    // => the facts of one request
    // JsonObject.encode() fixes key order: the bytes are stable across runs.
    journal.add(new JsonObject().put("method", method).put("path", path).put("status", status).encode()); // => one machine-readable line
  }

  // buildRouter wires the service with a logging middleware plus two routes.
  // The logger runs after the route: it records the status the route set.
  static Router buildRouter(Vertx vertx, List<String> journal) {
    // => the journal the middleware writes
    // An empty table first: logging middleware plus two routes follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // addBodyEndHandler runs when the response ends: the status is final then.
    router.route().handler(ctx -> {
      String method = ctx.request().method().name(); // => "GET" (type: String)
      String path = ctx.request().path(); // => "/hello" (type: String)
      ctx.addBodyEndHandler(done -> log(journal, method, path, ctx.response().getStatusCode())); // => logged at response end
      ctx.next(); // => the route runs next; logging waits for its end
    });
    // Two routes give the journal two lines: the order matches the checks.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    router.get("/goodbye").handler(ctx ->
      ctx
        .response()
        .setStatusCode(404) // => 404 names the absence deliberately
        .putHeader("content-type", "application/json") // => failures parse like successes
        .end("{\"error\":{\"code\":404,\"message\":\"not found\"}}")
    ); // => 404 inside the error contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process; the journal holds the proof.
  // The golden lines come from the journal, not from the responses.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The response body is discarded: this example asserts the log, not the reply.
    request.send().toCompletionStage().toCompletableFuture().join(); // => the middleware logs at response end
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    List<String> journal = new ArrayList<>(); // => the machine-readable log, two lines by the end
    Router router = buildRouter(vertx, journal); // => the service under test, wired by its builder
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
    check(client, port, "GET", "/hello"); // => logged: {"method":"GET","path":"/hello","status":200}
    check(client, port, "GET", "/goodbye"); // => logged: {"method":"GET","path":"/goodbye","status":404}
    // The journal prints after both requests: log order matches check order.
    for (String line : journal) {
      // => two lines, one per request above
      System.out.println("log " + line); // => Output: log {"method":"GET","path":"/hello","status":200}
    }
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
