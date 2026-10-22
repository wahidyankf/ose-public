// Example 57: Blocking Queue Connects Stages.
// put feeds, take settles, and one poison pill shuts the consumer down:
// backpressure, patience, and shutdown in a single bounded structure.
import java.util.concurrent.ArrayBlockingQueue // => the bounded pipe between stages
import kotlin.concurrent.thread // => producer and consumer run apart

const val PILL = "STOP" // => the shutdown protocol, named not magic

fun main() { // => the entry point the harness runs
    val pipe = ArrayBlockingQueue<String>(8) // => bounded: producers run at most eight ahead
    val settled = mutableListOf<String>() // => consumer-side results, single thread owns them
    val producer = thread { // => stage one: feeds lines, then the pill
        for (line in listOf("sari:50", "budi:75", "citra:25", "dewi:100", "eko:10")) { // => five fixed lines
            pipe.put(line) // => blocks when full: backpressure without busy loops
        } // => all real items queued in order
        pipe.put(PILL) // => the pill travels last: ordering guarantees it arrives after data
    } // => producer ends: fed everything, signaled the end
    val consumer = thread { // => stage two: settles until the pill arrives
        while (true) { // => takes block when empty: patience without polling
            val line = pipe.take() // => the next item, whenever it arrives
            if (line == PILL) break // => protocol honored: shutdown, not data
            settled.add(line.uppercase()) // => settle: uppercase as the visible transform
        } // => loop ends only on the pill, never on timing
    } // => consumer ends: every item settled exactly once
    producer.join() // => both stages joined before printing, as always
    consumer.join() // => completion as one ordered moment
    println(settled.sorted().joinToString("; ")) // => Output: all five settled, sorted for stability
    println("count: " + settled.size) // => Output: count: 5
} // => main ends: decoupled stages, clean shutdown, bounded memory
