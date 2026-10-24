// Starter: Group Routes Under a Shared Prefix. The smell: versioned paths repeated on every route.
// Related routes share a prefix, and a sub-router keeps their paths short while the mount supplies the shared part.
// This kata replays the grouping from Example 5 so the motion becomes reflex.
// Your solution mounts the group at /api, then prints one line per grouped check.
// Your task: Mount the sub-router at /api, then print 200 for both grouped routes.
public class Starter {

  // => the shape to keep: group, mount, checks
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the mounted group
  } // => main ends: the kata is done when todo is gone
}
// fix me: Mount the sub-router at /api, then print 200 for both grouped routes.
