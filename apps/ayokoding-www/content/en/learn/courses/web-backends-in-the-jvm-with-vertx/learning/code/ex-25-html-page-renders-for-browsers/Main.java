// Example 25: HTML Page Renders for Browsers.
// Not every route serves machines: a status page renders HTML a human can
// read. The handler sets the HTML content type and writes a small page,
// proving one router serves both APIs and pages. This example loads the
// dashboard and asserts its title made it into the body.
// (Concepts: co-04, co-12.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The same router serves pages and JSON: only the tongue differs (co-12).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the page route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // text/html tells the browser to render, not to download.
    router.get("/dashboard").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "text/html") // => the page tongue (co-04)
        .end("<html><body><h1>Gadget Dashboard</h1></body></html>")
    ); // => the smallest honest page
    // Hand the wired table back to the caller.
    return router;
  }

  // check loads one page in-process and prints its status line.
  // Pages assert like APIs: the body carries the proof (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, handlers, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    String type = response.getHeader("content-type"); // => "text/html" (type: String)
    // The title check proves the page rendered: contains, not equality, on purpose.
    boolean titled = text != null && text.contains("<h1>Gadget Dashboard</h1>"); // => true for this page
    // One golden line: status, tongue, whether the title rendered, and the body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + type + " titled=" + titled); // => Output: GET /dashboard -> 200 text/html titled=true
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
    check(client, port, "GET", "/dashboard"); // => Output: GET /dashboard -> 200 text/html titled=true
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
