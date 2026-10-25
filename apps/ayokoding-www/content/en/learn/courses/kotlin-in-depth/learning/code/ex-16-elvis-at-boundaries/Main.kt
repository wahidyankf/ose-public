// Example 16: Elvis at Boundaries.
// Elvis belongs where values enter: each right side states the
// absence policy for exactly one boundary, visible in one place.
fun main() { // => the entry point the harness runs
    val ledger = mapOf("sari" to 50) // => one known member, the rest absent
    val dues = ledger["sari"] ?: 0 // => literal default: missing reads as zero
    println("sari: " + dues) // => Output: sari: 50
    val guest = ledger["dewi"] ?: "visitor".uppercase() // => computed fallback, still at the boundary
    println("guest: " + guest) // => Output: guest: VISITOR
    val name: String? = "budi" // => present value, for the loud-refusal arm
    val kept = name ?: error("member name is required") // => loud refusal: cannot proceed nameless
    println("kept: " + kept) // => Output: kept: budi
    println("missing: " + (ledger["anon"] ?: 0)) // => Output: missing: 0
} // => main ends: three policies, each stated where the value enters
