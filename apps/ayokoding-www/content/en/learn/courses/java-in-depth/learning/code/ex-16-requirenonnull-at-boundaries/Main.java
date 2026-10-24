// Example 16: requireNonNull at Boundaries.
// Objects.requireNonNull states non-null preconditions in one line,
// failing at the boundary instead of deep inside the method.
import java.util.List; // => the collection validated as a whole
import java.util.Objects; // => the precondition vocabulary

public class Main {

  // => one public class per file, named after the file
  static int totalOf(List<Integer> amounts) {
    // => null list and null items both refused
    Objects.requireNonNull(amounts, "amounts must not be null"); // => boundary check, line one
    int total = 0; // => accumulator starts clean
    for (Integer amount : amounts) {
      // => every element faces the same rule
      total += Objects.requireNonNull(amount, "amount must not be null"); // => null item fails here, not in plus
    } // => loop ends: every added value was provably non-null
    return total; // => the honest total
  } // => helper ends: preconditions first, arithmetic after

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("total: " + totalOf(List.of(50, 25, 75))); // => Output: total: 150
    for (String label : new String[] { "null list", "null item" }) {
      // => two boundary violations
      try {
        // => each violation isolated
        if (label.equals("null list")) {
          // => first violation shape
          totalOf(null); // => refused at the method door
        } else {
          // => second violation shape
          totalOf(java.util.Arrays.asList(10, null)); // => refused at the guilty element
        } // => branch ends: one shape attempted per pass
      } catch (NullPointerException e) {
        // => the documented precondition failure
        System.out.println(label + " -> " + e.getMessage()); // => Output names the violated rule
      } // => catch ends: failure attributed to its boundary
    } // => loop ends: both violations refused with messages
  } // => main ends: valid total plus two fast failures
}
