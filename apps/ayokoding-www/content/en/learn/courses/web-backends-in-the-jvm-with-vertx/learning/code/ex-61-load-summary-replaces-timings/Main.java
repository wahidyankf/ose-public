// Example 61: Load Summary Replaces Timings.
// Load tests tempt timers, but timings wobble between runs and golden
// files cannot hold them. Summaries hold instead: how many ran, how many
// passed, how many failed by status. This example mixes known and unknown
// paths under one burst and prints the three stable numbers.
// (Concepts: co-07, co-13.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class Main {

  // buildRouter wires the service with one route plus the fallback.
  // Known and unknown share the burst: the summary separates them (co-13).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: one route is enough; the fallback is automatic.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The known route answers JSON: its hits count as ok below.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // Hand the wired table back to the caller.
    return router;
  }

  // check fires the mixed burst and prints the stable summary.
  // No clock is read: requests, ok, and failed are the whole story.
  static void check(WebClient client, int port) throws Exception {
    // Three known for every one unknown: the mix is fixed, so the counts are.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per request
    // Sending from the main thread is safe: the client owns its pool.
    for (int i = 0; i < 64; i++) {
      // => sixty-four requests, fixed mix
      String path = i % 4 == 3 ? "/nowhere" : "/hello"; // => every fourth one misses
      flights.add(
        client
          .request(HttpMethod.GET, port, "127.0.0.1", path) // => the route under load
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
      .count(); // => 48 known hits (type: long)
    long failed = flights
      .stream()
      .filter(future -> future.join() != 200)
      .count(); // => 16 misses (type: long)
    // The summary is the load test: stable numbers, no timings anywhere.
    System.out.println("requests=64 ok=" + ok + " failed=" + failed); // => Output: requests=64 ok=48 failed=16
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
    check(client, port); // => Output: requests=64 ok=48 failed=16
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
