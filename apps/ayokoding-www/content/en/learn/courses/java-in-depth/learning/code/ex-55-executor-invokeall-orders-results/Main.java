// Example 55: Executor invokeAll Orders Results.
// invokeAll runs every task in the pool yet returns futures in task
// order, so concurrent execution still prints submission order.
import java.util.List; // => the task list and the future list
import java.util.concurrent.Callable; // => value-returning tasks for the pool
import java.util.concurrent.ExecutorService; // => the managed worker pool
import java.util.concurrent.Executors; // => the pool factory
import java.util.concurrent.Future; // => the ordered result handles

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws Exception {
    // => gets and shutdown are checked
    ExecutorService pool = Executors.newFixedThreadPool(3); // => three workers, bounded and named by default
    List<Callable<String>> tasks = List.of(
      // => tasks in submission order
      () -> "sari:50", // => task one: settled line one
      () -> "budi:75", // => task two: settled line two
      () -> "citra:25"
    ); // => task three: settled line three
    try {
      // => the pool shuts down on every exit path
      List<Future<String>> futures = pool.invokeAll(tasks); // => runs concurrently, returns in order
      for (Future<String> f : futures) {
        // => submission order, regardless of finish order
        System.out.println(f.get()); // => Output: the three settled lines in order
      } // => loop ends: every task answered exactly once
    } finally {
      // => shutdown is a promise, not a hope
      pool.shutdown(); // => no new tasks; running tasks finish
    } // => finally ends: the pool closed, threads released
    System.out.println("pool closed: " + pool.isShutdown()); // => Output: pool closed: true
  } // => main ends: concurrent run, ordered transcript, closed pool
}
