// Solution: translation with the cause chained. The layer message
// names dues while getCause keeps the parse failure reachable.
// Fixed from Starter: orphaned replacement became honest chaining.
public class Solution {

  // => the reference solution, green in the harness
  static class LedgerException extends Exception {

    // => checked: callers face the layer failure
    LedgerException(String message, Throwable cause) {
      // => cause mandatory, never null
      super(message, cause); // => the chain link handlers walk
    } // => constructor ends: message plus cause, always paired
  } // => domain type ends: one layer, one failure

  static int load(String text) throws LedgerException {
    // => narrow throws: exactly this layer's failure
    try {
      // => the low-level attempt speaking integers
      return Integer.parseInt(text); // => may throw NumberFormatException
    } catch (NumberFormatException e) {
      // => translate, never swallow
      throw new LedgerException("bad dues amount: '" + text + "'", e); // => layer message plus cause
    } // => catch ends: the original travels as getCause
  } // => helper ends: one failure type leaves this layer

  public static void main(String[] args) {
    // => the entry point the harness runs
    try {
      // => the layer boundary where the failure is answered
      System.out.println("amount: " + load("50")); // => Output: amount: 50
      load("xx"); // => corrupt cell: translated with cause
      System.out.println("unreachable"); // => skipped: translation threw first
    } catch (LedgerException e) {
      // => the single type this layer raises
      System.out.println("ledger: " + e.getMessage()); // => Output: ledger: bad dues amount: 'xx'
      System.out.println("cause: " + e.getCause().getClass().getSimpleName()); // => Output: cause: NumberFormatException
    } // => catch ends: message and cause both witnessed
  } // => main ends: the chain intact end to end
} // => solved: layers translate, causes travel
