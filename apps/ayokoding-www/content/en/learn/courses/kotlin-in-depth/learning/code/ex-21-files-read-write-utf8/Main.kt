// Example 21: Files Read and Write in UTF-8.
// writeText and readText move whole texts in one call with the
// charset stated, so platform defaults never sneak into data.
import java.io.File // => the fixture handle beside the program

fun main() { // => the entry point the harness runs
    val ledger = File("names.txt") // => fixture beside the program, relative path
    val body = "sari:50\nbudi:75\ndewi:Séka\n" // => non-ASCII name: the charset test that matters
    ledger.writeText(body, Charsets.UTF_8) // => charset explicit, never defaulted
    val back = ledger.readText(Charsets.UTF_8) // => same charset on the way back
    print(back) // => Output: the three dues lines verbatim
    println("roundtrip: " + (back == body)) // => Output: roundtrip: true
    println("lines: " + back.trim().lines().size) // => Output: lines: 3
    ledger.delete() // => tidy: reruns start identical
} // => main ends: write, read, verify, tidy
