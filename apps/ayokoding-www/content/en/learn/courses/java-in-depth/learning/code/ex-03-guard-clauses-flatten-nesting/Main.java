// Example 3: Guard Clauses Flatten Nesting.
// A guard clause rejects bad input at the door, so the happy path
// stays at the left margin instead of nesting inside validation.
public class Main {

  // => one public class per file, named after the file
  static String greet(String name) {
    // => returns the greeting or the refusal
    if (name == null) {
      // => guard one: missing input cannot be greeted
      return "error: name is missing"; // => exit early with the failure text
    } // => past this line, name is provably non-null
    if (name.isBlank()) {
      // => guard two: whitespace is not a name either
      return "error: name is blank"; // => exit early again, same flat shape
    } // => past this line, name holds at least one visible character
    return "hello, " + name; // => happy path: one statement, zero nesting
  } // => the method ends: two exits for failures, one value for success

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(greet(null)); // => Output: error: name is missing
    System.out.println(greet("   ")); // => Output: error: name is blank
    System.out.println(greet("Sari")); // => Output: hello, Sari
  } // => main ends: one call per path through the helper
}
