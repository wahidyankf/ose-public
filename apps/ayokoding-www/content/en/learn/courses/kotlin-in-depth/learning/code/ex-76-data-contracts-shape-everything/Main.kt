// Example 76: Data Contracts Shape Everything.
// Find the data class first: three fields, one invariant, enforced in
// the factory. Every function takes the contract, never raw strings.
data class Due(val member: String, val amount: Int) // => the contract: the program in miniature

fun makeDue(member: String, amount: Int): Due { // => the factory: the only legal birth
    require(member.isNotBlank()) { "member must name someone" } // => invariant one, enforced at birth
    require(amount >= 0) { "dues must not be negative" } // => invariant two, enforced at birth
    return Due(member, amount) // => past both guards the value is legal
} // => no instance exists in violation: construction is the checkpoint

fun settle(due: Due): String = "settled " + due.member + "=" + due.amount // => typed stations: Due in, text out

fun main() { // => the entry point the harness runs
    val due = makeDue("sari", 50) // => one value begins its journey
    println(settle(due)) // => Output: settled sari=50
    println("contract: " + due) // => Output: contract: Due(member=sari, amount=50)
    println("refused: " + runCatching { makeDue("", -5) }.isFailure) // => Output: refused: true
} // => main ends: construct, settle, render; violations refused at birth
