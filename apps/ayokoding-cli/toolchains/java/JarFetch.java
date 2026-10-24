// JarFetch fetches one jar per lock line into a target folder, checking
// SHA-256. Usage: JarFetch <lockfile> <target-dir>. A lock line is
// `<group>:<artifact>:<version> <sha256> [<repository>]`, where `<repository>`
// is `central` (the default, https://repo.maven.apache.org/maven2/) or
// `clojars` (https://repo.clojars.org/); lines starting with `#` and blank
// lines are ignored. Any hash difference, missing line, failed download, or
// unknown repository fails the build naming the line, and the unit never
// starts.
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;

public class JarFetch {

  public static void main(String[] args) throws Exception {
    if (args.length != 2) {
      System.err.println("usage: JarFetch <lockfile> <target-dir>");
      System.exit(2);
    }
    Path target = Path.of(args[1]);
    Files.createDirectories(target);
    HttpClient http = HttpClient.newHttpClient();
    for (String raw : Files.readAllLines(Path.of(args[0]))) {
      String line = raw.trim();
      if (line.isEmpty() || line.startsWith("#")) {
        continue;
      }
      String[] fields = line.split("\\s+");
      if (fields.length < 2 || fields.length > 3) {
        fail("bad lock line (want '<group>:<artifact>:<version> <sha256> [<repository>]'): " + line);
      }
      String[] coord = fields[0].split(":");
      if (coord.length != 3) {
        fail("bad coordinate (want '<group>:<artifact>:<version>'): " + line);
      }
      String repository = fields.length == 3 ? fields[2] : "central";
      String base;
      if (repository.equals("central")) {
        base = "https://repo.maven.apache.org/maven2/";
      } else if (repository.equals("clojars")) {
        base = "https://repo.clojars.org/";
      } else {
        fail("unknown repository (want 'central' or 'clojars'): " + line);
        return;
      }
      String jar =
        base + coord[0].replace('.', '/') + "/" + coord[1] + "/" + coord[2] + "/" + coord[1] + "-" + coord[2] + ".jar";
      HttpResponse<byte[]> response = http.send(
        HttpRequest.newBuilder(URI.create(jar)).GET().build(),
        HttpResponse.BodyHandlers.ofByteArray()
      );
      if (response.statusCode() != 200) {
        fail("fetch failed for lock line: " + line + " (HTTP " + response.statusCode() + ")");
      }
      String actual = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(response.body()));
      if (!actual.equalsIgnoreCase(fields[1])) {
        fail("hash mismatch for lock line: " + line);
      }
      Files.write(target.resolve(coord[1] + "-" + coord[2] + ".jar"), response.body());
    }
  }

  static void fail(String message) {
    System.err.println("JarFetch: " + message);
    System.exit(1);
    throw new AssertionError("unreachable");
  }
}
