// Example 6: Grouping and Counting.
// groupingBy with eachCount folds the tally loop into one stage
// that cannot forget the zero case: every key starts at zero.
fun main() { // => the entry point the harness runs
    val votes = listOf("sari", "budi", "sari", "citra", "budi", "sari") // => fixed ballot box
    val counts = votes.groupingBy { it }.eachCount() // => group by value, count each group
    println("tallies: " + counts.toSortedMap()) // => Output: tallies: {budi=2, citra=1, sari=3}
    println("winner votes: " + (counts["sari"] ?: 0)) // => Output: winner votes: 3
    println("absent votes: " + (counts["dewi"] ?: 0)) // => Output: absent votes: 0
} // => main ends: the elvis operator answers missing keys with zero
