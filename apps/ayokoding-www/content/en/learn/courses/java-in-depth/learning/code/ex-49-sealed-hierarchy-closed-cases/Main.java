// Example 49: Sealed Hierarchies Close the Cases.
// A sealed interface names its permitted children, so every handler
// covers a closed set: the compiler knows the family is complete.
public class Main {

  // => one public class per file, named after the file
  sealed interface Result permits Success, Shortfall, Skipped {} // => closed family of three outcomes

  record Success(String member, int amount) implements Result {} // => permitted child one: settled

  record Shortfall(String member, int missing) implements Result {} // => permitted child two: partial

  record Skipped(String line, String reason) implements Result {} // => permitted child three: refused

  static String settle(Result r) {
    // => one handler over the closed family
    if (r instanceof Success s) {
      // => pattern variable binds without a cast
      return "settled " + s.member() + ":" + s.amount(); // => success reads its fields directly
    } else if (r instanceof Shortfall f) {
      // => second case: partial payment
      return "shortfall " + f.member() + " missing " + f.missing(); // => shortfall names the gap
    } else if (r instanceof Skipped k) {
      // => third case: the closed set exhausted
      return "skipped '" + k.line() + "' (" + k.reason() + ")"; // => skip carries its evidence
    } // => every permitted child answered, no else needed for logic
    throw new AssertionError("unreachable: family is sealed"); // => documents exhaustiveness, never throws
  } // => handler ends: closed cases, complete coverage

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(settle(new Success("sari", 50))); // => Output: settled sari:50
    System.out.println(settle(new Shortfall("budi", 25))); // => Output: shortfall budi missing 25
    System.out.println(settle(new Skipped("xx", "no colon"))); // => Output: skipped 'xx' (no colon)
  } // => main ends: three children, three answers
}
