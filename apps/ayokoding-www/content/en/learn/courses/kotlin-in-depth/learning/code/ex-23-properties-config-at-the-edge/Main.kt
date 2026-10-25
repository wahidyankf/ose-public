// Example 23: Properties Config at the Edge.
// Properties load key=value pairs once at startup; each key resolves
// with an explicit default so missing config behaves like documented config.
import java.io.File // => the config fixture beside the program
import java.util.Properties // => the key=value loader with comments handled

fun loadConfig(path: String): Map<String, String> { // => config enters here and only here
    val props = Properties() // => the loader: comments and whitespace handled
    File(path).reader(Charsets.UTF_8).use { props.load(it) } // => use closes the reader
    return props.stringPropertyNames().associateWith { props.getProperty(it) } // => plain map inward
} // => past this function everything is typed and defaulted

fun main() { // => the entry point the harness runs
    File("settle.properties").writeText("batch=sari\nlimit=2\n# verbose is unset\n", Charsets.UTF_8) // => two keys, one defaulted
    val cfg = loadConfig("settle.properties") // => read once at the edge
    val batch = cfg["batch"] ?: "everyone" // => present key flows through
    val limit = cfg["limit"]?.toIntOrNull() ?: 10 // => typed at the boundary, defaulted calmly
    val verbose = cfg["verbose"]?.toBooleanStrictOrNull() ?: false // => missing key takes the policy default
    println("batch: " + batch) // => Output: batch: sari
    println("limit: " + limit) // => Output: limit: 2
    println("verbose: " + verbose) // => Output: verbose: false
    File("settle.properties").delete() // => tidy: reruns start identical
} // => main ends: present, typed, and defaulted keys each proven
