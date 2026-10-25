// Example 30: Gradle Layout and Coordinates.
// The build file declares group, version, and the Kotlin plugin;
// the reader below extracts them as text to prove what is declared.
import java.io.File // => the committed build file beside the program

fun field(lines: List<String>, prefix: String): String { // => first line starting with prefix, stripped
    return lines.first { it.trim().startsWith(prefix) } // => the declaration line
        .substringAfter("=") // => drop the key, keep the value
        .trim().trim('"') // => drop spaces and the surrounding quotes
} // => tiny grammar: key = "value", nothing more

fun main() { // => the entry point the harness runs
    val lines = File("build.gradle.kts").readLines(Charsets.UTF_8) // => the committed descriptor
    println("group: " + field(lines, "group")) // => Output: group: com.ayokoding
    println("version: " + field(lines, "version")) // => Output: version: 1.0.0
    println("kotlin: " + lines.any { "kotlin(\"jvm\")" in it }) // => Output: kotlin: true
} // => main ends: coordinates proven from the file that declares them
