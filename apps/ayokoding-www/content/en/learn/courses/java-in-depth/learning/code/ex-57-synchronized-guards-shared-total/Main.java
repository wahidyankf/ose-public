// Example 57: synchronized Guards the Shared Total.
// Ten threads add one hundred dues each into one total; the
// synchronized method serializes the increments, so all 1000 land.
public class Main {

  // => one public class per file, named after the file
  static class Vault {

    // => the shared mutable total under guard
    private int total = 0; // => private: every increment crosses the guard

    synchronized void add(int amount) {
      // => one thread at a time, no interleaving
      total += amount; // => read-modify-write, atomic under the lock
    } // => add ends: lock released, next thread admitted

    synchronized int total() {
      // => guarded read: sees the latest write
      return total; // => the settled sum under the same lock
    } // => total ends: visibility plus atomicity together
  } // => Vault ends: shared state, single guard

  public static void main(String[] args) throws InterruptedException {
    // => joins are interruptibly checked
    Vault vault = new Vault(); // => one vault shared by ten threads
    Thread[] crew = new Thread[10]; // => handles for joining later
    for (int i = 0; i < crew.length; i++) {
      // => launch loop: identical work per thread
      crew[i] = new Thread(() -> {
        // => each worker adds one hundred ones
        for (int k = 0; k < 100; k++) {
          // => one hundred increments per worker
          vault.add(1); // => guarded: every increment lands
        } // => worker loop ends: its hundred banked
      }); // => worker defined: loop only, no printing
      crew[i].start(); // => worker runs alongside its nine colleagues
    } // => launch ends: one thousand increments in flight
    for (Thread worker : crew) {
      // => join loop: wait for every worker
      worker.join(); // => returns only after that worker's hundred
    } // => join ends: all one thousand increments complete
    System.out.println("total: " + vault.total()); // => Output: total: 1000
    System.out.println("workers: " + crew.length); // => Output: workers: 10
  } // => main ends: shared total exact, no increment lost
}
