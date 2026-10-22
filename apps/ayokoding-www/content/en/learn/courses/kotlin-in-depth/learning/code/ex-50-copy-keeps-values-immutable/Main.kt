// Example 50: Copy Keeps Values Immutable.
// Each adjustment copies into a new state while earlier states stay
// intact: the audit trail is a chain of values, not one mutated cell.
data class Due(val member: String, val amount: Int) // => values: val fields, copy updates

fun main() { // => the entry point the harness runs
    val original = Due("sari", 50) // => state one: Tuesday's line, forever 50
    val raised = original.copy(amount = 75) // => state two: same member, new amount
    val handed = raised.copy(member = "budi") // => state three: same amount, new member
    println("first: " + original) // => Output: first: Due(member=sari, amount=50)
    println("second: " + raised) // => Output: second: Due(member=sari, amount=75)
    println("third: " + handed) // => Output: third: Due(member=budi, amount=75)
    println("chain: " + (original.amount + raised.amount + handed.amount)) // => Output: chain: 200
} // => main ends: three states chained, every earlier one intact
