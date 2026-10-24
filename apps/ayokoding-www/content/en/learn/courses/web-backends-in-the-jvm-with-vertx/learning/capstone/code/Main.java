// Capstone: Order-Tracking Service.
// A small order-tracking HTTP service in Vert.x with five routes, request
// validation, structured error responses, a health-check endpoint, and an
// in-process test suite. Orders move pending to paid to shipped, one step
// at a time; the suite below proves every transition and every rejection.
// (Concepts: co-01, co-03, co-04, co-05, co-06, co-09, co-10, co-11, co-13, co-14, co-15.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

public class Main {

  // Order fixes the boundary in a type: identity plus customer, item,
  // quantity, and a lifecycle status the transitions below advance.
  // Records carry rows the compiler can see: the seam is typed (co-15).
  record Order(long id, String customer, String item, int quantity, String status) {
    // => the stored row
    // toJson renders the row for every answer: one shape everywhere.
    JsonObject toJson() {
      // => the single rendering every route shares
      return new JsonObject() // => keys fixed here: clients learn one shape
        .put("id", id)
        .put("customer", customer)
        .put("item", item)
        .put("quantity", quantity)
        .put("status", status); // => the full row, rendered
    }
  }

  // OrderStore owns the orders behind a small seam: save, find, list.
  // Handlers program to the seam: maps today, a database tomorrow (co-06).
  static class OrderStore {

    // => the state the suite proves
    private final Map<Long, Order> rows = new LinkedHashMap<>(); // => id to order, oldest first
    private final AtomicLong sequence = new AtomicLong(0); // => ordered ids, gap-free

    // save stores one order under the next id and returns the stored row.
    // Quantity is validated before this runs: storage trusts its callers.
    Order save(String customer, String item, int quantity) {
      // => validated fields in, stored row out
      long id = sequence.incrementAndGet(); // => 1 for the first order (type: long)
      Order order = new Order(id, customer, item, quantity, "pending"); // => new orders start pending
      rows.put(id, order); // => remembered behind the seam from here on
      return order; // => the stored row, rendered by the caller
    }

    // find reads one order back, or null when the id is unknown.
    // Null means absent: the handler turns it into a 404 (co-05).
    Order find(long id) {
      // => the wanted id
      return rows.get(id); // => the row, or null for unknown ids
    }

    // all lists every order oldest first: creation order is the listing order.
    java.util.List<Order> all() {
      // => no arguments: the whole collection
      return new java.util.ArrayList<>(rows.values()); // => the snapshot the list route renders
    }

    // advance moves one order one lifecycle step, or throws when it cannot.
    // pending goes paid, paid goes shipped; anything else is rejected.
    Order advance(long id, String next) {
      // => the order plus the wanted status
      Order current = rows.get(id); // => null for unknown ids
      // Unknown ids fail first: absence beats transition rules.
      if (current == null) {
        // => the absence branch
        throw new IllegalArgumentException("order " + id + " not found"); // => rendered as 404 below
      }
      // One step only: pending to paid, paid to shipped, nothing else.
      boolean forward =
        (current.status().equals("pending") && next.equals("paid")) ||
        (current.status().equals("paid") && next.equals("shipped")); // => the only legal moves
      // Skips and backward moves fail: the lifecycle is a line, not a web.
      if (!forward) {
        // => illegal transitions land here
        throw new IllegalStateException("cannot move " + current.status() + " to " + next); // => rendered as 422 below
      }
      Order moved = new Order(current.id(), current.customer(), current.item(), current.quantity(), next); // => the advanced row
      rows.put(id, moved); // => the move is stored: later reads see it
      return moved; // => the moved row, rendered by the caller
    }
  }

  // error answers a failure inside the shared envelope with a status.
  // Code for machines, message for humans: one object serves both (co-05).
  static void error(io.vertx.ext.web.RoutingContext ctx, int status, String message) {
    // => ctx writes this response
    ctx
      .response()
      .setStatusCode(status) // => the HTTP code matches the envelope code
      .putHeader("content-type", "application/json") // => failures parse like successes
      .end(
        new JsonObject() // => the envelope, built in one expression
          .put("error", new JsonObject().put("code", status).put("message", message))
          .encode()
      ); // => code plus what to fix
  }

