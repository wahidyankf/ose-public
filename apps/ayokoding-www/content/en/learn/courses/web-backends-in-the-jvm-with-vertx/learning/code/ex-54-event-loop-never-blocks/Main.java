// Example 54: Event Loop Never Blocks.
// Fast handlers answer thousands of overlapping requests on a few event
// loop threads, as long as no handler blocks. Sixty-four concurrent GETs
// share the loop here, and every one answers 200: the summary counts the
// outcomes, never the timings. This example proves the loop stayed free.
// (Concepts: co-01, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // The handler answers from memory: nothing blocks the loop (co-07).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the fast route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // No sleep, no wait, no blocking call: the loop moves to the next request.
    router.get("/fast").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"fast\":true}")
    ); // => 200 immediately, for every caller
    // Hand the wired table back to the caller.
    return router;
  }

  // check fires concurrent GETs and prints the outcome summary.
  // Concurrency is the load: counts are the assertion, never timings.
  static void check(WebClient client, int port, int total) throws Exception {
    // One future per request: all sixty-four fly at once, sharing the loop.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per request
    // Sending from the main thread is safe: the client owns its pool.
    for (int i = 0; i < total; i++) {
      // => sixty-four concurrent GETs
      flights.add(
        client
          .request(HttpMethod.GET, port, "127.0.0.1", "/fast") // => the fast route under load
          .send()
          .toCompletionStage()
          .toCompletableFuture() // => the future completes on answer
          .thenApply(response -> response.statusCode())
      ); // => the code is the only fact kept
    }
    // allOf waits for every flight: the summary covers the whole burst.
    CompletableFuture.allOf(flights.toArray(new CompletableFuture[0])).join(); // => every request answered
    long ok = flights
      .stream()
      .filter(future -> future.join() == 200)
      .count(); // => 64 when the loop never blocked
    // The summary replaces timings: outcomes, not milliseconds.
    System.out.println("concurrent=" + total + " ok=" + ok); // => Output: concurrent=64 ok=64
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server and every concurrent check below.
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
    WebClient client = WebClient.create(vertx); // => one pooled client serves the burst
    check(client, port, 64); // => Output: concurrent=64 ok=64
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
