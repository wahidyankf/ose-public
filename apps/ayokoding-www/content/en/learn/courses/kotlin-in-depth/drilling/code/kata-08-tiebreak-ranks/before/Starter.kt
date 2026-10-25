// Starter: single-key ranking. The smell: equal dues keep input order,
// so the transcript depends on fixture order instead of stating its own.
// Your task: sortedWith compareByDescending dues thenBy name.
fun main() { // => ranks by dues alone, ties accidental
    val dues = mapOf("sari" to 50, "budi" to 75, "citra" to 75) // => budi and citra tie at 75
    val ranked = dues.keys.sortedByDescending { dues.getValue(it) } // => dues down, ties in encounter order
    println(ranked) // => [budi, citra]: true today, accidental by fixture order
} // => main ends: correct values, unpinned ties
// fix me: thenBy name, total ranking, stated order
