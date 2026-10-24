// Example 62: Names That Read Aloud.
// setleOutstanding says what happens; processData says nothing. Read
// the call site aloud: translation needed means the name lied.
fun settleOutstanding(dues: Map<String, Int>): Int { // => the domain verb, honest and complete
    return dues.values.sum() // => settle means total here: one verb, one meaning
} // => no translation needed between the name and the body

fun countSkipped(lines: List<String>): Int { // => skipped lines, counted plainly
    return lines.count { ":" !in it } // => unshaped lines are the skipped ones
} // => the name states input and verdict together

fun main() { // => the entry point the harness runs
    println("settled: " + settleOutstanding(mapOf("sari" to 50, "budi" to 75))) // => Output: settled: 125
    println("skipped: " + countSkipped(listOf("sari:50", "oops", ""))) // => Output: skipped: 2
    println("names: honest") // => Output: names: honest
} // => main ends: the transcript reads as English, no glossary needed
