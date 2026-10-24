// Starter: three maximums, one idea. The smell: each type gets its
// own copy, so every fix ships three times and the fourth type waits.
// Your task: one generic maxOfAll bounded by Comparable for all three.
fun maxInt(a: Int, b: Int): Int = if (a >= b) a else b // => copy one: integers

fun maxString(a: String, b: String): String = if (a >= b) a else b // => copy two: strings

fun maxLong(a: Long, b: Long): Long = if (a >= b) a else b // => copy three: longs, the pattern visible

fun main() { // => calls each copy once, triplicating the idea
    println(maxInt(50, 75)) // => 75, via the integer copy
    println(maxString("budi", "sari")) // => sari, via the string copy
} // => main ends: three copies, one idea, the tax itemized
// fix me: fun <T : Comparable<T>> maxOfAll, one function
