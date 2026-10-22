// Example 4: ArrayList Grows on Add.
// ArrayList is the default resizable sequence: add freely, and read
// back in insertion order with get.
import java.util.ArrayList; // => resizable list backed by a growing array
import java.util.List; // => program to the interface, build the ArrayList

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    List<String> queue = new ArrayList<>(); // => diamond infers String twice-free
    queue.add("citra"); // => first arrival takes position zero
    queue.add("budi"); // => the backing array grows as needed, silently
    queue.add("ada"); // => insertion order is the iteration contract
    System.out.println("size: " + queue.size()); // => Output: size: 3
    System.out.println("first: " + queue.get(0)); // => Output: first: citra
    String served = queue.remove(0); // => remove shifts later elements left
    System.out.println("served: " + served); // => Output: served: citra
    System.out.println("now first: " + queue.get(0)); // => Output: now first: budi
    for (String next : queue) {
      // => enhanced for over the survivors
      System.out.println("waiting: " + next); // => Output: waiting: budi, then ada
    } // => loop ends having shown the live contents twice over
  } // => main ends: the list did the bookkeeping throughout
}
