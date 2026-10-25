// Example 64: Size Collections Upfront.
// ArrayList grows by copying when it overflows; ensureCapacity pays
// one allocation upfront, so known-size fills never copy mid-loop.
// HashMap takes the same hint through its initial-capacity argument.
import java.util.ArrayList; // => the pre-sized list
import java.util.HashMap; // => the pre-sized map
import java.util.List; // => interface on the left as always
import java.util.Map; // => the dues index by member

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    String[] members = { "sari", "budi", "citra", "dewi", "eka" }; // => five known names upfront
    List<String> roster = new ArrayList<>(members.length); // => capacity hint: five slots, one allocation
    for (String member : members) {
      // => fill loop: no growth copy interrupts
      roster.add(member); // => each add lands in reserved space
    } // => loop ends: five adds, zero copies
    System.out.println("roster: " + roster); // => Output: roster: the five names in order
    Map<String, Integer> index = new HashMap<>(members.length * 2); // => room for five entries plus load margin
    for (int i = 0; i < members.length; i++) {
      // => index loop: position per member
      index.put(members[i], i); // => each put lands without rehashing
    } // => loop ends: five puts, zero rehashes
    System.out.println("budi at: " + index.get("budi")); // => Output: budi at: 1
    System.out.println("sized upfront: true"); // => Output: sized upfront: true
  } // => main ends: known sizes, single allocations
}
