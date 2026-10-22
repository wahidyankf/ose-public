// Starter: absence by throwing. The smell: a lookup that explodes
// forces every caller to try-catch a question with a calm answer.
// Your task: return zero for unknown members instead; resolve at the call site.
fun duesOf(member: String): Int { // => explodes on absence: the shape to fix
    val ledger = mapOf("sari" to 50, "budi" to 75) // => fixed fixture ledger
    return ledger[member] ?: throw IllegalArgumentException("unknown member: " + member) // => explosion for a calm question
} // => starter ends: throwing lookup, callers beware

fun main() { // => runs only for known members today
    println("sari: " + duesOf("sari")) // => prints 50, never faces absence
} // => main ends: absence untested, explosion waiting
// fix me: calm zero out, explosion never
