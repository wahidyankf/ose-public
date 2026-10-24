// Example 68: Small Methods, Extracted Early.
// A twenty-line main doing four things becomes four named methods:
// each fits on screen, each tests alone, and main reads as an index.
// Extract at the second use, or the first moment a block needs a name.
import java.util.List; // => the dues lines through the pipeline

public class Main {

  // => one public class per file, named after the file
  static String memberOf(String line) {
    // => extraction one: field access with a name
    return line.split(":")[0]; // => member half of the grammar
  } // => memberOf ends: one expression, one responsibility

  static int amountOf(String line) {
    // => extraction two: parsing with a name
    return Integer.parseInt(line.split(":")[1]); // => amount half parsed to int
  } // => amountOf ends: one expression, one responsibility

  static boolean settled(String line) {
    // => extraction three: the validity rule named
    return line.contains(":") && amountOf(line) >= 0; // => shape plus non-negative, composed
  } // => settled ends: rule in one testable place

  static String tag(String line) {
    // => extraction four: presentation with a name
    return memberOf(line) + " owes " + amountOf(line); // => composition of extractions one and two
  } // => tag ends: format owned here, nowhere else

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> lines = List.of("sari:50", "budi:75", "citra:25"); // => fixed three-line feed
    for (String line : lines) {
      // => main walks the feed, helpers do the work
      System.out.println(tag(line) + " settled=" + settled(line)); // => Output: three tagged settled lines
    } // => loop ends: main stayed five lines while doing everything
    System.out.println("helpers: 4"); // => Output: helpers: 4
  } // => main ends: an index over named behaviors
}
