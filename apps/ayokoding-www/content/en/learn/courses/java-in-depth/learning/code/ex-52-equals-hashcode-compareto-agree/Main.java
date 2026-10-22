// Example 52: equals, hashCode, and compareTo Agree.
// Value types keep three contracts consistent: equal objects share
// hash codes, and compareTo zero matches equals, or maps misbehave.
import java.util.ArrayList; // => the sortable roster
import java.util.HashSet; // => the hash-based membership witness
import java.util.List; // => interface on the left as always
import java.util.Objects; // => null-safe field comparison
import java.util.Set; // => membership without duplicates

public class Main {

  // => one public class per file, named after the file
  static final class Due implements Comparable<Due> {

    // => hand-rolled value: all three contracts visible
    private final String member; // => final: set once, never mutated
    private final int amount; // => final: part of the value identity

    Due(String member, int amount) {
      // => canonical construction, validated
      this.member = Objects.requireNonNull(member, "member"); // => null refused at the door
      this.amount = amount; // => amount stored as given
    } // => constructor ends: fully formed, immutable

    @Override
    public boolean equals(Object o) {
      // => value equality: fields, not addresses
      if (!(o instanceof Due other)) {
        // => pattern variable: wrong types lose fast
        return false; // => a Due never equals a non-Due
      } // => past this line other is provably a Due
      return amount == other.amount && member.equals(other.member); // => both fields agree
    } // => equals ends: symmetric, field-based

    @Override
    public int hashCode() {
      // => consistent with equals, always
      return Objects.hash(member, amount); // => same fields, same hash for equal values
    } // => hashCode ends: equal objects hash equally

    @Override
    public int compareTo(Due other) {
      // => natural order: amount first, member second
      int byAmount = Integer.compare(amount, other.amount); // => never subtract: overflow-safe
      return byAmount != 0 ? byAmount : member.compareTo(other.member); // => tie broken by name
    } // => compareTo ends: zero exactly when equals

    @Override
    public String toString() {
      // => readable text for transcripts
      return member + ":" + amount; // => the canonical dues shape
    } // => toString ends: debugging reads data
  } // => Due ends: three contracts, one consistent value

  public static void main(String[] args) {
    // => the entry point the harness runs
    Due first = new Due("sari", 50); // => canonical value one
    Due twin = new Due("sari", 50); // => equal fields, separate object
    System.out.println("equals: " + first.equals(twin)); // => Output: equals: true
    System.out.println("hashes: " + (first.hashCode() == twin.hashCode())); // => Output: hashes: true
    System.out.println("compare: " + (first.compareTo(twin) == 0)); // => Output: compare: true
    Set<Due> members = new HashSet<>(List.of(first, twin, new Due("budi", 75))); // => set dedupes by contract
    System.out.println("unique: " + members.size()); // => Output: unique: 2
    List<Due> board = new ArrayList<>(members); // => sorted view of the survivors
    board.sort(null); // => natural order via compareTo
    System.out.println("board: " + board); // => Output: board: [sari:50, budi:75]
  } // => main ends: three contracts witnessed agreeing
}
