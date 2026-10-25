// Example 47: A Generic Stack with Honest Bounds.
// A bounded type parameter keeps the stack generic yet capable: T
// extends Comparable<T> buys ordering without losing reusability.
import java.util.ArrayList; // => the stack storage, top at the end
import java.util.List; // => interface on the left as always
import java.util.NoSuchElementException; // => the documented empty-stack failure

public class Main {

  // => one public class per file, named after the file
  static class Stack<T extends Comparable<T>> {

    // => bounded: every element orders itself
    private final List<T> items = new ArrayList<>(); // => private storage, top at the end

    void push(T item) {
      // => push accepts the bounded type only
      items.add(item); // => top grows at the list end
    } // => push ends: one append, LIFO order kept

    T pop() {
      // => pop removes and returns the top
      if (items.isEmpty()) {
        // => empty pop is a caller bug, refused loudly
        throw new NoSuchElementException("pop from empty stack"); // => unchecked: fix the caller
      } // => past this line the top exists
      return items.remove(items.size() - 1); // => remove and return the last element
    } // => pop ends: top out, rest intact

    T max() {
      // => the bound pays off: ordering without casts
      T best = items.get(0); // => seed with the first element
      for (T item : items) {
        // => every element comparable by construction
        if (item.compareTo(best) > 0) {
          // => the bound guarantees this method exists
          best = item; // => a new champion by natural order
        } // => branch ends: best always the maximum so far
      } // => loop ends having compared everything
      return best; // => the maximum by natural ordering
    } // => max ends: generic code, specific capability
  } // => Stack ends: reusable, ordered, refusal-honest

  public static void main(String[] args) {
    // => the entry point the harness runs
    Stack<String> names = new Stack<>(); // => Strings order: alphabetical max
    names.push("budi"); // => first arrival, deeper in the stack
    names.push("sari"); // => second arrival, the top
    System.out.println("pop: " + names.pop()); // => Output: pop: sari
    names.push("citra"); // => new top after the pop
    System.out.println("max: " + names.max()); // => Output: max: sari
    Stack<Integer> dues = new Stack<>(); // => Integers order: numeric max
    dues.push(50); // => smaller due first
    dues.push(125); // => larger due second
    System.out.println("max due: " + dues.max()); // => Output: max due: 125
  } // => main ends: two flavors, one bounded implementation
}
