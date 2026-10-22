// Example 73: Read Interfaces for Seams.
// Interfaces mark where unfamiliar code splits: logic on one side,
// boundaries on the other. Read the interface first and the design
// announces which parts test purely and which parts need fakes.
// Reading order: interface, logic, fakes, then wiring in main.
import java.util.ArrayList; // => the fake's recorded receipts
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  interface Receipts {
    // => SEAM (read first): the boundary vocabulary
    void issue(String member, int amount); // => the one call logic makes at its edge
  } // => seam ends: implement twice, depend once

  static class Ledger {

    // => LOGIC (read second): pure decisions, seam parameter
    private int total = 0; // => banked dues, mutated only through settle

    void settle(String member, int amount, Receipts receipts) {
      // => boundary arrives as a parameter
      if (amount < 0) {
        // => refusal precedes every side effect
        throw new IllegalArgumentException("amount must be >= 0"); // => unchecked: fix the feed
      } // => past this line the receipt sends exactly once
      total += amount; // => bank before notifying: state first, edge second
      receipts.issue(member, amount); // => the single seam call per settlement
    } // => settle ends: decide, bank, notify in order

    int total() {
      // => pure observer for assertions
      return total; // => the banked sum, no seam involved
    } // => observer ends: logic reads need no fakes
  } // => Ledger ends: testable without any implementation

  static class FakeReceipts implements Receipts {

    // => FAKE (read third): the recording test double
    final List<String> issued = new ArrayList<>(); // => every receipt banked for assertions

    @Override
    public void issue(String member, int amount) {
      // => records instead of sending
      issued.add(member + ":" + amount); // => banked in settlement order
    } // => fake ends: no side effects, full evidence
  } // => double ends here

  public static void main(String[] args) {
    // => WIRING (read last): logic plus fake, assembled
    Ledger ledger = new Ledger(); // => logic under test, fresh totals
    FakeReceipts fake = new FakeReceipts(); // => boundary double, fresh receipts
    ledger.settle("sari", 50, fake); // => first settlement through the seam
    ledger.settle("budi", 75, fake); // => second settlement through the seam
    System.out.println("total: " + ledger.total()); // => Output: total: 125
    System.out.println("receipts: " + fake.issued); // => Output: receipts: [sari:50, budi:75]
  } // => main ends: wiring understood last, after every part
}
