// Example 37: Fresh Fixtures per Test.
// A factory method builds a new fixture per check, so no test
// inherits another test's mutations through shared state.
import java.util.ArrayList; // => the fresh ledger per check
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static List<String> freshLedger() {
    // => factory: every caller gets its own list
    return new ArrayList<>(List.of("sari:50", "budi:75")); // => same contents, new object, every time
  } // => factory ends: sharing contents, never sharing identity

  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => one line per check, verdict first
  } // => check ends: reporting only, no banking needed here

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> first = freshLedger(); // => first check owns this list outright
    first.add("citra:25"); // => mutation stays inside this check
    check("add grows the ledger", first.size() == 3); // => Output: PASS add grows the ledger
    List<String> second = freshLedger(); // => factory hands out a pristine twin
    check("second starts pristine", second.size() == 2); // => Output: PASS second starts pristine
    check("same contents", second.equals(List.of("sari:50", "budi:75"))); // => Output: PASS same contents
    check("distinct objects", first != second); // => Output: PASS distinct objects
    System.out.println("isolation holds: true"); // => Output: isolation holds: true
  } // => main ends: four checks, zero shared state
}
