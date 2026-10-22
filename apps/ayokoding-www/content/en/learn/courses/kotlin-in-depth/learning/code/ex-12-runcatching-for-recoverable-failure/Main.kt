// Example 12: RunCatching for Recoverable Failure.
// runCatching wraps an expected disappointment into a Result value,
// so the call site stays a straight line with no try in sight.
fun parseDues(raw: String): Int { // => parsing is the operation that can disappoint
    return runCatching { raw.trim().toInt() }.getOrElse { 0 } // => good numbers parse, the rest default
} // => the failure travels as data and resolves at the boundary

fun main() { // => the entry point the harness runs
    println("good: " + parseDues("50")) // => Output: good: 50
    println("word: " + parseDues("fifty")) // => Output: word: 0
    println("blank: " + parseDues("   ")) // => Output: blank: 0
    val kept = runCatching { "75".toInt() }.getOrNull() // => getOrNull keeps the value, drops the story
    println("kept: " + kept) // => Output: kept: 75
} // => main ends: three shapes, one parser, zero try keywords
