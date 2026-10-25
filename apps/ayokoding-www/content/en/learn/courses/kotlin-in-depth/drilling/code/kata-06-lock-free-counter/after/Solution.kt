// Solution: atomics plus a latch. Each increment is indivisible, the
// latch waits for all ten workers, and the total reads exactly 1000.
// Fixed from Starter: the race became an atomic plus a wait.
import java.util.concurrent.CountDownLatch // => waits for all workers, deterministically
import java.util.concurrent.atomic.AtomicInteger // => the indivisible counter
import kotlin.concurrent.thread // => one lambda per worker

fun main() { // => the entry point the harness runs
    val total = AtomicInteger(0) // => shared counter: atomic, never plain var
    val latch = CountDownLatch(10) // => ten workers to wait for
    repeat(10) { // => ten identical workers, fixed count
        thread { // => each worker adds its hundred, then counts down
            repeat(100) { total.incrementAndGet() } // => indivisible: no update lost between threads
            latch.countDown() // => this worker finished its full share
        } // => worker ends: a hundred added, one tick spent
    } // => all ten launched; the latch decides when reading is safe
    latch.await() // => completion as one ordered moment
    println("total: " + total.get()) // => Output: total: 1000, every run
} // => main ends: shared mutation through atomics, exact transcript
