// Example 64: Health Check Fails When Not Ready.
// Readiness is a flag, not a constant: the service starts unready, becomes
// ready when its dependencies connect, and turns unready during shutdown.
// The probe reads the flag per request, answering 503 while unready so the
// balancer stops sending traffic. This example flips the flag mid-test.
// (Concepts: co-05, co-14.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.concurrent.atomic.AtomicBoolean;

public class Main {

  // buildRouter wires the probe over the readiness flag it reads.
  // The flag is a dependency: storage or startup flips it, never the route.
  static Router buildRouter(Vertx vertx, AtomicBoolean ready) {
    // => readiness, handed in
    // An empty table first: the flag-reading probe below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The probe reads the flag on every call: readiness is current, not cached.
    router.get("/healthz").handler(ctx -> {
      boolean up = ready.get(); // => false before startup, true after (type: boolean)
      // Unready answers 503: balancers shed load until the flag flips.
      if (!up) {
        // => the draining branch
        ctx
          .response()
          .setStatusCode(503) // => 503 sheds traffic (co-05)
          .putHeader("content-type", "application/json") // => the flag is JSON either way
          .end("{\"status\":\"starting\"}"); // => honest: not ready yet
        return; // => the handler is done: the flag spoke
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the flag stays JSON
        .end("{\"status\":\"ok\"}"); // => 200 with the readiness flag (co-14)
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one probe in-process and prints its status line.
  // The flag flips between checks: the probe must track it (co-09).
  static void check(WebClient client, int port, String label) throws Exception {
    // A server-side request needs no socket: it never leaves this process.
    var response = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/healthz") // => the probe under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the flag is read on this call
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // One golden line: the flag state, the status, and the body.
    System.out.println("probe " + label + " -> " + response.statusCode() + " " + text); // => Output: probe starting -> 503 {"status":"starting"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: the service starts unready, like every real one.
    AtomicBoolean ready = new AtomicBoolean(false); // => starting: probes shed traffic
    Router router = buildRouter(vertx, ready); // => wiring, with the flag explicit
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
    WebClient client = WebClient.create(vertx); // => one client serves every probe
    check(client, port, "starting"); // => Output: probe starting -> 503 {"status":"starting"}
    // Startup completes: dependencies connected, the flag flips true.
    ready.set(true); // => ready: probes admit traffic from here on
    check(client, port, "ready"); // => Output: probe ready -> 200 {"status":"ok"}
    // Shutdown begins: the flag flips back before close drains the server.
    ready.set(false); // => draining: probes shed traffic again
    check(client, port, "draining"); // => Output: probe draining -> 503 {"status":"starting"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
