// Example 14: Sealed Hierarchies for Errors.
// A sealed hierarchy lists every failure shape in the type, so
// when-handlers stay exhaustive and new failures break callers loudly.
sealed interface LineResult { // => closed set: the compiler knows every arm
    data class Ok(val member: String, val amount: Int) : LineResult // => success carries both fields
    data object Blank : LineResult // => one shape for empty lines
    data class Malformed(val line: String) : LineResult // => failure keeps the offending text
} // => three shapes, fixed forever unless edited here

fun parseLine(line: String): LineResult { // => parsing answers in the closed type
    if (line.isBlank()) return LineResult.Blank // => blanks are a shape, not an accident
    val parts = line.split(":") // => the member:amount grammar, one split
    if (parts.size != 2) return LineResult.Malformed(line) // => wrong shape keeps its evidence
    val amount = parts[1].toIntOrNull() // => calm parse: null instead of explosion
        ?: return LineResult.Malformed(line) // => unparsable numbers keep evidence too
    return LineResult.Ok(parts[0], amount) // => both fields present: the happy shape
} // => every path returns: no throws, no nulls, no strings

fun main() { // => the entry point the harness runs
    for (line in listOf("sari:50", "", "oops", "budi:xx")) { // => one of each shape, fixed order
        val verdict = when (val r = parseLine(line)) { // => exhaustive when: every arm valued
            is LineResult.Ok -> "ok " + r.member + "=" + r.amount // => success posts both fields
            LineResult.Blank -> "skip blank" // => object arm needs no binding
            is LineResult.Malformed -> "skip malformed: " + r.line // => evidence rides along
        } // => add a fourth outcome and this when stops compiling
        println(verdict) // => Output: one verdict per line, in order
    } // => the loop ends: four lines, four exhaustive answers
} // => main ends: closed errors, open-and-shut handling
