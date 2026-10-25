// Example 72: Read Pipelines Stage by Stage.
// Stream pipelines read one stage at a time: name the source, then
// each intermediate, then the terminal, before judging any lambda.
// Reading order: source type first, terminal second, stages middle.
// Terminal first tells you what the pipeline produces; stages tell how.
import java.util.List; // => the source roster and the collected result

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> feed = List.of("sari:50", "oops", "budi:75", "xx:yy", "citra:25"); // => SOURCE: five raw lines
    List<String> settled = feed
      .stream() // => SOURCE: ordered list stream
      .filter(line -> line.contains(":")) // => STAGE 1: keep shaped lines only
      .filter(line -> line.split(":")[1].matches("[0-9]+")) // => STAGE 2: keep numeric amounts only
      .map(line -> line.split(":")[0] + " settled") // => STAGE 3: members plus verdict
      .sorted() // => STAGE 4: alphabetical for determinism
      .toList(); // => TERMINAL: immutable collected list
    System.out.println(settled); // => Output: [budi settled, citra settled, sari settled]
    long dropped = feed.size() - settled.size(); // => TERMINAL arithmetic: input minus output
    System.out.println("dropped: " + dropped); // => Output: dropped: 2
  } // => main ends: source, four stages, terminal, audit
}
