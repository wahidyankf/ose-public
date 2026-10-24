// Example 17: Failure Granularity: Per Item, Not per Batch.
// Handling each item inside the loop banks every success and reports
// each failure, where one shared try would abandon the batch.
import java.util.ArrayList; // => the banked successes
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static int parseAmount(String cell) {
    // => one cell, one answer or one failure
    int amount = Integer.parseInt(cell); // => throws on non-numeric cells
    if (amount < 0) {
      // => negative dues are feed errors here
      throw new IllegalArgumentException("negative: " + amount); // => unchecked: fix the feed
    } // => past this line the amount banks safely
    return amount; // => the validated cell value
  } // => helper ends: pure validation, no printing

  public static void main(String[] args) {
    // => the entry point the harness runs
    String[] cells = { "50", "xx", "25", "-5", "75" }; // => valid, corrupt, valid, refused, valid
    List<Integer> banked = new ArrayList<>(); // => successes accumulate here
    List<String> skipped = new ArrayList<>(); // => failures are reported, not hidden
    for (String cell : cells) {
      // => the try lives inside: per-item granularity
      try {
        // => one cell attempted, others unaffected
        banked.add(parseAmount(cell)); // => success banks, failure jumps to catch
      } catch (RuntimeException e) {
        // => both failure shapes share this recovery
        skipped.add(cell + " (" + e.getMessage() + ")"); // => evidence kept per skipped cell
      } // => catch ends: loop continues with the next cell
    } // => loop ends: three banked, two reported
    System.out.println("banked: " + banked); // => Output: banked: [50, 25, 75]
    System.out.println("skipped: " + skipped); // => Output: skipped both corrupt cells with reasons
  } // => main ends: partial success beats total abandonment
}
