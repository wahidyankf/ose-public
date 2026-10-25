// Example 22: CSV Quotes Need More Than Split.
// Naive comma-splitting breaks on quoted commas, so this parser
// walks each line char by char, honoring quotes the way CSV means.
import java.util.ArrayList; // => the parsed fields, grown per line
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static List<String> parseCsvLine(String line) {
    // => one line in, fields out
    List<String> fields = new ArrayList<>(); // => grows field by field
    StringBuilder cell = new StringBuilder(); // => the field under construction
    boolean quoted = false; // => inside quotes, commas are data
    for (int i = 0; i < line.length(); i++) {
      // => the char walk: every char judged once
      char c = line.charAt(i); // => the current character under judgment
      if (c == '"') {
        // => a quote toggles quoting, never lands in data
        quoted = !quoted; // => enter or leave the quoted region
      } else if (c == ',' && !quoted) {
        // => bare comma ends the field
        fields.add(cell.toString()); // => bank the finished field
        cell.setLength(0); // => reset the builder for the next field
      } else {
        // => data characters, quoted commas included
        cell.append(c); // => accumulate into the current field
      } // => branch ends: every char classified exactly once
    } // => walk ends at end-of-line
    fields.add(cell.toString()); // => bank the final field after the loop
    return fields; // => the parsed row for the caller
  } // => parser ends: quotes honored, commas split, data kept

  public static void main(String[] args) {
    // => the entry point the harness runs
    String[] rows = { "sari,50", "\"santoso, budi\",75", "citra,25" }; // => plain, quoted comma, plain
    for (String row : rows) {
      // => each row parsed on its own terms
      System.out.println(parseCsvLine(row)); // => Output: [sari, 50], then the quoted pair intact, then [citra, 25]
    } // => loop ends: no quoted comma ever split a field
    System.out.println("naive: " + rows[1].split(",").length); // => Output: naive: 3, the wrong field count
  } // => main ends: parser right, split wrong, evidence printed
}
