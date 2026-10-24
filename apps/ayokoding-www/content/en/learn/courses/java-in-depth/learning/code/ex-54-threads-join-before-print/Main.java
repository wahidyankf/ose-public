// Example 54: Threads Join Before Printing.
// Each thread owns one array slot, main joins every thread, and only
// then prints: joining turns parallel work into ordered output.
public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws InterruptedException {
    // => joins are interruptibly checked
    int[] partials = new int[3]; // => one slot per worker, no sharing
    Thread[] crew = new Thread[3]; // => handles for the three workers
    int[] dues = { 50, 75, 25 }; // => fixed figures, one per worker
    for (int i = 0; i < crew.length; i++) {
      // => launch loop: each worker knows its index
      final int slot = i; // => effectively final copy for the lambda
      crew[i] = new Thread(() -> partials[slot] = dues[slot] * 2); // => doubled dues into its own slot
      crew[i].start(); // => worker runs: main continues launching
    } // => launch ends: three workers doubling concurrently
    for (Thread worker : crew) {
      // => join loop: main waits for everyone
      worker.join(); // => returns only after that worker finished
    } // => join ends: all slots final, no race remains
    System.out.println("partials: " + partials[0] + "," + partials[1] + "," + partials[2]); // => Output: partials: 100,150,50
    System.out.println("total: " + (partials[0] + partials[1] + partials[2])); // => Output: total: 300
  } // => main ends: parallel work, ordered transcript
}
