// Example 10: Multi-catch Shares One Handler.
// One catch arm for several unrelated exception types keeps the
// shared recovery in one place instead of copying it per type.
import java.time.LocalDate; // => the date half of each dated-dues cell
import java.time.format.DateTimeParseException; // => the bad-date failure type

public class Main {

  // => one public class per file, named after the file
  static String parseCell(String cell) {
    // => "yyyy-MM-dd:amount" or a shared refusal
    int colon = cell.indexOf(':'); // => the separator between date and amount
    LocalDate day = LocalDate.parse(cell.substring(0, colon)); // => throws DateTimeParseException on bad dates
    int amount = Integer.parseInt(cell.substring(colon + 1)); // => throws NumberFormatException on bad amounts
    return day + " owes " + amount; // => both halves valid: the settled line
  } // => helper ends: two unrelated failure shapes, one contract

  public static void main(String[] args) {
    // => the entry point the harness runs
    String[] cells = { "2026-10-01:50", "2026-13-45:50", "2026-10-01:xx" }; // => good, bad date, bad amount
    for (String cell : cells) {
      // => each cell attempted on its own terms
      try {
        // => the attempt that may fail two ways
        System.out.println(parseCell(cell)); // => prints only the valid cell
      } catch (DateTimeParseException | NumberFormatException e) {
        // => shared arm: unrelated types only
        System.out.println("bad cell '" + cell + "'"); // => names the guilty input, recovery shared
      } // => catch ends: loop continues with the next cell
    } // => Output: one owes line, then two bad-cell lines
  } // => main ends: every candidate answered, none escaped
}
