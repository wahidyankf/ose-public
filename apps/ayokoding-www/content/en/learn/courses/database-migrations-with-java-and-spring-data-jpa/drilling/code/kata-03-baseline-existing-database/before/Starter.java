// Starter: Baseline an Existing Database Without Losing Data. The smell: a migration story with its ending missing.
// Adoption without loss is the whole of baselining: legacy rows survive, satisfied versions are marked, and only genuinely new migrations execute. This kata rehearses the adoption from Example 46 at small scale.
// Your solution seeds the legacy table, marks V001 satisfied, applies V002 for real, and prints the preserved row beside the two-row ledger.
// Your task: Mark the legacy versions satisfied, run the new migration, and print the preserved rows and ledger.
public class Starter {

  // => the shape to keep: configure, migrate, verify
  public static void main(String[] args) throws Exception {
    // => the entry point the harness would run once the todo is gone
    System.out.println("todo"); // => replace this line with the real workflow
  } // => main ends: the kata is done when todo is gone
}
// fix me: Mark the legacy version satisfied, run the new migration, and print the preserved rows and ledger.
