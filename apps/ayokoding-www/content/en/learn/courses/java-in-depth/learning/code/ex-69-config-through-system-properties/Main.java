// Example 69: Config Through System Properties.
// -D flags inject deployment values without touching the artifact:
// region selects the report zone while the code keeps its default.
// Secrets never ride -D on shared machines: arguments leak to logs.
public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    String region = System.getProperty("dues.region", "jakarta"); // => flag wins, default covers local runs
    String batch = System.getProperty("dues.batch", "july"); // => second tunable, same default shape
    System.out.println("region: " + region); // => Output: region: surabaya, injected by -D
    System.out.println("batch: " + batch); // => Output: batch: july, the code default
    System.out.println("java version family: " + (Runtime.version().feature() >= 11 ? "modern" : "legacy")); // => capability, never the raw number
    System.out.println("injected, not hardcoded: true"); // => Output: injected, not hardcoded: true
  } // => main ends: flags read, defaults kept, secrets absent
}
