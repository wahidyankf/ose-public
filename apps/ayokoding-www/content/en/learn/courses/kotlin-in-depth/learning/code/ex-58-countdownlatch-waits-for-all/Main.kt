// Example 58: CountDownLatch Waits for All.
// The latch counts tasks, not threads: ten tasks count down ten times,
// and await opens exactly when the tenth finishes, whoever ran it.
import java.util.concurrent.CountDownLatch // => completion counter, one wait per latch
import kotlin.concurrent.thread // => workers run the tasks, the latch watches them

fun main() { // => the entry point the harness runs
    val done = CountDownLatch(10) // => ten tasks to wait for, counted down once each
    val results = BooleanArray(10) // => partitioned slots again: owner writes only its own
    for (i in 0 until 10) { // => ten tasks, fixed and countable
        thread { // => whichever thread runs it, the countdown is the same
            results[i] = (i * 10 >= 0) // => the task: trivially true, deterministically
            done.countDown() // => one task finished, one tick spent
        } // => task ends: slot written, latch ticked
    } // => ten tasks launched; reading before await would race
    done.await() // => wait for work, not threads: opens at the tenth tick
    println("finished: " + results.count { it }) // => Output: finished: 10
    println("latch: " + (done.count == 0L)) // => Output: latch: true
} // => main ends: ten ticks, one opening, complete results
