// Example 57: Concurrent Posts Keep Every Write.
// Concurrent writers share the store, and a thread-safe map keeps every
// write: thirty-two overlapping POSTs must leave thirty-two gadgets, not
// twenty-nine with three lost to a race. This example fires the burst and
// counts the store afterwards.
// (Concepts: co-03, co-07.)
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

public class Main {

  // buildRouter wires creation over a thread-safe store.
  // ConcurrentHashMap survives overlapping writers: no write is lost (co-07).
  // A plain HashMap would corrupt here: threads share the handler's map.
  // Atomic ids pair with the concurrent map: unique and kept, together.
  static Router buildRouter(Vertx vertx, ConcurrentMap<Long, String> store, AtomicLong sequence) {
    // => the state, handed in
    // An empty table first: middleware plus one creation follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: creation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Atomic ids plus a concurrent map: every overlapping post is kept.
    router.post("/gadgets").handler(ctx -> {
      String name = ctx.body().asJsonObject().getString("name", "unnamed"); // => the gadget to keep (type: String)
      long id = sequence.incrementAndGet(); // => unique across threads (type: long)
      store.put(id, name); // => kept, even under overlap
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("id", id).encode()); // => the assigned address
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check fires the burst, then prints how many writes the store kept.
  // kept equals fired: the summary is the thread-safety proof.
  static void check(WebClient client, int port, ConcurrentMap<Long, String> store, int total) throws Exception {
    // One future per post: thirty-two creations overlap on the store.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per post
    // Sending from the main thread is safe: the client owns its pool.
    for (int i = 0; i < total; i++) {
      // => thirty-two overlapping POSTs
      flights.add(
        client
          .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
          .sendJsonObject(new JsonObject().put("name", "bulk")) // => identical bodies: only ids differ
          .toCompletionStage()
          .toCompletableFuture() // => the future completes on answer
          .thenApply(response -> response.statusCode())
      ); // => the code is the only fact kept
    }
    // allOf waits for every flight: the count covers the whole burst.
    CompletableFuture.allOf(flights.toArray(new CompletableFuture[0])).join(); // => every post answered
    long ok = flights
      .stream()
      .filter(future -> future.join() == 201)
      .count(); // => 32 when every write landed
    // The store count is the proof: lost writes would read fewer here.
    System.out.println("posted=" + total + " created=" + ok + " stored=" + store.size()); // => Output: posted=32 created=32 stored=32
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server; the map carries the overlap.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: thread-safe state, built in the open.
    ConcurrentMap<Long, String> store = new ConcurrentHashMap<>(); // => empty until the burst lands
    AtomicLong sequence = new AtomicLong(0); // => unique ids across threads
    Router router = buildRouter(vertx, store, sequence); // => wiring, with the state explicit
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
    check(client, port, store, 32); // => Output: posted=32 created=32 stored=32
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
