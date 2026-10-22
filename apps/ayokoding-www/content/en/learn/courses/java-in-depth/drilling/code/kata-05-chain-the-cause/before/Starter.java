// Starter: orphaned translation. The smell: the NumberFormatException
// is caught and replaced, so the stack trace dies at the boundary.
// Your task: chain the cause so handlers see both layer and root.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int load(String text) throws Exception {
    // => broad throws: the first smell beside the lost cause
    try {
      // => the low-level attempt speaking integers
      return Integer.parseInt(text); // => may throw NumberFormatException
    } catch (NumberFormatException e) {
      // => caught, then orphaned below
      throw new Exception("bad amount: " + text); // => replacement without a cause: trace lost
    } // => catch ends: the original vanishes here
  } // => starter ends: translated, but orphaned

  public static void main(String[] args) throws Exception {
    // => broad throws inherited upward
    System.out.println("amount: " + load("50")); // => prints 50, never faces corruption
  } // => main ends: honest only on the happy path
} // => fix me: specific type plus (message, cause), narrow throws
