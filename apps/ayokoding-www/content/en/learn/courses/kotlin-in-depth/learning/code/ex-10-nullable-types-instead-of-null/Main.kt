// Example 10: Nullable Types Instead of Null.
// String? declares that absence is possible; ?. and ?: handle
// it in one expression instead of a four-line null ladder.
fun duesOf(member: String): Int? { // => the ? admits absence honestly
    val ledger = mapOf("sari" to 50, "budi" to 75) // => fixed fixture ledger
    return ledger[member] // => missing keys read as null, typed and visible
} // => the lookup never throws: absence travels in the type

fun main() { // => the entry point the harness runs
    println("sari: " + (duesOf("sari") ?: 0)) // => Output: sari: 50
    println("dewi: " + (duesOf("dewi") ?: 0)) // => Output: dewi: 0, absent reads as zero
    val shout = duesOf("budi")?.toString()?.uppercase() // => safe chain: runs only when present
    println("shout: " + (shout ?: "none")) // => Output: shout: 75
    println("present: " + (duesOf("budi") != null)) // => Output: present: true
} // => main ends: absence handled at each call site, nothing thrown
