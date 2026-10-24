// Example 67: Verticle Start Promises Routes.
// A verticle bundles routes with their lifecycle: start binds the server,
// stop releases it, and deployment completes only when start's promise
// does. Callers never see a half-started service. This example deploys an
// HTTP verticle and checks its route only after deploy completes.
// (Concepts: co-01, co-08.)
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // ApiVerticle owns one route plus the server behind it.
  // Deployment completes when start's promise does: never half-started.
  static class ApiVerticle extends AbstractVerticle {

    // => routes with a lifecycle
    int port; // => assigned on bind: read after deploy completes

    public void start(Promise<Void> started) {
      // => the promise deployment waits for
      // The router is built inside the verticle: lifecycle and routes travel together.
      Router router = Router.router(vertx); // => bound to this verticle's event loop
      // The only route: deployment has no meaning without something to serve.
      router.get("/hello").handler(ctx ->
        ctx
          .response()
          .putHeader("content-type", "application/json") // => the body is JSON (co-04)
          .end("{\"message\":\"hello, vertx\"}")
      ); // => 200 plus the greeting contract
      // Bind inside start: the promise completes only when traffic may arrive.
      vertx
        .createHttpServer()
        .requestHandler(router)
        .listen(0, "127.0.0.1") // => loopback only, system-assigned port
        .onSuccess(bound -> {
          // => bound carries the assigned port
          port = bound.actualPort(); // => readable after deploy completes
          started.complete(); // => deployment completes: the service is live
        })
        .onFailure(started::fail); // => bind failures fail the deployment, loudly
    }
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // Deploy first: the future completes when start's promise does.
    ApiVerticle api = new ApiVerticle(); // => the service, packaged with its lifecycle
    // The deployment id is runtime-assigned, so it never reaches the output.
    vertx.deployVerticle(api).toCompletionStage().toCompletableFuture().join(); // => live: start promised, routes bound (co-08)
    System.out.println("deployed routes=1"); // => Output: deployed routes=1
    // The client talks through loopback, never leaving this process.
    WebClient client = WebClient.create(vertx); // => one client proves traffic flows
    // The check runs after deploy: no request can beat the binding.
    var response = client
      .request(HttpMethod.GET, api.port, "127.0.0.1", "/hello") // => the verticle's route
      .send()
      .toCompletionStage()
      .toCompletableFuture()
      .join(); // => the pipeline runs, then answers
    System.out.println("GET /hello -> " + response.statusCode() + " " + response.bodyAsString()); // => Output: GET /hello -> 200 {"message":"hello, vertx"}
    // The pool shuts down: nothing in flight is cut.
    client.close();
    // The runtime stops the verticle too: stop releases what start bound.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
