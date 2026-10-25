// Starter: Split a Breaking Change into Zero-Downtime Steps. The smell: a migration story with its ending missing.
// The rename cannot land in one version without breaking old readers, so the kata splits it exactly as Example 38 teaches. Each phase deploys alone and the final shape carries no trace of the old name.
// Your solution applies the expand, migrate, and contract versions in order and prints the surviving columns.
// Your task: Expand, migrate, and contract across three versions, then print the final columns.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Expand, migrate, and contract across three versions, then print the final columns.
