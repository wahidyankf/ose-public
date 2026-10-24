// Example 45: Check Helper Drives One Request.
// Every test in this course is one helper: build the request, send it,
// print method, path, status, and body. The helper keeps tests to one line
// each and the golden output to one line per request. This example names
// the pattern every later example reuses without comment.
// (Concepts: co-01, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Small on purpose: the check helper below is the real subject (co-09).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route is enough to demonstrate the helper.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The route answers JSON: the helper prints whatever the route writes.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check is the course's testing atom: one request, one golden line.
  // Tests compose from this helper: tables loop it, stories sequence it.
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // The client and the server share one JVM: no socket, no network (co-09).
    // Nothing here dials a fixed port: the port arrives as an argument.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target); // => server-side request, no socket
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
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
