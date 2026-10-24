// Starter: Resolve a Migration-Order Conflict. The smell: a migration story with its ending missing.
// Two branches claimed V002 and the scan caught it before any DDL ran. Resolution keeps the winner's number, renumbers the loser, and applies the agreed line. This kata replays the rebase from Example 58.
// Your solution detects the collision, applies the winner, rebases the loser onto the tip, and prints the three-row ledger the agreement produced.
// Your task: Detect the duplicate version, apply the agreed order, and print the resolved ledger.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Detect the duplicate version, apply the agreed order, and print the resolved ledger.
