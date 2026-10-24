// Example 1: When Expressions Choose Values.
// When-expressions turn multi-branch choices into values: each arm
// produces the result, so no branch can silently fall through.
fun sizeOf(code: Int): String { // => pure function: input in, label out
    return when (code) { // => when is an expression: it yields a value
        1 -> "small" // => each arm covers exactly one input shape
        2 -> "medium" // => one condition, one value, no assignment repeat
        3 -> "large" // => a new size means one new arm, nothing else
        else -> "unknown" // => else answers every uncovered input
    } // => no semicolons: the expression result is the return value
} // => choosing lives in the helper, printing lives in main

fun main() { // => the entry point the harness runs
    println(sizeOf(1)) // => Output: small
    println(sizeOf(2)) // => Output: medium
    println(sizeOf(9)) // => Output: unknown, through else
} // => main ends after exercising every arm once
