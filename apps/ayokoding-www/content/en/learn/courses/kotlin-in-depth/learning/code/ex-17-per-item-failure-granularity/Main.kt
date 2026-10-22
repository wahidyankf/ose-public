// Example 17: Per-Item Failure Granularity.
// Each line settles or reports itself: successes accumulate into
// totals, failures accumulate into named skip counts. No line vetoes another.
fun main() { // => the entry point the harness runs
    val lines = listOf("sari:50", "oops", "budi:75", "", "citra:xx", "dewi:25") // => six lines, three bad
    val totals = mutableMapOf<String, Int>() // => successes bank here
    var skipped = 0 // => refusals count here, never vanish
    for (line in lines) { // => one line, one independent verdict
        val parts = line.split(":") // => the member:amount grammar again
        val amount = if (parts.size == 2) parts[1].toIntOrNull() else null // => calm parse per line
        if (parts.size != 2 || parts[0].isBlank() || amount == null) { // => any shape of badness
            println("skip: [" + line + "]") // => Output: each bad line names itself
            skipped++ // => counted, never hidden
        } else { // => good lines settle without noticing the bad ones
            totals[parts[0]] = (totals[parts[0]] ?: 0) + amount // => accumulate per member
        } // => the line is done: settled or reported, never both
    } // => the loop ends: every line answered for
    println("totals: " + totals.toSortedMap()) // => Output: totals: {budi=75, dewi=25, sari=50}
    println("skipped: " + skipped) // => Output: skipped: 3
} // => main ends: five settled across three members, three named skips
