// Example 54: Threads Join Before Print.
// Workers fill their own slots, main joins every thread, then prints
// in a fixed order: the scheduler decides timing, joins decide output.
import kotlin.concurrent.thread // => the stdlib worker starter, one lambda per thread

fun main() { // => the entry point the harness runs
    val slots = arrayOf("", "", "") // => one slot per worker, written only by its owner
    val names = listOf("sari", "budi", "citra") // => fixed work, partitioned by index
    val workers = names.mapIndexed { i, name -> // => one thread per name, index owned
        thread { slots[i] = name.uppercase() } // => owner writes only its own slot: no lock needed
    } // => workers run now, in whatever order the scheduler chooses
    workers.forEach { it.join() } // => reunite: every worker finished before printing
    println(slots.sorted().joinToString(", ")) // => Output: BUDI, CITRA, SARI
    println("joined: " + workers.size) // => Output: joined: 3
} // => main ends: timing concurrent, transcript deterministic
