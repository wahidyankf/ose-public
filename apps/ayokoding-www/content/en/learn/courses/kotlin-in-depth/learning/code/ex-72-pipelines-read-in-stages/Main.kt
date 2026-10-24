// Example 72: Pipelines Read in Stages.
// State the data shape after each stage before reading the next: lines
// to pairs, pairs to valid, valid to sorted, sorted to text. Four shapes.
fun main() { // => the entry point the harness runs
    val lines = listOf("sari:50", "oops", "budi:75", "citra:25", "xx", "dewi:100") // => stage zero: six raw lines
    val pairs = lines.map { it.split(":") } // => stage one: six fragment lists
    val valid = pairs.filter { it.size == 2 && it[1].toIntOrNull() != null } // => stage two: four clean pairs
    val ranked = valid.sortedByDescending { it[1].toInt() } // => stage three: best first
    val top = ranked.take(3) // => stage four: three winners, shapes proven each step
    for (entry in top) println(entry[0] + "=" + entry[1]) // => Output: dewi=100, budi=75, sari=50
    println("stages: 4 survivors: " + valid.size) // => Output: stages: 4 survivors: 4
} // => main ends: four shapes stated, one pipeline understood
