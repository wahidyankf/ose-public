// Main.kt: the thin edge over package dues.
// Imports exactly the two functions it needs; nothing else crosses.
import dues.parse // => the import list documents the dependencies
import dues.total // => two names in, the whole domain stays out

fun main() { // => the entry point the harness runs
    val lines = listOf("sari:50", "oops", "budi:75") // => three lines, one bad
    val good = lines.mapNotNull(::parse) // => calm parsing: bad lines vanish here
    println("pairs: " + good) // => Output: pairs: [(sari, 50), (budi, 75)]
    println("total: " + total(good)) // => Output: total: 125
} // => main ends: imports honest, edge thin, domain untouched
