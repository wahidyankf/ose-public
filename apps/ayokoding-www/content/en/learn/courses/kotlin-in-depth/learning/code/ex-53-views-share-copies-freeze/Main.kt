// Example 53: Views Share, Copies Freeze.
// Sequences view lazily and stop early; sorted copies eagerly into a
// new order. The transcript proves each policy by what it touched.
fun main() { // => the entry point the harness runs
    val members = listOf("sari", "budi", "citra", "dewi") // => four members, fixed order
    var touched = 0 // => the laziness meter: counts evaluations
    val first = members.asSequence() // => view: no copy, work deferred
        .map { it.uppercase().also { touched++ } } // => stage one, runs only on demand
        .first() // => terminal: pulls exactly one element through
    println("first: " + first + " touched=" + touched) // => Output: first: SARI touched=1
    val ordered = members.sorted() // => eager copy: all four into a new order
    println("ordered: " + ordered) // => Output: ordered: [budi, citra, dewi, sari]
    println("source: " + members) // => Output: source: [sari, budi, citra, dewi]
} // => main ends: lazy touched one, eager copied four, source untouched
