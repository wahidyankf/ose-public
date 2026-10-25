// Example 58: Shared Data Needs the Event Loop.
// One handler runs on many event loop threads at once, so shared numbers
// must update atomically: a plain int loses increments under overlap while
// an AtomicLong keeps all sixty-four. This example counts concurrent hits
// and proves the final count matches the burst.
// (Concepts: co-01, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicLong;

public class Main {

  // buildRouter wires one counting route over the shared counter.
  // The counter is a dependency: shared state stays visible (co-07).
  static Router buildRouter(Vertx vertx, AtomicLong hits) {
    // => the shared number, handed in
    // An empty table first: the counting route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // incrementAndGet is atomic: overlapping event loops cannot lose a hit.
    // A plain int++ here would race: threads, not requests, are the overlap.
    router.get("/hit").handler(ctx -> {
      long seen = hits.incrementAndGet(); // => the hit number, unique per call (type: long)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"hit\":" + seen + "}"); // => the running count, rendered per call
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check fires the burst, then prints the final count beside the burst.
  // final equals fired: the summary is the atomicity proof.
  static void check(WebClient client, int port, AtomicLong hits, int total) throws Exception {
    // One future per request: sixty-four hits overlap on the counter.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per hit
    // Sending from the main thread is safe: the client owns its pool.
    for (int i = 0; i < total; i++) {
      // => sixty-four concurrent hits
      flights.add(
        client
          .request(HttpMethod.GET, port, "127.0.0.1", "/hit") // => the counting route under load
          .send()
          .toCompletionStage()
          .toCompletableFuture() // => the future completes on answer
          .thenApply(response -> response.statusCode())
      ); // => the code is the only fact kept
    }
    // allOf waits for every flight: the count covers the whole burst.
    CompletableFuture.allOf(flights.toArray(new CompletableFuture[0])).join(); // => every hit counted
    long ok = flights
      .stream()
      .filter(future -> future.join() == 200)
      .count(); // => 64 when the counter kept up
    // The final count is the proof: lost increments would read fewer here.
    System.out.println("hits=" + total + " ok=" + ok + " final=" + hits.get()); // => Output: hits=64 ok=64 final=64
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server; the counter carries the overlap.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: the shared number starts at zero.
    AtomicLong hits = new AtomicLong(0); // => every hit lands here, atomically
    Router router = buildRouter(vertx, hits); // => wiring, with the counter explicit
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
    check(client, port, hits, 64); // => Output: hits=64 ok=64 final=64
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
