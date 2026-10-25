// Kata 2: Convert a Blocking Call into the Framework's Async Idiom.
// Blocking the loop freezes every request, and the fix is one wrapper:
// executeBlocking moves the slow work to a worker pool while the handler
// resumes on success. This kata replays the offload from Example 55 so
// the motion becomes reflex.
// (Concepts: co-02, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class Solution {

  // buildRouter wires the service with one deliberately slow route.
  // The sleep stands in for blocking work: JDBC, files, legacy APIs.
  static Router buildRouter(Vertx vertx) {
    // An empty table first: the slow route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // executeBlocking borrows a worker thread: the loop stays free.
    // ordered=true keeps this route's calls in arrival order.
    router.get("/slow").handler(ctx ->
      ctx
        .vertx()
        .executeBlocking(() -> {
          Thread.sleep(50); // => the stand-in for blocking work: never on the loop
          return "done"; // => the slow answer, computed off-loop
        }, true)
        .onSuccess(value ->
          ctx
            .response()
            .putHeader("content-type", "application/json") // => the body is JSON
            .end("{\"slow\":\"" + value + "\"}")
        )
    ); // => 200 after the slow work finishes
    // Hand the wired table back to the caller.
    return router;
  }

  // check fires the concurrent burst and prints the outcome summary.
  // Slow but parallel: the pool carries what the loop must not.
  static void check(WebClient client, int port, int total) throws Exception {
    // One future per request: four slow calls overlap on the pool.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per request
    // Sending from the main thread is safe: the client owns its pool.
    for (int i = 0; i < total; i++) {
      // => four concurrent slow calls
      flights.add(
        client
          .request(HttpMethod.GET, port, "127.0.0.1", "/slow") // => the slow route under load
          .send()
          .toCompletionStage()
          .toCompletableFuture() // => the future completes on answer
          .thenApply(response -> response.statusCode())
      ); // => the code is the only fact kept
    }
    // allOf waits for every flight: the summary covers the whole burst.
    CompletableFuture.allOf(flights.toArray(new CompletableFuture[0])).join(); // => every slow call answered
    long ok = flights
      .stream()
      .filter(future -> future.join() == 200)
      .count(); // => 4 when the pool kept up
    // The summary replaces timings: outcomes, not milliseconds.
    System.out.println("slow=" + total + " ok=" + ok); // => Output: slow=4 ok=4
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server; the pool carries the slow work.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
    // Port zero asks the operating system for a free loopback port.
    // Reading it back keeps fixed ports out of every example.
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
    check(client, port, 4); // => Output: slow=4 ok=4
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
