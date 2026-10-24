// Example 37: Fresh Fixtures per Test.
// Each check builds its own ledger, so mutations never leak across
// checks and order stops mattering: freshness is construction, not luck.
fun ledger(): MutableMap<String, Int> { // => the builder: a new ledger per call
    return mutableMapOf("sari" to 50, "budi" to 75) // => same known state, owned by the caller
} // => callers mutate freely: nobody else holds this map

fun main() { // => the entry point the harness runs
    val first = ledger() // => first check owns this copy outright
    first["sari"] = 999 // => mutate freely: the copy absorbs it
    check(first["sari"] == 999) { "first check edits its own ledger" } // => the edit, pinned
    println("PASS: first edits its own copy") // => Output: the first verdict
    val second = ledger() // => second check builds fresh, untouched by the first
    check(second["sari"] == 50) { "second check sees a fresh ledger" } // => no leak: still 50
    println("PASS: second sees a fresh 50") // => Output: the second verdict
    check(ledger().size == 2) { "builder always starts with two members" } // => the builder contract
    println("PASS: builder starts with two") // => Output: the builder verdict
} // => main ends: opposite mutations, independent verdicts, shared nothing
