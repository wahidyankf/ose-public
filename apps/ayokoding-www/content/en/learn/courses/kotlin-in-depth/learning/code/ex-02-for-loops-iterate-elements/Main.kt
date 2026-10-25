// Example 2: For Loops Iterate Elements.
// The element loop reads each item directly, so off-by-one
// errors and length bookkeeping disappear from everyday iteration.
fun main() { // => the entry point the harness runs
    val names = listOf("ada", "grace", "sari") // => fixed sample data, read-only
    for (name in names) { // => element loop: the item, never an index
        println("hello, " + name) // => Output per element, in order
    } // => the loop ends: no counter to reset, no bound to recheck
    var total = 0 // => accumulators start at the identity before the loop
    for (name in names) { // => second pass: one loop does one job
        total += name.length // => add each length: 3 + 5 + 4
    } // => pass ends with the total fully accumulated
    println("letters: " + total) // => Output: letters: 12
    for (i in names.indices) { // => indices kept for exactly one reason
        println("" + i + ": " + names[i]) // => Output: 0: ada, then 1: grace, 2: sari
    } // => positions print only when the position itself is data
} // => main ends: three loops, each with a single visible job
