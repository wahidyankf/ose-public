// Starter: joining by hand. The smell: a loop with an isFirst flag
// restates what String.join already says in one call.
// Your task: replace the loop with String.join and prove identical text.
import java.util.List; // => the lines joined two ways

public class Starter {

  // => the imperfect starting point, fixed in After
  static String join(List<String> lines) {
    // => hand-rolled joining with a flag
    String out = ""; // => accumulator starts empty
    boolean first = true; // => flag tracks the separator state
    for (String line : lines) {
      // => every line visited with ceremony
      if (!first) {
        // => separator before every line but the first
        out += "\n"; // => manual separator, easy to misplace
      } // => branch ends: separator handled by hand
      out += line; // => plus per pass: quadratic besides
      first = false; // => flag flips after the first line
    } // => loop ends: joined, but the long way
    return out; // => correct text, hand-rolled cost
  } // => starter ends: flags and plus where a library fits

  public static void main(String[] args) {
    // => prints the hand-rolled text
    System.out.print(join(List.of("sari:50", "budi:75"))); // => prints two lines, joined by hand
  } // => main ends: correct, but not standard
} // => fix me: String.join("\n", lines) says the same in one call
