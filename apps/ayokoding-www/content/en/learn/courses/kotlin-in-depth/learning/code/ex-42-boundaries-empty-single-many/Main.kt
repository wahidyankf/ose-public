// Example 42: Boundaries Empty Single Many.
// Empty proves the identity, single proves the shape, many proves the
// fold: three rows catch the off-by-one, the null, and the trailing separator.
fun joinMembers(members: List<String>): String { // => the unit under test
    return members.joinToString(", ") // => stdlib join: separators between, never trailing
} // => the boundary family below proves all three shapes

fun main() { // => the entry point the harness runs
    check(joinMembers(emptyList()) == "") { "empty joins to nothing" } // => the identity row
    println("PASS: empty -> []") // => Output: the empty verdict
    check(joinMembers(listOf("sari")) == "sari") { "single joins to itself" } // => the shape row
    println("PASS: single -> [sari]") // => Output: the single verdict
    check(joinMembers(listOf("sari", "budi", "citra")) == "sari, budi, citra") { "many joins between" } // => the fold row
    println("PASS: many -> [sari, budi, citra]") // => Output: the many verdict
} // => main ends: the trio, green, copyable by reflex
