// Example 26: One File One Job.
// This file owns the member:amount grammar and nothing else:
// parsing in, pairs or null out, no printing, no summing.
fun parseEntry(line: String): Pair<String, Int>? { // => text in, pair-or-null out
    val parts = line.split(":") // => the grammar: exactly one colon
    if (parts.size != 2 || parts[0].isBlank()) return null // => wrong shape: calm null
    val amount = parts[1].toIntOrNull() // => calm digits: null instead of explosion
        ?: return null // => unparsable amount: calm null again
    return parts[0] to amount // => both halves good: the pair travels on
} // => the file ends: grammar owned, nothing else touched

fun main() { // => the entry point the harness runs
    println(parseEntry("sari:50")) // => Output: (sari, 50)
    println(parseEntry("oops")) // => Output: null
    println(parseEntry("budi:xx")) // => Output: null
} // => main ends: the grammar proven in three calls
