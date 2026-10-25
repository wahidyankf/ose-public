// Example 7: Sorting with Comparators.
// Comparator combinators sort by one key, then the next: comparing
// plus thenComparing reads as the ranking rule itself.
import java.util.ArrayList; // => sortable list for the roster
import java.util.Comparator; // => the ordering combinator vocabulary
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  record Rider(String name, int points) {} // => record: name plus points, nothing else

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Rider> board = new ArrayList<>(
      List.of(
        // => mutable copy of fixed samples
        new Rider("budi", 12), // => tied leader, alphabetical second
        new Rider("sari", 12), // => tied leader, alphabetical first
        new Rider("ada", 9)
      )
    ); // => clear third on points
    board.sort(
      Comparator.comparingInt(Rider::points)
        .reversed() // => points first, highest wins
        .thenComparing(Rider::name)
    ); // => ties break alphabetically, deterministic
    for (Rider r : board) {
      // => the board now reads top to bottom
      System.out.println(r.name() + ": " + r.points()); // => Output: sari:12, budi:12, ada:9
    } // => loop ends: ranking rule visible in the output order
    Rider top = board.get(0); // => the winner after the declared ordering
    System.out.println("champion: " + top.name()); // => Output: champion: sari
  } // => main ends: one sort, one read-off
}
