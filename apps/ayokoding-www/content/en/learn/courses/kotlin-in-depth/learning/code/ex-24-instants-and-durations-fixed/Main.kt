// Example 24: Instants and Durations, Fixed.
// Time tests parse fixed instants and compute durations as data:
// no clocks, no sleeps, so the transcript is byte-stable forever.
import java.time.Duration // => the answer type for between-two-instants
import java.time.Instant // => fixed points on the timeline, parsed not read

fun main() { // => the entry point the harness runs
    val open = Instant.parse("2026-03-01T09:00:00Z") // => window opens: same moment everywhere
    val close = Instant.parse("2026-03-01T17:30:00Z") // => window closes eight and a half hours later
    val window = Duration.between(open, close) // => the window as data, not as waiting
    println("hours: " + window.toHours()) // => Output: hours: 8
    println("minutes: " + window.toMinutes()) // => Output: minutes: 510
    val paid = Instant.parse("2026-03-01T12:00:00Z") // => a payment timestamp, fixed like the rest
    val inside = !paid.isBefore(open) && paid.isBefore(close) // => half-open membership: open in, close out
    println("inside: " + inside) // => Output: inside: true
    println("late: " + Instant.parse("2026-03-01T18:00:00Z").isBefore(close)) // => Output: late: false
} // => main ends: parsed instants, computed durations, fixed verdicts
