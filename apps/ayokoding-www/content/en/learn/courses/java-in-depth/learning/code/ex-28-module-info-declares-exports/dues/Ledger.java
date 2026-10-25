// dues/Ledger.java: the exported ledger inside module dues.
// Ledger publishes totals; its parsing helper stays package-private,
// and the module descriptor stops other modules even earlier.
package dues; // => the exported package named in module-info

import java.util.ArrayList; // => the banked dues lines
import java.util.List; // => interface on the left as always

public class Ledger {

  // => public and exported: reachable from other modules
  private final List<String> lines = new ArrayList<>(); // => private: raw lines stay hidden

  public void add(String member, int amount) {
    // => public: validated entry point
    lines.add(member + ":" + amount); // => canonical shape stored, callers pass parts
  } // => add ends: one line banked per call

  public int total() {
    // => public: the settled sum over banked lines
    return lines
      .stream()
      .mapToInt(l -> Integer.parseInt(l.split(":")[1]))
      .sum(); // => split, parse, sum
  } // => total ends: arithmetic over the canonical shape

  public int size() {
    // => public: observers count without reading lines
    return lines.size(); // => count answers, contents stay hidden
  } // => size ends: number out, lines still private
} // => Ledger ends: three public methods, zero leaks
