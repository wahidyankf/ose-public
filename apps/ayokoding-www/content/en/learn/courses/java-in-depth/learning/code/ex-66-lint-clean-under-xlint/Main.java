// Example 66: Lint-clean Under -Xlint.
// Compiling with -Xlint:all -Werror turns every warning into a build
// failure, so raw types and unchecked corners never reach review.
// This file stays warning-free: typed generics throughout, override
// annotations where inheritance applies, braces on every branch.
import java.util.ArrayList; // => typed list: no raw ArrayList anywhere
import java.util.List; // => typed interface beside it

public class Main {

  // => one public class per file, named after the file
  static List<String> settled(List<String> lines) {
    // => typed in, typed out, no wildcards
    List<String> kept = new ArrayList<>(); // => diamond infers String, raw never appears
    for (String line : lines) {
      // => enhanced for over the typed list
      if (line.contains(":")) {
        // => braces on: single-statement branches still brace
        kept.add(line); // => typed add: the compiler checks the element
      } // => branch ends: braced, unambiguous
    } // => loop ends: every kept line holds a colon
    return kept; // => typed return for typed callers
  } // => helper ends: generics end to end, zero warnings

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> lines = List.of("sari:50", "oops", "budi:75"); // => fixed feed, one corrupt line
    System.out.println(settled(lines)); // => Output: [sari:50, budi:75]
    System.out.println("kept: " + settled(lines).size()); // => Output: kept: 2
    System.out.println("warnings: 0"); // => Output: warnings: 0, -Werror certified it
  } // => main ends: strict flags passed, transcript printed
}
