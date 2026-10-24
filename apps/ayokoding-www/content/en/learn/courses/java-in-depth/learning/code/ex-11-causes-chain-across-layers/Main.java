// Example 11: Causes Chain Across Layers.
// Wrapping a low-level failure in a layer-meaningful exception keeps
// the original as the cause, so no diagnostic detail is lost.
public class Main {

  // => one public class per file, named after the file
  static class LedgerException extends Exception {

    // => checked: callers must face it
    LedgerException(String message, Throwable cause) {
      // => cause is mandatory, never null
      super(message, cause); // => the chain link every handler can walk
    } // => constructor ends: message plus cause, always paired
  } // => domain exception ends: one type for ledger failures

  static int loadAmount(String text) throws LedgerException {
    // => declares the layer failure
    try {
      // => the low-level attempt that speaks integers, not dues
      return Integer.parseInt(text); // => may throw NumberFormatException
    } catch (NumberFormatException e) {
      // => translate, never swallow
      throw new LedgerException("bad dues amount: '" + text + "'", e); // => layer message plus cause
    } // => catch ends: the original travels as getCause
  } // => helper ends: one failure type leaves this layer

  public static void main(String[] args) {
    // => the entry point the harness runs
    for (String cell : new String[] { "50", "xx" }) {
      // => one clean amount, one corrupt
      try {
        // => the layer boundary where LedgerException is caught
        System.out.println("amount: " + loadAmount(cell)); // => Output: amount: 50, once
      } catch (LedgerException e) {
        // => the single type this layer raises
        System.out.println(
          "ledger: " +
            e.getMessage() + // => Output: ledger: bad dues amount: 'xx'
            " caused by " +
            e.getCause().getClass().getSimpleName()
        ); // => plus caused by NumberFormatException
      } // => catch ends: message and cause both reported
    } // => loop ends: clean and corrupt cells both answered
  } // => main ends: the chain stayed intact end to end
}
