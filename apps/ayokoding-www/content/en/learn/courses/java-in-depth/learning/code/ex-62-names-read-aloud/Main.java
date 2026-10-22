// Example 62: Names Read Aloud.
// Idiomatic names state role and unit: settleDues reads as an action,
// memberTotals as contents, and MAX_BATCH as the loud constant.
// Abbreviations save typing and charge every later reader instead.
import java.util.List; // => the settled dues under good names

public class Main {

  // => one public class per file, named after the file
  static final int MAX_BATCH = 100; // => CONSTANT_CASE: loud, stable, shared

  static int settleDues(List<Integer> dues) {
    // => verb phrase: action over dues
    int memberTotal = 0; // => camelCase: role plus unit in the name
    for (int duesAmount : dues) {
      // => loop variable names its element, not i
      memberTotal += duesAmount; // => accumulation reads as English
    } // => loop ends: every figure added once
    return memberTotal; // => the total the name promised
  } // => method ends: verb name, noun result

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Integer> julyDues = List.of(50, 75, 25); // => month in the name: scope stated
    int julyTotal = settleDues(julyDues); // => result name mirrors its source
    System.out.println("july: " + julyTotal); // => Output: july: 150
    System.out.println("within batch: " + (julyDues.size() <= MAX_BATCH)); // => Output: within batch: true
    System.out.println("names read aloud: true"); // => Output: names read aloud: true
  } // => main ends: every name earned its place
}
