import static java.lang.Math.max; // => static import: max reads as a verb
import static java.util.Collections.sort; // => static import: sort reads as a verb

// Example 29: Imports Resolve Names, Collisions Qualify.
// Imports buy short names for the types a file uses most; when two
// packages offer the same name, the loser is spelled out in full.
import java.time.LocalDate; // => the date this file means unqualified
import java.util.List; // => the list this file means unqualified

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    LocalDate day = LocalDate.of(2026, 10, 1); // => short name via the import above
    System.out.println("dues day: " + day); // => Output: dues day: 2026-10-01
    java.sql.Date legacy = java.sql.Date.valueOf(day); // => collision: fully qualified, no import
    System.out.println("legacy: " + legacy); // => Output: legacy: 2026-10-01
    System.out.println("max: " + max(50, 75)); // => Output: max: 75, static verb, no class prefix
    java.util.ArrayList<String> names = new java.util.ArrayList<>(List.of("budi", "sari")); // => qualified builder
    sort(names); // => static sort over the qualified list
    System.out.println("sorted: " + names); // => Output: sorted: [budi, sari]
  } // => main ends: imports shortened, collisions spelled out
}
