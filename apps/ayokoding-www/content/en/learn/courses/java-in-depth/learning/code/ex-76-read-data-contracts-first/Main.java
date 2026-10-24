// Example 76: Read Data Contracts First.
// Data shapes anchor unfamiliar code: records and grammars state what
// flows before any method states what happens. Read the types, then
// the grammar, then the methods that move values between them.
// Reading order: records, grammar constants, validators, reporters.
import java.util.List; // => the contract tables under review
import java.util.regex.Pattern; // => the compiled grammar constant

public class Main {

  // => one public class per file, named after the file
  record Due(String member, int amount) {} // => CONTRACT 1 (read first): the value shape

  record Report(int members, int total, int skipped) {} // => CONTRACT 2: the summary shape

  static final Pattern DUE_LINE = Pattern.compile("[a-z]+:[0-9]+"); // => GRAMMAR (read second): the line shape

  static boolean valid(String line) {
    // => VALIDATOR (read third): grammar as predicate
    return DUE_LINE.matcher(line).matches(); // => full match: the whole line conforms
  } // => validator ends: one line, grammar-backed

  static Due parse(String line) {
    // => VALIDATOR: grammar-conforming text to value
    String[] parts = line.split(":"); // => safe split: callers validate first
    return new Due(parts[0], Integer.parseInt(parts[1])); // => value shaped by Contract 1
  } // => parse ends: text in, Due out

  static Report summarize(List<String> lines) {
    // => REPORTER (read last): values to summary
    int members = 0; // => valid lines counted
    int total = 0; // => amounts summed
    int skipped = 0; // => corrupt lines counted honestly
    for (String line : lines) {
      // => every line judged against the grammar
      if (valid(line)) {
        // => grammar gate before parsing
        Due due = parse(line); // => value shaped, then folded
        members++; // => one more settled member
        total += due.amount(); // => amount folded into the total
      } else {
        // => corrupt lines skip with accounting
        skipped++; // => honest count, never silent
      } // => branch ends: banked or counted, never dropped
    } // => loop ends: every line answered
    return new Report(members, total, skipped); // => summary shaped by Contract 2
  } // => reporter ends: lines in, Report out

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> feed = List.of("sari:50", "oops", "budi:75", "citra:25", "bad"); // => three valid, two corrupt
    Report report = summarize(feed); // => the pipeline: validate, parse, fold
    System.out.println("members: " + report.members()); // => Output: members: 3
    System.out.println("total: " + report.total()); // => Output: total: 150
    System.out.println("skipped: " + report.skipped()); // => Output: skipped: 2
  } // => main ends: contracts first, methods after, transcript exact
}
