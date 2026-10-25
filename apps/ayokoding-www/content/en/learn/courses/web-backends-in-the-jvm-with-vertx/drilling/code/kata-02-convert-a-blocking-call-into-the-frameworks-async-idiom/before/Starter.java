// Starter: Convert a Blocking Call into the Framework's Async Idiom. The smell: a sleep sitting on the event loop.
// Blocking the loop freezes every request, and the fix is one wrapper: executeBlocking moves the slow work to a
// worker pool while the handler resumes on success. This kata replays the offload from Example 55 so the motion becomes reflex.
// Your solution wraps the sleep, serves four concurrent calls, then prints the outcome summary.
// Your task: Move the slow work into executeBlocking, then print slow=4 ok=4 for the burst.
public class Starter {

  // => the shape to keep: wrap, resume, summarize
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the offloaded burst
  } // => main ends: the kata is done when todo is gone
}
// fix me: Move the slow work into executeBlocking, then print slow=4 ok=4 for the burst.
