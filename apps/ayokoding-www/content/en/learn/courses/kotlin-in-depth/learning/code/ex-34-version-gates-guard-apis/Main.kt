// Example 34: Version Gates Guard APIs.
// KotlinVersion.CURRENT reports the running compiler; isAtLeast gates
// version-sensitive APIs so old runtimes get a sentence, not a crash.
fun main() { // => the entry point the harness runs
    val running = KotlinVersion.CURRENT // => the version that actually runs this code
    println("kotlin: " + running) // => Output: kotlin: 2.4.21, the pinned toolchain
    check(running.isAtLeast(2, 0)) { "needs Kotlin 2.0+, got " + running } // => floor stated, refusal named
    println("floor: ok") // => Output: floor: ok
    val tag = if (running.isAtLeast(2, 4)) "current-pinned" else "older-fallback" // => one API choice gated
    println("track: " + tag) // => Output: track: current-pinned
} // => main ends: version proven, floor checked, choice gated
