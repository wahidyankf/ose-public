// Example 71: Handlers First, Then Helpers.
// Read the when first: it inventories every shape. Helpers follow in
// call order, so file order teaches reading order: route, then details.
fun handle(line: String): String { // => the handler: every shape routed here
    return when { // => condition arms: the inventory of the program
        line.isBlank() -> skip("blank") // => blanks route to skip
        ":" !in line -> skip("shapeless") // => missing colon routes to skip
        else -> post(line) // => shaped lines route to post
    } // => three shapes, three routes, the whole vocabulary
} // => handler ends: read this first, helpers second

fun skip(reason: String): String = "skip: " + reason // => one helper: names the refusal

fun post(line: String): String { // => one helper: settles shaped lines
    val (member, amount) = line.split(":") // => destructure the shaped line
    return "post " + member + "=" + (amount.toIntOrNull() ?: 0) // => calm digits, posted
} // => helpers end: sentences after the vocabulary

fun main() { // => the entry point the harness runs
    for (line in listOf("sari:50", "", "oops", "budi:xx")) println(handle(line)) // => Output: four routed verdicts
} // => main ends: handler first in reading, first in the file
