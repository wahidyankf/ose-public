// Kata 5: Add a Health-Check Endpoint.
// Balancers need one question answered: readiness stays a separate route
// with a fixed shape, never tangled with business logic. This kata replays
// the probe from Example 63 so the motion becomes reflex.
// (Concepts: co-01, co-14.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Solution {

  // buildRouter wires one business route plus the readiness probe.
  // Probes stay separate: balancers read health without exercising logic.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: business plus probe follow on separate paths.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The business route answers the greeting every test expects.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // The probe answers readiness in one fixed shape: balancers parse this.
    router.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the flag is JSON too
        .end("{\"status\":\"ok\"}")
    ); // => 200 with the readiness flag
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /healthz -> 200 {"status":"ok"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
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
    check(client, port, "GET", "/healthz"); // => Output: GET /healthz -> 200 {"status":"ok"}
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
