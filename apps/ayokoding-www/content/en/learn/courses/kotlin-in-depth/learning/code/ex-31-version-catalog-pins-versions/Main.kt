// Example 31: Version Catalog Pins Versions.
// The catalog states each version once in [versions]; libraries bind
// names to coordinates that reference the table instead of repeating numbers.
import java.io.File // => the committed catalog fixture beside the program

fun main() { // => the entry point the harness runs
    val lines = File("libs.versions.toml").readLines(Charsets.UTF_8) // => the version table, committed
    val versions = lines.filter { "=" in it && !it.trim().startsWith("[") && !it.trim().startsWith("#") } // => version lines only
    println("entries: " + versions.size) // => Output: entries: 4
    val kotlin = lines.first { it.trim().startsWith("kotlin") } // => the Kotlin pin, found by name
    println("pin: " + kotlin.trim()) // => Output: pin: kotlin = "2.4.21"
    val refs = lines.count { "version.ref" in it } // => libraries pointing at the table, not literals
    println("refs: " + refs) // => Output: refs: 2
} // => main ends: versions stated once, referenced twice, repeated nowhere
