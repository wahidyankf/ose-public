// Example 49: Sealed Hierarchy, Closed Cases.
// Sealed lists every shape; exhaustive when covers all arms with no
// else. New shapes break handlers at compile time instead of slipping past.
sealed interface Outcome { // => closed: these three shapes, forever unless edited here
    data class Approved(val member: String, val amount: Int) : Outcome // => success carries both fields
    data class Rejected(val reason: String) : Outcome // => refusal carries its reason
    data object Pending : Outcome // => waiting carries nothing but its name
} // => the fixed few: handlers answer each, the compiler audits all

fun report(outcome: Outcome): String { // => one when values every arm into a line
    return when (outcome) { // => exhaustive: no else needed, none allowed to be missed
        is Outcome.Approved -> "approved " + outcome.member + "=" + outcome.amount // => smart cast, no casting
        is Outcome.Rejected -> "rejected: " + outcome.reason // => reason rides along
        Outcome.Pending -> "pending review" // => object arm binds nothing
    } // => add a fourth shape and this when stops compiling
} // => coverage proven by the compiler, not by discipline

fun main() { // => the entry point the harness runs
    println(report(Outcome.Approved("sari", 50))) // => Output: approved sari=50
    println(report(Outcome.Rejected("negative dues"))) // => Output: rejected: negative dues
    println(report(Outcome.Pending)) // => Output: pending review
} // => main ends: three shapes, three arms, zero else
