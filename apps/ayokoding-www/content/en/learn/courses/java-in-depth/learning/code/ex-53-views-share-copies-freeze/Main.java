// Example 53: Views Share, Copies Freeze.
// Unmodifiable views reflect later edits while List.copyOf freezes
// the moment: choose the view for live windows, the copy for history.
import java.util.ArrayList; // => the live ledger underneath both
import java.util.Collections; // => the unmodifiable view factory
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> ledger = new ArrayList<>(List.of("sari:50", "budi:75")); // => the live list both derive from
    List<String> window = Collections.unmodifiableList(ledger); // => view: reads through to the live list
    List<String> frozen = List.copyOf(ledger); // => copy: the moment frozen immutably
    System.out.println("window: " + window); // => Output: window: [sari:50, budi:75]
    System.out.println("frozen: " + frozen); // => Output: frozen: [sari:50, budi:75]
    ledger.add("citra:25"); // => the live list grows after both derive
    System.out.println("window sees growth: " + window); // => Output: window sees growth, three lines
    System.out.println("frozen ignores growth: " + frozen); // => Output: frozen ignores growth, two lines
    try {
      // => views reject writes through themselves
      window.add("sneaky:1"); // => throws: views are read-only doors
      System.out.println("unreachable"); // => skipped: the view refused first
    } catch (UnsupportedOperationException e) {
      // => the documented view refusal
      System.out.println("view read-only: true"); // => Output: view read-only: true
    } // => catch ends: the live list untouched by the attempt
    System.out.println("live: " + ledger.size() + ", window: " + window.size() + ", frozen: " + frozen.size()); // => Output: live: 3, window: 3, frozen: 2
  } // => main ends: sharing and freezing told apart
}
