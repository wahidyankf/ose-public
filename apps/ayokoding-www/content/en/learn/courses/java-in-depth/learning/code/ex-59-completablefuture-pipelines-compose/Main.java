// Example 59: CompletableFuture Pipelines Compose.
// Supply, transform, and combine stages read as one chain: async
// fetch, thenApply parse, thenCombine totals, join collects in order.
import java.util.concurrent.CompletableFuture; // => the composable async pipeline

public class Main {

  // => one public class per file, named after the file
  static String fetch(String member) {
    // => the async fetch stage, fixed data
    return member + ":50"; // => every member owes fifty here
  } // => fetch ends: line shaped, ready to parse

  static int parse(String line) {
    // => the parse stage: line in, amount out
    return Integer.parseInt(line.split(":")[1]); // => amount half parsed to int
  } // => parse ends: pure function, stage-safe

  public static void main(String[] args) {
    // => join rethrows unchecked: no checked ceremony
    CompletableFuture<Integer> sari = CompletableFuture // => pipeline one: sari's dues
      .supplyAsync(() -> fetch("sari")) // => async fetch off the calling thread
      .thenApply(Main::parse); // => parse chained onto the fetch result
    CompletableFuture<Integer> budi = CompletableFuture // => pipeline two: budi's dues
      .supplyAsync(() -> fetch("budi")) // => async fetch, overlapping pipeline one
      .thenApply(Main::parse); // => same parse stage, independent data
    int total = sari.thenCombine(budi, Integer::sum).join(); // => combine stage: sum when both land
    System.out.println("sari: " + sari.join()); // => Output: sari: 50
    System.out.println("budi: " + budi.join()); // => Output: budi: 50
    System.out.println("total: " + total); // => Output: total: 100
    CompletableFuture<String> label = sari.thenApply(amount -> "settled:" + amount); // => label stage after join
    System.out.println(label.join()); // => Output: settled:50
  } // => main ends: composed async, ordered transcript
}
