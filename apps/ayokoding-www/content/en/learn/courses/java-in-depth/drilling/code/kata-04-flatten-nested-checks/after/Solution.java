// Solution: guards at the door, work at the margin. Each refusal
// exits immediately, so the tag builds at zero nesting.
// Fixed from Starter: the staircase became three flat guards.
public class Solution {

  // => the reference solution, green in the harness
  static String tag(String member, int amount) {
    // => flat validation around one line of work
    if (member == null) {
      // => guard one: missing input refused at the door
      return "error: null"; // => exit with the failure text
    } // => past this line member is provably non-null
    if (member.isBlank()) {
      // => guard two: whitespace refused next
      return "error: blank"; // => exit with the failure text
    } // => past this line the member prints cleanly
    if (amount < 0) {
      // => guard three: negative refused last
      return "error: negative"; // => exit with the failure text
    } // => past this line the amount adds safely
    return member + ":" + amount; // => the work, at the left margin
  } // => helper ends: three exits, one flat success

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(tag("sari", 50)); // => Output: sari:50
    System.out.println(tag(null, 50)); // => Output: error: null
    System.out.println(tag("  ", 50)); // => Output: error: blank
    System.out.println(tag("budi", -5)); // => Output: error: negative
  } // => main ends: one success, three flat refusals
} // => solved: the door refuses, the margin works
