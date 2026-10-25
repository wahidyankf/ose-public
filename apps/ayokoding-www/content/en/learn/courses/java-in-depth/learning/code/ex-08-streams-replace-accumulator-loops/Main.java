// Example 8: Streams Replace Accumulator Loops.
// A stream pipeline states filter, transform, and collect as one
// chain, replacing the loop, the branch, and the temp list.
import java.util.List; // => source data and the collected result
import java.util.stream.Collectors; // => toList finishes the pipeline

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> names = List.of("ada", "grace", "sari", "citra", "budi"); // => fixed sample roster
    List<String> honored = names
      .stream() // => the pipeline starts from the source
      .filter(n -> n.length() > 3) // => keep only names longer than three
      .map(String::toUpperCase) // => shout the survivors uniformly
      .sorted() // => alphabetical: determinism before printing
      .collect(Collectors.toList()); // => terminal step gathers the result
    System.out.println(honored); // => Output: [CITRA, GRACE, SARI]
    long count = names
      .stream() // => a second pipeline over the same source
      .filter(n -> n.startsWith("a")) // => keep the a-initial names
      .count(); // => terminal count needs no accumulator variable
    System.out.println("a-names: " + count); // => Output: a-names: 1
    int letters = names
      .stream() // => third pipeline: total letters
      .mapToInt(String::length) // => primitive stream avoids boxing
      .sum(); // => sum is the built-in reduction
    System.out.println("letters: " + letters); // => Output: letters: 21
  } // => main ends: three pipelines, zero explicit loops
}
