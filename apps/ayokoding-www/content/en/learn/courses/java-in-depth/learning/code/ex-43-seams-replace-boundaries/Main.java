// Example 43: Seams Replace Boundaries.
// A notifier seam lets tests substitute a recording fake for the real
// sender: the ledger logic runs identically, nothing sends anything.
import java.util.ArrayList; // => the fake's recorded messages
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  interface Notifier {
    // => the seam: one method, two implementations
    void send(String message); // => the boundary call tests must not really make
  } // => seam ends: callers depend on this, never on senders

  static class FakeNotifier implements Notifier {

    // => the recording test double
    final List<String> sent = new ArrayList<>(); // => every message banked for assertions

    @Override
    public void send(String message) {
      // => records instead of sending
      sent.add(message); // => banked: assertions read this list
    } // => fake ends: no network, no side effects
  } // => double ends here

  static void settle(String member, int amount, Notifier notifier) {
    // => logic takes its boundary as a parameter
    if (amount < 0) {
      // => negative dues refuse before any message
      throw new IllegalArgumentException("amount must be >= 0"); // => unchecked: fix the feed
    } // => past this line the settlement sends exactly once
    notifier.send("settled " + member + ":" + amount); // => the single boundary call under test
  } // => settle ends: pure decision plus one seam call

  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  public static void main(String[] args) {
    // => the entry point the harness runs
    FakeNotifier fake = new FakeNotifier(); // => fresh recorder per run
    settle("sari", 50, fake); // => the logic runs against the fake
    settle("budi", 75, fake); // => second settlement, same recorder
    check("two messages sent", fake.sent.size() == 2); // => Output: PASS two messages sent
    check("first message exact", fake.sent.get(0).equals("settled sari:50")); // => PASS first message exact
    try {
      // => the refusal path sends nothing
      settle("citra", -5, fake); // => throws before the seam call
      check("negative refused", false); // => unreachable: refusal threw first
    } catch (IllegalArgumentException e) {
      // => the documented refusal
      check("negative refused", true); // => Output: PASS negative refused
    } // => catch ends: refusal certified
    check("refusal sent nothing", fake.sent.size() == 2); // => Output: PASS refusal sent nothing
  } // => main ends: boundary faked, logic proven, silence kept
}
