// Starter: the racy counter. The smell: total is a plain var shared
// across ten threads, so increments interleave and updates vanish.
// Your task: AtomicInteger plus a latch; the total must read exactly 1000.
// NOTE: this starter never runs green; only the After solution runs.
import kotlin.concurrent.thread // => workers share the plain var below

var total = 0 // => shared and unguarded: the race lives here

fun main() { // => launches ten threads at one variable
    val workers = (1..10).map { // => ten workers, fixed roster
        thread { repeat(100) { total++ } } // => read-modify-write, interleaved
    } // => workers launched at the shared var
    workers.forEach { it.join() } // => joined, but the damage is done
    println("total: " + total) // => short of 1000 by a scheduler-chosen amount
} // => main ends: usually red, always untrustworthy
// fix me: AtomicInteger, latch, exact 1000
