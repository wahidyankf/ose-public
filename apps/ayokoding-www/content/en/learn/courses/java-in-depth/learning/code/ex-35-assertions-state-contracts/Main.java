// Example 35: Assertions State Contracts.
// The assert statement pins runnable contracts inside the code: run
// with -ea, and every violated assumption fails loudly at its line.
public class Main {

  // => one public class per file, named after the file
  static int total(int[] amounts) {
    // => the tiny domain under contract
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => every figure added exactly once
      sum += amount; // => plain addition, asserted below
    } // => loop ends with the settled sum
    return sum; // => the total the assertions certify
  } // => helper ends: arithmetic only, checks live with callers

  public static void main(String[] args) {
    // => run with -ea: assertions enabled
    assert total(new int[] { 50, 75, 25 }) == 150; // => the headline contract, exact sum
    assert total(new int[] {}) == 0; // => empty input totals to the identity
    assert total(new int[] { 100 }) == 100; // => single input passes through unchanged
    int big = total(new int[] { 1_000_000, 2_000_000 }); // => named value for the message below
    assert big == 3_000_000 : "big total drifted: " + big; // => message carries the evidence on failure
    System.out.println("contracts hold: 4 of 4"); // => Output: contracts hold: 4 of 4
    System.out.println("run with -ea: true"); // => Output: run with -ea: true
  } // => main ends: silence means green, the print confirms it ran
}
