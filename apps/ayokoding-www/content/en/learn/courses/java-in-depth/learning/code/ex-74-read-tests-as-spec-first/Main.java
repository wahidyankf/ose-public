// Example 74: Read Tests as the Spec First.
//UMOJA-old/user/tests first: the check names state every behavior,
// so production code reads as answers to questions already asked.
// Reading order: check names first, expectations second, code last.
// A behavior missing from the checks is missing from the spec.
import java.util.List; // => the expectations table rows

public class Main {

  // => one public class per file, named after the file
  record Case(String line, String expected, String reason) {} // => SPEC ROW: input, verdict word, and why

  static String handle(String line) {
    // => PRODUCTION (read last): answers the spec rows
    if (!line.contains(":")) {
      // => answers the shape row
      return "skip"; // => shape verdict: unshaped lines skip
    } // => past this line the grammar holds
    int amount = Integer.parseInt(line.split(":")[1]); // => answers the value rows
    if (amount < 0) {
      // => answers the policy row
      return "refused"; // => policy verdict: negatives refuse
    } // => past this line the dues settle
    return "settled"; // => default verdict: valid lines settle
  } // => production ends: three rows, three answers

  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  public static void main(String[] args) {
    // => SPEC (read first): the behavior table
    List<Case> spec = List.of(
      // => four rows: the whole specification
      new Case("sari:50", "settled", "valid lines settle"), // => SPEC ROW 1: the happy path
      new Case("oops", "skip", "shapeless lines skip"), // => SPEC ROW 2: the shape rule
      new Case("budi:-5", "refused", "negatives refuse"), // => SPEC ROW 3: the policy rule
      new Case("citra:0", "settled", "zero settles")
    ); // => SPEC ROW 4: the boundary rule
    for (Case c : spec) {
      // => every row faces production in turn
      check(c.reason(), handle(c.line()).equals(c.expected())); // => verdict word must match the row
    } // => Output: four PASS lines naming each behavior
    System.out.println("spec rows: " + spec.size()); // => Output: spec rows: 4
  } // => main ends: spec read first, production answered after
}
