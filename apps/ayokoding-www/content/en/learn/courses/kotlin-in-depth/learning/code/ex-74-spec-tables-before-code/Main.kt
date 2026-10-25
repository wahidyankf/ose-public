// Example 74: Spec Tables Before Code.
// The table states the contract as data; branches below enforce it.
// Read the rows first, then each branch reads as one row's enforcement.
fun route(code: Int): String { // => the router: five rows, five branches
    return when (code) { // => each arm enforces exactly one stated row
        0 -> "empty batch" // => row 0: nothing to settle
        1 -> "single member" // => row 1: the trivial settlement
        in 2..10 -> "small batch" // => rows 2-10: one room, one sitting
        in 11..100 -> "large batch" // => rows 11-100: split across sittings
        else -> "reject: too many" // => row else: over capacity, refused
    } // => five arms, five rows, no surprise branch
} // => the table lives in the test; the branches mirror it here

fun main() { // => the entry point the harness runs
    val rows = listOf(0 to "empty batch", 1 to "single member", 5 to "small batch", 50 to "large batch", 500 to "reject: too many") // => the spec as data
    for ((code, want) in rows) { // => each row enforced in turn
        val got = route(code) // => run the branch for this row
        check(got == want) { "row " + code + ": want " + want + ", got " + got } // => branches answer to rows
        println("row " + code + ": " + got) // => Output: five enforced verdicts
    } // => the loop ends: contract stated, branches answering
} // => main ends: table first in reading, rows green in running
