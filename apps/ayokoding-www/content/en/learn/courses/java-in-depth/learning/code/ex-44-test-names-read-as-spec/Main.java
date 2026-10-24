// Example 44: Test Names Read as a Spec.
// Given-when-then names turn the suite into a behavior list: read
// the check names aloud and the specification reads itself back.
import java.util.ArrayList; // => the ledger under specification
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> ledger = new ArrayList<>(List.of("sari:50")); // => given: one settled member
    ledger.add("budi:75"); // => when: the second due arrives
    check("given one due when adding budi:75 then size is 2", ledger.size() == 2); // => Output: PASS given one due...
    ledger.clear(); // => when: the ledger is cleared
    check("given two dues when clearing then ledger is empty", ledger.isEmpty()); // => Output: PASS given two dues...
    List<String> fresh = new ArrayList<>(); // => given: an empty ledger
    check(
      "given empty ledger when totaling then sum is 0", // => third behavior, empty boundary included
      fresh
        .stream()
        .mapToInt(l -> Integer.parseInt(l.split(":")[1]))
        .sum() == 0
    ); // => empty sums to zero
    check(
      "given sari:50 when parsing then member is sari", // => fourth behavior, grammar pinned
      "sari:50".split(":")[0].equals("sari")
    ); // => Output: PASS given sari:50...
    System.out.println("spec lines: 4"); // => Output: spec lines: 4
  } // => main ends: four behaviors, four sentences
}
