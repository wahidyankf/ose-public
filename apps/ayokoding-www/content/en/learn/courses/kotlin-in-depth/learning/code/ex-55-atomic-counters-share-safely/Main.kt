// Example 55: Atomic Counters Share Safely.
// AtomicInteger folds each increment into one indivisible step, so ten
// threads times a hundred always totals exactly a thousand: no lost updates.
import java.util.concurrent.CountDownLatch // => waits for all workers, deterministically
import java.util.concurrent.atomic.AtomicInteger // => the indivisible counter
import kotlin.concurrent.thread // => one lambda per worker, as before

fun main() { // => the entry point the harness runs
    val total = AtomicInteger(0) // => shared counter: atomic, never plain var
    val latch = CountDownLatch(10) // => ten workers to wait for
    repeat(10) { // => ten identical workers, fixed count
        thread { // => each worker adds its hundred, then counts down
            repeat(100) { total.incrementAndGet() } // => indivisible step: no update lost between threads
            latch.countDown() // => this worker finished its full share
        } // => worker ends: a hundred added, one latch tick spent
    } // => all ten launched; the latch, not luck, decides when reading is safe
    latch.await() // => wait for all ten: completion as one ordered moment
    println("total: " + total.get()) // => Output: total: 1000, every run
    println("workers: 10") // => Output: workers: 10
} // => main ends: shared mutation through atomics, reading after the latch
