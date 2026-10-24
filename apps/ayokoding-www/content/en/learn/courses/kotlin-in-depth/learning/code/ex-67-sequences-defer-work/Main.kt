// Example 67: Sequences Defer Work.
// map and filter stack without running; first pulls exactly one element
// through. The counter proves work avoided instead of asserting speed felt.
fun main() { // => the entry point the harness runs
    val lines = (1..10000).map { "member" + it + ":" + it } // => ten thousand fixture lines
    var parsed = 0 // => the honesty meter: counts parses, not milliseconds
    val first = lines.asSequence() // => lazy view: nothing runs yet
        .map { line -> parsed++; line.split(":") } // => parse stage, counted per evaluation
        .first { it[1].toInt() > 9000 } // => terminal: pulls until the first match
    println("found: " + first) // => Output: found: [member9001, 9001]
    println("parsed: " + parsed) // => Output: parsed: 9001, not 10000
    println("saved: " + (10000 - parsed)) // => Output: saved: 999
} // => main ends: partial demand, lazy supply, counted savings
