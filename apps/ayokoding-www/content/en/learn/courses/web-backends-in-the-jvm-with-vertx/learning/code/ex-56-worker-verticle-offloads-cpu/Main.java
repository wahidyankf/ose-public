// Example 56: Worker Verticle Offloads CPU.
// Heavy computation deserves its own home: a worker verticle answers
// event-bus messages off the event loop, and the HTTP handler asks it
// per request. The route stays thin while the worker squares numbers.
// This example deploys the worker, then squares 6 and 7 through HTTP.
// (Concepts: co-06, co-07.)
import io.vertx.core.AbstractVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.ThreadingModel;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // SquareWorker answers "square" messages with the squared number.
  // Workers run off-loop: CPU-heavy work never steals the loop (co-07).
  static class SquareWorker extends AbstractVerticle {

    // => the off-loop computation
    public void start() {
      // => the bus address is registered on deploy
      // The consumer lives as long as the verticle: one address, many asks.
      vertx.eventBus().consumer("square", message -> {
        int n = (int) message.body(); // => 6 for the first check (type: int)
        message.reply(n * n); // => 36: the answer travels back on the bus
      });
    }
  }

  // buildRouter wires one route that asks the worker per request.
  // The handler is a messenger: ask on the bus, render the reply (co-06).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the delegating route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // request() asks and waits: the reply completes the HTTP response.
    router.get("/square/:n").handler(ctx -> {
      int n = Integer.parseInt(ctx.pathParam("n")); // => "6" becomes 6 (type: int)
      ctx
        .vertx()
        .eventBus()
        .<Integer>request("square", n) // => the ask, off the loop
        .onSuccess(reply ->
          ctx
            .response() // => the worker answered: render it
            .putHeader("content-type", "application/json") // => the body is JSON (co-04)
            .end("{\"square\":" + reply.body() + "}")
        ); // => 36 for 6, computed off-loop
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: route, bus, worker, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /square/6 -> 200 {"square":36}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server; the worker pool carries the math.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // WORKER threading moves the verticle off the loop: deploy before serving.
    // The deployment id is runtime-assigned, so it never reaches the output.
    vertx
      .deployVerticle(
        new SquareWorker(), // => the computation, deployed once
        new DeploymentOptions().setThreadingModel(ThreadingModel.WORKER)
      ) // => off-loop by construction
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the bus address is live from here
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
    check(client, port, "GET", "/square/6"); // => Output: GET /square/6 -> 200 {"square":36}
    check(client, port, "GET", "/square/7"); // => Output: GET /square/7 -> 200 {"square":49}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
