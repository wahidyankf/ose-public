// Report.java: the capstone domain, pure and testable.
// Due carries one parsed line, Summary carries the settled books, and
// every method is pure: inputs in, answers out, nothing printed.
// Parsing refuses corrupt lines loudly; callers count the refusals.
import java.util.ArrayList; // => the banked valid dues
import java.util.Collections; // => the unmodifiable snapshot wrapper
import java.util.List; // => interface on the left as always
import java.util.Map; // => per-member totals by name
import java.util.TreeMap; // => alphabetical members for stable reports

public class Report {

  // => public domain type shared by Main and the tests
  public record Due(String member, int amount) {} // => one parsed line: who paid what

  public record Summary(Map<String, Integer> perMember, int total, int skipped) {} // => the settled books

  public static Due parseLine(String line) {
    // => text in, Due out, or a refusal naming the cause
    String[] parts = line.split(":", -1); // => -1 keeps trailing empties: "sari:" stays two fields
    if (parts.length != 2) {
      // => shape check first: one colon exactly
      throw new IllegalArgumentException("need member:amount, got '" + line + "'"); // => corrupt shape refused
    } // => past this line the arity is exactly two
    String member = parts[0].trim(); // => whitespace trimmed: " sari " pays as sari
    if (member.isEmpty()) {
      // => empty members corrupt every per-member table
      throw new IllegalArgumentException("member must be non-blank, got '" + line + "'"); // => blank refused
    } // => past this line the member prints cleanly
    int amount; // => declared before the parse attempt below
    try {
      // => the numeric half may still refuse
      amount = Integer.parseInt(parts[1].trim()); // => trimmed digits to int
    } catch (NumberFormatException e) {
      // => non-numeric amounts lose uniformly
      throw new IllegalArgumentException("amount must be an integer, got '" + line + "'", e); // => cause chained
    } // => past this line the amount parsed cleanly
    if (amount < 0) {
      // => negative dues corrupt every total downstream
      throw new IllegalArgumentException("amount must be >= 0, got '" + line + "'"); // => policy refused
    } // => past this line the line settles
    return new Due(member, amount); // => the parsed value for the caller
  } // => parseLine ends: four refusals, one value

  public static Summary summarize(List<String> lines) {
    // => lines in, settled books out
    Map<String, Integer> perMember = new TreeMap<>(); // => alphabetical: deterministic reports
    int skipped = 0; // => corrupt lines counted honestly, never hidden
    for (String line : lines) {
      // => per-item granularity: one bad line never aborts the batch
      if (line.isBlank()) {
        // => blank lines skip quietly: separators, not data
        continue; // => next line, no accounting: blanks are layout
      } // => past this line the line claims to be data
      try {
        // => each data line attempted on its own terms
        Due due = parseLine(line); // => may refuse four ways, all counted below
        perMember.put(due.member(), perMember.getOrDefault(due.member(), 0) + due.amount()); // => tally by member
      } catch (IllegalArgumentException e) {
        // => every refusal shape lands here
        skipped++; // => counted: the report proves nothing vanished
      } // => catch ends: loop continues with the next line
    } // => loop ends: every line banked, skipped, or blank
    int total = perMember.values().stream().mapToInt(Integer::intValue).sum(); // => primitive sum, no boxing
    return new Summary(Collections.unmodifiableMap(new TreeMap<>(perMember)), total, skipped); // => ordered snapshot out
  } // => summarize ends: pure fold, honest accounting

  public static String render(Summary summary) {
    // => books in, report text out
    StringBuilder out = new StringBuilder(); // => one buffer: linear text, no plus loop
    out.append("members: ").append(summary.perMember().size()).append('\n'); // => line 1: headcount first
    for (Map.Entry<String, Integer> e : summary.perMember().entrySet()) {
      // => alphabetical members, TreeMap order
      out.append(e.getKey()).append(": ").append(e.getValue()).append('\n'); // => one line per member
    } // => member lines complete in stable order
    out.append("total: ").append(summary.total()).append('\n'); // => the settled sum
    out.append("skipped: ").append(summary.skipped()).append('\n'); // => the honest skip count closes
    return out.toString(); // => the full transcript for Main to print
  } // => render ends: pure text, printed once by Main
} // => Report ends: parse, fold, and render, all pure
