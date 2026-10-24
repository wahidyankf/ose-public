// Solution: points first, names break ties. The composed ordering
// ranks fully by rule, so reshuffled input prints the same board.
// Fixed from Starter: arrival-order ties became name-order ties.
import java.util.ArrayList; // => the sortable roster
import java.util.Comparator; // => the composed ordering vocabulary
import java.util.List; // => interface on the left as always

public class Solution {

  // => the reference solution, green in the harness
  record Rider(String name, int points) {} // => name plus points, ties broken by rule

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Rider> board = new ArrayList<>(
      List.of(
        // => tied leaders arrive budi-first
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
      // => the board reads by rule now
      System.out.println(r.name() + ": " + r.points()); // => Output: sari:12, budi:12, ada:9
    } // => loop ends: ranking rule visible in the order
    System.out.println("tiebreak: name"); // => Output: tiebreak: name
  } // => main ends: ranked by rule, stable across shuffles
} // => solved: ties break by name on every input order
