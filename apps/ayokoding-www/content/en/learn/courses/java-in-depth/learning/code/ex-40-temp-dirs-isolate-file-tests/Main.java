// Example 40: Temp Dirs Isolate File Tests.
// Files.createTempDirectory gives each file test a private folder,
// so tests never fight over fixtures or pollute the checkout.
import java.io.IOException; // => file work is environmentally checked
import java.nio.charset.StandardCharsets; // => UTF_8 stated at every call
import java.nio.file.Files; // => temp dir plus file helpers
import java.nio.file.Path; // => the isolated folder handle
import java.util.Comparator; // => deepest-first ordering for deletion

public class Main {

  // => one public class per file, named after the file
  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  public static void main(String[] args) throws IOException {
    // => small-program shape: declare once
    Path sandbox = Files.createTempDirectory("dues-test-"); // => private folder, unique name, system temp
    Path ledger = sandbox.resolve("ledger.txt"); // => fixture path inside the sandbox, nowhere else
    Files.writeString(ledger, "sari:50\nbudi:75\n", StandardCharsets.UTF_8); // => fixed two-line fixture
    String back = Files.readString(ledger, StandardCharsets.UTF_8); // => roundtrip inside the sandbox
    check("roundtrip inside sandbox", back.equals("sari:50\nbudi:75\n")); // => Output: PASS roundtrip inside sandbox
    check("two lines stored", Files.readAllLines(ledger, StandardCharsets.UTF_8).size() == 2); // => PASS two lines stored
    check("sandbox is a directory", Files.isDirectory(sandbox)); // => PASS sandbox is a directory
    try (var paths = Files.walk(sandbox)) {
      // => deepest-first walk for tidy deletion
      paths.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete()); // => files before folders
    } // => walk closes here, sandbox fully removed
    check("sandbox removed", Files.notExists(sandbox)); // => Output: PASS sandbox removed
  } // => main ends: isolated, verified, removed
}
