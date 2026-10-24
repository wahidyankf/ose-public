// Example 21: Files with Explicit UTF-8.
// Files.readString and writeString move whole texts in one call with
// the charset stated, so platform defaults never sneak into data.
import java.io.IOException; // => file work is environmentally checked
import java.nio.charset.StandardCharsets; // => UTF_8 stated at every call
import java.nio.file.Files; // => the whole-file helpers
import java.nio.file.Path; // => the fixture handle

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws IOException {
    // => small-program shape: declare once
    Path ledger = Path.of("ledger.txt"); // => fixture beside the program
    String body = "sari:50\nbudi:75\ncitra:25\n"; // => three dues lines, fixed content
    Files.writeString(ledger, body, StandardCharsets.UTF_8); // => charset explicit, never defaulted
    String back = Files.readString(ledger, StandardCharsets.UTF_8); // => same charset on the way back
    System.out.print(back); // => Output: the three dues lines verbatim
    System.out.println("roundtrip: " + back.equals(body)); // => Output: roundtrip: true
    System.out.println("lines: " + Files.readAllLines(ledger, StandardCharsets.UTF_8).size()); // => Output: lines: 3
    Files.deleteIfExists(ledger); // => tidy: reruns start identical
  } // => main ends: write, read, verify, tidy
}
