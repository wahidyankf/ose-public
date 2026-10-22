// Example 20: Regular Expressions with Named Groups.
// Named groups turn a dues line into labeled fields: the pattern
// states the grammar once, and group names replace index magic.
import java.util.regex.Matcher; // => the match cursor over each line
import java.util.regex.Pattern; // => the compiled grammar, reused per line

public class Main {

  // => one public class per file, named after the file
  static final Pattern DUE = Pattern.compile(
    // => compiled once, matched many times
    "(?<member>[a-z]+):(?<amount>[0-9]+)"
  ); // => member letters, colon, digits

  public static void main(String[] args) {
    // => the entry point the harness runs
    String[] lines = { "sari:50", "budi:125", "oops-no-colon", "citra:25" }; // => three valid, one corrupt
    for (String line : lines) {
      // => each line faces the same grammar
      Matcher m = DUE.matcher(line); // => fresh cursor per line, shared pattern
      if (m.matches()) {
        // => full match: the whole line is grammar
        System.out.println(m.group("member") + " owes " + m.group("amount")); // => Output: three owes lines
      } else {
        // => the corrupt line lands here with its evidence
        System.out.println("skip: '" + line + "'"); // => Output: skip: 'oops-no-colon'
      } // => branch ends: matched or reported, never ignored
    } // => loop ends: grammar enforced line by line
    System.out.println("pattern: " + DUE.pattern()); // => Output: the source grammar itself
  } // => main ends: one pattern, four verdicts
}
