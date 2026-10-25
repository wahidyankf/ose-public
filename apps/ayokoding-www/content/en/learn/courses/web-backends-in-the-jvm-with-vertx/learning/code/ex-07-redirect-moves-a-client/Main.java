// Example 7: Redirect Moves a Client.
// A redirect answers with a status and a Location header instead of a body.
// The client decides whether to follow; this example reads the contract
// directly, printing the status plus the destination the server named.
// The old path stays reachable forever as a pointer, never as content.
// (Concepts: co-01, co-04.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.client.WebClientOptions;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The old path is a pointer; the new path holds the content (co-01).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: a pointer route plus a content route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // redirect ends the response with 302 and a Location header, no body.
    // Callers learn the new address without the server duplicating content.
    router.get("/welcome").handler(ctx -> ctx.redirect("/hello")); // => 302 to the canonical path
    // The canonical route holds the real greeting every pointer names.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints status plus location.
  // Headers are asserted like bodies: the redirect lives in them (co-04).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String location = response.getHeader("location"); // => "/hello" for the pointer (type: String)
    String text = response.bodyAsString(); // => the greeting bytes on the canonical route
    // The printed line names the move when one exists, else the body itself.
    String shown = location == null ? text : "location=" + location; // => pointers carry headers, content carries bodies
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /welcome -> 302 location=/hello
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
    // Redirects stay unread: the check asserts the 302 contract itself.
    WebClient client = WebClient.create(vertx, new WebClientOptions().setFollowRedirects(false)); // => one client serves every check
    check(client, port, "GET", "/welcome"); // => Output: GET /welcome -> 302 location=/hello
    check(client, port, "GET", "/hello"); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
