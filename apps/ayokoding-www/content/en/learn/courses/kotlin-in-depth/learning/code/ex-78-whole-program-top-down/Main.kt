// Example 78: Whole Program, Top Down.
// Pass one: main shows parse-settle-render. Pass two: Due is what flows.
// Pass three: the outcome routes shapes. Pass four: parseLine, one step deep.
data class Due(val member: String, val amount: Int) // => pass two: the contract, three fields

sealed interface LineOut { // => pass three: the routing inventory
    data class Good(val due: Due) : LineOut // => shaped lines settle
    data object Bad : LineOut // => the rest report
} // => two shapes: the whole routing vocabulary

fun parseLine(line: String): LineOut { // => pass four: one helper, read deep
    val parts = line.split(":") // => the grammar one final time
    val amount = if (parts.size == 2) parts[1].toIntOrNull() else null // => calm digits
    if (parts.size != 2 || parts[0].isBlank() || amount == null) return LineOut.Bad // => refusal, named
    return LineOut.Good(Due(parts[0], amount)) // => success carries the contract
} // => one helper deep: grammar, refusal, contract

fun main() { // => pass one: the pipeline shape, read first
    val lines = listOf("sari:50", "oops", "budi:75", "", "citra:25") // => five lines, two bad
    val goods = lines.map(::parseLine).filterIsInstance<LineOut.Good>().map { it.due } // => route, keep, unwrap
    println("members: " + goods.size) // => Output: members: 3
    println("total: " + goods.sumOf { it.amount }) // => Output: total: 150
    println("passes: 4") // => Output: passes: 4
} // => main ends: four passes, four answers, one understood program
