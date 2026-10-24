// Example 13: Result Map and Recover.
// map runs each stage only on success, recover answers only failure,
// and fold forces both branches into one honest exit type.
fun loadDues(raw: String): String { // => three stages, one visible recipe
    return runCatching { raw.trim().toInt() } // => stage one: the parse that can disappoint
        .mapCatching { if (it < 0) throw IllegalArgumentException("negative") else it } // => stage two: validate, still pure
        .map { "settled: " + it } // => stage three: format the validated total
        .fold( // => the honest exit: both branches produce a String
            onSuccess = { it }, // => success flows through untouched
            onFailure = { "settled: 0 (was: " + raw.trim() + ")" } // => failure names the offending input
        ) // => fold ends: one type out, whatever happened inside
} // => the pipeline never branches in the middle

fun main() { // => the entry point the harness runs
    println(loadDues("50")) // => Output: settled: 50
    println(loadDues("-5")) // => Output: settled: 0 (was: -5)
    println(loadDues("fifty")) // => Output: settled: 0 (was: fifty)
} // => main ends: success, refused value, unparsable word
