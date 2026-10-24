// Example 25: Zoned Time for Humans.
// ZonedDateTime binds an instant to a zone for display; storage stays
// instant, math stays instant, and only faces for humans carry zones.
import java.time.Instant // => the single truth for storage and math
import java.time.ZoneId // => named zones: faces for humans, never storage
import java.time.ZonedDateTime // => an instant wearing one human face

fun main() { // => the entry point the harness runs
    val paid = Instant.parse("2026-03-01T12:00:00Z") // => the stored truth: one instant
    val jakarta = paid.atZone(ZoneId.of("Asia/Jakarta")) // => face one: UTC+7 evening
    val utc = paid.atZone(ZoneId.of("UTC")) // => face two: the same moment, midday
    println("jakarta: " + jakarta.toLocalTime()) // => Output: jakarta: 19:00
    println("utc: " + utc.toLocalTime()) // => Output: utc: 12:00
    val open = Instant.parse("2026-03-01T09:00:00Z") // => the settlement window from before
    val close = Instant.parse("2026-03-01T17:30:00Z") // => same fixed window, reused honestly
    println("inside: " + (!paid.isBefore(open) && paid.isBefore(close))) // => Output: inside: true
    println("day: " + jakarta.dayOfWeek) // => Output: day: SUNDAY
} // => main ends: one instant, two faces, one membership verdict
