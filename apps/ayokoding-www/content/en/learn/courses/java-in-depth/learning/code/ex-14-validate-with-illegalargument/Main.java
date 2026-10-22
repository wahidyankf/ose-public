// Example 14: Validate with IllegalArgumentException.
// Public methods reject bad arguments immediately with unchecked
// IllegalArgumentException: a caller bug, not an environmental failure.
public class Main {

  // => one public class per file, named after the file
  static String memberTag(String member, int amount) {
    // => both arguments validated first
    if (member == null || member.isBlank()) {
      // => blank names print nonsense tags
      throw new IllegalArgumentException("member must be non-blank"); // => caller bug: fix the call
    } // => past this line the member prints cleanly
    if (amount < 0) {
      // => negative dues corrupt every total downstream
      throw new IllegalArgumentException("amount must be >= 0, got " + amount); // => evidence in the message
    } // => past this line the amount adds safely
    return member + ":" + amount; // => the tag only valid input can build
  } // => helper ends: validation up front, work after

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(memberTag("sari", 50)); // => Output: sari:50
    for (String[] bad : new String[][] { { "", "10" }, { "budi", "-5" } }) {
      // => blank name, negative amount
      try {
        // => each bad call isolated from the next
        memberTag(bad[0], Integer.parseInt(bad[1])); // => throws before any tag builds
        System.out.println("unreachable"); // => skipped: validation threw first
      } catch (IllegalArgumentException e) {
        // => the one type validation raises
        System.out.println("rejected: " + e.getMessage()); // => Output: two rejected lines with reasons
      } // => catch ends: the message names the violated rule
    } // => loop ends: both caller bugs refused loudly
  } // => main ends: one success, two fast failures
}
