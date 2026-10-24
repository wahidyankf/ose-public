// Example 36: Hand-Rolled Check Runner.
// Each check body runs inside runCatching, so one red contract never
// hides its siblings; the summary states the score at the end.
val failures = mutableListOf<String>() // => broken contracts bank here with names

fun checkThat(name: String, body: () -> Unit) { // => the runner: name plus a body
    runCatching { body() } // => independence: throws bank, they never abort siblings
        .onSuccess { println("PASS: " + name) } // => green prints the contract name
        .onFailure { failures.add(name + ": " + (it.message ?: "?")) } // => red banks name plus message
} // => every check answers exactly once, pass or named failure

fun main() { // => the entry point the harness runs
    checkThat("totals sum") { check(listOf(50, 75).sum() == 125) } // => Output: PASS: totals sum
    checkThat("empty is zero") { check(emptyList<Int>().sum() == 0) } // => Output: PASS: empty is zero
    checkThat("sorted output") { check(listOf("b", "a").sorted() == listOf("a", "b")) } // => Output: PASS: sorted output
    println("checks: 3 failed: " + failures.size) // => Output: checks: 3 failed: 0
    if (failures.isNotEmpty()) error("red: " + failures) // => nonzero exit when anything failed
} // => main ends: three verdicts, one summary, exit agrees with it
