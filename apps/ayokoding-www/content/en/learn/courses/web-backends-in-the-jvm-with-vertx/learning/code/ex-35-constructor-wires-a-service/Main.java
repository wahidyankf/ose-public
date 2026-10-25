// Example 35: Constructor Wires a Service.
// Handlers stay thin when the logic lives in a service the route receives.
// The builder takes the service as a parameter — no globals, no lookups —
// so the same handler serves any service handed to it. This example greets
// through a service instead of a literal.
// (Concepts: co-01, co-06.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // GadgetService owns the greeting the handler serves.
  // Logic lives here; the handler below only translates HTTP (co-06).
  static class GadgetService {

    // => the dependency the route receives
    // The message is fixed for this course: services still own their data.
    String greet() {
      // => no arguments: the service holds what it needs
      return "hello, vertx"; // => the greeting every route serves (type: String)
    }
  }

  // buildRouter wires the service with the service it needs.
  // Parameters carry dependencies: nothing is looked up or global (co-06).
  static Router buildRouter(Vertx vertx, GadgetService service) {
    // => the service under test, handed in
    // An empty table first: the service-backed route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The handler translates: HTTP in, service call, JSON out.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"" + service.greet() + "\"}")
    ); // => the service answer, rendered
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, service, and response.
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
    // The composition root: services are built here, then handed to routers.
    GadgetService service = new GadgetService(); // => the one service this example needs
    Router router = buildRouter(vertx, service); // => wiring, with the dependency explicit
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
