// Example 12: Form Body Carries Fields.
// Not every client speaks JSON: browsers submit forms. Form fields arrive
// URL-encoded, and the same BodyHandler decodes them into attributes the
// handler reads by name. This example logs in with a form and echoes the
// decoded username back.
// (Concepts: co-03, co-10.)
import io.vertx.core.MultiMap;
import io.vertx.core.Vertx;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Forms decode into attributes: one reader per content type (co-03).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus one route follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes forms and JSON: the handler picks the reader.
    router.route().handler(BodyHandler.create()); // => form fields land in attributes
    // getAttribute reads one decoded form field by its HTML name.
    router.post("/login").handler(ctx -> {
      MultiMap form = ctx.request().formAttributes(); // => {username=..., password=...} (type: MultiMap)
      String username = form.get("username"); // => null when the field is missing (type: String)
      // A missing field is a client error, never a null-pointer crash.
      String shown = username == null ? "nobody" : username; // => "nobody" for empty forms
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"user\":\"" + shown + "\"}"); // => the decoded username echoed back
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts one form in-process and prints its status line.
  // sendForm encodes the fields exactly like a browser would (co-09).
  static void check(WebClient client, int port, MultiMap form, String label) throws Exception {
    // The label names the case in the golden line: the fields stay readable.
    var response = client
      .post(port, "127.0.0.1", "/login") // => POST names the verb under test
      .sendForm(form) // => url-encoded body, browser-style
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line per request: the case label, the status, and the body.
    System.out.println("POST /login " + label + " -> " + response.statusCode() + " " + text); // => Output: POST /login full -> 200 {"user":"gopher"}
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
    // MultiMap.of builds the field list: an even count of names and values.
    check(client, port, MultiMap.caseInsensitiveMultiMap().add("username", "gopher").add("password", "s3cret"), "full"); // => Output: POST /login full -> 200 {"user":"gopher"}
    check(client, port, MultiMap.caseInsensitiveMultiMap(), "empty"); // => Output: POST /login empty -> 200 {"user":"nobody"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
