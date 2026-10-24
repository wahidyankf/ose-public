// Solution: absence as a typed answer. The lookup returns
// Optional, and the call site resolves with orElse: no explosion.
// Fixed from Starter: throwing lookup became a calm question.
import java.util.Map; // => the lookup table, unchanged
import java.util.Optional; // => the honest absent-or-present wrapper

public class Solution {

  // => the reference solution, green in the harness
  static final Map<String, Integer> DUES = Map.of("sari", 50, "budi", 75); // => same fixture ledger

  static Optional<Integer> duesOf(String member) {
    // => absence in the type: callers answer it
    return Optional.ofNullable(DUES.get(member)); // => null becomes empty, values stay present
  } // => helper ends: no null, no throw, ever

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("sari: " + duesOf("sari").orElse(0)); // => Output: sari: 50
    System.out.println("dewi: " + duesOf("dewi").orElse(0)); // => Output: dewi: 0, absent reads as zero
    System.out.println("present: " + duesOf("budi").isPresent()); // => Output: present: true
  } // => main ends: absence handled, nothing thrown
} // => solved: callers choose defaults, the lookup stays calm
