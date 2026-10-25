// Main.java: the thin edge over the Report domain.
// Main touches the filesystem and the terminal; every decision lives
// in Report, so this file reads input, calls summarize, prints render.
import java.io.IOException; // => fixture reads are environmentally checked
import java.nio.charset.StandardCharsets; // => UTF_8 stated at the read
import java.nio.file.Files; // => whole-file fixture reader
import java.nio.file.Path; // => the input.txt handle
import java.util.List; // => the lines handed to the domain

public class Main {

  // => the entry point the harness runs
  public static void main(String[] args) throws IOException {
    // => small-program shape: declare once
    Path input = Path.of("input.txt"); // => fixture beside the program
    List<String> lines = Files.readAllLines(input, StandardCharsets.UTF_8); // => UTF-8 stated, never defaulted
    Report.Summary summary = Report.summarize(lines); // => the pure fold over every line
    System.out.print(Report.render(summary)); // => the golden transcript, printed once
  } // => main ends: read, fold, print, nothing else
} // => Main ends: three lines of work, zero decisions
