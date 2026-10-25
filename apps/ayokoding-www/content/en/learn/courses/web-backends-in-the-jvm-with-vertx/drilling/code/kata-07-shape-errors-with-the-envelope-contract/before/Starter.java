// Starter: Shape Errors with the Envelope Contract. The smell: a lookup that answers 404 with an empty body.
// Every failure answers three questions — code, message, fix — inside one shared envelope, so clients parse failures
// the same way they parse successes. This kata replays the envelope from Example 22 so the motion becomes reflex.
// Your solution fails the lookup inside the envelope, then prints the status plus the envelope body.
// Your task: Answer the missing gadget with the envelope contract, then print the 404 line.
public class Starter {

  // => the shape to keep: helper, routes, checks
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the enveloped service
  } // => main ends: the kata is done when todo is gone
}
// fix me: Answer the missing gadget with the envelope contract, then print the 404 line.
