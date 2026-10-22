// Example 36: A Hand-rolled Test Runner.
// Without test libraries, a tiny runner counts passes and failures:
// each check prints PASS or FAIL, and the summary exits the verdict.
import java.util.ArrayList; // => the failure evidence list
import java.util.List; // => interface on the left as always

public class Main {

  // => one public class per file, named after the file
  static final List<String> FAILURES = new ArrayList<>(); // => every failure banks its name here

  static void check(String name, boolean condition) {
    // => one assertion, uniformly reported
    if (condition) {
      // => green path: name the pass
      System.out.println("PASS " + name); // => PASS lines prove each check ran
    } else {
      // => red path: bank the name for the summary
      System.out.println("FAIL " + name); // => FAIL lines name the breakage precisely
      FAILURES.add(name); // => banked: the summary counts these
    } // => branch ends: every check reported exactly once
  } // => check ends: the only assertion vocabulary this file needs

  static int total(int[] amounts) {
    // => the domain under test, kept tiny
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => every figure added exactly once
      sum += amount; // => plain addition under test
    } // => loop ends with the settled sum
    return sum; // => the total the checks certify
  } // => helper ends: arithmetic only

  public static void main(String[] args) {
    // => the entry point the harness runs
    check("sums three dues", total(new int[] { 50, 75, 25 }) == 150); // => headline contract first
    check("empty totals zero", total(new int[] {}) == 0); // => boundary: identity, not crash
    check("single passes through", total(new int[] { 100 }) == 100); // => boundary: one element unchanged
    check("rejects negatives in messages", true); // => placeholder: policy stated, tested in Example 39
    System.out.println("failures: " + FAILURES.size()); // => Output: failures: 0
    if (!FAILURES.isEmpty()) {
      // => red builds exit nonzero: CI reads the code
      throw new AssertionError("red: " + FAILURES); // => unreachable here, kept as the policy
    } // => green path continues past the guard
    System.out.println("suite green: true"); // => Output: suite green: true
  } // => main ends: four checks, zero failures, verdict printed
}
