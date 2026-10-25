// Solution: one bounded max for every ordered type. The Comparable
// bound buys compareTo without casts; both call sites share it.
// Fixed from Starter: two copies became one bounded method.
public class Solution {

  // => the reference solution, green in the harness
  static <T extends Comparable<T>> T max(T a, T b) {
    // => bounded: ordered types only, all welcome
    return a.compareTo(b) >= 0 ? a : b; // => the bound guarantees compareTo exists
  } // => helper ends: one method, every ordered type

  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("max int: " + max(50, 75)); // => Output: max int: 75
    System.out.println("max string: " + max("budi", "sari")); // => Output: max string: sari
    System.out.println("one method: true"); // => Output: one method: true
  } // => main ends: two flavors, one implementation
} // => solved: bounds reuse, copies retire
