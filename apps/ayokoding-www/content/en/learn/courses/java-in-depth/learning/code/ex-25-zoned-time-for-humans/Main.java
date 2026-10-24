// Example 25: Zoned Time for Humans.
// ZonedDateTime pairs an instant with a zone for display, and
// DateTimeFormatter renders it; storage stays Instant, humans get zones.
import java.time.Instant; // => the storable machine point
import java.time.LocalDate; // => calendar dates for dues-day arithmetic
import java.time.Period; // => human-scale spans in years, months, days
import java.time.ZoneId; // => named zones, never raw offsets
import java.time.ZonedDateTime; // => instant plus zone for display
import java.time.format.DateTimeFormatter; // => explicit patterns for reports

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    Instant settled = Instant.parse("2026-10-01T02:00:00Z"); // => stored UTC point, fixed
    ZoneId jakarta = ZoneId.of("Asia/Jakarta"); // => named zone: UTC+7, no DST
    ZonedDateTime seen = settled.atZone(jakarta); // => same instant, human wall time
    System.out.println("jakarta: " + seen.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))); // => Output: jakarta: 2026-10-01 09:00
    LocalDate duesDay = LocalDate.of(2026, 10, 1); // => calendar date, no time attached
    LocalDate next = duesDay.plus(Period.ofMonths(1)); // => human month step, calendar-aware
    System.out.println("next dues: " + next); // => Output: next dues: 2026-11-01
    Period wait = Period.between(duesDay, next); // => human span between calendar dates
    System.out.println("wait months: " + wait.getMonths()); // => Output: wait months: 1
    System.out.println("offset: " + seen.getOffset()); // => Output: offset: +07:00
    System.out.println("back to instant: " + seen.toInstant().equals(settled)); // => Output: back to instant: true
  } // => main ends: zones displayed, instants stored
}
