// Example 9: try-with-resources Closes for You.
// Declaring a resource in the try header guarantees its close runs,
// even when the body throws: cleanup stops being a promise.
// The multi-catch form follows in Example 10.
import java.io.BufferedReader; // => line reader over the fixture
import java.io.IOException; // => the checked failure files can raise
import java.io.PrintWriter; // => line writer for the reply fixture
import java.nio.charset.StandardCharsets; // => UTF_8 named once, used twice
import java.nio.file.Files; // => fixture setup helpers
import java.nio.file.Path; // => the fixture file handle

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws IOException {
    // => main declares: setup may fail
    Path inbox = Path.of("inbox.txt"); // => fixture lives beside the program
    Files.writeString(inbox, "sari\n" + "budi\n", StandardCharsets.UTF_8); // => two dues lines, fixed
    Path outbox = Path.of("outbox.txt"); // => reply file, created below
    try (
      BufferedReader in = Files.newBufferedReader(inbox, StandardCharsets.UTF_8); // => opened first, closed last
      PrintWriter out = new PrintWriter(Files.newBufferedWriter(outbox, StandardCharsets.UTF_8))
    ) {
      // => opened last, closed first
      String line; // => holds each line in turn, null at the end
      while ((line = in.readLine()) != null) {
        // => null line means the file is spent
        out.println("ack: " + line); // => reply per line, flushed at close
      } // => loop ends at end-of-file, resources still open
    } // => close runs here for both: out flushes, then in releases
    System.out.print(Files.readString(outbox, StandardCharsets.UTF_8)); // => Output: ack: sari, then ack: budi
    Files.deleteIfExists(inbox); // => tidy the fixtures: transcripts stay stable
    Files.deleteIfExists(outbox); // => no residue for the next harness run
  } // => main ends: every opened handle provably closed
}
