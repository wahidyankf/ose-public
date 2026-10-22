// Example 24: Instants and Durations from Fixed Points.
// Instant marks machine time and Duration measures between fixed
// points, so tests assert exact spans without ever reading a clock.
import java.time.Duration; // => the machine-scale span between instants
import java.time.Instant; // => a fixed point on the UTC timeline

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    Instant start = Instant.parse("2026-10-01T09:00:00Z"); // => fixed settlement open, UTC
    Instant end = Instant.parse("2026-10-01T09:30:00Z"); // => fixed settlement close, UTC
    Duration window = Duration.between(start, end); // => the span as data, not arithmetic
    System.out.println("minutes: " + window.toMinutes()); // => Output: minutes: 30
    System.out.println("seconds: " + window.toSeconds()); // => Output: seconds: 1800
    Duration grace = Duration.ofMinutes(5); // => factory names the unit at construction
    System.out.println("deadline: " + end.plus(grace)); // => Output: 2026-10-01T09:35:00Z
    System.out.println("half: " + window.dividedBy(2).toMinutes()); // => Output: half: 15
    System.out.println("before: " + start.isBefore(end)); // => Output: before: true
    Instant epoch = Instant.ofEpochSecond(0); // => the timeline origin for reference
    System.out.println("epoch: " + epoch); // => Output: 1970-01-01T00:00:00Z
  } // => main ends: no clock read, every value fixed
}
