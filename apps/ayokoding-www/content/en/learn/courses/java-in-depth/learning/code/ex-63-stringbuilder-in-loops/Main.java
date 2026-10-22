// Example 63: StringBuilder in Loops.
// Plus in a loop copies the growing string every pass: quadratic
// work hiding in one character. StringBuilder appends in place.
// Both print identically; only the cost differs, so choose knowingly.
import java.util.List; // => the lines joined two ways

public class Main {

  // => one public class per file, named after the file
  static String joinPlus(List<String> lines) {
    // => the quadratic habit, kept for contrast
    String report = ""; // => fresh string per pass: the hidden cost
    for (String line : lines) {
      // => every pass copies everything so far
      report += line + "\n"; // => plus builds a new string each time
    } // => loop ends after N copies of growing text
    return report; // => correct text, quadratic cost
  } // => plus version ends: right answer, wrong economics

  static String joinBuilder(List<String> lines) {
    // => the linear habit to ship
    StringBuilder report = new StringBuilder(); // => one buffer, grown in place
    for (String line : lines) {
      // => every pass appends without copying
      report.append(line).append('\n'); // => chained appends, single buffer
    } // => loop ends after N appends, zero copies
    return report.toString(); // => one string built at the very end
  } // => builder version ends: same text, linear cost

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> lines = List.of("sari:50", "budi:75", "citra:25"); // => fixed three-line feed
    String slow = joinPlus(lines); // => quadratic build, correct text
    String fast = joinBuilder(lines); // => linear build, identical text
    System.out.print(fast); // => Output: the three dues lines
    System.out.println("identical: " + slow.equals(fast)); // => Output: identical: true
    System.out.println("chars: " + fast.length()); // => Output: chars: 25
  } // => main ends: same transcript, different economics
}
