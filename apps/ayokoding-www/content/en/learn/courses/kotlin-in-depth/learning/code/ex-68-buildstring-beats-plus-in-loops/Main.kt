// Example 68: BuildString Beats Plus in Loops.
// Plus in a loop copies per iteration (quadratic); buildString appends
// into one buffer (linear). Same meaning, honest cost, identical bytes.
fun report(dues: Map<String, Int>): String { // => the report builder: loops inside
    return buildString { // => one buffer behind a readable shape
        for ((member, amount) in dues.toSortedMap()) { // => sorted for stability, as always
            append(member).append(": ").append(amount).append("\n") // => appends, never copies
        } // => the loop ends: one buffer holds all lines
    } // => linear work, readable code, identical bytes to the naive shape
} // => builders for loops, plus for straight lines: the precise boundary

fun main() { // => the entry point the harness runs
    val dues = mapOf("sari" to 50, "budi" to 75, "citra" to 25) // => three fixed members
    val text = report(dues) // => build once through the builder
    print(text) // => Output: three sorted lines
    println("chars: " + text.length) // => Output: chars: 28
    println("lines: " + text.trim().lines().size) // => Output: lines: 3
} // => main ends: identical bytes, linear cost, proven length
