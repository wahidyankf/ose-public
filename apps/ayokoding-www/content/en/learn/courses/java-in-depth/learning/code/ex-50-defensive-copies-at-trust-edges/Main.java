// Example 50: Defensive Copies at Trust Edges.
// List.copyOf snapshots caller data on entry, so later caller
// mutations cannot corrupt the ledger; arrays need clone instead.
import java.util.ArrayList; // => the caller-side mutable list
import java.util.Arrays; // => array printing for the transcript
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static class Ledger {

    // => the trust edge: outside data enters here
    private final List<String> lines; // => snapshot held, never the caller's list

    Ledger(List<String> incoming) {
      // => constructor copies on entry
      lines = List.copyOf(incoming); // => immutable snapshot: later caller edits stop here
    } // => constructor ends: ownership transferred, aliasing refused

    List<String> lines() {
      // => accessor returns the snapshot itself
      return lines; // => safe: immutable snapshots share freely
    } // => accessor ends: no copy needed on the way out
  } // => Ledger ends: one copy in, zero copies out

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> feed = new ArrayList<>(List.of("sari:50")); // => caller-owned, still mutable
    Ledger ledger = new Ledger(feed); // => snapshot taken at the trust edge
    feed.add("sneaky:999"); // => caller mutates after handoff
    System.out.println("ledger: " + ledger.lines()); // => Output: ledger: [sari:50]
    System.out.println("feed: " + feed); // => Output: feed holds the sneaky line too
    int[] figures = { 50, 75 }; // => arrays alias too: clone at the edge
    int[] kept = figures.clone(); // => clone snapshots the array contents
    figures[0] = 999; // => caller mutates the original array
    System.out.println("kept: " + Arrays.toString(kept)); // => Output: kept: [50, 75]
    System.out.println("copyOf rejects nulls: " + keepsNullsOut()); // => Output: copyOf rejects nulls: true
  } // => main ends: edges copied, aliases defeated

  static boolean keepsNullsOut() {
    // => the null-rejection witness for copyOf
    try {
      // => List.copyOf refuses null elements loudly
      List.copyOf(Arrays.asList("sari:50", null)); // => throws before any snapshot exists
      return false; // => unreachable: rejection threw first
    } catch (NullPointerException e) {
      // => the documented copyOf refusal
      return true; // => witnessed: nulls die at the trust edge
    } // => catch ends: rejection proven, not assumed
  } // => witness ends: copyOf guards entry twice over
}
