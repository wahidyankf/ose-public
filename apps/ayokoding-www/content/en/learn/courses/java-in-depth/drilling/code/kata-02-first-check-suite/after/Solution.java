// Solution: contracts pinned with assert. Empty, single, and many
// each hold an assertion, and -ea arms them on every harness run.
// Fixed from Starter: printing became proving.
public class Solution {

  // => the reference solution, green in the harness
  static int total(int[] amounts) {
    // => the domain under contract, unchanged
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => every figure added once
      sum += amount; // => plain addition, witnessed below
    } // => loop ends with the settled sum
    return sum; // => the total the assertions certify
  } // => helper ends: arithmetic only, checks live with callers

  public static void main(String[] args) {
    // => run with -ea: assertions enabled
    assert total(new int[] { 50, 75, 25 }) == 150; // => many: the headline contract
    assert total(new int[] {}) == 0; // => empty: identity, not crash
    assert total(new int[] { 100 }) == 100; // => single: passes through unchanged
    System.out.println("contracts hold: 3 of 3"); // => Output: contracts hold: 3 of 3
  } // => main ends: silence meant green, the print confirms it
} // => solved: three contracts, zero unwitnessed arithmetic
