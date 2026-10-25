// Example 8: Sorting with Comparators.
// sortedBy ranks by one key, thenBy pins the tiebreak, and no
// sort mutates: each returns a new list, the input stays put.
fun main() { // => the entry point the harness runs
    val dues = mapOf("sari" to 50, "budi" to 75, "citra" to 75, "dewi" to 25) // => fixed ledger
    val byDues = dues.keys.sortedBy { dues.getValue(it) } // => rank by value, ascending
    println("ascending: " + byDues) // => Output: ascending: [dewi, sari, budi, citra]
    val ranked = dues.keys.sortedWith(compareByDescending<String> { dues.getValue(it) }.thenBy { it }) // => dues down, names up
    println("ranked: " + ranked) // => Output: ranked: [budi, citra, sari, dewi]
    println("untouched: " + dues.toSortedMap()) // => Output: untouched: {budi=75, citra=75, dewi=25, sari=50}
} // => main ends: sorted views printed, the source map unchanged
