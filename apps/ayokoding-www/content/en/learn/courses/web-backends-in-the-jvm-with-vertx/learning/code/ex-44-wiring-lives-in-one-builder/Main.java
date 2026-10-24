// Example 44: Wiring Lives in One Builder.
// Composition roots beat scattered news: one builder takes every service
// and returns the finished router, so main reads like a parts list. New
// domains add one parameter and one mount, never a hunt through handlers.
// This example assembles gadgets plus a health check in a single builder.
// (Concepts: co-06, co-11.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // GadgetService answers the gadget group with a fixed collection.
  // One domain, one service: the builder composes them below (co-06).
  static class GadgetService {

    // => the gadget domain, standing alone
    // count names how many gadgets the group reports.
    int count() {
      // => no arguments: the service holds its answer
      return 2; // => the fixed collection size (type: int)
    }
  }

  // Health answers readiness with a fixed flag: the simplest service.
  // Even one-liners are services: the builder treats every domain alike.
  static class Health {

    // => the readiness domain, standing alone
    // ready names whether the service accepts traffic right now.
    boolean ready() {
      // => no arguments: the answer is fixed here
      return true; // => ready from the first request (type: boolean)
    }
  }

  // buildRouter is the composition root: every service enters here.
  // One builder, one router: main stays a three-line parts list (co-06).
  static Router buildRouter(Vertx vertx, GadgetService gadgets, Health health) {
    // => every domain, handed in
    // An empty table first: groups mount below, nothing else.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The gadget group serves its service behind the shared prefix.
    Router api = Router.router(vertx); // => the group both domains share below
    api.get("/gadgets").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"gadgets\":" + gadgets.count() + "}")
    ); // => 2, from the gadget service
    // The health endpoint is a domain too: readiness behind the same table.
    api.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end("{\"ready\":" + health.ready() + "}")
    ); // => true, from the health service
    // One mount carries the group: composition at the table level (co-11).
    router.route("/api/*").subRouter(api); // => /api/gadgets and /api/healthz resolve
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, services, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /api/gadgets -> 200 {"gadgets":2}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The parts list: one service per domain, built in the open.
    GadgetService gadgets = new GadgetService(); // => the gadget domain
    Health health = new Health(); // => the readiness domain
    Router router = buildRouter(vertx, gadgets, health); // => one builder assembles the service
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
    check(client, port, "GET", "/api/gadgets"); // => Output: GET /api/gadgets -> 200 {"gadgets":2}
    check(client, port, "GET", "/api/healthz"); // => Output: GET /api/healthz -> 200 {"ready":true}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
