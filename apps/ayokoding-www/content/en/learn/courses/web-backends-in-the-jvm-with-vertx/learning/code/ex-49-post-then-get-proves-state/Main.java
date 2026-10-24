// Example 49: Post Then Get Proves State.
// A write test that never reads back proves the request was accepted, not
// that the state changed. Posting a gadget and then getting it back proves
// the round trip: the write landed where reads can find it. This example
// asserts both halves of one state change.
// (Concepts: co-03, co-09.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;
import java.util.LinkedHashMap;
import java.util.Map;

public class Main {

  // buildRouter wires creation plus lookup over one shared map.
  // The map is the state the round trip proves: POST writes, GET reads.
  // LinkedHashMap keeps creation order: listings read oldest first.
  // Handing the map in keeps storage visible in the composition root.
  static Router buildRouter(Vertx vertx, Map<Integer, String> store) {
    // => the state under test, handed in
    // An empty table first: middleware plus the two halves follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: creation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Creation writes the state the lookup below must find.
    router.post("/gadgets").handler(ctx -> {
      String name = ctx.body().asJsonObject().getString("name", "unnamed"); // => the gadget to remember (type: String)
      int id = store.size() + 1; // => 1 for the first gadget (type: int)
      store.put(id, name); // => the write the GET below proves
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("id", id).encode()); // => the new address
    });
    // Lookup reads the state creation wrote: the round trip completes here.
    router.get("/gadgets/:id").handler(ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id")); // => "1" becomes 1 (type: int)
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("id", id).put("name", store.get(id)).encode()); // => the remembered gadget
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // verdict prints PASS when actual holds, FAIL with both sides otherwise.
  // State assertions read golden: the written value must come back whole.
  static void verdict(String label, Object expected, Object actual) {
    // => label names the assertion
    // equals() decides: the golden line pins the outcome either way.
    if (expected.equals(actual)) {
      // => the passing branch this example prints
      System.out.println("PASS " + label + " == " + expected); // => Output: PASS created id == 1
    } else {
      System.out.println("FAIL " + label + ": expected " + expected + " but got " + actual); // => unreachable here, by design
    }
  }

  // check writes one gadget, reads it back, and asserts both halves.
  // Acceptance then proof: the write is asserted, then the state is (co-09).
  static void check(WebClient client, int port) throws Exception {
    // The write half: creation must answer 201 with the new address.
    var created = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject().put("name", "drill")) // => the gadget to remember
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the store holds one gadget now
    verdict("created id", 1, created.bodyAsJsonObject().getInteger("id")); // => 1 for the first gadget
    // The proof half: the same gadget must read back through GET.
    var found = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/gadgets/1") // => GET reads the remembered gadget
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the round trip completes here
    verdict("round-trip name", "drill", found.bodyAsJsonObject().getString("name")); // => the written value, back whole
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: one store shared by the write half and the proof half.
    Map<Integer, String> store = new LinkedHashMap<>(); // => empty until the POST lands
    Router router = buildRouter(vertx, store); // => wiring, with the state explicit
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
    WebClient client = WebClient.create(vertx); // => one client serves both halves
    check(client, port); // => Output: two PASS lines, write then proof
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
