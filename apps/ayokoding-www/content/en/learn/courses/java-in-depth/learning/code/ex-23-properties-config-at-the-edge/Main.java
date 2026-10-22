// Example 23: Properties Config at the Edge.
// The Properties loader reads key=value config with defaults, so
// tunables live in a file while the code keeps its fallbacks.
import java.io.IOException; // => config reads are environmentally checked
import java.io.Reader; // => the charset-carrying reader
import java.nio.charset.StandardCharsets; // => UTF_8 stated once more
import java.nio.file.Files; // => fixture reader
import java.nio.file.Path; // => the app.properties handle
import java.util.Properties; // => the key=value config map

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) throws IOException {
    // => small-program shape: declare once
    Path config = Path.of("app.properties"); // => fixture beside the program
    Properties settings = new Properties(); // => empty map with built-in defaults below
    try (Reader reader = Files.newBufferedReader(config, StandardCharsets.UTF_8)) {
      // => closed by the header
      settings.load(reader); // => comments and blanks skipped by the loader
    } // => reader closed here, settings fully loaded
    String host = settings.getProperty("report.host", "localhost"); // => present key wins over the default
    String missing = settings.getProperty("report.missing", "fallback"); // => absent key yields the default
    int port = Integer.parseInt(settings.getProperty("report.port", "8080")); // => typed at the edge, once
    System.out.println("host: " + host); // => Output: host: ledger.example
    System.out.println("missing: " + missing); // => Output: missing: fallback
    System.out.println("port: " + port); // => Output: port: 9090
  } // => main ends: config read, defaulted, typed, printed
}
