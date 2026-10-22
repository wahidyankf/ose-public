// Example 30: Maven Layout and Coordinates.
// Maven names every project groupId:artifactId:version; this reader
// parses the committed pom and prints the coordinates it declares.
import java.nio.file.Files; // => pom reader
import java.nio.file.Path; // => the pom.xml handle
import java.util.ArrayList; // => the coordinate lines in order
import java.util.List; // => interface on the left as always
import java.util.regex.Matcher; // => tag-content cursor
import java.util.regex.Pattern; // => one tag pattern, reused per line

public class Main {

  // => one public class per file, named after the file
  static String tag(String line, String name) {
    // => extracts <name>value</name> or null
    Matcher m = Pattern.compile("<" + name + ">([^<]+)</" + name + ">").matcher(line); // => simple tag grammar
    return m.find() ? m.group(1).trim() : null; // => content or absent, caller decides
  } // => helper ends: pure text, no printing

  public static void main(String[] args) throws Exception {
    // => pom reads are environmentally checked
    List<String> coords = new ArrayList<>(); // => project line first, dependencies after
    for (String line : Files.readAllLines(Path.of("pom.xml"))) {
      // => the committed descriptor, line by line
      String trimmed = line.trim(); // => indentation is layout, not data
      if (trimmed.startsWith("<groupId>") && coords.isEmpty()) {
        // => first groupId is the project itself
        coords.add("project: " + trimmed.replaceAll("<[^>]+>", "")); // => text only, tags stripped
      } // => project line banked exactly once
      if (trimmed.startsWith("<artifactId>")) {
        // => project artifact and each dependency alike
        coords.add("artifact: " + trimmed.replaceAll("<[^>]+>", "")); // => banked in document order
      } // => artifacts accumulate in pom order
      if (trimmed.startsWith("<version>")) {
        // => pinned versions beside their artifacts
        coords.add("version: " + trimmed.replaceAll("<[^>]+>", "")); // => the pin this course preaches
      } // => versions accumulate beside their owners
    } // => scan ends: coordinates collected without an XML library
    for (String c : coords) {
      // => print the collected coordinates in order
      System.out.println(c); // => Output: project, artifact, version lines below
    } // => Output: com.ayokoding, dues-reporter, 1.0.0, junit-jupiter, 5.11.0
  } // => main ends: descriptor read, coordinates printed
}
