// Example 61: Atomics Count Without Locks.
// AtomicInteger increments with hardware compare-and-set, so eight
// threads add one hundred each with no lock and an exact total.
import java.util.concurrent.atomic.AtomicInteger; // => the lock-free counter

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws InterruptedException {
    // => joins are interruptibly checked
    AtomicInteger settled = new AtomicInteger(); // => shared counter, lock-free increments
    Thread[] crew = new Thread[8]; // => handles for joining later
    for (int i = 0; i < crew.length; i++) {
      // => launch loop: identical counting per thread
      crew[i] = new Thread(() -> {
        // => each worker settles one hundred dues
        for (int k = 0; k < 100; k++) {
          // => one hundred increments per worker
          settled.incrementAndGet(); // => atomic: no lost update, no lock
        } // => worker loop ends: its hundred counted
      }); // => worker defined: counting only
      crew[i].start(); // => worker counts alongside its colleagues
    } // => launch ends: eight hundred increments in flight
    for (Thread worker : crew) {
      // => join loop: wait for every worker
      worker.join(); // => returns only after that worker's hundred
    } // => join ends: all eight hundred increments complete
    System.out.println("settled: " + settled.get()); // => Output: settled: 800
    boolean second = settled.compareAndSet(800, 801); // => exact-value gate: 800 becomes 801 once
    System.out.println("gate opened: " + second); // => Output: gate opened: true
    System.out.println("final: " + settled.get()); // => Output: final: 801
  } // => main ends: lock-free total exact, gate witnessed
}
