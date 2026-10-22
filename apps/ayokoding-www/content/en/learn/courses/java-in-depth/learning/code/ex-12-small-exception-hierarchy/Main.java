// Example 12: A Small Exception Hierarchy.
// Two specific exception types under one root let callers catch
// precisely what they can handle and let the rest propagate.
public class Main {

  // => one public class per file, named after the file
  static class LedgerException extends Exception {

    // => root: every ledger failure
    LedgerException(String message) {
      // => message-only: roots carry no policy
      super(message); // => plain cause-free construction
    } // => root ends: a type to catch, nothing to instantiate
  } // => hierarchy root ends here

  static class UnknownMemberException extends LedgerException {

    // => specific: the member is absent
    UnknownMemberException(String member) {
      // => the missing name is the data
      super("unknown member: " + member); // => message built at the throw site
    } // => specific type ends: message carries the evidence
  } // => first leaf ends here

  static class NegativeDuesException extends LedgerException {

    // => specific: the amount is refused
    NegativeDuesException(int amount) {
      // => the refused value is the data
      super("negative dues refused: " + amount); // => policy stated in the message
    } // => second leaf ends: refusal, not correction
  } // => hierarchy complete: one root, two leaves

  static void post(String member, int amount) throws LedgerException {
    // => declares the root: leaves travel inside
    if (!member.equals("sari") && !member.equals("budi")) {
      // => the two known members
      throw new UnknownMemberException(member); // => unknown: caller may register first
    } // => membership settled from here on
    if (amount < 0) {
      // => dues only grow: minus is a data error
      throw new NegativeDuesException(amount); // => refused: caller must fix the feed
    } // => amount settled from here on
    System.out.println("posted: " + member + " " + amount); // => Output: posted lines for valid posts
  } // => post ends: two precise failures, one success path

  public static void main(String[] args) {
    // => the entry point the harness runs
    String[][] attempts = { { "sari", "50" }, { "dewi", "50" }, { "budi", "-5" } }; // => valid, unknown, negative
    for (String[] a : attempts) {
      // => each attempt handled on its own terms
      try {
        // => the call that may fail two precise ways
        post(a[0], Integer.parseInt(a[1])); // => parse is safe: fixtures are numeric
      } catch (UnknownMemberException e) {
        // => first leaf: register-then-retry applies
        System.out.println("retry after register: " + e.getMessage()); // => Output names dewi
      } catch (NegativeDuesException e) {
        // => second leaf: fixing the feed applies
        System.out.println("fix the feed: " + e.getMessage()); // => Output names -5
      } catch (LedgerException e) {
        // => root arm: future leaves stay answered
        System.out.println("ledger failure: " + e.getMessage()); // => unreachable today, kept for growth
      } // => catch order: leaves before root, or the root swallows all
    } // => loop ends: three attempts, three tailored answers
  } // => main ends: hierarchy and handling agree
}
