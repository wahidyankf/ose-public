// Solution: joining with the standard library. One String.join
// call replaces the flag, the loop, and the quadratic plus chain.
// Fixed from Starter: hand-rolled joining became one library call.
import java.util.List; // => the lines joined the standard way

public class Solution {

  // => the reference solution, green in the harness
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> lines = List.of("sari:50", "budi:75", "citra:25"); // => fixed three-line feed
    String report = String.join("\n", lines); // => the library join: separator once, no flags
    System.out.println(report); // => Output: the three dues lines
    System.out.println("lines: " + report.lines().count()); // => Output: lines: 3
  } // => main ends: standard join, identical text, linear cost
} // => solved: the library owned the separator all along
