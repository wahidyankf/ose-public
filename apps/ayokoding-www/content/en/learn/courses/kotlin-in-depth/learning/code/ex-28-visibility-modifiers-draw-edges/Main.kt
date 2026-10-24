// Main.kt: a second file in the same module.
// Uses the public surface and the internal workshop; the private
// machinery stays unreachable, which the commented line documents.
import dues.settleReport // => the public promise, imported plainly
import dues.parseLine // => internal is visible: same module, same build

fun main() { // => the entry point the harness runs
    println(settleReport(listOf("sari:50", "oops", "budi:75"))) // => Output: members=2 total=125
    println(parseLine("citra:25")) // => Output: (citra, 25)
    // println(auditTag()) // => does not compile: private to Ledger.kt
    println("edge: drawn") // => Output: edge: drawn
} // => main ends: public and internal used, private respected
