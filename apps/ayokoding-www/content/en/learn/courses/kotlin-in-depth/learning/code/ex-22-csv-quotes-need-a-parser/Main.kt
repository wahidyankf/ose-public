// Example 22: CSV Quotes Need a Parser.
// A split on commas breaks on the first quoted comma, so quoted
// fields need a real state machine: quotes flip the meaning of commas.
fun parseCsv(line: String): List<String> { // => the CSV subset dues files need
    val fields = mutableListOf<String>() // => finished fields bank here
    val cur = StringBuilder() // => the field under construction
    var quoted = false // => quote state: what commas mean right now
    var i = 0 // => index walk: lookahead needs positions
    while (i < line.length) { // => every character visits exactly once
        val c = line[i] // => the character under the cursor
        if (c == '"') { // => a quote flips state or escapes
            if (quoted && i + 1 < line.length && line[i + 1] == '"') { // => doubled quote inside quotes
                cur.append('"') // => unescape: one quote of data
                i += 2 // => consume both quote characters
            } else { // => a lone quote flips the state
                quoted = !quoted // => entering or leaving quoted mode
                i++ // => the quote itself is syntax, not data
            } // => quote handled: state correct for the next character
        } else if (c == ',' && !quoted) { // => bare comma ends the field
            fields.add(cur.toString()) // => bank the finished field
            cur.clear() // => start the next field empty
            i++ // => consume the delimiter
        } else { // => data character in either mode
            cur.append(c) // => commas inside quotes land here safely
            i++ // => consume the data character
        } // => character classified: syntax, delimiter, or data
    } // => the walk ends: every character classified once
    fields.add(cur.toString()) // => bank the final field after the last comma
    return fields // => plain list out: the parser owns quotes, callers own meaning
} // => thirty lines of state machine instead of one wrong split

fun main() { // => the entry point the harness runs
    println(parseCsv("sari,50,settled")) // => Output: [sari, 50, settled]
    println(parseCsv("sari,\"50, paid\",settled")) // => Output: [sari, 50, paid, settled]
    println(parseCsv("dewi,\"says \"\"hi\"\"\",25")) // => Output: [dewi, says "hi", 25]
} // => main ends: plain, quoted comma, escaped quote
