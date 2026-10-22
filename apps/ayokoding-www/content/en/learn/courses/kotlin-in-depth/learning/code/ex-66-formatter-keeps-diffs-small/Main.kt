// Example 66: Formatter Keeps Diffs Small.
// The normalizer canonicalizes spacing the way ktfmt canonicalizes
// style: same meaning in, same bytes out, style debates out of review.
fun normalize(line: String): String { // => one ragged line into canonical shape
    val parts = line.split("=").map { it.trim() } // => trim every side of every equals
    return parts.joinToString("=") // => rejoin with exactly one equals, no spaces
} // => canonical text out: spacing decisions made once, here

fun main() { // => the entry point the harness runs
    val ragged = listOf("sari   =   50", "budi=75", "  citra  =  25  ") // => three authors, three spacings
    val canonical = ragged.map(::normalize) // => one rule formats all three
    for (line in canonical) println(line) // => Output: three canonical lines
    check(canonical == listOf("sari=50", "budi=75", "citra=25")) { "formatter must canonicalize all rows" } // => byte equality proven
    println("PASS: canonical") // => Output: PASS: canonical
} // => main ends: style as a function, diffs carrying logic only
