// Example 64: Small Functions Read Once.
// parseValid, settleTotal, renderReport: each fits on a glance, each
// does what its name said. Extraction manages reader working memory.
fun parseValid(lines: List<String>): Map<String, Int> { // => step one: text into clean data
    val out = mutableMapOf<String, Int>() // => valid entries bank here
    for (line in lines) { // => one line, one verdict, as Example 17 teaches
        val parts = line.split(":") // => the member:amount grammar
        val amount = if (parts.size == 2) parts[1].toIntOrNull() else null // => calm digits or null
        if (parts.size == 2 && parts[0].isNotBlank() && amount != null) out[parts[0]] = amount // => good lines bank
    } // => the loop ends: valid parsed, the rest ignored
    return out // => clean data out, nothing printed
} // => step one ends: decisions without side effects

fun settleTotal(dues: Map<String, Int>): Int = dues.values.sum() // => step two: one line, one sum

fun renderReport(total: Int, members: Int): String = "members=" + members + " total=" + total // => step three: values into text

fun main() { // => the entry point the harness runs: composition only
    val dues = parseValid(listOf("sari:50", "oops", "budi:75")) // => text into clean data
    println(renderReport(settleTotal(dues), dues.size)) // => Output: members=2 total=125
    println("steps: 3") // => Output: steps: 3
} // => main ends: three named steps, zero interleaved purposes
