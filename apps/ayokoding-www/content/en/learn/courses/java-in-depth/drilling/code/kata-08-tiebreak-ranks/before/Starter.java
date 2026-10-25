// Starter: points-only ranking. The smell: tied riders print in
// arrival order, so reruns with reshuffled input reshuffle the board.
// Your task: thenComparing by name so ties break deterministically.
import java.util.ArrayList; // => the sortable roster
import java.util.Comparator; // => the single-key ordering under repair
import java.util.List; // => interface on the left as always

public class Starter {

  // => the imperfect starting point, fixed in After
  record Rider(String name, int points) {} // => name plus points, ties unbroken

  public static void main(String[] args) {
    // => ranks by points alone
    List<Rider> board = new ArrayList<>(
      List.of(
        // => tied leaders arrive budi-first
        new Rider("budi", 12), // => tied leader one
        new Rider("sari", 12), // => tied leader two
        new Rider("ada", 9)
      )
    ); // => clear third
    board.sort(Comparator.comparingInt(Rider::points).reversed()); // => points only: ties keep arrival order
    for (Rider r : board) {
      // => the board reads budi before sari today
      System.out.println(r.name() + ": " + r.points()); // => order depends on arrival, not rules
    } // => loop ends: correct points, accidental tie order
  } // => main ends: ranked, but not deterministically
} // => fix me: thenComparing(Rider::name) settles every tie
