// Example 35: Check States Contracts.
// check in a main is the whole testing convention at its smallest:
// a boolean, a lazy message, and the toolchain as the runner.
fun totalOf(dues: Map<String, Int>): Int = dues.values.sum() // => the unit under test, pure

fun main() { // => the entry point the harness runs, and the test runner
    val got = totalOf(mapOf("sari" to 50, "budi" to 75)) // => exercise the unit once, fixed input
    check(got == 125) { "settlement totals 125, got " + got } // => the contract, named for red days
    println("PASS: settlement totals 125") // => Output: the green line, a readable spec
    check(totalOf(emptyMap()) == 0) { "empty ledger settles zero" } // => the edge case, pinned too
    println("PASS: empty ledger settles zero") // => Output: edges earn checks, not assumptions
    check(totalOf(mapOf("x" to 1, "y" to 2, "z" to 3)) == 6) // => Output line below
    println("PASS: three members total 6") // => Output: the third contract, equally named
} // => main ends: three contracts, three PASS lines, zero framework
