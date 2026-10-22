// Solution: lock-free counting with AtomicInteger. Compare-and-set
// hardware lands every increment, and joins order the transcript.
// Fixed from Starter: the raced int became an atomic plus joins.
import java.util.concurrent.atomic.AtomicInteger; // => the lock-free counter

public class Solution {

  // => the reference solution, green in the harness
  public static void main(String[] args) throws InterruptedException {
    // => joins are interruptibly checked
    AtomicInteger settled = new AtomicInteger(); // => shared counter, atomic increments
    Thread[] crew = new Thread[4]; // => handles for joining later
    for (int i = 0; i < crew.length; i++) {
      // => launch loop, identical work
      crew[i] = new Thread(() -> {
        // => each worker settles one hundred
        for (int k = 0; k < 100; k++) {
          // => one hundred increments per worker
          settled.incrementAndGet(); // => atomic: no lost update, no lock
        } // => worker loop ends: its hundred counted
      }); // => worker defined: counting only
      crew[i].start(); // => workers count alongside each other
    } // => launch ends: four hundred increments in flight
    for (Thread worker : crew) {
      // => join loop: wait for every worker
      worker.join(); // => returns only after that worker's hundred
    } // => join ends: all four hundred increments complete
    System.out.println("settled: " + settled.get()); // => Output: settled: 400
  } // => main ends: lock-free total exact
} // => solved: atomics land, joins order
