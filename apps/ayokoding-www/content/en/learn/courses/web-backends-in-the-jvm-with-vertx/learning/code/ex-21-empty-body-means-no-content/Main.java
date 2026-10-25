// Example 21: Empty Body Means No Content.
// Some answers have nothing to say: a delete that worked, a heartbeat
// with no news. A 204 answers with headers only, and the client must not
// wait for a body that never comes. This example deletes and heartbeats,
// printing the empty marker for both.
// (Concepts: co-01, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Both routes succeed with silence: the status is the answer (co-04).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: deletion plus heartbeat follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // end() with no argument closes the response with an empty body.
    router.delete("/gadgets/1").handler(ctx ->
      ctx
        .response()
        .setStatusCode(204) // => 204 means deleted, with an empty body (co-04)
        .end()
    ); // => the status carries the whole answer
    // A heartbeat with no news answers the same silent way.
    router.get("/ping").handler(ctx ->
      ctx
        .response()
        .setStatusCode(204) // => alive, and nothing to report
        .end()
    ); // => no body follows the headers
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
    String shown = text == null || text.isEmpty() ? "(empty body)" : text; // => both checks land here
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: DELETE /gadgets/1 -> 204 (empty body)
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
    check(client, port, "DELETE", "/gadgets/1"); // => Output: DELETE /gadgets/1 -> 204 (empty body)
    check(client, port, "GET", "/ping"); // => Output: GET /ping -> 204 (empty body)
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
