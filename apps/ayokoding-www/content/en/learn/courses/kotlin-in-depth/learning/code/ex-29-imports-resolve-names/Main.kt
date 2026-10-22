// Example 29: Imports Resolve Names.
// Plain imports for the usual, aliases for clashes, wildcards almost
// never: each import form says something different at the top of the file.
import java.util.ArrayDeque // => plain: the double-ended queue by its own name
import java.util.ArrayList // => plain: the resizable list, no clash here
import kotlin.collections.HashMap as FastMap // => alias: the same map under a clearer local name

fun main() { // => the entry point the harness runs
    val deque = ArrayDeque(listOf("sari", "budi")) // => plain imports read plainly
    println("first: " + deque.removeFirst()) // => Output: first: sari
    val ledger = FastMap<String, Int>() // => the alias at work: a map with intent
    ledger["citra"] = 25 // => aliased type behaves exactly like the original
    val grown = ArrayList(listOf("a", "b", "c")) // => second plain import, same file
    println("ledger: " + ledger.toSortedMap()) // => Output: ledger: {citra=25}
    println("grown: " + grown.size) // => Output: grown: 3
} // => main ends: three imports, three behaviors, zero wildcards
