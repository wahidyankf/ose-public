// Example 41: Red First, Then Green.
// The failing-test-first workflow in one program: the old parser
// fails the quoted case on purpose, then the fixed parser passes all.
// Old code kept beside new code documents why the fix exists.
import java.util.List; // => the shared expectations table

public class Main {

  // => one public class per file, named after the file
  static int oldFieldCount(String row) {
    // => the legacy implementation, naive split
    return row.split(",").length; // => wrong on quoted commas: the documented bug
  } // => old code ends: kept to witness the red, never shipped

  static int newFieldCount(String row) {
    // => the fixed implementation, quote-aware
    boolean quoted = false; // => inside quotes, commas are data
    int fields = 1; // => every row holds at least one field
    for (int i = 0; i < row.length(); i++) {
      // => the char walk from Example 22, compressed
      char c = row.charAt(i); // => each character judged once
      if (c == '"') {
        // => quotes toggle, never count
        quoted = !quoted; // => enter or leave the quoted region
      } else if (c == ',' && !quoted) {
        // => bare commas separate fields
        fields++; // => one more field begins here
      } // => branch ends: data chars change nothing
    } // => walk ends at end-of-line
    return fields; // => the honest field count
  } // => new code ends: quotes honored, commas split

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> rows = List.of("sari,50", "\"santoso, budi\",75"); // => plain row, quoted-comma row
    for (String row : rows) {
      // => both implementations face both rows
      boolean oldRight = oldFieldCount(row) == 2; // => legacy verdict per row
      boolean newRight = newFieldCount(row) == 2; // => fixed verdict per row
      System.out.println(
        "row '" +
          row +
          "' old=" +
          (oldRight ? "green" : "RED") + // => red witnessed, not hidden
          " new=" +
          (newRight ? "green" : "RED")
      ); // => green proven beside it
    } // => Output: plain row green/green, quoted row RED/green
    System.out.println("red came first: true"); // => Output: red came first: true
  } // => main ends: the workflow demonstrated, both witnesses printed
}
