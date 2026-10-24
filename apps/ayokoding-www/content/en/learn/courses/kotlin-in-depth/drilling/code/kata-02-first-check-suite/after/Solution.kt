// Solution: contracts as checks. Each boolean states what must hold,
// each PASS line reads as specification, each message names red days.
// Fixed from Starter: inspection became evaluation.
fun totalOf(dues: Map<String, Int>): Int = dues.values.sum() // => the unit under test, pure

fun main() { // => the entry point the harness runs, and the test runner
    check(totalOf(mapOf("sari" to 50, "budi" to 75)) == 125) { "two members total 125" } // => contract one, named
    println("PASS: two members total 125") // => Output: the first specification
    check(totalOf(emptyMap()) == 0) { "empty ledger settles zero" } // => contract two, the edge
    println("PASS: empty ledger settles zero") // => Output: the edge, pinned
    check(totalOf(mapOf("x" to 1, "y" to 2)) == 3) { "small ledger totals 3" } // => contract three
    println("PASS: small ledger totals 3") // => Output: the third specification
} // => main ends: three contracts, three verdicts, zero framework
