// Example 59: Parallel Map, Then Sort.
// Workers transform concurrently into a guarded sink, the join reunites,
// and one sort restores scheduler-proof order: parallelism, transcript-safe.
import kotlin.concurrent.thread // => one worker per partition, as throughout

fun main() { // => the entry point the harness runs
    val members = listOf("sari", "budi", "citra", "dewi") // => four fixed members
    val sink = mutableListOf<String>() // => shared sink, guarded below
    val lock = Any() // => one dedicated lock for the appends
    val workers = members.map { name -> // => one worker per member, partition by element
        thread { // => transform concurrently: uppercase plus dues lookup
            val line = name.uppercase() + "=" + mapOf("sari" to 50, "budi" to 75, "citra" to 25, "dewi" to 100)[name] // => the transform
            synchronized(lock) { sink.add(line) } // => guarded append: short span, whole decision
        } // => worker ends: its line sunk, exactly once
    } // => four workers transforming apart
    workers.forEach { it.join() } // => reunite: all transforms finished
    println(sink.sorted().joinToString(", ")) // => Output: sorted transcript, scheduler-proof
    println("mapped: " + sink.size) // => Output: mapped: 4
} // => main ends: concurrent transform, ordered transcript, no timings claimed
