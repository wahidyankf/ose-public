// Example 5: HashMap Counts with getOrDefault.
// Maps answer membership and counting questions; getOrDefault keeps
// the counting loop to one line with no containsKey check.
import java.util.HashMap; // => the default key-to-value map
import java.util.Map; // => interface on the left, HashMap on the right
import java.util.TreeMap; // => sorted-by-key view for stable printing

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    Map<String, Integer> votes = new HashMap<>(); // => counters start absent
    String[] ballots = { "sari", "budi", "sari", "citra", "budi", "sari" }; // => fixed sample votes
    for (String name : ballots) {
      // => one pass tallies every ballot
      votes.put(name, votes.getOrDefault(name, 0) + 1); // => missing counts as zero, then add one
    } // => loop ends: each name maps to its exact total
    Map<String, Integer> ranked = new TreeMap<>(votes); // => TreeMap sorts by key for output
    for (Map.Entry<String, Integer> e : ranked.entrySet()) {
      // => entrySet visits pairs, not keys
      System.out.println(e.getKey() + ": " + e.getValue()); // => Output: ada lines below, alphabetical
    } // => deterministic order: ada:1, budi:2, citra:1, sari:3
    System.out.println("sari wins: " + votes.get("sari")); // => Output: sari wins: 3
    System.out.println("has dewi: " + votes.containsKey("dewi")); // => Output: has dewi: false
  } // => main ends: counting, ordering, and lookup each shown once
}
