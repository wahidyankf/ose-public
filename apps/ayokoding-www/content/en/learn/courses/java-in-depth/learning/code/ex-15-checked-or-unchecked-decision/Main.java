// Example 15: Checked or Unchecked: The Decision.
// The rule in one program: recoverable environmental failures are
// checked, caller bugs are unchecked, and main shows both sides.
import java.io.IOException; // => the classic checked environmental failure
import java.nio.file.Files; // => file reading that can fail environmentally
import java.nio.file.Path; // => the fixture handle

public class Main {

  // => one public class per file, named after the file
  static String loadTag(Path file) throws IOException {
    // => checked: the disk may fail anyone
    String body = Files.readString(file); // => throws IOException on missing file
    if (body.isBlank()) {
      // => empty file is a caller-data bug here
      throw new IllegalArgumentException("tag file must not be blank: " + file); // => unchecked: fix the data
    } // => past this line the tag text is usable
    return body.trim(); // => whitespace trimmed, content returned
  } // => helper ends: one checked, one unchecked, each for its reason

  public static void main(String[] args) throws IOException {
    // => main answers the checked side once
    Path good = Path.of("tag.txt"); // => fixture beside the program
    Files.writeString(good, "sari:50\n"); // => fixed tag content
    System.out.println("tag: " + loadTag(good)); // => Output: tag: sari:50
    try {
      // => the caller-bug side, isolated
      Path blank = Path.of("blank.txt"); // => second fixture, deliberately empty
      Files.writeString(blank, "\n"); // => blank content triggers validation
      loadTag(blank); // => throws unchecked before returning
      System.out.println("unreachable"); // => skipped: validation threw first
    } catch (IllegalArgumentException e) {
      // => caller-data bugs land here
      System.out.println("rejected: " + e.getMessage()); // => Output names blank.txt
    } // => catch ends: data bug reported, run continues
    Files.deleteIfExists(good); // => tidy fixtures for rerun stability
    Files.deleteIfExists(Path.of("blank.txt")); // => no residue for the next run
  } // => main ends: both sides of the decision exercised
}
