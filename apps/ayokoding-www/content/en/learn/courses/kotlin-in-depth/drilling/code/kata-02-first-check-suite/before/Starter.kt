// Starter: prints without expectations. The smell: values scroll by
// and correctness lives in the reader's head, unverified by anything.
// Your task: state three contracts with check plus PASS lines.
fun totalOf(dues: Map<String, Int>): Int = dues.values.sum() // => the unit, untested so far

fun main() { // => prints answers nobody verifies
    println(totalOf(mapOf("sari" to 50, "budi" to 75))) // => 125, allegedly
    println(totalOf(emptyMap())) // => 0, allegedly
} // => main ends: output without oracle, green by inspection
// fix me: check plus PASS lines, contracts named
