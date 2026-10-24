// Example 61: Confinement Avoids Sharing.
// Each worker folds its own private ledger; the main thread merges
// after the joins. No atomics, no locks, no queues: sharing avoided entirely.
import kotlin.concurrent.thread // => workers own their locals outright

fun main() { // => the entry point the harness runs
    val firstHalf = listOf("sari" to 50, "budi" to 75) // => disjoint partition one, fixed
    val secondHalf = listOf("citra" to 25, "dewi" to 100) // => disjoint partition two, fixed
    val locals = arrayOf<Map<String, Int>?>(null, null) // => finished values land here, one slot each
    val w1 = thread { // => worker one: its ledger lives and dies inside
        val local = mutableMapOf<String, Int>() // => inside-declared: confinement by construction
        for ((m, a) in firstHalf) local[m] = (local[m] ?: 0) + a // => private fold, no contention possible
        locals[0] = local // => publish the finished value after the work
    } // => worker one ends: local complete, published once
    val w2 = thread { // => worker two: same shape, disjoint data
        val local = mutableMapOf<String, Int>() // => its own ledger, never the other's
        for ((m, a) in secondHalf) local[m] = (local[m] ?: 0) + a // => private fold again
        locals[1] = local // => publish finished, once
    } // => worker two ends: the same confinement, different members
    w1.join() // => joins first: merge reads finished values, never live ones
    w2.join() // => both finished before the merge begins
    val merged = mutableMapOf<String, Int>() // => the merge: main thread alone, no guard needed
    for (local in locals) for ((m, a) in local!!) merged[m] = (merged[m] ?: 0) + a // => fold finished into final
    println("merged: " + merged.toSortedMap()) // => Output: merged: {budi=75, citra=25, dewi=100, sari=50}
    println("total: " + merged.values.sum()) // => Output: total: 250
} // => main ends: partitioned work, private folds, solitary merge
