// Example 4: Ranges and Progressions.
// Ranges state intervals as data, so loop bounds stop being
// arithmetic every reader must simulate and check by hand.
fun main() { // => the entry point the harness runs
    for (i in 1..3) { // => closed range: both ends included
        println("count: " + i) // => Output: count: 1, then 2, then 3
    } // => 1..3 always means one, two, three: no bound to verify
    for (i in 0 until 3) { // => half-open: the end is a size, not a member
        println("slot: " + i) // => Output: slot: 0, then 1, then 2
    } // => until fits zero-based slots and counts exactly
    for (i in 6 downTo 4) { // => countdowns read as countdowns
        println("retry in: " + i) // => Output: retry in: 6, then 5, then 4
    } // => downTo walks backward with no reversed comparison
    val floor = 2 // => a value to test, not a loop at all
    println("allowed: " + (floor in 1..5)) // => Output: allowed: true
    println("allowed: " + (9 in 1..5)) // => Output: allowed: false
} // => main ends: three loops and two membership tests, all fixed
