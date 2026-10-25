// Example 42: Boundaries: Empty, Single, Many.
// The smallest boundary family, zero-one-many, catches the off-by-one
// errors that happy-path tests miss: assert all three, every time.
import java.util.List; // => the boundary-sized inputs

public class Main {

  // => one public class per file, named after the file
  static double average(List<Integer> amounts) {
    // => mean over dues, boundary-honest
    if (amounts.isEmpty()) {
      // => empty is a contract question, not a crash
      return 0.0; // => documented policy: no dues means zero average
    } // => past this line division is safe
    return amounts.stream().mapToInt(Integer::intValue).sum() / (double) amounts.size(); // => floating division
  } // => helper ends: empty answered, rest computed

  static void check(String name, boolean condition) {
    // => the runner vocabulary from Example 36
    System.out.println((condition ? "PASS " : "FAIL ") + name); // => verdict first, name second
  } // => check ends: reporting only

  public static void main(String[] args) {
    // => the entry point the harness runs
    check("empty averages zero", average(List.of()) == 0.0); // => Output: PASS empty averages zero
    check("single passes through", average(List.of(50)) == 50.0); // => Output: PASS single passes through
    check("many average exactly", average(List.of(50, 75, 25)) == 50.0); // => Output: PASS many average exactly
    check("two need float division", average(List.of(50, 75)) == 62.5); // => Output: PASS two need float division
    check("negative averages honestly", average(List.of(-10, 30)) == 10.0); // => negative input, honest output
    System.out.println("boundaries covered: 5"); // => Output: boundaries covered: 5
  } // => main ends: zero, one, and many all witnessed
}
