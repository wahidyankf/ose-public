// Example 60: Immutable Messages Cross Threads.
// Data-class messages travel the queue: fixed at construction, safely
// published by the queue, folded by the consumer. No field ever writable.
import java.util.concurrent.ArrayBlockingQueue // => the safe-publication pipe, as before
import kotlin.concurrent.thread // => sender and folder run apart

data class Due(val member: String, val amount: Int) // => the message: values only, no vars
val PILL = Due("", -1) // => the sentinel: blocking queues forbid null, so one fixed value ends the stream

fun main() { // => the entry point the harness runs
    val pipe = ArrayBlockingQueue<Due>(8) // => values only: no null ever enters the pipe
    val totals = mutableMapOf<String, Int>() // => consumer-owned fold state, single thread
    val sender = thread { // => the producer: sends values, edits nothing
        for (due in listOf(Due("sari", 50), Due("budi", 75), Due("sari", 25))) { // => three fixed messages
            pipe.put(due) // => safe publication: construction visible after take
        } // => all messages sent, none mutable afterwards
        pipe.put(PILL) // => the pill: sentinel ends the stream
    } // => sender ends: values sent, nothing shared but the pipe
    val folder = thread { // => the consumer: folds until the pill
        while (true) { // => takes block patiently, as Example 57 teaches
            val due = pipe.take() // => one message per take, publication guaranteed
            if (due == PILL) break // => sentinel pill ends the fold cleanly
            totals[due.member] = (totals[due.member] ?: 0) + due.amount // => single-threaded fold, no guard needed
        } // => loop ends on the pill: every message folded exactly once
    } // => folder ends: totals complete, owned by one thread throughout
    sender.join() // => both joined before reading, the standing rule
    folder.join() // => completion as one ordered moment
    println("totals: " + totals.toSortedMap()) // => Output: totals: {budi=75, sari=75}
    println("messages: 3") // => Output: messages: 3
} // => main ends: values crossed, variables stayed home, totals exact
