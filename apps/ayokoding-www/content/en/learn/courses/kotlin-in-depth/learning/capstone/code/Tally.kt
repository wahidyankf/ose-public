// Tally.kt: the settlement domain for the capstone.
// parseLine answers per line, summarize folds lines, render prints.
// Pure throughout: printing belongs to Main, testing to TallyTest.
data class Due(val member: String, val amount: Int) // => the contract: member plus non-negative amount

data class Summary(val totals: Map<String, Int>, val skipped: Int) // => folded state: sorted totals, honest skips

fun parseLine(line: String): Due? { // => one line, one calm verdict: Due or null
    val parts = line.split(":") // => the member:amount grammar, one split
    if (parts.size != 2 || parts[0].isBlank()) return null // => shapeless or nameless: calm null
    val amount = parts[1].toIntOrNull() ?: return null // => wordy amounts refuse calmly too
    if (amount < 0) return null // => negative dues are data errors, not refunds
    return Due(parts[0], amount) // => both halves good: the Due travels on
} // => parseLine ends: no throws, no nulls leaking, no printing

fun summarize(lines: List<String>): Summary { // => the fold: successes bank, failures count
    val totals = mutableMapOf<String, Int>() // => per-member totals accumulate here
    var skipped = 0 // => malformed lines count here, never vanish
    for (line in lines) { // => one line, one independent verdict
        val due = parseLine(line) // => calm verdict per line
        if (due == null) skipped++ // => bad lines count and name themselves downstream
        else totals[due.member] = (totals[due.member] ?: 0) + due.amount // => good lines accumulate per member
    } // => the fold ends: every line answered for, none vetoing another
    return Summary(totals.toSortedMap(), skipped) // => sorted for byte-stable transcripts
} // => summarize ends: per-item granularity, the course's standing rule

fun render(summary: Summary): String { // => folded state into report text
    return buildString { // => one buffer, sorted members, honest footer
        for ((member, amount) in summary.totals) { // => members already sorted by summarize
            append(member).append(": ").append(amount).append("\n") // => one line per member, fixed shape
        } // => member lines done: the treasurer reads them by hand
        append("grand: ").append(summary.totals.values.sum()).append("\n") // => the grand total of exactly the settled
        append("skipped: ").append(summary.skipped).append("\n") // => skipped count printed, never hidden
    } // => render ends: text out, decisions none, printing none
} // => Tally.kt ends: domain complete, edges elsewhere
