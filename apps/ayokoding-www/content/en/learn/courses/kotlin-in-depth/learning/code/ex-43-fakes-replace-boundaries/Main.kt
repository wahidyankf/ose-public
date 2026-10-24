// Example 43: Fakes Replace Boundaries.
// The window check takes now as a parameter, so tests inject exact
// moments: inside, edge, outside. No clocks, no flakes, same function.
import java.time.Instant // => fixed moments in, verdicts out

fun insideWindow(now: Instant, open: Instant, close: Instant): Boolean { // => the boundary as a parameter
    return !now.isBefore(open) && now.isBefore(close) // => half-open: open in, close out
} // => testable because the world arrives as an argument

fun main() { // => the entry point the harness runs
    val open = Instant.parse("2026-03-01T09:00:00Z") // => fixed window, reused from Example 24
    val close = Instant.parse("2026-03-01T17:30:00Z") // => same fixed close
    check(insideWindow(Instant.parse("2026-03-01T12:00:00Z"), open, close)) { "noon is inside" } // => the inside fake
    println("PASS: noon inside") // => Output: the inside verdict
    check(insideWindow(open, open, close)) { "open edge counts as inside" } // => the edge fake
    println("PASS: open edge inside") // => Output: the edge verdict
    check(!insideWindow(close, open, close)) { "close edge counts as outside" } // => the outside fake
    println("PASS: close edge outside") // => Output: the outside verdict
} // => main ends: three injected moments, three decided verdicts
