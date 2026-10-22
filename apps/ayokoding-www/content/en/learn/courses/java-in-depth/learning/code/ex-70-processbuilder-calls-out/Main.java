// Example 70: ProcessBuilder Calls Out.
// ProcessBuilder runs one fixed external command and reads its exact
// bytes: arguments listed, no shell interpolation, output asserted.
// Fixed printf output keeps the transcript deterministic everywhere.
import java.io.IOException; // => spawning is environmentally checked
import java.nio.charset.StandardCharsets; // => decode the captured bytes as UTF-8

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws IOException, InterruptedException {
    // => spawn and wait are checked
    ProcessBuilder builder = new ProcessBuilder("sh", "-c", "printf 'sari:50\\nbudi:75\\n'"); // => fixed command, fixed bytes
    builder.redirectErrorStream(true); // => merge stderr: nothing hides outside stdout
    Process child = builder.start(); // => the child runs concurrently from here
    String report = new String(child.getInputStream().readAllBytes(), StandardCharsets.UTF_8); // => exact bytes captured
    int code = child.waitFor(); // => join the child: exit code before verdicts
    System.out.print(report); // => Output: the two dues lines from the child
    System.out.println("exit: " + code); // => Output: exit: 0
    System.out.println("lines: " + report.lines().count()); // => Output: lines: 2
  } // => main ends: child joined, bytes asserted, code checked
}
