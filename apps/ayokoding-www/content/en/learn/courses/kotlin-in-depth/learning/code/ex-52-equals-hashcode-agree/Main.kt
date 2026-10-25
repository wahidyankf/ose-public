// Example 52: Equals and HashCode Agree.
// Equal values must hash equal: maps trust the hash first, equality
// second. Data classes generate both from the same fields, so they agree.
data class Due(val member: String, val amount: Int) // => both contracts from one declaration

fun main() { // => the entry point the harness runs
    val first = Due("sari", 50) // => Tuesday's construction
    val second = Due("sari", 50) // => Thursday's construction, same content
    println("equal: " + (first == second)) // => Output: equal: true
    println("hash: " + (first.hashCode() == second.hashCode())) // => Output: hash: true
    val rates = mapOf(first to "settled") // => the map trusts the hash first
    println("lookup: " + rates[second]) // => Output: lookup: settled
    println("dedup: " + setOf(first, second).size) // => Output: dedup: 1
} // => main ends: agreement proven four ways, keys immutable throughout
