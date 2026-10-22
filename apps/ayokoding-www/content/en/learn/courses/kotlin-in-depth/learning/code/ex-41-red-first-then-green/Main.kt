// Example 41: Red First, Then Green.
// The same contract runs twice: against a stub it fails red, against
// the real function it passes green. Red calibrates the instrument first.
fun contract(total: Int): String { // => the contract, implementation-agnostic
    check(total == 125) { "settlement totals 125, got " + total } // => named for red days
    return "calibrated" // => reaching here means the value measured true
} // => contracts outlive the stubs they first fail against

fun stubTotal(): Int = 0 // => the stub: smallest wrong answer, honest red

fun realTotal(): Int = 50 + 75 // => the real function: smallest true answer

fun main() { // => the entry point the harness runs
    val red = runCatching { contract(stubTotal()) } // => red first: the check must prove it can fail
    println("red: " + red.isFailure) // => Output: red: true
    println("green: " + contract(realTotal())) // => Output: green: calibrated
    check(red.isFailure) { "a check that never ran red measures nothing" } // => calibration, pinned
    println("PASS: red calibrated the green") // => Output: the workflow verdict
} // => main ends: same contract, stub red, function green
