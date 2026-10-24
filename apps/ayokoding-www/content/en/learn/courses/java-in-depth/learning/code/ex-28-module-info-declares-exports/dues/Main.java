// dues/Main.java: the module's own entry point.
// Main lives inside the module, so it uses Ledger freely; outside
// modules would see only the exported package, never internals.
package dues; // => same module, same package: full visibility here

public class Main {

  // => the entry point the module runs
  public static void main(String[] args) {
    // => launched as dues/dues.Main on the module path
    Ledger ledger = new Ledger(); // => exported type, constructed directly
    ledger.add("sari", 50); // => first dues line banked
    ledger.add("budi", 75); // => second dues line banked
    System.out.println("lines: " + ledger.size()); // => Output: lines: 2
    System.out.println("total: " + ledger.total()); // => Output: total: 125
  } // => main ends: module compiled, linked, and run as one unit
}
