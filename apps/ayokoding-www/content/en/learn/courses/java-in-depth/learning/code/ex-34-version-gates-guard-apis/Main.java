// Example 34: Version Gates Guard New APIs.
// Runtime.version gates API use by feature number, so one binary
// adapts to its runtime instead of crashing on older releases.
public class Main {

  // => one public class per file, named after the file
  static String describeFormatted() {
    // => String.formatted needs feature 15 or newer
    if (Runtime.version().feature() >= 15) {
      // => the gate: ask the runtime, not the docs
      return "formatted: " + "sari owes %d".formatted(50); // => fluent verb under the gate
    } // => gated branch ends: modern runtimes answer here
    return "formatted: " + String.format("sari owes %d", 50); // => fallback: the classic verb, same text
  } // => helper ends: one message, two spellings, runtime decides

  static String describeStrip() {
    // => String.strip needs feature 11 or newer
    if (Runtime.version().feature() >= 11) {
      // => the gate for the strip API
      return "strip: '" + "  sari  ".strip() + "'"; // => unicode-aware trim under the gate
    } // => gated branch ends
    return "strip: unavailable"; // => fallback for ancient runtimes
  } // => helper ends: same gate shape, older threshold

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(describeFormatted()); // => Output: formatted: sari owes 50
    System.out.println(describeStrip()); // => Output: strip: 'sari'
    System.out.println("gated, never crashed: true"); // => Output: gated, never crashed: true
  } // => main ends: gates asked, features answered
}
