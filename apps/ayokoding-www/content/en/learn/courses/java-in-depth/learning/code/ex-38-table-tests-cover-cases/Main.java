// Example 38: Table Tests Cover the Cases.
// One row per case over a shared check compresses five scenarios
// into five data lines: adding a case means adding a row.
import java.util.List; // => the case table rows

public class Main {

  // => one public class per file, named after the file
  record Case(String line, boolean valid, int amount) {} // => input, verdict, and value per row

  static boolean valid(String line) {
    // => the grammar under test: member:nonnegative-int
    String[] parts = line.split(":"); // => two fields or the line is corrupt
    if (parts.length != 2) {
      // => shape check first: wrong arity fails fast
      return false; // => corrupt shape, no further questions
    } // => past this line the arity is exactly two
    try {
      // => the numeric half may still refuse
      return Integer.parseInt(parts[1]) >= 0; // => numeric and non-negative wins
    } catch (NumberFormatException e) {
      // => non-numeric amounts lose uniformly
      return false; // => refusal, not explosion: validity is data
    } // => catch ends: every path answered true or false
  } // => helper ends: verdicts, never throws

  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Case> cases = List.of(
      // => the table: five rows, five scenarios
      new Case("sari:50", true, 50), // => canonical valid line
      new Case("budi:0", true, 0), // => boundary: zero is a valid amount
      new Case("oops-no-colon", false, -1), // => corrupt shape, amount unused
      new Case("citra:xx", false, -1), // => non-numeric amount refused
      new Case("dewi:-5", false, -1)
    ); // => negative amount refused
    for (Case c : cases) {
      // => one shared check walks every row
      check("valid(" + c.line() + ")==" + c.valid(), valid(c.line()) == c.valid()); // => verdict per row
      if (c.valid()) {
        // => valid rows additionally prove their amounts
        int got = Integer.parseInt(c.line().split(":")[1]); // => reparse: validity already proven
        check("amount(" + c.line() + ")==" + c.amount(), got == c.amount()); // => value verdict per valid row
      } // => branch ends: invalid rows carry no amount to prove
    } // => Output: seven PASS lines, five verdicts plus two amounts
    System.out.println("rows: " + cases.size()); // => Output: rows: 5
  } // => main ends: table walked, verdicts printed
}
