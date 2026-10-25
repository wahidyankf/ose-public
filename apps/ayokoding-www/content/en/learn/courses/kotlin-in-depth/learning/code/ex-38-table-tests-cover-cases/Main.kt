// Example 38: Table Tests Cover Cases.
// Cases are data rows, not functions: one body runs every row, and
// adding a case means adding a row. Failures name the row index.
fun parseAmount(raw: String): Int? { // => the unit under test, calm by design
    return raw.trim().toIntOrNull()?.takeIf { it >= 0 } // => digits and non-negative, else null
} // => null means refuse: callers decide, never explosions

fun main() { // => the entry point the harness runs
    val rows = listOf("50" to 50, "0" to 0, " 75 " to 75, "xx" to null, "-5" to null, "" to null) // => six shapes as data
    for ((i, row) in rows.withIndex()) { // => index on every row for red-day pointers
        val got = parseAmount(row.first) // => run the one body on this row
        check(got == row.second) { "row " + i + " [" + row.first + "]: want " + row.second + ", got " + got } // => failure names its row
        println("PASS: row " + i + " [" + row.first.trim() + "] -> " + got) // => Output: one verdict per row
    } // => the loop ends: six rows, six verdicts, one body
} // => main ends: cases as data, coverage as a readable list
