// Example 19: Format Verbs for Tables.
// Format verbs state column widths as data, so tables align by
// contract instead of by hand-counted spaces that drift on arrival.
fun row(name: String, dues: Int): String { // => one row, one verb contract
    return "%-10s %5d".format(name, dues) // => name left in ten, dues right in five
} // => every row obeys the same widths, so columns cannot drift

fun main() { // => the entry point the harness runs
    println(row("member", 0).replace(' ', '.')) // => Output: header dots show the widths
    println(row("sari", 50)) // => Output: sari padded to ten, then 50 in five
    println(row("budi", 125)) // => Output: budi padded to ten, then 125 in five
    println(row("citra-wulandari", 75)) // => Output: long names overflow honestly
} // => main ends: widths proven, overflow visible instead of silent