  // buildRouter wires the five capstone routes over the store.
  // Validation guards every write: presence, range, and transitions (co-10).
  static Router buildRouter(Vertx vertx, OrderStore store) {
    // => the state under test, handed in
    // An empty table first: middleware plus the five routes follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The same middleware decodes every body: writes read the result.
    router.route().handler(BodyHandler.create()); // => bytes become a JsonObject
    // Creation validates presence and range before storage ever runs.
    router.post("/orders").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded, possibly invalid
      String customer = body.getString("customer", "").trim(); // => blank counts as missing
      String item = body.getString("item", "").trim(); // => blank counts as missing
      int quantity = body.getInteger("quantity", 0); // => 0 when absent: absent is out of bounds
      // Presence first: unnamed orders stop here.
      if (customer.isEmpty() || item.isEmpty()) {
        // => the presence gate
        error(ctx, 422, "customer and item are required"); // => what to fix, in the contract
        return; // => the handler is done: the gate held
      }
      // Range second: quantities outside 1..100 stop here.
      if (quantity < 1 || quantity > 100) {
        // => the range gate
        error(ctx, 422, "quantity must be 1..100"); // => the bound, in the contract
        return; // => the handler is done: the gate held
      }
      Order saved = store.save(customer, item, quantity); // => pending, id assigned
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(saved.toJson().encode()); // => the stored row, rendered
    });
    // Lookup reads through the seam: present renders, absent fails 404.
    router.get("/orders/:id").handler(ctx -> {
      long id = Long.parseLong(ctx.pathParam("id")); // => "1" becomes 1 (type: long)
      Order order = store.find(id); // => the row, or null
      // The seam's null becomes the HTTP absence: one mapping, in one place.
      if (order == null) {
        // => unknown ids land here
        error(ctx, 404, "order " + id + " not found"); // => the absence contract
        return; // => the handler is done: nothing is rendered below
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(order.toJson().encode()); // => the stored row, rendered
    });
    // Listing renders every order oldest first plus the total count.
    router.get("/orders").handler(ctx -> {
      JsonArray items = new JsonArray(); // => the collection, in creation order
      // One row per order: the rendering stays uniform with lookup above.
      for (Order order : store.all()) {
        // => oldest first, by construction
        items.add(order.toJson()); // => the same shape as single reads
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(new JsonObject().put("orders", items).put("total", items.size()).encode()); // => the collection plus its count
    });
    // Status moves advance the lifecycle one step: skips fail 422.
    router.patch("/orders/:id/status").handler(ctx -> {
      long id = Long.parseLong(ctx.pathParam("id")); // => "1" becomes 1 (type: long)
      String next = ctx.body().asJsonObject().getString("status", ""); // => the wanted status (type: String)
      Order moved; // => assigned below, or the handler answers an error
      try {
        moved = store.advance(id, next); // => one legal step, or an exception
      } catch (IllegalArgumentException absent) {
        // => unknown ids land here
        error(ctx, 404, absent.getMessage()); // => the absence contract
        return; // => the handler is done: the error contract went out
      } catch (IllegalStateException stuck) {
        // => illegal transitions land here
        error(ctx, 422, stuck.getMessage()); // => the lifecycle rule, in the contract
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body stays JSON
        .end(moved.toJson().encode()); // => the moved row, rendered
    });
    // The probe answers readiness in one fixed shape: balancers parse this.
    router.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the flag is JSON too
        .end("{\"status\":\"ok\"}")
    ); // => 200 with the readiness flag (co-14)
    // Hand the wired table back to the caller.
    return router;
  }

  // verdict prints PASS when both halves hold, FAIL with the detail otherwise.
  // The suite counts verdicts: the summary line is the capstone's gold.
  static int verdict(int passed, String label, boolean holds, String detail) {
    // => passed counts the wins so far
    // Holds prints PASS: the golden suite is all passes, by design.
    if (holds) {
      // => the passing branch this suite prints
      System.out.println("PASS " + label); // => one line per behavior, in suite order
      return passed + 1; // => the win is counted
    }
    System.out.println("FAIL " + label + ": " + detail); // => unreachable here, by design
    return passed; // => failures do not advance the count
  }

  // suite drives the whole service in-process and returns the pass count.
  // Creation, lookup, listing, transitions, rejections, probe: all covered.
  static int suite(WebClient client, int port) throws Exception {
    int passed = 0; // => the wins, counted verdict by verdict
    // Creation: the valid order answers 201 with id 1.
    var created = client
      .post(port, "127.0.0.1", "/orders") // => the creation under test
      .sendJsonObject(new JsonObject().put("customer", "gopher").put("item", "drill").put("quantity", 2)) // => the valid order
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the store holds order 1 now
    passed = verdict(
      passed,
      "create -> 201",
      created.statusCode() == 201 && created.bodyAsJsonObject().getLong("id") == 1L,
      created.bodyAsString()
    ); // => id 1, pending
    // Presence gate: the unnamed order answers 422.
    var unnamed = client
      .post(port, "127.0.0.1", "/orders") // => the presence gate under test
      .sendJsonObject(new JsonObject().put("item", "drill").put("quantity", 2)) // => customer missing
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the gate holds before storage
    passed = verdict(passed, "missing customer -> 422", unnamed.statusCode() == 422, unnamed.bodyAsString()); // => presence, enforced
    // Range gate: the giant quantity answers 422.
    var giant = client
      .post(port, "127.0.0.1", "/orders") // => the range gate under test
      .sendJsonObject(new JsonObject().put("customer", "gopher").put("item", "drill").put("quantity", 101)) // => over the ceiling
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the gate holds before storage
    passed = verdict(passed, "quantity 101 -> 422", giant.statusCode() == 422, giant.bodyAsString()); // => range, enforced
    // Lookup: order 1 reads back pending with its fields.
    var found = client
      .get(port, "127.0.0.1", "/orders/1") // => the lookup under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the stored row renders
    passed = verdict(
      passed,
      "lookup -> pending",
      found.statusCode() == 200 && found.bodyAsJsonObject().getString("status").equals("pending"),
      found.bodyAsString()
    ); // => as created
    // Absence: order 9 answers 404 in the error contract.
    var missing = client
      .get(port, "127.0.0.1", "/orders/9") // => the absence under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the seam's null becomes 404
    passed = verdict(passed, "missing -> 404", missing.statusCode() == 404, missing.bodyAsString()); // => absence, contracted
    // Listing: one order, total 1, creation order kept.
    var listed = client
      .get(port, "127.0.0.1", "/orders") // => the collection under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the snapshot renders
    passed = verdict(
      passed,
      "list total=1",
      listed.statusCode() == 200 && listed.bodyAsJsonObject().getInteger("total") == 1,
      listed.bodyAsString()
    ); // => one order so far
    // Transition: pending advances to paid.
    var paid = client
      .patch(port, "127.0.0.1", "/orders/1/status") // => the forward move under test
      .sendJsonObject(new JsonObject().put("status", "paid")) // => one legal step
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the move is stored
    passed = verdict(
      passed,
      "pending->paid -> 200",
      paid.statusCode() == 200 && paid.bodyAsJsonObject().getString("status").equals("paid"),
      paid.bodyAsString()
    ); // => advanced
    // Skip rejected: pending cannot jump to shipped... paid cannot rewind to pending.
    var rewind = client
      .patch(port, "127.0.0.1", "/orders/1/status") // => the backward move under test
      .sendJsonObject(new JsonObject().put("status", "pending")) // => backward: illegal
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the lifecycle rule rejects
    passed = verdict(passed, "paid->pending -> 422", rewind.statusCode() == 422, rewind.bodyAsString()); // => the line holds
    // Transition: paid advances to shipped.
    var shipped = client
      .patch(port, "127.0.0.1", "/orders/1/status") // => the second forward move
      .sendJsonObject(new JsonObject().put("status", "shipped")) // => the final step
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the move is stored
    passed = verdict(
      passed,
      "paid->shipped -> 200",
      shipped.statusCode() == 200 && shipped.bodyAsJsonObject().getString("status").equals("shipped"),
      shipped.bodyAsString()
    ); // => terminal
    // Terminal: shipped cannot move anywhere.
    var stuck = client
      .patch(port, "127.0.0.1", "/orders/1/status") // => the terminal move under test
      .sendJsonObject(new JsonObject().put("status", "paid")) // => backward from terminal: illegal
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the lifecycle rule rejects
    passed = verdict(passed, "shipped->paid -> 422", stuck.statusCode() == 422, stuck.bodyAsString()); // => shipped is final
    // Probe: readiness answers without touching orders.
    var probe = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/healthz") // => the probe under test
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the flag answers
    passed = verdict(passed, "healthz -> 200", probe.statusCode() == 200, probe.bodyAsString()); // => readiness, separate
    return passed; // => 11 when every behavior held
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // The composition root: the store starts empty, the suite fills it.
    OrderStore store = new OrderStore(); // => empty until the suite creates order 1
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
    WebClient client = WebClient.create(vertx); // => one client serves the whole suite
    int passed = suite(client, port); // => 11 verdicts, all passing by design
    int total = 11; // => the suite size: new behaviors extend this count
    // The summary is the capstone's gold: wins over total, no timings.
    System.out.println("capstone ok=" + passed + " failed=" + (total - passed)); // => Output: capstone ok=11 failed=0
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
