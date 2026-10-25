// Starter: Cap Bodies with a Limit. The smell: an echo route that reads bodies of any size.
// Unbounded bodies crowd out every other request, so the boundary caps each one and fails oversized callers fast with
// 413. This kata replays the bound from Example 59 so the motion becomes reflex.
// Your solution caps bodies at 64 bytes, then prints 200 for the small body and 413 for the large one.
// Your task: Install the capped middleware plus the 413 catcher, then print both verdict lines.
public class Starter {

  // => the shape to keep: capped middleware, echo, catcher
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the capped echo
  } // => main ends: the kata is done when todo is gone
}
// fix me: Install the capped middleware plus the 413 catcher, then print both verdict lines.
