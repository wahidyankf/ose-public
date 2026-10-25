// Example 18: Multiline Strings for Templates.
// Triple-quoted blocks show the output's shape in the source;
// trimIndent strips shared whitespace so code nests but text does not.
// => the three template lines below cannot carry annotations themselves:
// => comments inside the string would print, so the teaching notes live
// => around the block instead: shape above, margin rule beside the close.
fun report(member: String, dues: Int): String { // => pure rendering: values in, text out
    return """
        |member: ${member}
        |dues: ${dues}
        |status: ${if (dues >= 50) "settled" else "owing"}
        """.trimMargin() // => | margins strip, placeholders fill after
} // => the template reads exactly like the report it produces
// => placeholders evaluate after the margin strips, never before.

fun main() { // => the entry point the harness runs
    println(report("sari", 50).trim()) // => Output: three report lines for sari
    println("---") // => Output: a separator between the two reports
    println(report("dewi", 20).trim()) // => Output: three report lines for dewi
} // => main ends: two members, two readable reports
