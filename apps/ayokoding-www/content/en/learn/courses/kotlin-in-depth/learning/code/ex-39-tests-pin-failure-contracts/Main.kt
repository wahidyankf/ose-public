// Example 39: Tests Pin Failure Contracts.
// Failure promises are behavior too: pin the refusal shape with
// isFailure and a message fragment, so softening refusals breaks loudly.
fun settleOrThrow(dues: Map<String, Int>): Int { // => the strict settler, loud by contract
    require(dues.values.all { it >= 0 }) { "dues must not be negative" } // => refusal one, named
    check(dues.isNotEmpty()) { "cannot settle an empty ledger" } // => refusal two, named
    return dues.values.sum() // => past both guards the answer is safe
} // => two refusals, each with a fragment the checks below pin

fun main() { // => the entry point the harness runs
    val neg = runCatching { settleOrThrow(mapOf("sari" to -5)) } // => refusal one, captured
    check(neg.isFailure) { "negative dues must fail" } // => the shape: failure, not value
    check("negative" in (neg.exceptionOrNull()?.message ?: "")) { "message names negativity" } // => the fragment, pinned
    println("PASS: negative refused with its fragment") // => Output: the first failure contract
    val empty = runCatching { settleOrThrow(emptyMap()) } // => refusal two, captured
    check("empty" in (empty.exceptionOrNull()?.message ?: "")) { "message names emptiness" } // => the fragment, pinned
    println("PASS: empty refused with its fragment") // => Output: the second failure contract
    check(settleOrThrow(mapOf("sari" to 50)) == 50) { "good ledgers still settle" } // => the happy path, kept
    println("PASS: good ledgers still settle") // => Output: the happy path, unbroken
} // => main ends: two refusal contracts pinned, one success kept
