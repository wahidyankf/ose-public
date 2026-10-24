// Solution: absence as a calm value. The lookup returns zero for
// unknown members, and the call site prints without ceremony.
// Fixed from Starter: throwing lookup became a calm default.
fun duesOf(member: String): Int { // => absence answered in the type's own way
    val ledger = mapOf("sari" to 50, "budi" to 75) // => same fixture ledger
    return ledger[member] ?: 0 // => calm zero: no throw, no try, no ceremony
} // => helper ends: questions stay questions, never explosions

fun main() { // => the entry point the harness runs
    println("sari: " + duesOf("sari")) // => Output: sari: 50
    println("dewi: " + duesOf("dewi")) // => Output: dewi: 0, absent reads as zero
    println("present: " + (duesOf("budi") == 75)) // => Output: present: true
} // => main ends: absence handled, nothing thrown
