// Example 4: Method and Path Pick the Handler.
// The same path can serve different verbs, and Vert.x routes each pair
// separately. GET reads the resource while POST replaces it, so one path
// hosts two handlers with no if-statements. This example registers both
// verbs on /notes and prints what each one answers.
// (Concepts: co-01, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Method plus path picks the handler: GET and POST diverge here (co-01).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: routes are added below, none exists yet.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // GET /notes reads: the handler answers what the collection holds.
    router.get("/notes").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"notes\":[]}")
    ); // => 200 with the empty collection
    // POST /notes writes: same path, different verb, different handler.
    router.post("/notes").handler(ctx ->
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation, not a bare 200 (co-04)
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"created\":true}")
    ); // => the creation receipt
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
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /notes -> 200 {"notes":[]}
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
    check(client, port, "GET", "/notes"); // => Output: GET /notes -> 200 {"notes":[]}
    check(client, port, "POST", "/notes"); // => Output: POST /notes -> 201 {"created":true}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
