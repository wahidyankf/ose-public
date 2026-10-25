// Example 65: Startup Order Is Explicit.
// Servers must not accept traffic before their routes exist: the order is
// build the router, bind the port, then announce readiness. Binding returns
// the assigned port, and the route table reports its own size, so startup
// prints two facts that prove the sequence held.
// (Concepts: co-01, co-08.)
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // buildRouter wires the service with every route this example serves.
  // Two routes: the startup summary counts them after binding (co-01).
  static Router buildRouter(Vertx vertx) {
    // An empty table first: two routes follow, then the bind.
    Router router = Router.router(vertx); // => vertx creates routers bound to it
    // The greeting route answers the check the summary runs below.
    router.get("/hello").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the body is JSON (co-04)
        .end("{\"message\":\"hello, vertx\"}")
    ); // => 200 plus the greeting contract
    // The probe answers readiness: startup announces only after binding.
    router.get("/healthz").handler(ctx ->
      ctx
        .response()
        .putHeader("content-type", "application/json") // => the flag is JSON too
        .end("{\"status\":\"ok\"}")
    ); // => 200 with the readiness flag (co-14)
    // Hand the wired table back to the caller.
    return router;
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // Build first: no socket exists until the table is complete.
    Router router = buildRouter(vertx); // => the table, finished before binding
    // Bind second: the port assigns here, never before the routes exist.
    HttpServer server = vertx
      .createHttpServer()
      .requestHandler(router)
      .listen(0, "127.0.0.1")
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => bound: traffic may arrive from here
    // Announce third: routes counted, port assigned, both printed as proof.
    // The port never reaches the output: counts and statuses are the gold.
    System.out.println("started routes=" + router.getRoutes().size() + " ready=true"); // => Output: started routes=2 ready=true
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client proves traffic flows
    // The first request after announce must succeed: startup held its order.
    var response = client
      .request(HttpMethod.GET, server.actualPort(), "127.0.0.1", "/hello") // => the greeting route
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    System.out.println("GET /hello -> " + response.statusCode() + " " + response.bodyAsString()); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // Close drains, then the loop stops: the reverse of the startup above (co-08).
    server.close().toCompletionStage().toCompletableFuture().join(); // => drained, then released
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
