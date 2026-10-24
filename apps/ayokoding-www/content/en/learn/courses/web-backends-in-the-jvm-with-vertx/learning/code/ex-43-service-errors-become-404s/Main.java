// Example 43: Service Errors Become 404s.
// Services speak their own errors — unknown id, duplicate name — and the
// handler translates each one to HTTP. A NotFound from the service becomes
// a 404 with the error contract, while the handler stays free of storage
// details. This example looks up a missing gadget through the seam.
// (Concepts: co-05, co-06.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // NotFound is the service's own absence: storage-agnostic by design.
  // Services throw domain errors; handlers translate them to HTTP (co-05).
  static class NotFound extends RuntimeException {

    // => the absence the service names
    NotFound(int id) {
      // => id names the gadget nobody stores
      super("gadget " + id + " not found"); // => the domain message handlers render
    }
  }

  // Gadgets names the lookup seam: find or throw, never null.
  // Throwing beats null: callers handle absence instead of forgetting it.
  interface Gadgets {
    // => the seam storage implements
    // find reads one gadget back, or throws NotFound when it is unknown.
    JsonObject find(int id); // => throws NotFound for unknown ids
  }

  // EmptyGadgets stores nothing: every lookup throws, by construction.
  // The smallest honest storage: absence is the only behavior to translate.
  static class EmptyGadgets implements Gadgets {

    // => the lookup target under test
    public JsonObject find(int id) {
      // => must be public: it implements the seam
      throw new NotFound(id); // => unknown, always: the store is empty
    }
  }

  // buildRouter wires the service with the storage seam it needs.
  // Translation lives in the handler: services never name HTTP codes (co-06).
  static Router buildRouter(Vertx vertx, Gadgets gadgets) {
    // => the seam under test, handed in
    // An empty table first: the translating lookup below is its only row.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The try answers the seam's error in HTTP: NotFound becomes 404.
    router.get("/gadgets/:id").handler(ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id")); // => "9" becomes 9 (type: int)
      JsonObject gadget; // => assigned below, or the handler answers 404
      try {
        gadget = gadgets.find(id); // => throws NotFound for the missing gadget
      } catch (NotFound missing) {
        // => the service absence, translated here
        ctx
          .response()
          .setStatusCode(404) // => 404 names the absence (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":404,\"message\":\"" + missing.getMessage() + "\"}}"); // => the domain message, rendered
        return; // => the handler is done: the error contract went out
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end(gadget.encode()); // => the found gadget, unreachable in this example
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request in-process and prints its status line.
  // The client and the server share one JVM: no real network (co-09).
  static void check(WebClient client, int port, String method, String target) throws Exception {
    // A server-side request needs no socket: method, port, host, and path suffice.
    var request = client.request(HttpMethod.valueOf(method), port, "127.0.0.1", target);
    // The seam throws inside the pipeline: the translator answers 404.
    var response = request.send().toCompletionStage().toCompletableFuture().join();
    String text = response.bodyAsString(); // => the exact bytes the handler wrote
    // An empty body still needs a visible marker, or the line ends mid-air.
    String shown = text == null || text.isEmpty() ? "(empty body)" : text;
    // One golden line per request: method, path, status, and body.
    System.out.println(method + " " + target + " -> " + response.statusCode() + " " + shown); // => Output: GET /gadgets/9 -> 404 {"error":{...}}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: empty storage, so the lookup must throw.
    Gadgets gadgets = new EmptyGadgets(); // => absence, by construction
    Router router = buildRouter(vertx, gadgets); // => wiring, with the seam explicit
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
    check(client, port, "GET", "/gadgets/9"); // => Output: GET /gadgets/9 -> 404 {"error":{"code":404,"message":"gadget 9 not found"}}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
