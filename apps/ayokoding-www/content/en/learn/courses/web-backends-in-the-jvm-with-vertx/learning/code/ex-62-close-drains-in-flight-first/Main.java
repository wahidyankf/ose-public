// Example 62: Close Drains In-Flight First.
// Stopping must not cut the requests already accepted: the server sheds
// new traffic, waits for the in-flight count to reach zero, and only then
// closes the port. Four slow requests are caught mid-flight here, the main
// thread waits them out, and the summary proves all four still answered.
// (Concepts: co-07, co-08.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {

  // buildRouter wires one slow route that tracks its in-flight count.
  // Entry increments, body end decrements: the count is exact mid-flight.
  // The latch and the counter split duties: provable start, exact finish.
  // Shed load first in production: the flag flips before this drain runs.
  static Router buildRouter(Vertx vertx, AtomicInteger inFlight, CountDownLatch started) {
    // => the drain proof, handed in
    // An empty table first: the slow route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // executeBlocking holds each request mid-flight: the drain waits these out.
    router.get("/slow").handler(ctx -> {
      inFlight.incrementAndGet(); // => one more request inside the server
      started.countDown(); // => one request provably in flight
      ctx.addBodyEndHandler(done -> inFlight.decrementAndGet()); // => answered: the drain counts down
      ctx
        .vertx()
        .executeBlocking(() -> {
          Thread.sleep(300); // => the stand-in for real work: never on the loop
          return "done"; // => the slow answer, computed off-loop
        }, true)
        .onSuccess(value ->
          ctx
            .response()
            .putHeader("content-type", "application/json") // => the body is JSON (co-04)
            .end("{\"slow\":\"" + value + "\"}")
        ); // => 200 after the slow work finishes
    });
    // Hand the wired table back to the caller.
    return router;
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries the server; the pool carries the slow work.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // Four slots: main waits until all four requests are provably in flight.
    AtomicInteger inFlight = new AtomicInteger(0); // => the drain counter, exact by construction
    CountDownLatch started = new CountDownLatch(4); // => one count per slow request
    Router router = buildRouter(vertx, inFlight, started); // => the service under test, wired by its builder
    // The server handle is kept: close() is called on this exact server.
    HttpServer server = vertx
      .createHttpServer()
      .requestHandler(router)
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => bound, port assigned by the system
    int port = server.actualPort(); // => the assigned port the client will drive
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one pooled client serves the burst
    // Four futures fly first: none is awaited until after the drain below.
    List<CompletableFuture<Integer>> flights = new ArrayList<>(); // => one slot per slow request
    for (int i = 0; i < 4; i++) {
      // => four overlapping slow calls
      flights.add(
        client
          .request(HttpMethod.GET, port, "127.0.0.1", "/slow") // => the slow route, mid-flight soon
          .send()
          .toCompletionStage()
          .toCompletableFuture() // => the future completes on answer
          .thenApply(response -> response.statusCode())
      ); // => the code is the only fact kept
    }
    // The latch proves all four are inside their handlers before draining.
    started.await(); // => in flight, provably: the drain cannot beat the requests
    // The drain: no new sends happen here, and close waits for zero in flight.
    while (inFlight.get() > 0) {
      // => the graceful wait: still work inside
      Thread.sleep(20); // => the pause never reaches output: counts are the gold
    }
    // Zero in flight: the port releases with nothing left to cut.
    server.close().toCompletionStage().toCompletableFuture().join(); // => drained, then released (co-08)
    // allOf collects the answers that arrived during the drain.
    CompletableFuture.allOf(flights.toArray(new CompletableFuture[0])).join(); // => every slow call answered
    long ok = flights
      .stream()
      .filter(future -> future.join() == 200)
      .count(); // => 4 when the drain held
    // The summary is the graceful proof: in flight, then drained, then closed.
    System.out.println("in-flight=4 drained=" + ok + " closed=true"); // => Output: in-flight=4 drained=4 closed=true
    // The pool shuts down: the answers are already printed.
    client.close();
    // The loop stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
