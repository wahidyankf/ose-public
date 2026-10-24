// Example 73: Seams Mark Where Tests Enter.
// parseValid and settleTotal are doors (pure, typed params); the file
// read in main is the one wall, sitting at the edge where it belongs.
import java.io.File // => the single wall: file enters only here

fun parseValid(lines: List<String>): Map<String, Int> { // => door one: text in, data out
    val out = mutableMapOf<String, Int>() // => valid entries bank here
    for (line in lines) { // => one line, one verdict
        val parts = line.split(":") // => the grammar, as throughout
        val amount = if (parts.size == 2) parts[1].toIntOrNull() else null // => calm digits or null
        if (parts.size == 2 && parts[0].isNotBlank() && amount != null) out[parts[0]] = amount // => good lines bank
    } // => the loop ends: valid parsed
    return out // => door one opens: testable with literals
} // => pure: no world inside, tests enter freely

fun settleTotal(dues: Map<String, Int>): Int = dues.values.sum() // => door two: data in, answer out

fun main() { // => the edge: the wall lives here and only here
    File("dues.txt").writeText("sari:50\nbudi:75\n", Charsets.UTF_8) // => committed-shape fixture, written fresh
    val dues = parseValid(File("dues.txt").readLines(Charsets.UTF_8)) // => through door one with file text
    println("doors: 2 walls: 1") // => Output: the seam inventory of this program
    println("total: " + settleTotal(dues)) // => Output: total: 125
    File("dues.txt").delete() // => tidy: the wall leaves no trace
} // => main ends: doors counted, wall edged, seams mapped
