// Dues.kt: the settlement domain in package dues.
// Owns parsing and totaling; printing belongs to Main.
package dues // => the namespace: every member here reads as dues.*

fun parse(line: String): Pair<String, Int>? { // => shared parser, package-visible
    val parts = line.split(":") // => the member:amount grammar, one split
    if (parts.size != 2 || parts[0].isBlank()) return null // => wrong shape: calm null
    val amount = parts[1].toIntOrNull() ?: return null // => calm digits or calm null
    return parts[0] to amount // => the good pair travels on
} // => parse ends: text in, pair-or-null out

fun total(pairs: List<Pair<String, Int>>): Int { // => totaling beside parsing: related code
    return pairs.sumOf { it.second } // => sumOf reads the amount of each pair
} // => total ends: the domain stays together in one package
