// Main.kt: the Kotlin caller across the boundary.
// Legacy.normalize reads like any Kotlin call; the platform type gets
// pinned to a non-null String at exactly this boundary line.
fun main() { // => the entry point the harness runs
    val roster = listOf("  Sari ", "BUDI", "citra") // => ragged legacy input, fixed
    val clean: List<String> = roster.map { Legacy.normalize(it) } // => boundary: platform type pinned here
    println(clean.sorted().joinToString(", ")) // => Output: budi, citra, sari
    println("legacy: " + (Legacy.normalize(null) == "")) // => Output: legacy: true, null handled in Java
    println("count: " + clean.size) // => Output: count: 3
} // => main ends: boring, typed, checked once at the edge
