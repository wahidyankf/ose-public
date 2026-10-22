// Example 2: The Enhanced for Loop Over Indexes.
// The enhanced for loop reads each element directly, so off-by-one
// errors and length bookkeeping disappear from everyday iteration.
import java.util.List; // => List is the read-mostly sequence interface

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> names = List.of("ada", "grace", "sari"); // => fixed sample data
    for (String name : names) {
      // => enhanced for: element, never an index
      System.out.println("hello, " + name); // => Output per element, in order
    } // => the loop ends: no counter to reset, no bound to recheck
    int total = 0; // => accumulators start at the identity before the loop
    for (String name : names) {
      // => second pass: one loop does one job
      total += name.length(); // => add each length: 3 + 5 + 4
    } // => pass ends with the total fully accumulated
    System.out.println("letters: " + total); // => Output: letters: 12
    for (int i = 0; i < names.size(); i++) {
      // => indexed form kept for one reason
      System.out.println(i + ": " + names.get(i)); // => Output: 0: ada, then 1: grace, 2: sari
    } // => indexes appear only when the position itself is data
  } // => main ends: three loops, each with a single visible job
}
