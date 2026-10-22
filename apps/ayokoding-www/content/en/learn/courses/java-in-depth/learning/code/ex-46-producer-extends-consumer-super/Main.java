// Example 46: Producer Extends, Consumer Super.
// extends opens a list for reading, super opens one for writing:
// PECS states which bound each direction needs, once and for all.
import java.util.ArrayList; // => the writable destination list
import java.util.List; // => the readable source lists

public class Main {

  // => one public class per file, named after the file
  static double sumAll(List<? extends Number> source) {
    // => producer bound: read Numbers out
    double sum = 0; // => widened accumulator for every numeric flavor
    for (Number n : source) {
      // => every element arrives as Number, safely
      sum += n.doubleValue(); // => uniform read through the bound
    } // => loop ends: ints and doubles summed alike
    return sum; // => the total regardless of element flavor
  } // => reader ends: extends, never writes

  static void addDues(List<? super Integer> sink) {
    // => consumer bound: write Integers in
    sink.add(50); // => Integer fits wherever Integers are welcome
    sink.add(75); // => second due through the same door
  } // => writer ends: super, never reads specifically

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("ints: " + sumAll(List.of(50, 75, 25))); // => Output: ints: 150.0
    System.out.println("mixed: " + sumAll(List.of(50, 2.5))); // => Output: mixed: 52.5
    List<Number> vault = new ArrayList<>(); // => Numbers welcome Integers
    addDues(vault); // => super bound admits the writes
    System.out.println("vault: " + vault + " sum=" + sumAll(vault)); // => Output: vault: [50, 75] sum=125.0
    List<Object> attic = new ArrayList<>(); // => Objects welcome Integers too
    addDues(attic); // => same writer, wider sink
    System.out.println("attic size: " + attic.size()); // => Output: attic size: 2
  } // => main ends: producers read, consumers write
}
