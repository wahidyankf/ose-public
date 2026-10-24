// Example 68: Undeploy Removes Routes.
// Deployment is reversible: undeploy stops the verticle, closes its server,
// and frees the port, so the route stops answering. A fresh client with no
// pooled connections proves the removal: the request fails instead of
// routing. This example checks before and after the undeploy.
// (Concepts: co-01, co-08.)
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.client.WebClient;

public class Main {

  // ApiVerticle owns one route plus the server behind it.
  // Undeploy reverses deploy: stop releases what start bound (co-08).
  static class ApiVerticle extends AbstractVerticle {

    // => routes with a lifecycle
    int port; // => assigned on bind: read after deploy completes
    HttpServer server; // => kept: stop closes this exact server

    public void start(Promise<Void> started) {
      // => the promise deployment waits for
      // The router is built inside the verticle: lifecycle and routes travel together.
      Router router = Router.router(vertx); // => bound to this verticle's event loop
      // The only route: removal has no meaning without something to remove.
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
          server = bound; // => stop closes this exact server
          port = bound.actualPort(); // => readable after deploy completes
          started.complete(); // => deployment completes: the service is live
        })
        .onFailure(started::fail); // => bind failures fail the deployment, loudly
    }

    public void stop(Promise<Void> stopped) {
      // => undeploy runs this before completing
      // The port frees inside stop: undeploy completes only after the route is gone.
      server
        .close()
        .onSuccess(closed -> stopped.complete())
        .onFailure(stopped::fail); // => drained, then released
    }
  }

  // reachable answers whether one request to the port gets any HTTP reply.
  // Fresh client, no pool: a closed server fails instead of answering.
  static boolean reachable(Vertx vertx, int port) {
    // => vertx serves the fresh client
    // A new client owns no pooled connections: every call dials the port.
    WebClient probe = WebClient.create(vertx); // => no history, no keep-alive reuse
    try {
      // The reply content is irrelevant: only reachability is asserted.
      probe
        .request(HttpMethod.GET, port, "127.0.0.1", "/hello") // => the verticle's route
        .send()
        .toCompletionStage()
        .toCompletableFuture()
        .join(); // => throws when the server is gone
      return true; // => answered: the route is still live
    } catch (Exception gone) {
      // => refused or reset: removal proved
      return false; // => unreachable: undeploy removed the route
    } finally {
      probe.close(); // => the probe never outlives its question
    }
  }

  public static void main(String[] args) throws Exception {
    // One event loop carries both the server and the client below.
    Vertx vertx = Vertx.vertx(); // => vertx() boots the runtime this process shares
    // Deploy first: the future completes when start's promise does.
    ApiVerticle api = new ApiVerticle(); // => the service, packaged with its lifecycle
    // The deployment id is runtime-assigned, so it never reaches the output.
    String deployment = vertx.deployVerticle(api).toCompletionStage().toCompletableFuture().join(); // => live: routes bound
    System.out.println("deployed reachable=" + reachable(vertx, api.port)); // => Output: deployed reachable=true
    // Undeploy reverses the deploy: the verticle stops, the port frees.
    vertx.undeploy(deployment).toCompletionStage().toCompletableFuture().join(); // => removed: the route is gone (co-08)
    System.out.println("undeployed reachable=" + reachable(vertx, api.port)); // => Output: undeployed reachable=false
    // The runtime stops after every check printed, so no output is lost.
    vertx.close().toCompletionStage().toCompletableFuture().join();
  }
}
