// Starter: untested arithmetic. The smell: total works today by
// luck, and no check will notice the day it drifts by one.
// Your task: add assert contracts for empty, single, and many;
// run with -ea so the contracts arm every time.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int total(int[] amounts) {
    // => correct today, unwitnessed
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => every figure added once
      sum += amount; // => plain addition, no witness
    } // => loop ends with the settled sum
    return sum; // => returned unwitnessed
  } // => starter ends: behavior without proof

  public static void main(String[] args) {
    // => prints one answer, proves nothing
    System.out.println("total: " + total(new int[] { 50, 75 })); // => prints 125, asserts nothing
  } // => main ends: untested, drifting risk accepted
} // => fix me: assert empty, single, and many under -ea
