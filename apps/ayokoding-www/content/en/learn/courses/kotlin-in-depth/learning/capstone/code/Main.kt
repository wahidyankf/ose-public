// Main.kt: the thin edge over the tally domain.
// Reads input.txt, summarizes, prints the rendered report. Three lines
// of work: the file, the fold, the print. Everything else lives in Tally.
import java.io.File // => the committed fixture, read at the edge

fun main() { // => the entry point the harness runs
    val lines = File("input.txt").readLines(Charsets.UTF_8) // => the fixture: eight dues lines
    print(render(summarize(lines))) // => fold then render: the whole program in one line
} // => Main ends: thin edge, domain doing the work, transcript golden
