// Example 65: EnumSet Flags Stay Compact.
// EnumSet stores enum flags as bits in a long: sixty-four options in
// eight bytes with set operations the CPU executes natively.
// Booleans scattered across fields cannot union or intersect.
import java.util.EnumMap; // => the array-backed map keyed by enum
import java.util.EnumSet; // => the bit-vector set for enum flags
import java.util.Map; // => dues per flag for the transcript

public class Main {

  // => one public class per file, named after the file
  enum Flag {
    // => the fixed flag vocabulary, three options
    VERIFIED, // => identity checked against the roster
    PAID, // => dues received and banked
    RECEIPTED, // => receipt issued to the member
  } // => flags end: closed set, bit positions implied

  public static void main(String[] args) {
    // => the entry point the harness runs
    EnumSet<Flag> sari = EnumSet.of(Flag.VERIFIED, Flag.PAID); // => two bits set in one long
    EnumSet<Flag> budi = EnumSet.of(Flag.VERIFIED, Flag.PAID, Flag.RECEIPTED); // => three bits, still one long
    System.out.println("sari: " + sari); // => Output: sari: [VERIFIED, PAID]
    System.out.println("budi complete: " + budi.containsAll(sari)); // => Output: budi complete: true
    EnumSet<Flag> missing = EnumSet.copyOf(budi); // => copy before complementing
    missing.removeAll(sari); // => set difference: what budi has that sari lacks
    System.out.println("sari lacks: " + missing); // => Output: sari lacks: [RECEIPTED]
    Map<Flag, Integer> counts = new EnumMap<>(Flag.class); // => array-backed: flag ordinal indexes directly
    counts.put(Flag.PAID, 2); // => two members paid
    counts.put(Flag.RECEIPTED, 1); // => one receipt issued
    System.out.println("paid: " + counts.get(Flag.PAID)); // => Output: paid: 2
  } // => main ends: flags as bits, counts as arrays
}
