// Example 18: Status Codes Say What Happened.
// The status code is the first thing a client reads: 201 means a resource
// was created, 204 means the delete worked and there is nothing to show.
// Handlers set the code explicitly instead of leaving every answer at 200.
// This example creates and deletes one gadget, printing both codes.
// (Concepts: co-01, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Each verb owns its success code: creation differs from deletion (co-04).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one creation plus one deletion follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // 201 Created: the response names the new resource in its body.
    router.post("/gadgets").handler(ctx ->
      ctx
        .response()
        .setStatusCode(201) // => 201 means created, not a bare 200 (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end("{\"id\":1}")
    ); // => the new resource, addressable from here
    // 204 No Content: success with nothing to show must still say so.
    router.delete("/gadgets/1").handler(ctx ->
      ctx
        .response()
        .setStatusCode(204) // => 204 means deleted, with an empty body (co-04)
        .end()
    ); // => no body: the code carries the whole answer
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
    String shown = text == null || text.isEmpty() ? "(empty body)" : text; // => the 204 case lands here
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: POST /gadgets -> 201 {"id":1}
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
    check(client, port, "POST", "/gadgets"); // => Output: POST /gadgets -> 201 {"id":1}
    check(client, port, "DELETE", "/gadgets/1"); // => Output: DELETE /gadgets/1 -> 204 (empty body)
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
