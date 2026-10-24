// Example 31: Pin Exact Versions, Not Ranges.
// Exact pins resolve identically on every machine; ranges resolve to
// whatever is newest that day, so reproducible builds pin exactly.
import java.util.List; // => the candidate version tables
import java.util.Map; // => pinned lookup: library to exact version
import java.util.TreeMap; // => alphabetical for stable printing

public class Main {

  // => one public class per file, named after the file
  record Pin(String library, String version) {} // => one library, one exact version

  public static void main(String[] args) {
    // => the entry point the harness runs
    Map<String, String> pins = new TreeMap<>(
      Map.of(
        // => the lockfile in miniature, sorted
        "junit-jupiter",
        "5.11.0", // => exact: every machine resolves this
        "assertj",
        "3.26.3", // => exact: patch digits included
        "mockito",
        "5.14.2"
      )
    ); // => exact: minors never float
    for (Pin p : List.of(
      new Pin("junit-jupiter", "5.11.0"), // => pinned request meets the lock
      new Pin("assertj", "3.26.3"), // => pinned request meets the lock
      new Pin("mockito", "5.x")
    )) {
      // => ranged request floats: lock has 5.14.2
      String locked = pins.get(p.library()); // => the locked version, or null for unknown
      boolean reproducible = p.version().equals(locked); // => equality with the lock is the whole test
      System.out.println(p.library() + " " + p.version() + " -> " + (reproducible ? "reproducible" : "FLOATS")); // => verdict per library
    } // => Output: two reproducible lines, one FLOATS line
    System.out.println("locked libraries: " + pins.size()); // => Output: locked libraries: 3
  } // => main ends: pins checked against the lock, verdicts printed
}
