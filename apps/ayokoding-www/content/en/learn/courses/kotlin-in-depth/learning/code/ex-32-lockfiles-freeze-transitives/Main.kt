// Example 32: Lockfiles Freeze Transitives.
// The lock freezes the whole closure: every jar pinned with a hash,
// so rebuilds download the same bytes no matter what released overnight.
import java.io.File // => the committed lock fixture beside the program

fun locked(line: String): Boolean { // => one line is a lock iff it parses fully
    if (line.isBlank() || line.startsWith("#")) return false // => comments and blanks are not entries
    val parts = line.split(" ") // => coordinate, then hash
    if (parts.size != 2) return false // => two fields or it is not a lock line
    val coords = parts[0].split(":") // => group:artifact:version, exactly three
    val hash = parts[1] // => the SHA-256 receipt for the bytes
    return coords.size == 3 && hash.length == 64 && hash.all { it in "0123456789abcdef" } // => shape proven
} // => shape checks prove the file is a lock, not a wish

fun main() { // => the entry point the harness runs
    val lines = File("jars.lock").readLines(Charsets.UTF_8) // => the frozen closure, committed
    val entries = lines.filter { locked(it) } // => only real entries count
    println("locked: " + entries.size) // => Output: locked: 2
    println("first: " + entries.first().split(" ")[0]) // => Output: first: org.jetbrains.kotlin:kotlin-stdlib:2.4.21
    println("hashed: " + entries.all { locked(it) }) // => Output: hashed: true
} // => main ends: every line parsed, every hash shaped, closure frozen
