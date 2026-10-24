// Starter: a hand-rolled join. The smell: the loop re-implements
// joinToString with a flag variable tracking the first element.
// Your task: replace the loop with joinToString and its separator.
fun joinMembers(members: List<String>): String { // => the loop to delete
    var out = "" // => accumulator plus flag: the two moving parts
    var first = true // => the flag joinToString makes unnecessary
    for (m in members) { // => hand iteration over a solved problem
        if (!first) out += ", " // => separator logic, hand-placed
        out += m // => copy per iteration, quadratic besides
        first = false // => flag maintenance, the tax on every reader
    } // => loop ends: correct, slow, and longer than the answer
    return out // => the answer joinToString gives in one call
} // => starter ends: working code that should not exist

fun main() { // => demonstrates the loop, separator and all
    println(joinMembers(listOf("sari", "budi"))) // => sari, budi, via the long road
} // => main ends: the flag variable's last stand
// fix me: joinToString with ", ", no loop, no flag
