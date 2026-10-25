// Example 60: Parallel Streams Sort After.
// Parallel streams split bulk mapping across cores; the sorted
// terminal restores order, so speedup never scrambles output.
import java.util.List; // => the source roster and the result
import java.util.concurrent.atomic.LongAdder; // => the contention-friendly counter

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> names = List.of("sari", "budi", "citra", "dewi", "eka", "gita"); // => fixed six-name roster
    List<String> shouted = names
      .parallelStream() // => fork-join pool maps concurrently
      .map(String::toUpperCase) // => stateless mapping: safe at any parallelism
      .sorted() // => order restored after the parallel mapping
      .toList(); // => immutable result in sorted order
    System.out.println(shouted); // => Output: [BUDI, CITRA, DEWI, EKA, GITA, SARI]
    LongAdder letters = new LongAdder(); // => striped counter: threads add without contention
    names.parallelStream().forEach(n -> letters.add(n.length())); // => concurrent adds, exact sum
    System.out.println("letters: " + letters.sum()); // => Output: letters: 24
    long sequential = names.stream().mapToInt(String::length).sum(); // => sequential twin for agreement
    System.out.println("agree: " + (sequential == letters.sum())); // => Output: agree: true
  } // => main ends: parallel mapped, sorted, and cross-checked
}
