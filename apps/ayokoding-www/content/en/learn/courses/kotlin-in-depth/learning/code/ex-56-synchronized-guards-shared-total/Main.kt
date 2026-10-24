// Example 56: Synchronized Guards Shared Total.
// synchronized wraps read-add-write into one indivisible decision, so
// ten threads settling together never overwrite each other's updates.
import kotlin.concurrent.thread // => one lambda per worker, as before

fun main() { // => the entry point the harness runs
    val ledger = mutableMapOf<String, Int>() // => shared settlement state, guarded below
    val lock = Any() // => one dedicated lock: private, never shared outward
    val workers = (1..10).map { i -> // => ten members, fixed roster
        thread { // => compute outside, mutate inside, hold briefly
            val share = i * 10 // => computed outside the lock: no contention
            synchronized(lock) { // => the whole decision, indivisible to observers
                ledger["member" + i] = (ledger["member" + i] ?: 0) + share // => read-add-write as one step
            } // => lock released: the shortest span that keeps the decision whole
        } // => worker ends: its share settled whole or not at all
    } // => ten workers launched against one guarded map
    workers.forEach { it.join() } // => reunite before reading, as Example 54 teaches
    println("members: " + ledger.size) // => Output: members: 10
    println("total: " + ledger.values.sum()) // => Output: total: 550
} // => main ends: ten whole settlements, total exact, every run
