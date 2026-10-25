// Example 51: Enums Carry Behavior.
// Enums with fields and methods turn fixed sets into data: each
// settlement state knows its own label and its next step.
// Behavior on the constant beats switches scattered at call sites.
public class Main {

  // => one public class per file, named after the file
  enum State {
    // => the closed settlement lifecycle, four states
    PENDING("waiting", false), // => arrived, not yet processed
    SETTLED("done", true), // => processed and banked
    SHORT("partial", false), // => processed, gap remains
    VOID("cancelled", true); // => closed without banking

    private final String label; // => the human word per state
    private final boolean closed; // => whether the lifecycle ended

    State(String label, boolean closed) {
      // => constructor binds data per constant
      this.label = label; // => label stored once per constant
      this.closed = closed; // => closedness stored once per constant
    } // => constructor ends: constants fully formed

    boolean isClosed() {
      // => behavior lives on the constant
      return closed; // => no switch at the call site, ever
    } // => query ends: data answers, not branches

    String label() {
      // => the human word for reports
      return label; // => stored per constant at class load
    } // => label ends: reporting reads data, not branches

    State settle() {
      // => the lifecycle transition each state owns
      return switch (this) {
        // => expression switch over the closed set
        case PENDING -> SETTLED; // => waiting work completes
        case SHORT -> SETTLED; // => partial work completes too
        case SETTLED, VOID -> this; // => terminal states stay put
      }; // => exhaustive: the compiler checks all four
    } // => transition ends: next state, no external map
  } // => State ends: data plus behavior, closed set

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("pending: " + State.PENDING.settle()); // => Output: pending: SETTLED
    System.out.println("settled stays: " + State.SETTLED.settle()); // => Output: settled stays: SETTLED
    System.out.println("void closed: " + State.VOID.isClosed()); // => Output: void closed: true
    System.out.println("pending open: " + State.PENDING.isClosed()); // => Output: pending open: false
    System.out.println("short reads: " + State.SHORT.label()); // => Output: short reads: partial
    System.out.println("states: " + State.values().length); // => Output: states: 4
  } // => main ends: lifecycle walked without one external switch
}
