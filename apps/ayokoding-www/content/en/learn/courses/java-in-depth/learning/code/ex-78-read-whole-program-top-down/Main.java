// Example 78: Read a Whole Program Top Down.
// The full method applied once: entry first, stages named, details
// last. This settler combines parsing, validation, totaling, and
// reporting; the numbered comments mark the reading pass order.
// Pass 1: main. Pass 2: settle. Pass 3: helpers. Pass 4: lines.
import java.util.ArrayList; // => the banked valid lines
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static boolean valid(String line) {
    // => PASS 3A: the validity rule
    String[] parts = line.split(":"); // => two fields or corrupt
    if (parts.length != 2) {
      // => shape check first
      return false; // => corrupt shapes fail fast
    } // => arity settled from here on
    try {
      // => the numeric half may still refuse
      return Integer.parseInt(parts[1]) >= 0; // => numeric and non-negative wins
    } catch (NumberFormatException e) {
      // => non-numeric loses uniformly
      return false; // => refusal, not explosion
    } // => catch ends: every path answered
  } // => valid ends: verdicts, never throws

  static int amountOf(String line) {
    // => PASS 3B: parsing beneath validation
    return Integer.parseInt(line.split(":")[1]); // => trusted: callers validate first
  } // => amountOf ends: one expression, validated callers only

  static String settle(List<String> feed) {
    // => PASS 2: the three stages named
    List<String> banked = new ArrayList<>(); // => stage 1 storage: valid lines accumulate
    int skipped = 0; // => stage 1 accounting: corrupt lines counted
    for (String line : feed) {
      // => STAGE 1: separate valid from corrupt
      if (valid(line)) {
        // => grammar gate per line
        banked.add(line); // => valid lines bank for stage 2
      } else {
        // => corrupt lines skip with accounting
        skipped++; // => honest count, never silent
      } // => branch ends: banked or counted
    } // => stage 1 ends: feed fully judged
    int total = 0; // => stage 2 storage: the running sum
    for (String line : banked) {
      // => STAGE 2: total the banked lines
      total += amountOf(line); // => validated parsing, safe addition
    } // => stage 2 ends: sum complete
    return "members: " + banked.size() + ", total: " + total + ", skipped: " + skipped; // => STAGE 3: report
  } // => settle ends: separate, total, report in order

  public static void main(String[] args) {
    // => PASS 1: the entry point, read first
    List<String> feed = List.of("sari:50", "oops", "budi:75", "citra:-5", "dewi:25"); // => PASS 1: the five-line feed
    System.out.println(settle(feed)); // => PASS 1: one call, full answer
  } // => Output: members: 3, total: 150, skipped: 2
}
