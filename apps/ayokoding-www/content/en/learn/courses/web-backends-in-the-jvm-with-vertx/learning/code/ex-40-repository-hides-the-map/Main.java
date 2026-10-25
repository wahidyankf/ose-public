// Example 40: Repository Hides the Map.
// Handlers should not know where gadgets sleep: a map today, a database
// tomorrow. A repository interface hides the storage, and the handler
// speaks only save and find. This example stores through the interface
// and reads back without ever naming the map.
// (Concepts: co-06, co-15.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;
import java.util.LinkedHashMap;
import java.util.Map;

public class Main {

  // Gadget names the stored row: id plus name, nothing else.
  // Records carry rows: the boundary type is explicit and typed (co-15).
  record Gadget(int id, String name) {
    // => the shape storage returns
  }

  // Gadgets names the storage seam: save one, find one by id.
  // Handlers program to this interface: maps and databases both fit.
  interface Gadgets {
    // => the seam storage implements
    // save stores one gadget and returns its assigned id.
    int save(String name); // => the id the handler renders

    // find reads one gadget back, or null when the id is unknown.
    Gadget find(int id); // => null means absent: the handler maps it to 404
  }

  // MemoryGadgets keeps gadgets in a map behind the seam.
  // The map is private: only the seam's two verbs are visible (co-06).
  static class MemoryGadgets implements Gadgets {

    // => the map-backed storage
    private final Map<Integer, String> rows = new LinkedHashMap<>(); // => id to name, oldest first

    public int save(String name) {
      // => must be public: it implements the seam
      int id = rows.size() + 1; // => 1 for the first gadget (type: int)
      rows.put(id, name); // => remembered behind the seam from here on
      return id; // => the assigned address
    }

    public Gadget find(int id) {
      // => must be public: it implements the seam
      String name = rows.get(id); // => null for unknown ids
      // Null stays null: absence is the handler's decision, not storage's.
      return name == null ? null : new Gadget(id, name); // => the typed row, or null
    }
  }

  // buildRouter wires the service with the repository it needs.
  // Storage hides behind the seam: the handler never names the map (co-06).
  static Router buildRouter(Vertx vertx, Gadgets gadgets) {
    // => the storage under test, handed in
    // An empty table first: middleware plus save and find follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: saving reads the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Save speaks the seam: no map is named in this handler.
    router.post("/gadgets").handler(ctx -> {
      String name = ctx.body().asJsonObject().getString("name", "unnamed"); // => the gadget to store (type: String)
      int id = gadgets.save(name); // => 1 for the first gadget (type: int)
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("id", id).encode()); // => the new address
    });
    // Find speaks the seam too: storage could be a database tomorrow.
    router.get("/gadgets/:id").handler(ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id")); // => "1" becomes 1 (type: int)
      Gadget gadget = gadgets.find(id); // => the typed row, or null
      // The seam's null becomes the HTTP absence: one mapping, in one place.
      if (gadget == null) {
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
        .end(new JsonObject().put("id", gadget.id()).put("name", gadget.name()).encode()); // => the typed row rendered
    });
    // Hand the wired table back to the caller.
    return router;
  }

  // check saves then finds through the seam and prints both lines.
  // Storage hides: the checks prove behavior, never the map (co-09).
  static void check(WebClient client, int port) throws Exception {
    // Save first: the seam is empty until this call lands.
    var saved = client
      .post(port, "127.0.0.1", "/gadgets") // => POST names the verb under test
      .sendJsonObject(new JsonObject().put("name", "drill")) // => the gadget to store
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the seam holds one row now
    System.out.println("POST /gadgets -> " + saved.statusCode() + " " + saved.bodyAsString()); // => Output: POST /gadgets -> 201 {"id":1}
    // Find second: the same seam answers through the GET route.
    var found = client
      .get(port, "127.0.0.1", "/gadgets/1") // => GET reads the stored row
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the round trip completes here
    System.out.println("GET /gadgets/1 -> " + found.statusCode() + " " + found.bodyAsString()); // => Output: GET /gadgets/1 -> 200 {"id":1,"name":"drill"}
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: storage is built here, hidden behind the seam.
    Gadgets gadgets = new MemoryGadgets(); // => a map today, a database tomorrow
    Router router = buildRouter(vertx, gadgets); // => wiring, with the storage explicit
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
    check(client, port); // => runs save then find against one seam
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
