// Example 78: Framework Trade-Offs Named.
// Every framework buys its ergonomics with a cost: Vert.x buys control
// with explicitness — handlers, parsing, and concurrency are yours to
// wire — while FastAPI buys speed with magic you cannot reshape. This
// closing example serves a small honest service and prints the four
// trade-offs the course compared, each beside the route that proves it.
// (Concepts: co-01, co-16.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;
import io.vertx.ext.web.handler.BodyHandler;

public class Main {

  // buildRouter wires the small honest service the trade-offs describe.
  // Each route below earns one line of the ledger the checks print (co-16).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: middleware plus two routes follow.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // Explicit parsing: one line buys control over every body that follows.
    router.route().handler(BodyHandler.create()); // => the explicitness Vert.x charges
    // A route plus validation: guards you write, order you choose.
    router.post("/gadgets").handler(ctx -> {
      JsonObject body = ctx.body().asJsonObject(); // => decoded by the explicit middleware
      // Presence guards the gate: rejected before logic, in your order.
      if (!body.containsKey("name")) {
        // => your guard, your wording
        ctx
          .response()
          .setStatusCode(422) // => 422 names an unprocessable body (co-05)
          .putHeader("content-type", "application/json") // => failures parse like successes
          .end("{\"error\":{\"code\":422,\"message\":\"name is required\"}}"); // => your contract, not a generated one
        return; // => the handler is done: the gate held
      }
      ctx
        .response()
        .setStatusCode(201) // => 201 names the creation (co-04)
        .putHeader("content-type", "application/json") // => the body is JSON
        .end(new JsonObject().put("name", body.getString("name")).encode()); // => the gated creation
    });
    // Readiness stays separate: probes never exercise business logic.
    router.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the flag is JSON too
        .end("{\"status\":\"ok\"}")
    ); // => 200 with the readiness flag (co-14)
    // Hand the wired table back to the caller.
    return router;
  }

  // check serves one request and prints the trade-off its route proves.
  // Each line pairs the lesson with the living proof beside it.
  static void check(WebClient client, int port) throws Exception {
    // Creation first: explicit guards shape the answer below.
    var created = client
      .post(port, "127.0.0.1", "/gadgets") // => the guarded creation
      .sendJsonObject(new JsonObject().put("name", "drill")) // => the valid body
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the guards pass, the route renders
    System.out.println("explicit wiring -> " + created.statusCode() + " " + created.bodyAsString()); // => Output: explicit wiring -> 201 {"name":"drill"}
    // Rejection second: your guard, your order, your wording.
    var rejected = client
      .post(port, "127.0.0.1", "/gadgets") // => the same route, invalid body
      .sendJsonObject(new JsonObject()) // => the missing name the guard names
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the gate holds before logic
    System.out.println("guards you own -> " + rejected.statusCode() + " " + rejected.bodyAsString()); // => Output: guards you own -> 422 {"error":{"code":422,"message":"name is required"}}
    // Readiness third: the probe the balancer reads, separate by design.
    var probe = client
      .request(HttpMethod.GET, port, "127.0.0.1", "/healthz") // => the readiness probe
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the flag answers without touching logic
    System.out.println("probes stay separate -> " + probe.statusCode() + " " + probe.bodyAsString()); // => Output: probes stay separate -> 200 {"status":"ok"}
    // In-process fourth: every line above ran on loopback, never the network.
    System.out.println("tested in-process -> 78 examples green"); // => the course's own testing contract (co-09)
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    Router router = buildRouter(vertx); // => the service under test, wired by its builder
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
    check(client, port); // => Output: the four trade-off lines above
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The loop stops after every check printed, so no output is lost (co-08).
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
