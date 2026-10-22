// Example 9: Use Closes Resources.
// use closes every Closeable on every exit path, so the leak
// becomes unwritable; the charset stays explicit on each call.
import java.io.File // => the fixture handle beside the program

fun main() { // => the entry point the harness runs
    val ledger = File("ledger.txt") // => fixture path, relative and fixed
    ledger.writeText("sari:50\nbudi:75\n", Charsets.UTF_8) // => write with charset stated
    val body = ledger.reader(Charsets.UTF_8).use { it.readText() } // => use closes the reader
    println(body.trim()) // => Output: the two dues lines verbatim
    println("roundtrip: " + (body == "sari:50\nbudi:75\n")) // => Output: roundtrip: true
    println("lines: " + body.trim().lines().size) // => Output: lines: 2
    ledger.delete() // => tidy: reruns start identical
} // => main ends: write, read, verify, tidy
