// Starter: Gate a Route Behind a Token. The smell: a private route that trusts anonymous callers.
// Private routes need a gate: a middleware that ends anonymous requests with 401 before the handler ever runs.
// This kata replays the token gate from Example 29 so the motion becomes reflex.
// Your solution opens /public, gates /private/notes, then prints one line per check.
// Your task: Add the gate middleware, then print 200 for the token holder and 401 for the anonymous caller.
public class Starter {

  // => the shape to keep: open route, gate, gated route
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the gated service
  } // => main ends: the kata is done when todo is gone
}
// fix me: Add the gate middleware, then print 200 for the token holder and 401 for the anonymous caller.
