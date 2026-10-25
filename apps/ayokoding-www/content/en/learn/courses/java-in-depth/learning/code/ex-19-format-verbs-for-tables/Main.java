// Example 19: Format Verbs for Tables and Numbers.
// Format verbs align columns, round decimals, and pad numbers, so
// reports read as tables instead of ragged concatenations.
public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    System.out.println("%-8s %5s".formatted("member", "dues")); // => Output: header, name left, dues right
    System.out.println("%-8s %5d".formatted("sari", 50)); // => Output: sari row, padded to columns
    System.out.println("%-8s %5d".formatted("budi", 125)); // => Output: budi row, wider figure aligned
    System.out.println("share: %.2f".formatted(50.0 / 175.0)); // => Output: share: 0.29, rounded to two
    System.out.println("id: %04d".formatted(7)); // => Output: id: 0007, zero-padded to four
    System.out.println("hex: %x".formatted(255)); // => Output: hex: ff, lowercase hexadecimal
    String order = "%2$s owes %1$s".formatted("sari", "budi"); // => indexed verbs reorder arguments
    System.out.println(order); // => Output: budi owes sari
  } // => main ends: one verb family, seven shapes
}
