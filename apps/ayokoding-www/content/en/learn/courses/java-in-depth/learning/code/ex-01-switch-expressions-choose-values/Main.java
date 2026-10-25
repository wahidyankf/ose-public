// Example 1: Switch Expressions Choose Values.
// Switch expressions turn multi-branch choices into values: each arm
// produces the result, so no branch can silently fall through.
public class Main {

  // => one public class per file, named after the file
  static String sizeOf(int code) {
    // => static helper keeps main readable
    return switch (code) {
      // => switch is an expression: it yields a value
      case 1 -> "small"; // => arrow arm: value only, no break needed
      case 2 -> "medium"; // => each arm covers exactly one input shape
      case 3 -> "large"; // => a new size means one new arm, nothing else
      default -> "unknown"; // => default answers every uncovered input
    }; // => the semicolon ends the expression switch cleanly
  } // => choosing lives in the helper, printing lives in main

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println(sizeOf(1)); // => Output: small
    System.out.println(sizeOf(2)); // => Output: medium
    System.out.println(sizeOf(9)); // => Output: unknown, through default
  } // => main ends after exercising every arm once
}
