// Example 77: Read Cleanup Inside Out.
// Nested resources release in reverse acquisition order: read the
// try headers outward to inward for opening, then inward to outward
// for closing. The transcript prints both orders as evidence.
// Reading order: headers down for opening, bodies up for closing.
import java.io.BufferedReader; // => the outer line reader
import java.io.IOException; // => resource work is environmentally checked
import java.io.PrintWriter; // => the inner reply writer
import java.nio.charset.StandardCharsets; // => UTF_8 stated at every call
import java.nio.file.Files; // => fixture helpers
import java.nio.file.Path; // => the fixture handles

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws IOException {
    // => small-program shape: declare once
    Path inbox = Path.of("notes.txt"); // => fixture beside the program
    Files.writeString(inbox, "sari\n", StandardCharsets.UTF_8); // => one fixed dues name
    Path outbox = Path.of("replies.txt"); // => reply file beside it
    System.out.println("open: reader, then writer"); // => Output: opening order stated first
    try (
      BufferedReader in = Files.newBufferedReader(inbox, StandardCharsets.UTF_8); // => OPENED FIRST
      PrintWriter out = new PrintWriter(Files.newBufferedWriter(outbox, StandardCharsets.UTF_8))
    ) {
      // => OPENED SECOND
      String line = in.readLine(); // => BODY: the single line read once
      out.println("ack: " + line); // => BODY: the reply written once
      System.out.println("body: read then wrote"); // => Output: body order stated second
    } // => CLOSED: writer flushes first, reader releases second
    System.out.println("close: writer, then reader"); // => Output: closing order stated last
    System.out.print(Files.readString(outbox, StandardCharsets.UTF_8)); // => Output: ack: sari
    Files.deleteIfExists(inbox); // => tidy fixtures for rerun stability
    Files.deleteIfExists(outbox); // => no residue for the next run
  } // => main ends: opening and closing orders both printed
}
