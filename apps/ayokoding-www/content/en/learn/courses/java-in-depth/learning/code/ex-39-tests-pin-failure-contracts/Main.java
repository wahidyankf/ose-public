// Example 39: Tests Pin Failure Contracts.
// Failure tests assert the refusal itself: the exact type plus the
// message fragment, so weakening validation breaks the suite.
public class Main {

  // => one public class per file, named after the file
  static String memberTag(String member, int amount) {
    // => the validated API from Example 14
    if (member == null || member.isBlank()) {
      // => blank names print nonsense tags
      throw new IllegalArgumentException("member must be non-blank"); // => caller bug, unchecked
    } // => past this line the member prints cleanly
    if (amount < 0) {
      // => negative dues corrupt every total
      throw new IllegalArgumentException("amount must be >= 0, got " + amount); // => evidence in the message
    } // => past this line the amount adds safely
    return member + ":" + amount; // => the tag only valid input can build
  } // => helper ends: validation up front, work after

  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  static void checkThrows(
    String name,
    Class<? extends RuntimeException> type, // => pins type plus message
    String fragment,
    Runnable attempt
  ) {
    // => the attempt expected to refuse
    try {
      // => run the attempt that must refuse
      attempt.run(); // => success here means the contract broke
      check(name, false); // => FAIL: nothing was thrown
    } catch (RuntimeException e) {
      // => the refusal arrived: inspect it
      check(name, type.isInstance(e) && e.getMessage().contains(fragment)); // => type plus fragment, both
    } // => catch ends: refusal certified or reported
  } // => checkThrows ends: the failure-contract vocabulary

  public static void main(String[] args) {
    // => the entry point the harness runs
    check("valid tag builds", memberTag("sari", 50).equals("sari:50")); // => Output: PASS valid tag builds
    checkThrows(
      "blank refused",
      IllegalArgumentException.class, // => type pinned exactly
      "non-blank",
      () -> memberTag("  ", 10)
    ); // => Output: PASS blank refused
    checkThrows(
      "negative refused",
      IllegalArgumentException.class, // => same type, other rule
      ">= 0",
      () -> memberTag("budi", -5)
    ); // => Output: PASS negative refused
    System.out.println("failures pinned: 2"); // => Output: failures pinned: 2
  } // => main ends: one success pinned, two refusals pinned
}
