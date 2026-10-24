// Solution: the total ranking. Dues descend, names ascend inside ties,
// so equal members order by statement instead of by fixture accident.
// Fixed from Starter: accidental ties became a stated tiebreak.
fun main() { // => the entry point the harness runs
    val dues = mapOf("sari" to 50, "budi" to 75, "citra" to 75) // => the same tie at 75
    val ranked = dues.keys.sortedWith(compareByDescending<String> { dues.getValue(it) }.thenBy { it }) // => dues down, names up
    println(ranked) // => Output: [budi, citra, sari], stated not accidental
    println("tiebreak: name") // => Output: tiebreak: name
} // => main ends: total order, byte-stable transcript, ties pinned
