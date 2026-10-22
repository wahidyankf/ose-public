// Example 65: Deprecated Levels Guide Migration.
// WARNING announces while the old function still works; ReplaceWith
// rewrites call sites by keystroke. Flag days become calendars.
@Deprecated("Use settleTotal instead", ReplaceWith("settleTotal(dues)"), level = DeprecationLevel.WARNING) // => stage one: guidance, still working
fun settleAll(dues: Map<String, Int>): Int = settleTotal(dues) // => old name delegates to the new logic

fun settleTotal(dues: Map<String, Int>): Int = dues.values.sum() // => the replacement: same answer, better name

fun main() { // => the entry point the harness runs
    println("new: " + settleTotal(mapOf("sari" to 50, "budi" to 75))) // => Output: new: 125
    println("old: " + settleAll(mapOf("sari" to 50, "budi" to 75))) // => Output: old: 125, warning on stderr
    println("migrated: true") // => Output: migrated: true
} // => main ends: identical answers, guided migration, green build
