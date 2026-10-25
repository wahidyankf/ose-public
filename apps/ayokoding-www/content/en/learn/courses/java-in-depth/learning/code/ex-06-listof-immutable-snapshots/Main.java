// Example 6: List.of Snapshots That Cannot Change.
// List.of builds a compact immutable list; any mutation attempt
// fails fast, which documents that the data is fixed by construction.
import java.util.ArrayList; // => mutable builder for the editable copy
import java.util.List; // => the shared sequence interface for both lists

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> plan = List.of("ada", "grace", "sari"); // => immutable snapshot, no nulls allowed
    System.out.println("stops: " + plan.size()); // => Output: stops: 3
    System.out.println("first: " + plan.get(0)); // => Output: first: ada
    try {
      // => mutation is attempted only to prove the guarantee
      plan.add("dewi"); // => throws: immutable lists reject every write
    } catch (UnsupportedOperationException e) {
      // => the documented failure type
      System.out.println("frozen: " + e.getClass().getSimpleName()); // => Output: frozen: UnsupportedOperationException
    } // => catch ends: the list is unchanged, still three stops
    List<String> editable = new ArrayList<>(plan); // => copy constructor buys mutability
    editable.add("dewi"); // => the copy accepts the fourth stop freely
    System.out.println("copy: " + editable); // => Output: copy: [ada, grace, sari, dewi]
    System.out.println("plan: " + plan); // => Output: plan unchanged: [ada, grace, sari]
  } // => main ends: snapshot and editable copy side by side
}
