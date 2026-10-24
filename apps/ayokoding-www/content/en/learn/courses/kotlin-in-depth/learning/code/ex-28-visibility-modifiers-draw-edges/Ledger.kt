// Ledger.kt: three visibilities, one honest surface.
// Public promises, internal workshop, private machinery: each marked.
package dues // => same module, same package: internal is reachable

fun settleReport(lines: List<String>): String { // => public: the promise other files keep
    val good = lines.mapNotNull(::parseLine) // => internal helper, same module so visible
    return "members=" + good.size + " total=" + good.sumOf { it.second } // => the polished surface
} // => the public function owns the only path to the machinery

internal fun parseLine(line: String): Pair<String, Int>? { // => internal: the module workshop
    val parts = line.split(":") // => the grammar, shared across module files
    if (parts.size != 2 || parts[0].isBlank()) return null // => wrong shape: calm null
    val amount = parts[1].toIntOrNull() ?: return null // => calm digits or calm null
    return parts[0] to amount // => good pairs travel to every module file
} // => internal ends: shared freely inside, hidden outside

private fun auditTag(): String = "audited" // => private: this file alone may call it
// Direct calls to auditTag from Main fail to compile: private means private.
