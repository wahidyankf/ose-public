// Example 13: Optional Instead of Null.
// Optional makes absence a visible type: callers handle empty with
// orElse or ifPresent instead of guessing about null returns.
import java.util.Map; // => the lookup table for member dues
import java.util.Optional; // => the honest absent-or-present wrapper

public class Main {

  // => one public class per file, named after the file
  static final Map<String, Integer> DUES = Map.of("sari", 50, "budi", 75); // => immutable fixture ledger

  static Optional<Integer> duesOf(String member) {
    // => may be absent: the type says so
    return Optional.ofNullable(DUES.get(member)); // => null becomes empty, values stay present
  } // => helper ends: no null ever leaves this method

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("sari: " + duesOf("sari").orElse(0)); // => Output: sari: 50
    System.out.println("dewi: " + duesOf("dewi").orElse(0)); // => Output: dewi: 0, absent reads as zero
    duesOf("budi").ifPresent(amount ->
      System.out
        // => present branch runs with the value
        .println("budi paid: " + amount)
    ); // => Output: budi paid: 75
    duesOf("dewi").ifPresent(amount ->
      System.out
        // => empty branch: the lambda never runs
        .println("unreachable: " + amount)
    ); // => skipped: dewi holds nothing
    System.out.println("present: " + duesOf("sari").isPresent()); // => Output: present: true
    System.out.println("empty: " + duesOf("dewi").isEmpty()); // => Output: empty: true
  } // => main ends: absence handled four ways, never with null
}
