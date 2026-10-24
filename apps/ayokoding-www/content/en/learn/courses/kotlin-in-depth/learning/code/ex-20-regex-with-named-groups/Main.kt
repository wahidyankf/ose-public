// Example 20: Regex with Named Groups.
// Named groups extract by name instead of by parenthesis position,
// so pattern edits keep the extraction code honest and compiling.
val ENTRY = Regex("""(?<member>[^:]+):(?<amount>\d+)""") // => one strict line grammar, compiled once

fun parseEntry(line: String): String { // => extraction answers in plain words
    val m = ENTRY.matchEntire(line.trim()) // => strict: the whole line must conform
        ?: return "reject: " + line // => no match names the rejected line
    val member = m.groups["member"]!!.value // => named read: no counting parentheses
    val amount = m.groups["amount"]!!.value // => digits only, guaranteed by the pattern
    return "accept: " + member + "=" + amount // => both parts arrive under their names
} // => extraction code survives pattern edits that shift positions

fun main() { // => the entry point the harness runs
    println(parseEntry("sari:50")) // => Output: accept: sari=50
    println(parseEntry("budi:xx")) // => Output: reject: budi:xx
    println(parseEntry("no-colon-here")) // => Output: reject: no-colon-here
} // => main ends: one grammar, three verdicts, all strict
