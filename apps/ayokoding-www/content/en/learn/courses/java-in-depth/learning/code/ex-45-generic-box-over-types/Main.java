// Example 45: A Generic Box Works over Types.
// One type parameter lets Box hold dues, names, or totals with full
// checking: the compiler rejects the wrong type at every put and get.
public class Main {

  // => one public class per file, named after the file
  static class Box<T> {

    // => T is the held type, chosen per use
    private T contents; // => private: every access crosses the typed door

    void put(T item) {
      // => put accepts exactly T, nothing wider
      contents = item; // => stored under the type the box promised
    } // => put ends: no cast, no check, the signature guarantees

    T take() {
      // => take returns exactly T, never Object
      return contents; // => no cast at the call site, ever
    } // => take ends: the type travels with the value
  } // => Box ends: one parameter, two methods, zero casts

  public static void main(String[] args) {
    // => the entry point the harness runs
    Box<String> names = new Box<>(); // => a box that holds names only
    names.put("sari"); // => String in: the signature allows it
    System.out.println("name: " + names.take()); // => Output: name: sari
    Box<Integer> totals = new Box<>(); // => a box that holds totals only
    totals.put(125); // => Integer in: autoboxed once at the door
    System.out.println("total: " + totals.take()); // => Output: total: 125
    System.out.println("empty box: " + new Box<String>().take()); // => Output: empty box: null
  } // => main ends: two types, one box, no casts anywhere
}
