// Solution: the stdlib owns joining. One call names the separator;
// no loop, no flag, no trailing separator, no quadratic copying.
// Fixed from Starter: the loop became a library call.
fun joinMembers(members: List<String>): String { // => the separator as data
    return members.joinToString(", ") // => separators between, never trailing
} // => helper ends: one line where nine stood

fun main() { // => the entry point the harness runs
    println(joinMembers(listOf("sari", "budi", "citra"))) // => Output: sari, budi, citra
    println("empty: [" + joinMembers(emptyList()) + "]") // => Output: empty: []
    println("single: " + joinMembers(listOf("sari"))) // => Output: single: sari
} // => main ends: the edges the loop got right, kept by the library
