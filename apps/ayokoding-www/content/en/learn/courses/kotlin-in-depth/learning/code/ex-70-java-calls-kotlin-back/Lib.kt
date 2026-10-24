// Lib.kt: the Kotlin library Java will call.
// Top-level functions surface as LibKt methods; the map lookup stays
// calm so Java callers get values, never platform-type surprises.
fun duesTotal(dues: Map<String, Int>): Int = dues.values.sum() // => LibKt.duesTotal from Java

fun duesOf(member: String): Int = mapOf("sari" to 50, "budi" to 75)[member] ?: 0 // => calm zero for unknown
