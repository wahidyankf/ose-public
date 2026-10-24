// Example 71: Read the Handler First.
// Unfamiliar code surrenders fastest through its handler: validate,
// decide, respond. Read the entry point, name the three stages, and
// the helpers explain themselves in calling order.
// Reading order: main first, then handle, then its helpers in order.
import java.util.List; // => the request batch under review

public class Main {

  // => one public class per file, named after the file
  static String handle(String line) {
    // => STAGE 2 (read second): the decision
    if (!line.contains(":")) {
      // => validate: shape check first
      return "skip: '" + line + "'"; // => invalid shape answers immediately
    } // => past this line the grammar holds
    int amount = Integer.parseInt(line.split(":")[1]); // => decide: parse the amount half
    if (amount < 0) {
      // => decide: policy check second
      return "refused: '" + line + "'"; // => negative dues refuse with evidence
    } // => past this line the dues settle
    return "settled: '" + line + "'"; // => respond: the success line
  } // => handle ends: validate, decide, respond in order

  public static void main(String[] args) {
    // => STAGE 1 (read first): the entry point
    List<String> inbox = List.of("sari:50", "oops", "budi:-5", "citra:25"); // => STAGE 1: the four requests
    for (String line : inbox) {
      // => STAGE 1: every request faces the handler
      System.out.println(handle(line)); // => STAGE 1: responses print in request order
    } // => Output: settled, skip, refused, settled in order
  } // => main ends: entry understood before any helper
}
