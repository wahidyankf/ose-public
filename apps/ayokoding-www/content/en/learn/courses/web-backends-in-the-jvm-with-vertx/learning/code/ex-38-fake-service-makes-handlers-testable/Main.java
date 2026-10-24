// Example 38: Fake Service Makes Handlers Testable.
// Handlers behind an interface accept any implementation, including a fake
// that answers on rails. The test wires the fake, so the handler logic is
// proven without the real service's weight. This example serves the gadget
// count through a fake fixed at seven.
// (Concepts: co-06, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // Counter names the one operation the handler needs from any service.
  // Interfaces keep handlers honest: they declare exactly what they use.
  interface Counter {
    // => the seam the fake implements
    // count answers how many gadgets exist right now.
    int count(); // => the handler's only need from the service
  }

  // RealCounter answers from a fixed collection, standing in for storage.
  // Production would query a database here; the shape stays identical.
  static class RealCounter implements Counter {

    // => the production implementation
    public int count() {
      // => must be public: it implements the interface
      return 2; // => the stored collection size (type: int)
    }
  }

  // FakeCounter answers on rails: seven, always, with no storage behind it.
  // Tests wire this one: handler logic is proven without a database (co-09).
  static class FakeCounter implements Counter {

    // => the test implementation
    public int count() {
      // => must be public: it implements the interface
      return 7; // => the canned answer the test asserts (type: int)
    }
  }

  // buildRouter wires the service with whatever counter it receives.
  // The handler depends on the interface: real and fake both fit (co-06).
  static Router buildRouter(Vertx vertx, Counter counter) {
    // => the seam, handed in
    // An empty table first: the counter-backed route below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The handler calls the seam: it cannot tell real from fake.
    router.get("/gadgets").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"gadgets\":" + counter.count() + "}")
    ); // => 7 through the fake, 2 through the real
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The full pipeline runs, then answers: routing, the fake, and response.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets -> 200 {"gadgets":7}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The test wires the fake: handler logic is proven without storage.
    Counter counter = new FakeCounter(); // => seven, on rails, every time
    Router router = buildRouter(vertx, counter); // => wiring, with the seam explicit
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
    check(client, port, "GET", "/gadgets"); // => Output: GET /gadgets -> 200 {"gadgets":7}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
