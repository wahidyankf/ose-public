// Example 11: Require and Check State Contracts.
// require refuses caller mistakes in arguments; check refuses broken
// promises in state. Each names who must act in its own message.
fun settle(dues: Map<String, Int>): Int { // => pure settlement: map in, total out
    require(dues.values.all { it >= 0 }) { "dues must not be negative" } // => caller mistake, caller fixes
    check(dues.isNotEmpty()) { "cannot settle an empty ledger" } // => broken promise, maintainer fixes
    return dues.values.sum() // => past both guards the answer is safe
} // => helpers decide, main prints: the course keeps repeating this

fun main() { // => the entry point the harness runs
    println("total: " + settle(mapOf("sari" to 50, "budi" to 75))) // => Output: total: 125
    println("refused: " + runCatching { settle(mapOf("sari" to -5)) }.isFailure) // => Output: refused: true
    println("refused: " + runCatching { settle(emptyMap()) }.isFailure) // => Output: refused: true
} // => main ends: one success, two refusals, each printed once
