// Example 48: Records Are Values.
// Records bundle immutable data with generated equals, hashCode, and
// toString: two dues with the same fields are the same value.
// Canonical constructors validate without giving up compactness.
public class Main {

  // => one public class per file, named after the file
  record Due(String member, int amount) {
    // => the value: two components, nothing else
    Due {
      // => compact constructor: validation before the implicit assignment
      if (member == null || member.isBlank()) {
        // => blank members corrupt every report
        throw new IllegalArgumentException("member must be non-blank"); // => refused at construction
      } // => membership settled before the value exists
      if (amount < 0) {
        // => negative dues corrupt every total
        throw new IllegalArgumentException("amount must be >= 0"); // => refused at construction
      } // => amount settled before the value exists
    } // => constructor ends: no invalid Due can exist
  } // => Due ends: immutable, comparable, printable

  public static void main(String[] args) {
    // => the entry point the harness runs
    Due first = new Due("sari", 50); // => canonical construction, validated
    Due twin = new Due("sari", 50); // => equal fields, separate object
    System.out.println("equal: " + first.equals(twin)); // => Output: equal: true, values compare by fields
    System.out.println("same object: " + (first == twin)); // => Output: same object: false
    System.out.println("text: " + first); // => Output: text: Due[member=sari, amount=50]
    System.out.println("member: " + first.member()); // => Output: member: sari
    try {
      // => invalid construction refused at the door
      new Due("budi", -5); // => throws before any value exists
      System.out.println("unreachable"); // => skipped: validation threw first
    } catch (IllegalArgumentException e) {
      // => the documented construction refusal
      System.out.println("refused: " + e.getMessage()); // => Output: refused: amount must be >= 0
    } // => catch ends: no invalid value escaped
  } // => main ends: values compared, printed, and guarded
}
