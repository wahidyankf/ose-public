// Example 56: Futures Carry Answers Back.
// Submitted callables compute off-thread while main does its own
// work; get in submission order reassembles the ordered answers.
import java.util.ArrayList; // => the ordered future handles
import java.util.List; // => interface on the left as always
import java.util.concurrent.ExecutorService; // => the two-worker pool
import java.util.concurrent.Executors; // => the pool factory
import java.util.concurrent.Future; // => the answer handles

public class Main {

  // => one public class per file, named after the file
  static int settle(String member, int amount) {
    // => the priced work each task performs
    return amount; // => trivial here: the shape matters, not the math
  } // => work ends: pure function, safe off-thread

  public static void main(String[] args) throws Exception {
    // => gets and shutdown are checked
    ExecutorService pool = Executors.newFixedThreadPool(2); // => two workers for three tasks
    List<Future<Integer>> owed = new ArrayList<>(); // => handles banked in submission order
    String[] members = { "sari", "budi", "citra" }; // => fixed roster for the three tasks
    int[] amounts = { 50, 75, 25 }; // => fixed dues beside the roster
    try {
      // => the pool shuts down on every exit path
      for (int i = 0; i < members.length; i++) {
        // => submit loop: order banked here
        final int slot = i; // => effectively final copy for the lambda
        owed.add(pool.submit(() -> settle(members[slot], amounts[slot]))); // => future banked at submit time
      } // => submit ends: three tasks running, three handles held
      int total = 0; // => main's own work: accumulate as answers land
      for (int i = 0; i < owed.size(); i++) {
        // => collection in submission order
        int got = owed.get(i).get(); // => blocks only for this task's answer
        System.out.println(members[i] + ": " + got); // => Output: sari: 50, budi: 75, citra: 25
        total += got; // => accumulate in order, no lock needed
      } // => loop ends: every answer collected exactly once
      System.out.println("total: " + total); // => Output: total: 150
    } finally {
      // => shutdown is a promise, not a hope
      pool.shutdown(); // => workers released after finishing
    } // => finally ends: pool closed on every path
  } // => main ends: submitted concurrently, collected in order
}
