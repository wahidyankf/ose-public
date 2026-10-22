// Starter: absence by throwing. The smell: a lookup that explodes
// forces every caller to try-catch a question with a calm answer.
// Your task: return Optional<Integer> instead; resolve at the call site.
import java.util.Map; // => the lookup table under repair

public class Starter {

  // => the imperfect starting point, fixed in After
  static final Map<String, Integer> DUES = Map.of("sari", 50, "budi", 75); // => fixed fixture ledger

  static int duesOf(String member) {
    // => explodes on absence: the shape to fix
    Integer got = DUES.get(member); // => null when the member is unknown
    if (got == null) {
      // => null check every caller must repeat
      throw new IllegalArgumentException("unknown member: " + member); // => explosion for a calm question
    } // => past this line the value exists
    return got; // => unboxed answer for known members
  } // => starter ends: throwing lookup, callers beware

  public static void main(String[] args) {
    // => runs only for known members today
    System.out.println("sari: " + duesOf("sari")); // => prints 50, never faces absence
  } // => main ends: absence untested, explosion waiting
} // => fix me: Optional out, orElse at the call site
