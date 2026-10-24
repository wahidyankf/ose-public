// Example 24: Cookies Remember the Client.
// HTTP forgets every request, so servers hand the client a cookie to bring
// back next time. The handler sets the cookie with a Set-Cookie header,
// and reads it back from the Cookie header on later calls. This example
// visits twice: unknown first, remembered second.
// (Concepts: co-03, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The cookie is the memory: the server itself stays stateless (co-03).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the remembering route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // No cookie means a first visit: the server hands one over.
    // A cookie means a return: the server reads who is back.
    router.get("/visit").handler(ctx -> {
      String cookie = ctx.request().getHeader("cookie"); // => null on the first visit
      // contains() tolerates extra cookies: the check stays loose on purpose.
      boolean known = cookie != null && cookie.contains("visitor=gopher"); // => false first, true later
      // Set-Cookie on every answer keeps the memory fresh for the next call.
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .putHeader("set-cookie", "visitor=gopher; Path=/"); // => the memory the client carries
      // The body names the visit: first or returning, exactly one is true.
      ctx.response().end(known ? "{\"visit\":\"returning\"}" : "{\"visit\":\"first\"}"); // => the memory read back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check visits with or without a cookie and prints the status line.
  // The cookie jar is manual: the helper passes the header through (co-09).
  static void check(WebClient client, int port, String cookie) throws Exception {
    // The request carries the cookie, or none on the very first visit.
    var request = client.request(HttpMethod.GET, port, "127.0.0.1", "/visit"); // => GET names the verb under test
    // Null means a first visit: the unknown branch is asserted, not assumed.
    if (cookie != null) {
      // => one branch remembers, one arrives fresh
      request.putHeader("cookie", cookie); // => the memory under test
    }
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    String set = response.getHeader("set-cookie"); // => the memory handed over (type: String)
    // One golden line: the sent cookie, the status, the new cookie, the body.
    System.out.println(
      "GET /visit cookie=" + cookie + " -> " + response.statusCode() + " set-cookie=" + set + " " + text
    ); // => Output: GET /visit cookie=null -> 200 set-cookie=visitor=gopher; Path=/ {...}
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
    check(client, port, null); // => Output: GET /visit cookie=null -> 200 set-cookie=visitor=gopher; Path=/ {"visit":"first"}
    check(client, port, "visitor=gopher"); // => Output: GET /visit cookie=visitor=gopher -> 200 set-cookie=visitor=gopher; Path=/ {"visit":"returning"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
