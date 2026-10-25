// Example 36: Service Holds the State.
// Routes translate; services remember. An in-memory store behind the
// service keeps gadgets across requests, so a POST followed by a GET
// proves the state survived the round trip. This example creates gadget 1
// and reads it back through the same service instance.
// (Concepts: co-03, co-06.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;
import java.util.LinkedHashMap;
import java.util.Map;

public class Main {

  // GadgetStore remembers gadgets by id across requests.
  // LinkedHashMap keeps insertion order: listings read oldest first (co-06).
  static class GadgetStore {

    // => the state the service owns
    private final Map<Integer, String> gadgets = new LinkedHashMap<>(); // => id to name, in creation order

    // create stores one gadget under the next id and returns that id.
    // Size plus one is the next id: single-threaded tests keep it exact.
    int create(String name) {
      // => name arrives validated from the handler
      int id = gadgets.size() + 1; // => 1 for the first gadget (type: int)
      gadgets.put(id, name); // => remembered across requests from here on
      return id; // => the address the handler renders
    }

    // byId reads one gadget back, or null when no gadget owns the id.
    // Null means absent: the handler turns it into a 404 (co-05).
    String byId(int id) {
      // => id arrives parsed from the path
      return gadgets.get(id); // => the name, or null for unknown ids
    }
  }

  // buildRouter wires the service with the store it needs.
  // Two routes share one store: state lives behind both (co-06).
  static Router buildRouter(Vertx vertx, GadgetStore store) {
    // => the state under test, handed in
    // An empty table first: middleware plus creation and lookup follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: creation reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Creation stores through the service, then renders the new address.
    router.post("/gadgets").handler(ctx -> {
      String name = ctx.body().asJsonObject().getString("name", "unnamed"); // => the gadget to remember (type: String)
      int id = store.create(name); // => 1 for the first gadget (type: int)
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("id", id).encode()); // => the new address
    });
    // Lookup reads through the same store: POST then GET round-trips state.
    router.get("/gadgets/:id").handler(ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id")); // => "1" becomes 1 (type: int)
      String name = store.byId(id); // => "drill" after the creation above
      // Absent means 404: the store's null becomes the HTTP absence.
      if (name == null) {
        // => unknown ids land here
        ctx
          .response()
          .setStatusCode(404) // => 404 names the absence (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":404,\"message\":\"not found\"}}"); // => the stable error contract
        return; // => the handler is done: nothing is rendered below
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("id", id).put("name", name).encode()); // => the remembered gadget
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check posts or gets through the store and prints the status line.
  // Creation then lookup proves state survived the round trip (co-09).
  static void check(WebClient client, int port) throws Exception {
    // Creation first: the store is empty until this call lands.
    var created = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject().put("name", "drill")) // => the gadget to remember
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the store holds one gadget now
    System.out.println("POST /gadgets -> " + created.statusCode() + " " + created.bodyAsString()); // => Output: POST /gadgets -> 201 {"id":1}
    // Lookup second: the same store answers through the GET route.
    var found = client
      .get(port, "127.0.0.1", "/gadgets/1") // => GET reads the remembered gadget
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the round trip completes here
    System.out.println("GET /gadgets/1 -> " + found.statusCode() + " " + found.bodyAsString()); // => Output: GET /gadgets/1 -> 200 {"id":1,"name":"drill"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: one store built here, shared by both routes.
    GadgetStore store = new GadgetStore(); // => empty until the POST lands
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
    WebClient client = WebClient.create(vertx); // => one client serves every check
    check(client, port); // => runs creation then lookup against one store
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
