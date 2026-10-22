// Example 48: Data Classes Are Values.
// Data carriers compare by content, copy changes one field into a new
// instance, and destructuring unpacks in order: values flow, never mutate.
data class Due(val member: String, val amount: Int) // => the declaration is the whole contract

fun main() { // => the entry point the harness runs
    val first = Due("sari", 50) // => one construction, Tuesday's line
    val second = Due("sari", 50) // => another construction, same content
    println("equal: " + (first == second)) // => Output: equal: true, content decides
    println("hash: " + (first.hashCode() == second.hashCode())) // => Output: hash: true, maps agree
    val raised = first.copy(amount = 75) // => one field changed, new instance out
    println("raised: " + raised) // => Output: raised: Due(member=sari, amount=75)
    println("kept: " + first) // => Output: kept: Due(member=sari, amount=50)
    val (member, amount) = raised // => unpack in declared order where parts are needed
    println("parts: " + member + "+" + amount) // => Output: parts: sari+75
} // => main ends: equal by content, updated by copy, original kept
