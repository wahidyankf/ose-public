// Solution: one bound maximum. Comparable buys ordering for every
// type at once; unorderable callers fail at compile time, not in copy four.
// Fixed from Starter: three copies became one bound function.
fun <T : Comparable<T>> maxOfAll(a: T, b: T): T = if (a >= b) a else b // => the honest list: ordering needed, ordering stated

fun main() { // => the entry point the harness runs
    println(maxOfAll(50, 75)) // => Output: 75, integers through the generic
    println(maxOfAll("budi", "sari")) // => Output: sari, strings through the same generic
    println(maxOfAll(50L, 25L)) // => Output: 50, longs through the same generic
} // => main ends: one function, three types, zero copies
