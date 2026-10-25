// Starter: Add a Health-Check Endpoint. The smell: a service with no readiness probe.
// Balancers need one question answered: readiness stays a separate route with a fixed shape, never tangled with business
// logic. This kata replays the probe from Example 63 so the motion becomes reflex.
// Your solution serves /healthz beside /hello, then prints one line per check.
// Your task: Add the probe route, then print 200 {"status":"ok"} for the probe.
public class Starter {

  // => the shape to keep: business route, probe route
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the service plus probe
  } // => main ends: the kata is done when todo is gone
}
// fix me: Add the probe route, then print 200 {"status":"ok"} for the probe.
