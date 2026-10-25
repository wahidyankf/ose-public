// Example 32: Javadoc Comments State the Contract.
// Javadoc on every public method states the contract once: what it
// takes, what it returns, and what it throws, before code is read.
import java.lang.reflect.Method; // => the self-inspection vocabulary
import java.lang.reflect.Modifier; // => the visibility vocabulary

public class Main {

  // => one public class per file, named after the file
  // => javadoc block below: the contract callers read first
  // => each tag names one promise the body below must keep
  /**
   * Settles one dues line into a member total.
   *
   * @param member the paying member, non-blank
   * @param amount the dues paid, must be zero or more
   * @return the running total for the member after posting
   * @throws IllegalArgumentException if the member is blank or the amount negative
   */ // => contract first: params, return, and failure in one place
  // => implementation follows: every documented rule enforced in order
  public static int post(String member, int amount) {
    // => the documented API under test
    if (member == null || member.isBlank()) {
      // => the documented precondition, enforced
      throw new IllegalArgumentException("member must be non-blank"); // => documented failure one
    } // => membership settled from here on
    if (amount < 0) {
      // => negative dues corrupt every total
      throw new IllegalArgumentException("amount must be >= 0"); // => documented failure two
    } // => amount settled from here on
    return amount; // => the new running total for this tiny ledger
  } // => post ends: implementation matches the comment above it

  public static void main(String[] args) throws Exception {
    // => reflection is environmentally checked
    // => exercise the documented API exactly as a caller would
    // => reflection then inspects the contract mechanically
    System.out.println("post(\"sari\", 50) = " + post("sari", 50)); // => Output: post("sari", 50) = 50
    Method m = Main.class.getMethod("post", String.class, int.class); // => the documented method, located
    System.out.println("params: " + m.getParameterCount()); // => Output: params: 2
    System.out.println("returns: " + m.getReturnType().getSimpleName()); // => Output: returns: int
    System.out.println("public: " + Modifier.isPublic(m.getModifiers())); // => Output: public: true
    System.out.println("contract holds: " + (post("budi", 25) == 25)); // => Output: contract holds: true
    // => every printed line witnessed the comment above staying true
  } // => main ends: contract stated, exercised, and verified
}
