// Example 67: Comments Explain Why, Not What.
// Good comments record decisions the code cannot state: why zero is
// valid, why the sort precedes the print, why the fallback exists.
// Restating the code in English doubles maintenance for zero insight.
import java.util.ArrayList; // => the sortable dues under decision comments
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Integer> dues = new ArrayList<>(List.of(75, 50, 25)); // => arrival order, not rank order
    // => Zero counts as settled here: fee waivers arrive as 0, not as absence.
    dues.add(0); // => the waiver case the policy explicitly includes
    // => Sort before printing: the treasurer reads rank order, and sorted output diffs cleanly.
    dues.sort(null); // => natural order, in place, before any print
    // => Print the count first: monitoring scrapes line one for the batch size.
    System.out.println("count: " + dues.size()); // => Output: count: 4
    for (int amount : dues) {
      // => rank order from here on
      System.out.println("due: " + amount); // => Output: due: 0, 25, 50, 75 in order
    } // => loop ends: ranked transcript complete
    // => No total printed: totals reconcile downstream, and duplicate figures invite disputes.
  } // => main ends: every line justified, nothing restated
}
