// Starter: shared count without a guard. The smell: four threads add
// one hundred each into a plain int, and increments vanish silently.
// Your task: count with AtomicInteger, join every thread, print 400.
// NOTE: this starter may print less than 400; that loss is the lesson.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int settled = 0; // => shared, unguarded: increments race here

  public static void main(String[] args) throws InterruptedException {
    // => joins without guards
    Thread[] crew = new Thread[4]; // => handles for joining later
    for (int i = 0; i < crew.length; i++) {
      // => launch loop, identical work
      crew[i] = new Thread(() -> {
        // => each worker adds one hundred
        for (int k = 0; k < 100; k++) {
          // => one hundred increments per worker
          settled++; // => read-modify-write: the race lives here
        } // => worker loop ends, some increments lost
      }); // => worker defined: racing by construction
      crew[i].start(); // => workers race from here
    } // => launch ends: four hundred increments, fewer landings
    for (Thread worker : crew) {
      // => joins wait, but cannot unlose losses
      worker.join(); // => all workers done, total short
    } // => join ends: the loss already happened
    System.out.println("settled: " + settled); // => often below 400: the witnessed race
  } // => main ends: joined, but short
} // => fix me: AtomicInteger plus joins print exactly 400
